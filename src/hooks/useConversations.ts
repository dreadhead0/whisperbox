import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/src/lib/api";

export function useConversations() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/conversations");
      setConversations(Array.isArray(data) ? data : []);
    } catch {
      // Silently fail — conversations are best-effort; sidebar just stays empty
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return { conversations, loading, refresh: fetchConversations };
}
