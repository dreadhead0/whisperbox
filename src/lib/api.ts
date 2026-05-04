import { getToken } from "../auth/session";

/**
 * All backend calls go through Next.js API routes to avoid CORS.
 * Maps e.g. /conversations  →  /api/conversations
 *           /auth/login     →  /api/auth/login
 */
export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = getToken();

  // Already an internal path (/api/...) → use as-is
  // External path → prepend /api
  const url = endpoint.startsWith("/api/") ? endpoint : `/api${endpoint}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const text = await res.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    data = null;
  }

  if (!res.ok) {
    throw data || { error: "Request failed", raw: text };
  }

  return data;
}
