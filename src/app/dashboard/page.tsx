import type { Metadata } from "next";
import DashboardClient from "./DashboardClient";
import { RequireAuth } from "@/components/RequireAuth";

export const metadata: Metadata = { title: "Dashboard Admin" };

export default function Page() {
  return (
    <RequireAuth role="admin">
      <DashboardClient />
    </RequireAuth>
  );
}
