export async function GET(
  req: Request,
  { params }: { params: Promise<{ user_id: string }> }
) {
  const { user_id } = await params;
  const auth = req.headers.get("authorization");

  if (!auth) {
    return Response.json({ error: "Missing auth" }, { status: 401 });
  }

  const url = new URL(req.url);
  const query = url.searchParams.toString();
  const upstream = `https://whisperbox.koyeb.app/conversations/${user_id}/messages${query ? `?${query}` : ""}`;

  try {
    const res = await fetch(upstream, {
      headers: {
        Authorization: auth,
        Accept: "application/json",
      },
    });

    const text = await res.text();

    if (!res.ok) {
      console.error("Upstream messages error:", res.status, text);
      return Response.json(
        { error: "Upstream error", status: res.status, raw: text },
        { status: 502 }
      );
    }

    return Response.json(JSON.parse(text));
  } catch (err) {
    return Response.json({ error: "Server error", details: String(err) }, { status: 500 });
  }
}
