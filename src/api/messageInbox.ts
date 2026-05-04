import { apiFetch } from "@/src/lib/api";

export async function fetchMessages() {
  return apiFetch("/messages", {
    method: "GET",
  });
}