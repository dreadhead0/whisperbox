export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes.buffer;
}

export async function unwrapMessageKey(
  encryptedKeyB64: string,
  privateKey: CryptoKey
) {
  const encryptedKey = base64ToArrayBuffer(encryptedKeyB64);

  const rawKey = await crypto.subtle.decrypt(
    {
      name: "RSA-OAEP",
    },
    privateKey,
    encryptedKey
  );

  return crypto.subtle.importKey(
    "raw",
    rawKey,
    {
      name: "AES-GCM",
    },
    false,
    ["decrypt"]
  );
}

export async function decryptMessage(
  ciphertextB64: string,
  ivB64: string,
  aesKey: CryptoKey
) {
  const ciphertext = base64ToArrayBuffer(ciphertextB64);
  const iv = base64ToArrayBuffer(ivB64);

  const plaintext = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: new Uint8Array(iv),
    },
    aesKey,
    ciphertext
  );

  return new TextDecoder().decode(plaintext);
}