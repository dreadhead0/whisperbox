const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const USER_KEY = "user";
const PRIVATE_KEY_PKCS8 = "pk_pkcs8";

export function setSession(data: {
  access_token: string;
  refresh_token: string;
  user: any;
}) {
  sessionStorage.setItem(ACCESS_TOKEN_KEY, data.access_token);
  sessionStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token);
  sessionStorage.setItem(USER_KEY, JSON.stringify(data.user));
}

export function getToken() {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getUser() {
  if (typeof window === "undefined") return null;
  const stored = sessionStorage.getItem(USER_KEY);
  return stored ? JSON.parse(stored) : null;
}

export function clearSession() {
  sessionStorage.clear();
}

export function hasPrivateKey(): boolean {
  return !!sessionStorage.getItem(PRIVATE_KEY_PKCS8);
}

/* ── Crypto ─────────────────────────────────────────────────── */

/** Call after unwrapping the private key on login/register. */
export async function setPrivateKey(key: CryptoKey): Promise<void> {
  const pkcs8 = await crypto.subtle.exportKey("pkcs8", key);
  const b64 = btoa(String.fromCharCode(...new Uint8Array(pkcs8)));
  sessionStorage.setItem(PRIVATE_KEY_PKCS8, b64);
}

/**
 * Returns the private key, re-importing from sessionStorage on every call.
 * Works across page refreshes within the same browser tab.
 */
export async function getPrivateKey(): Promise<CryptoKey> {
  const b64 = sessionStorage.getItem(PRIVATE_KEY_PKCS8);
  if (!b64) throw new Error("No private key in session — please log in again.");
  const pkcs8 = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey(
    "pkcs8",
    pkcs8,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["decrypt"]
  );
}
