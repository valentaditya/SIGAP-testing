import { Suspense } from "react";
import LoginClient from "./LoginClient";

export const metadata = {
  title: "Masuk",
  description:
    "Masuk ke SIGAP sebagai warga, admin pemerintah, petugas lapangan, atau dinas instansi untuk melaporkan dan menangani masalah lingkungan kota.",
};

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginClient />
    </Suspense>
  );
}
