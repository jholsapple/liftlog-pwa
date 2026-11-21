export const CURRENT_WORKOUT_SCHEMA = 3;

const numberOrNull = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const stableId = (prefix, value, fallbackIndex) =>
  String(value || `${prefix}-${fallbackIndex + 1}`);

export function normalizeWorkout(input, fallbackIndex = 0) {
  const workout = input && typeof input === "object" ? input : {};
  const exercises = Array.isArray(workout.exercises)
    ? workout.exercises.map((exercise, exerciseIndex) => ({
        id: stableId("exercise", exercise.id, exerciseIndex),
        name: String(exercise.name || "Exercise").trim() || "Exercise",
        metric: exercise.metric === "minutes" ? "minutes" : "reps",
        sets: Array.isArray(exercise.sets)
          ? exercise.sets.map((set, setIndex) => ({
              id: stableId("set", set.id, setIndex),
              weight: numberOrNull(set.weight),
              reps: numberOrNull(set.reps),
              done: Boolean(set.done),
              target: set.repTarget ? String(set.repTarget) : null,
            }))
          : [],
      }))
    : [];

  return {
    schemaVersion: CURRENT_WORKOUT_SCHEMA,
    id: stableId("workout", workout.id, fallbackIndex),
    name: String(workout.name || "Workout").trim() || "Workout",
    startTime: numberOrNull(workout.startTime),
    endTime: numberOrNull(workout.endTime),
    duration: numberOrNull(workout.duration),
    notes: String(workout.notes || ""),
    exercises,
  };
}

export function validateWorkout(input) {
  const workout = normalizeWorkout(input);
  const errors = [];
  if (!workout.id) errors.push("Workout ID is required");
  if (!workout.startTime) errors.push("Workout start time is required");
  if (!workout.exercises.length)
    errors.push("At least one exercise is required");
  workout.exercises.forEach((exercise, index) => {
    if (!exercise.name) errors.push(`Exercise ${index + 1} needs a name`);
    if (!exercise.sets.length)
      errors.push(`${exercise.name} needs at least one set or interval`);
  });
  return { valid: errors.length === 0, errors, workout };
}

export function summarizeWorkout(input) {
  const workout = normalizeWorkout(input);
  let completedSets = 0;
  let volume = 0;
  let cardioMinutes = 0;

  for (const exercise of workout.exercises) {
    for (const set of exercise.sets) {
      if (!set.done) continue;
      completedSets += 1;
      if (exercise.metric === "minutes") cardioMinutes += set.reps || 0;
      else volume += (set.weight || 0) * (set.reps || 0);
    }
  }

  return {
    workoutId: workout.id,
    name: workout.name,
    exerciseCount: workout.exercises.length,
    completedSets,
    volume,
    cardioMinutes,
    duration: workout.duration || 0,
  };
}
