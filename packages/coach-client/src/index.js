export function createCoachClient({
  baseUrl,
  fetchImpl = fetch,
  getAccessToken,
}) {
  if (!baseUrl) throw new Error("Coach API baseUrl is required");

  async function request(path, body) {
    const token = getAccessToken ? await getAccessToken() : null;
    const response = await fetchImpl(`${baseUrl.replace(/\/$/, "")}${path}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok)
      throw new Error(
        payload.error || `Coach request failed (${response.status})`,
      );
    return payload;
  }

  return {
    reviewWorkout({ workout, recentWorkouts = [], preferences = {} }) {
      return request("/api/v1/coach/review", {
        workout,
        recentWorkouts,
        preferences,
      });
    },
  };
}
