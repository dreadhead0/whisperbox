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
        const privateKey = getPrivateKey();

        const decrypted = await Promise.all(
          data.map(async (msg: any) => {
            try {
              return await decryptIncomingMessage({
                message: msg,
                privateKey,
              });
            } catch (e) {
              return {
                ...msg,
                text: "[Encrypted message]",
              };
            }
          }),
        );

        setMessages(decrypted);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  return { messages, loading };
}
