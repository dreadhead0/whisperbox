import { apiFetch } from "@/src/lib/api";
import {
  generateMessageKey,
  encryptMessage,
  encryptMessageKey,
} from "@/src/crypto/messageCrypto";

export async function sendMessage({
  to,
  text,
  recipientPublicKey,
  senderPublicKey,
}: {
  to: string;
  text: string;
  recipientPublicKey: CryptoKey;
  senderPublicKey: CryptoKey;
}) {
  // 1. generate AES session key
  const aesKey = await generateMessageKey();

  // 2. encrypt message
  const encryptedMessage = await encryptMessage(text, aesKey);

  // 3. encrypt AES key for recipient
  const encryptedKey = await encryptMessageKey(
    aesKey,
    recipientPublicKey
  );

  // 4. encrypt AES key for sender (self storage)
  const encryptedKeyForSelf = await encryptMessageKey(
    aesKey,
    senderPublicKey
  );

  // 5. send to backend (IMPORTANT: correct schema)
  return apiFetch("/messages", {
    method: "POST",
    body: JSON.stringify({
      to,
      payload: {
        ciphertext: encryptedMessage.data,
        iv: encryptedMessage.iv,
        encryptedKey,
        encryptedKeyForSelf,
      },
    }),
  });
}