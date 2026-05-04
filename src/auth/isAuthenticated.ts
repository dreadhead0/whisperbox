export function isAuthenticated() {
  if (typeof window === "undefined") return false;

  const token = sessionStorage.getItem("access_token");
  return !!token;
}