const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const html = fs.readFileSync("index.html", "utf8");
const manifest = JSON.parse(fs.readFileSync("manifest.json", "utf8"));
assert.equal(manifest.name, "SetRitual");
assert.ok(html.includes("<title>SetRitual</title>"));
assert.ok(html.includes('onclick="toggleRestTimer()"'));
assert.ok(!html.includes("Copy last"));
assert.ok(html.includes('onclick="prepareFinishWorkout()"'));
assert.ok(html.includes('class="session-complete-note"'));
assert.ok(html.includes("font-size: 44px"));
assert.ok(html.includes('onclick="scrollToNextSet()"'));
assert.ok(!html.includes("Optional RPE"));
assert.ok(html.includes("maxesTab.hidden"));
assert.ok(html.includes('class="plan-native-back"'));
assert.ok(html.includes('class="modal-title">Edit Plan'));
assert.ok(html.includes('aria-label="Edit plan"'));
assert.ok(html.includes('onclick="showDetail(${last.id})"'));
assert.ok(html.includes(".plan-card .template-name"));
assert.ok(html.includes('id="records-badges-panel"'));
assert.ok(html.includes('id="achievement-modal"'));
assert.ok(html.includes("Next milestone"));
assert.ok(html.includes("today-start-card"));
assert.ok(html.includes("Start workout"));
assert.ok(!html.includes("Begin ${esc(todayTemplate.name)}"));
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

vm.runInContext(
  `
  showScreen = () => {};
  state = { preferences: { rounding: 5 }, workouts: [], maxes: {}, templates: [{ name: 'Hypertrophy', exercises: [{ name: 'Row', sets: 3, reps: 8, setGroups: [{ sets: 3, reps: 8, repLow: 8, repHigh: 12 }] }] }] };
  startWorkout(0);
`,
  context,
);
const rangedSet = vm.runInContext(
  "state.activeWorkout.exercises[0].sets[0]",
  context,
);
assert.equal(rangedSet.repTarget, "8–12");
assert.equal(
  rangedSet.reps,
  "",
  "rep ranges should not overwrite actual completed reps",
);
assert.equal(
  typeof vm.runInContext("state.activeWorkout.startTime", context),
  "number",
);
vm.runInContext("state.templates = []; startWorkout()", context);
assert.equal(vm.runInContext("state.activeWorkout.startTime", context), null);
assert.equal(vm.runInContext("workoutElapsedMs()", context), 0);
vm.runInContext(
  "state.activeWorkout.exercises.push({ name: 'Squat', sets: [] }); startActiveWorkoutClock()",
  context,
);
assert.equal(
  typeof vm.runInContext("state.activeWorkout.startTime", context),
  "number",
);
vm.runInContext(
  "state.templates = [{ name: 'Hypertrophy', exercises: [{ name: 'Row', sets: 3, reps: 8, setGroups: [{ sets: 3, reps: 8, repLow: 8, repHigh: 12 }] }] }]; startWorkout(0)",
  context,
);
vm.runInContext(
  "updateActiveOverview = () => {}; updateSet(0, 0, 'weight', '135.5')",
  context,
);
assert.equal(
  vm.runInContext("state.activeWorkout.exercises[0].sets[0].weight", context),
  135.5,
);
vm.runInContext("updateSet(0, 0, 'reps', 'not-a-number')", context);
assert.equal(
  vm.runInContext("state.activeWorkout.exercises[0].sets[0].reps", context),
  "",
);
assert.equal(context.formatElapsed(125000), "2:05");
vm.runInContext(
  "state.activeWorkout.startTime = 1000; state.activeWorkout.finishPausedAt = 61000; state.activeWorkout.pausedDuration = 10000",
  context,
);
assert.equal(vm.runInContext("workoutElapsedMs()", context), 50000);
assert.equal(vm.runInContext("nextIncompleteSet().si", context), 0);
assert.equal(vm.runInContext("tourSteps.length", context), 6);
assert.equal(
  vm.runInContext("TOUR_STORAGE_KEY", context),
  "setritual_onboarding_v1",
);

const generatedPlan = vm.runInContext(
  `buildStarterPlan({ goal: 'muscle', equipment: 'dumbbells', level: 'beginner', days: 3, duration: 30 })`,
  context,
);
assert.equal(generatedPlan.length, 3);
assert.equal(generatedPlan[0].day, "Monday");
assert.equal(generatedPlan[0].exercises.length, 4);
assert.equal(generatedPlan[0].exercises[0].setGroups[0].repHigh, 12);
assert.equal(generatedPlan[0].generated, true);
vm.runInContext(
  `state.templates = [
    { planId: 'strength-1', program: 'Strength', planDescription: 'Three-day barbell plan', exercises: [] },
    { planId: 'strength-1', program: 'Strength', exercises: [] },
    { planId: 'cardio-1', program: 'Cardio', exercises: [] }
  ]`,
  context,
);
assert.equal(vm.runInContext("getPlanGroups().length", context), 2);
assert.equal(vm.runInContext("getPlanGroups()[0].workouts.length", context), 2);
assert.equal(vm.runInContext("getPlanGroups()[0].name", context), "Strength");
assert.equal(
  vm.runInContext("getPlanGroups()[0].description", context),
  "Three-day barbell plan",
);

