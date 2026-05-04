export async function GET(req: Request) {
  const auth = req.headers.get("authorization");

  if (!auth) {
    return Response.json({ error: "Missing auth header" }, { status: 401 });
  }

  const res = await fetch("https://whisperbox.koyeb.app/conversations", {
    headers: {
      Authorization: auth, // 👈 DO NOT modify it
      Accept: "application/json",
    },
  });

  const text = await res.text();

  // log real upstream issue
  if (!res.ok) {
    console.error("Upstream failed:", res.status, text);

    return Response.json(
      {
        error: "Upstream error",
        status: res.status,
        raw: text,
      },
      { status: 502 }
    );
  }

  try {
    return Response.json(JSON.parse(text));
  } catch (e) {
    console.error("Bad JSON:", text);

    return Response.json(
      {
        error: "Invalid JSON from upstream",
        raw: text,
      },
      { status: 502 }
    );
  }
}