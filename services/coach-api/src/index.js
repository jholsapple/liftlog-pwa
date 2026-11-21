const json = (body, status = 200, extraHeaders = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...extraHeaders },
  });

const coachInstructions = `You are SetRitual Coach, a careful strength and conditioning guide.
Use only the workout data supplied by the application. Be specific, supportive, and concise.
Separate observations from suggestions. Never diagnose injuries or medical conditions.
If the user reports pain, fainting, chest pain, or another concerning symptom, recommend stopping
the activity and seeking appropriate professional care. Do not claim that progress exists unless
the supplied history supports it.`;

export async function handleCoachRequest(request, env) {
  const origin = request.headers.get("origin");
  const allowedOrigin = env.APP_ORIGIN || "";
  const cors =
    origin && origin === allowedOrigin
      ? { "access-control-allow-origin": origin }
      : {};

  if (request.method === "OPTIONS")
    return new Response(null, {
      status: 204,
      headers: {
        ...cors,
        "access-control-allow-headers": "authorization, content-type",
        "access-control-allow-methods": "POST, OPTIONS",
      },
    });

  const url = new URL(request.url);
  if (request.method !== "POST" || url.pathname !== "/api/v1/coach/review")
    return json({ error: "Not found" }, 404, cors);
  if (!env.OPENAI_API_KEY || !env.OPENAI_MODEL)
    return json({ error: "Coach service is not configured" }, 503, cors);

  // Authentication and per-user authorization must be added before this endpoint is deployed.
  const payload = await request.json().catch(() => null);
  if (!payload?.workout)
    return json({ error: "A completed workout is required" }, 400, cors);

  const modelResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.OPENAI_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL,
      store: false,
      instructions: coachInstructions,
      input: JSON.stringify({
        completedWorkout: payload.workout,
        recentWorkouts: payload.recentWorkouts || [],
        preferences: payload.preferences || {},
        task: "Review the completed workout and suggest the most useful next step.",
      }),
    }),
  });

  const result = await modelResponse.json().catch(() => null);
  if (!modelResponse.ok)
    return json({ error: "Coach analysis failed" }, 502, cors);

  const review = (result?.output || [])
    .flatMap((item) => item.content || [])
    .filter((item) => item.type === "output_text")
    .map((item) => item.text)
    .join("\n")
    .trim();

  return json({ review, responseId: result.id }, 200, cors);
}

export default { fetch: handleCoachRequest };
