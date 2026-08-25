import { Suspense } from "react";
import DinasClient from "./DinasClient";

export const metadata = {
  title: "Dashboard Dinas — SIGAP",
  description:
    "Portal instansi dinas untuk memantau laporan infrastruktur & lingkungan di wilayah kerja masing-masing.",
};

export default function DinasPage() {
  return (
    <Suspense fallback={null}>
      <DinasClient />
    </Suspense>
  );
}
