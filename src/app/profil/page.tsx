"use client";

import { RequireAuth } from "@/components/RequireAuth";
import ProfileClient from "./ProfileClient";

export default function ProfilPage() {
  return (
    <RequireAuth>
      <ProfileClient />
    </RequireAuth>
  );
}
