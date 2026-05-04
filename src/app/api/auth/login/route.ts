export async function POST(req: Request) {
  const body = await req.json();
  const res = await fetch("https://whisperbox.koyeb.app/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  try { return Response.json(JSON.parse(text), { status: res.status }); }
  catch { return new Response(text, { status: res.status }); }
}
