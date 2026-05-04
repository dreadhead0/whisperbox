"use client";

import { getUserPublicKey } from "@/src/api/users";
import {
  getCachedPublicKey,
  setCachedPublicKey,
} from "@/src/cache/userCache";

export async function fetchUserPublicKey(userId: string) {
  const cached = getCachedPublicKey(userId);
  if (cached) return cached;

  const key = await getUserPublicKey(userId);

  setCachedPublicKey(userId, key);

  return key;
}