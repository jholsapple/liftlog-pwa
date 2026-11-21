import assert from "node:assert/strict";
import {
  CURRENT_WORKOUT_SCHEMA,
  createMemoryWorkoutRepository,
  normalizeWorkout,
  summarizeWorkout,
  validateWorkout,
} from "../packages/core/src/index.js";
import { createCoachClient } from "../packages/coach-client/src/index.js";
import { handleCoachRequest } from "../services/coach-api/src/index.js";

const legacyWorkout = {
  id: 42,
  name: "Push",
  startTime: 1_000,
  duration: 3_600_000,
  exercises: [
    {
      name: "Bench Press",
      sets: [
        { weight: "135", reps: "5", done: true },
        { weight: 135, reps: 5, done: false },
      ],
    },
    {
      name: "Bike",
      metric: "minutes",
      sets: [{ reps: 12, done: true }],
    },
  ],
};

const workout = normalizeWorkout(legacyWorkout);
assert.equal(workout.schemaVersion, CURRENT_WORKOUT_SCHEMA);
assert.equal(workout.id, "42");
assert.equal(workout.exercises[0].sets[0].weight, 135);
assert.equal(validateWorkout(workout).valid, true);
assert.deepEqual(summarizeWorkout(workout), {
  workoutId: "42",
  name: "Push",
  exerciseCount: 2,
  completedSets: 2,
  volume: 675,
  cardioMinutes: 12,
  duration: 3_600_000,
});

const repository = createMemoryWorkoutRepository();
await repository.save(workout);
assert.equal((await repository.get("42")).name, "Push");
assert.equal((await repository.list()).length, 1);

let coachRequest;
const coach = createCoachClient({
  baseUrl: "https://coach.example",
  fetchImpl: async (url, options) => {
    coachRequest = { url, options };
    return new Response(JSON.stringify({ review: "Solid session." }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  },
});
const coachResult = await coach.reviewWorkout({ workout });
assert.equal(coachResult.review, "Solid session.");
assert.equal(coachRequest.url, "https://coach.example/api/v1/coach/review");
assert.equal(JSON.parse(coachRequest.options.body).workout.id, "42");

const unconfiguredResponse = await handleCoachRequest(
  new Request("https://coach.example/api/v1/coach/review", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ workout }),
  }),
  {},
);
assert.equal(unconfiguredResponse.status, 503);

const missingWorkoutResponse = await handleCoachRequest(
  new Request("https://coach.example/api/v1/coach/review", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({}),
  }),
  { OPENAI_API_KEY: "server-secret", OPENAI_MODEL: "configured-model" },
);
assert.equal(missingWorkoutResponse.status, 400);

console.log("SetRitual 2.0 core tests passed");
