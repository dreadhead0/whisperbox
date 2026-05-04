"use client";

import { useEffect } from "react";
import { setSession } from "./session";

export default function SessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const access_token = sessionStorage.getItem("access_token");
    const refresh_token = sessionStorage.getItem("refresh_token");
    const user = sessionStorage.getItem("user");

    if (access_token && refresh_token && user) {
      setSession({
        access_token,
        refresh_token,
        user: JSON.parse(user),
      });
    }
  }, []);

  return <>{children}</>;
}