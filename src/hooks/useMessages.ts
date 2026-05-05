"use client";

import { useEffect, useState } from "react";
import { fetchMessages } from "@/src/api/messageInbox";
import { decryptIncomingMessage } from "@/src/services/messageService";
import { getPrivateKey } from "@/src/auth/session";

export function useMessages() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      try {
        const data = await fetchMessages();

        const privateKey = await getPrivateKey();

        const decrypted = await Promise.all(
          data.map(async (msg: any) => {
            try {
              return await decryptIncomingMessage({
                message: msg,
                privateKey, // now correct type
              });
            } catch (e) {
              console.error("Decryption failed:", e);

              return {
                ...msg,
                text: "[Encrypted message]",
              };
            }
          })
        );

        setMessages(decrypted);
      } catch (err) {
        console.error("Message fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  return { messages, loading };
}