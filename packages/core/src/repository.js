export function createMemoryWorkoutRepository(initialWorkouts = []) {
  const workouts = new Map(
    initialWorkouts.map((workout) => [
      String(workout.id),
      structuredClone(workout),
    ]),
  );

  return {
    async list() {
      return [...workouts.values()].map((workout) => structuredClone(workout));
    },
    async get(id) {
      const workout = workouts.get(String(id));
      return workout ? structuredClone(workout) : null;
    },
    async save(workout) {
      workouts.set(String(workout.id), structuredClone(workout));
      return structuredClone(workout);
    },
    async remove(id) {
      return workouts.delete(String(id));
    },
  };
}
