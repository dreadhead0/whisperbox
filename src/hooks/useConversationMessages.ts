import { useEffect, useState } from "react";
import { apiFetch } from "@/src/lib/api";
import { getPrivateKey, hasPrivateKey, getUser } from "@/src/auth/session";
import { decryptIncomingMessage } from "@/src/services/messageService";

async function tryDecrypt(msg: any, privateKey: CryptoKey, myId: string | undefined) {
  if (!msg.payload?.ciphertext || !msg.payload?.iv) {
    return { ...msg, text: "[No content]" };
  }
  try {
    // Sender reads via encryptedKeyForSelf; recipient reads via encryptedKey
    const isSender = msg.from_user_id === myId;
    const keyToUse = isSender ? msg.payload.encryptedKeyForSelf : msg.payload.encryptedKey;
    if (!keyToUse) return { ...msg, text: "[Missing key]" };
    return await decryptIncomingMessage({
      message: { ...msg, payload: { ...msg.payload, encryptedKey: keyToUse } },
      privateKey,
    });
  } catch (e) {
    console.warn("Decryption failed for", msg.id, e);
    return { ...msg, text: "[Decryption failed]" };
  }
}

export function useConversationMessages(userId: string | null) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) { setMessages([]); return; }

    const run = async () => {
      setLoading(true);
      try {
        const data = await apiFetch(`/conversations/${userId}/messages`);
        if (!Array.isArray(data)) { setMessages([]); return; }

        const currentUser = getUser();

        if (!hasPrivateKey()) {
          // No key in session — show raw placeholders but keep from_user_id intact
          setMessages(data.map((msg: any) => ({ ...msg, text: "[Log in to decrypt]" })).reverse());
          return;
        }

        const privateKey = await getPrivateKey();
        const decrypted = await Promise.all(
          data.map((msg: any) => tryDecrypt(msg, privateKey, currentUser?.id))
        );
        // API returns newest-first; reverse for chronological display
        setMessages(decrypted.reverse());
      } catch (err) {
        console.error("Failed to load messages:", err);
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [userId]);

  // Expose setMessages so chat page can push incoming WebSocket messages
  return { messages, loading, setMessages };
}
