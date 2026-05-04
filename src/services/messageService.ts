import { unwrapMessageKey, decryptMessage } from "@/src/crypto/messageDecrypt";

export async function decryptIncomingMessage({
  message,
  privateKey,
}: {
  message: any;
  privateKey: CryptoKey;
}) {
  const encryptedKey = message.payload.encryptedKey;
  const aesKey = await unwrapMessageKey(encryptedKey, privateKey);
  const text = await decryptMessage(
    message.payload.ciphertext,
    message.payload.iv,
    aesKey
  );

  // Spread the full message so from_user_id, to_user_id etc. are preserved
  return {
    ...message,
    text,
  };
}
