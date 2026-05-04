export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  const body = await req.json();

  const res = await fetch("https://whisperbox.koyeb.app/auth/logout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(auth ? { Authorization: auth } : {}),
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  try {
    return Response.json(JSON.parse(text), { status: res.status });
  } catch {
    return new Response(text, { status: res.status });
  }
}
