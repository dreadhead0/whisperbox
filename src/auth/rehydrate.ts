import { setSession } from "./session";

export function rehydrateSession() {
  const access_token = sessionStorage.getItem("access_token");
  const refresh_token = sessionStorage.getItem("refresh_token");
  const user = sessionStorage.getItem("user");

  if (!access_token || !refresh_token || !user) return;

  setSession({
    access_token,
    refresh_token,
    user: JSON.parse(user),
  });
}