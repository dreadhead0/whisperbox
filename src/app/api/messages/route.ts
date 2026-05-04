export async function POST(req: Request) {
  try {
    const auth = req.headers.get("authorization");

    if (!auth) {
      return Response.json(
        { error: "Missing authorization header" },
        { status: 401 }
      );
    }

    const body = await req.json();

    const res = await fetch("https://whisperbox.koyeb.app/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: auth,
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    const text = await res.text();

    // 🔥 IMPORTANT: log upstream errors clearly
    if (!res.ok) {
      console.error("Upstream error:", text);

      return Response.json(
        {
          error: "Upstream error",
          status: res.status,
          raw: text,
        },
        { status: 502 }
      );
    }

    return Response.json(JSON.parse(text), { status: 200 });
  } catch (err) {
    console.error("Server error:", err);

    return Response.json(
      { error: "Server error", details: String(err) },
      { status: 500 }
    );
  }
}