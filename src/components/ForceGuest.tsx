"use client";

import { useEffect } from "react";
import { useApp } from "@/lib/store";

/* Landing selalu dalam kondisi tanpa login:
   siapa pun yang masuk ke landing di-logout otomatis,
   sehingga wajib login setiap masuk ke menu role.
   Menunggu hydrated agar tidak keburu ditimpa hidrasi localStorage. */
export function ForceGuest() {
  const { user, hydrated, logout } = useApp();
  useEffect(() => {
    if (hydrated && user) logout();
  }, [hydrated, user, logout]);
  return null;
}
