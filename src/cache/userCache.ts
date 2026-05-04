const userSearchCache = new Map<string, any>();
const publicKeyCache = new Map<string, string>();

export function getCachedSearch(q: string) {
  return userSearchCache.get(q);
}

export function setCachedSearch(q: string, data: any) {
  userSearchCache.set(q, data);
}

export function getCachedPublicKey(userId: string) {
  return publicKeyCache.get(userId);
}

export function setCachedPublicKey(userId: string, key: string) {
  publicKeyCache.set(userId, key);
}