const cardioPlan = vm.runInContext(
  `buildStarterPlan({ goal: 'cardio', equipment: 'bike', level: 'beginner', days: 3, duration: 30 })`,
  context,
);
assert.equal(cardioPlan.length, 3);
assert.equal(cardioPlan[0].type, "cardio");
assert.equal(cardioPlan[0].exercises[0].metric, "minutes");
assert.match(cardioPlan[0].exercises[0].name, /Bike/);

const colonDayPlan = context.parsePlan(
  "Monday:\n- Bench Press: 3x5\nWednesday: Pull\n- Cable Row: 3x10",
);
assert.equal(colonDayPlan[0].day, "Monday");
assert.equal(colonDayPlan[0].name, "Monday");
assert.equal(colonDayPlan[1].day, "Wednesday");
assert.equal(colonDayPlan[1].name, "Pull");

vm.runInContext(
  `state.workouts = [{ id: 20, startTime: 100, exercises: [{ name: 'Deadlift', sets: [
    { weight: 300, reps: 2, done: true },
    { weight: 275, reps: 1, done: true },
    { weight: 315, reps: 1, done: false }
  ] }] }];`,
  context,
);
assert.deepEqual(
  JSON.parse(vm.runInContext("JSON.stringify(computeOneRepMaxes())", context)),
  { Deadlift: { weight: 275, date: 100, workoutId: 20 } },
);

const now = Date.now();
vm.runInContext(
  `state.workouts = [
    { id: 10, name: 'Scheduled Workout', startTime: ${now - 5000}, endTime: ${now - 4000}, exercises: [] },
    { id: 11, name: 'Actual Unscheduled Workout', startTime: ${now - 3000}, endTime: ${now - 1000}, exercises: [] },
    { id: 9, name: 'Older Workout', startTime: ${now - 86400000}, endTime: ${now - 86300000}, exercises: [] }
  ]`,
  context,
);
assert.equal(
  vm.runInContext("latestCompletedWorkoutToday().name", context),
  "Actual Unscheduled Workout",
);
assert.equal(
  vm.runInContext("latestSavedWorkout().name", context),
  "Actual Unscheduled Workout",
);

vm.runInContext(
  `state = {
    preferences: { unit: 'lb', rounding: 5, autoRest: 0 },
    achievements: {},
    workouts: [
      { id: 1, startTime: ${now - 5 * 86400000}, endTime: ${now - 5 * 86400000 + 3600000}, duration: 3600000, exercises: [{ name: 'Bench Press', sets: [{ weight: 100, reps: 1, done: true }] }] },
      { id: 2, startTime: ${now - 3 * 86400000}, endTime: ${now - 3 * 86400000 + 1800000}, duration: 1800000, exercises: [{ name: 'Bike', metric: 'minutes', sets: [{ reps: 30, done: true }] }] },
      { id: 3, startTime: ${now - 86400000}, endTime: ${now - 86400000 + 1800000}, duration: 1800000, exercises: [{ name: 'Bike', metric: 'minutes', sets: [{ reps: 30, done: true }] }] }
    ]
  }`,
  context,
);
assert.equal(vm.runInContext("achievementMetrics().workoutCount", context), 3);
assert.equal(
  vm.runInContext("achievementMetrics().maxSevenDayWorkouts", context),
  3,
);
assert.equal(
  vm.runInContext("achievementMetrics().cardioMinutes", context),
  60,
);
const unlockedIds = vm.runInContext(
  "syncAchievements(3).map((achievement) => achievement.id)",
  context,
);
assert.ok(unlockedIds.includes("first-ritual"));
assert.ok(unlockedIds.includes("three-in-seven"));
assert.ok(unlockedIds.includes("true-max"));
assert.ok(unlockedIds.includes("cardio-hour"));
assert.ok(unlockedIds.includes("long-session"));
assert.equal(
  vm.runInContext("Object.keys(state.achievements).length", context),
  unlockedIds.length,
  "badges should unlock only once",
);
assert.equal(vm.runInContext("syncAchievements(3).length", context), 0);

console.log("SetRitual tests passed");
