export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (!auth) return Response.json({ error: "Missing auth" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";

  const res = await fetch(
    `https://whisperbox.koyeb.app/users/search?q=${encodeURIComponent(q)}`,
    { headers: { Authorization: auth, Accept: "application/json" } }
  );

  const text = await res.text();
  if (!res.ok) return Response.json({ error: "Upstream error", raw: text }, { status: 502 });

  return Response.json(JSON.parse(text));
}
