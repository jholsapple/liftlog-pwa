const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const html = fs.readFileSync("index.html", "utf8");
const source = html
  .match(/<script>([\s\S]*?)<\/script>/)[1]
  .split("// ── INIT ──")[0];
const storage = new Map();
const context = {
  console,
  Blob,
  URL,
  setTimeout: () => 0,
  clearTimeout() {},
  setInterval: () => 1,
  clearInterval() {},
  localStorage: {
    getItem: (k) => storage.get(k) || null,
    setItem: (k, v) => storage.set(k, v),
  },
  navigator: {},
  window: { addEventListener() {} },
  document: {
    activeElement: null,
    addEventListener() {},
    querySelectorAll: () => [],
    getElementById: () => null,
    createElement: () => ({ click() {} }),
    documentElement: { removeAttribute() {}, setAttribute() {} },
  },
};
vm.createContext(context);
vm.runInContext(source, context);

const plan = context.parsePlan(
  "MONDAY – PUSH\n• Bench Press: 3×5 @80%\n• Triceps Pressdown: 2×12",
);
assert.equal(plan.length, 1);
assert.equal(plan[0].exercises[0].name, "Bench Press");
assert.equal(plan[0].exercises[0].setGroups[0].pctLow, 80);

assert.equal(
  context.calcExTonnage({
    sets: [
      { weight: 100, reps: 5, done: true },
      { weight: 200, reps: 5, done: false },
    ],
  }),
  500,
  "incomplete sets must not affect tonnage",
);

vm.runInContext(
  `state = { preferences: { rounding: 5 }, workouts: [{ id: 1, startTime: 1, exercises: [{ name: 'Bench', sets: [
  { weight: 100, reps: 5, done: true },
  { weight: 500, reps: 1, done: false }
]}] }] }`,
  context,
);
assert.equal(
  context.computePRs().Bench.weight,
  100,
  "incomplete sets must not set PRs",
);
assert.equal(
  context.esc('<img onerror="x">'),
  "&lt;img onerror=&quot;x&quot;&gt;",
);
assert.equal(context.roundTo5(113), 115);

console.log("LiftLog tests passed");
