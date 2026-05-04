export async function GET(
  req: Request,
  { params }: { params: Promise<{ user_id: string }> }
) {
  const { user_id } = await params;
  const auth = req.headers.get("authorization");
  if (!auth) return Response.json({ error: "Missing auth" }, { status: 401 });

  const res = await fetch(
    `https://whisperbox.koyeb.app/users/${user_id}/public-key`,
    { headers: { Authorization: auth, Accept: "application/json" } }
  );

  const text = await res.text();
  if (!res.ok) return Response.json({ error: "Upstream error", raw: text }, { status: 502 });

  return Response.json(JSON.parse(text));
}
