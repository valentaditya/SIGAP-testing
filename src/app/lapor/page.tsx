import type { Metadata } from "next";
import { Suspense } from "react";
import LaporClient from "./LaporClient";

export const metadata: Metadata = { title: "Form Pelaporan" };

export default function Page() {
  // Suspense diperlukan karena LaporClient membaca useSearchParams
  // (?anonim=1 dan ?darurat=1 dari jalur "tanpa akun" di halaman masuk).
  return (
    <Suspense fallback={null}>
      <LaporClient />
    </Suspense>
  );
}
