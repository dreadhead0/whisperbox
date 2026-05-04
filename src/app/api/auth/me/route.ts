export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  const res = await fetch("https://whisperbox.koyeb.app/auth/me", {
    headers: { Authorization: auth || "", Accept: "application/json" },
  });
  const text = await res.text();
  try { return Response.json(JSON.parse(text), { status: res.status }); }
  catch { return new Response(text, { status: res.status }); }
}
