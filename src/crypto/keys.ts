export async function generateKeyPair() {
  return window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"],
  );
}

export async function exportPublicKey(key: CryptoKey) {
  const spki = await crypto.subtle.exportKey("spki", key);
  return btoa(String.fromCharCode(...new Uint8Array(spki)));
}

export async function exportPrivateKey(key: CryptoKey) {
  const pkcs8 = await crypto.subtle.exportKey("pkcs8", key);
  return btoa(String.fromCharCode(...new Uint8Array(pkcs8)));
}

export function generateSalt() {
  return crypto.getRandomValues(new Uint8Array(16));
}

export async function deriveKey(password: string, salt: Uint8Array) {
  const enc = new TextEncoder();

  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: new Uint8Array(salt),
      iterations: 100000,
      hash: "SHA-256",
    },
    baseKey,
    {
      name: "AES-GCM",
      length: 256,
    },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function wrapPrivateKey(
  privateKey: CryptoKey,
  wrappingKey: CryptoKey,
) {
  const pkcs8 = await crypto.subtle.exportKey("pkcs8", privateKey);

  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encrypted = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
    },
    wrappingKey,
    pkcs8,
  );

  // combine iv + ciphertext
  const combined = new Uint8Array(iv.byteLength + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.byteLength);

  return btoa(String.fromCharCode(...combined));
}

export function encodeSalt(salt: Uint8Array) {
  return btoa(String.fromCharCode(...salt));
}


export async function unwrapPrivateKey(
  wrapped: string,
  wrappingKey: CryptoKey
) {
  const data = Uint8Array.from(atob(wrapped), c => c.charCodeAt(0));

  const iv = data.slice(0, 12);
  const ciphertext = data.slice(12);

  const pkcs8 = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv,
    },
    wrappingKey,
    ciphertext
  );

  return crypto.subtle.importKey(
    "pkcs8",
    pkcs8,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["decrypt"]
  );
}

export function base64ToUint8(b64: string) {
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
}