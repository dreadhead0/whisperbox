import { apiFetch } from "@/src/lib/api";

export type UserSearchResult = {
  id: string;
  username: string;
  display_name: string;
};

export async function searchUsers(q: string): Promise<UserSearchResult[]> {
  if (!q) return [];

  return apiFetch(`/users/search?q=${encodeURIComponent(q)}`);
}

export async function getUserPublicKey(userId: string): Promise<string> {
  const res = await apiFetch(`/users/${userId}/public-key`);
  return res.public_key;
}