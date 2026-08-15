"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp, type Role } from "@/lib/store";
import { ShieldAlert, LogIn } from "lucide-react";
import Link from "next/link";

// Proteksi halaman berdasarkan peran.
// - Tanpa role: cukup harus login.
// - Dengan role: harus login DAN perannya cocok.
export function RequireAuth({
  children, role,
}: {
  children: React.ReactNode;
  role?: Role | Role[];
}) {
  const { user } = useApp();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // tunggu localStorage terbaca (store sudah hydrate di mount)
    const t = setTimeout(() => setHydrated(true), 60);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (role) {
      const allowed = Array.isArray(role) ? role : [role];
      if (!allowed.includes(user.role)) {
        router.replace(user.role === "admin" ? "/dashboard" : user.role === "petugas" ? "/petugas" : "/warga");
      }
    }
  }, [hydrated, user, role, router]);

  if (!hydrated || !user) {
    return (
      <main className="grid min-h-[calc(100vh-var(--nav-h))] place-items-center px-6">
        <div className="anim-fade-in text-center">
          <span className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-brand-100 text-brand-600">
            <ShieldAlert size={30} />
          </span>
          <p className="font-display text-lg font-bold">Memeriksa akses…</p>
          <p className="mt-1 text-sm text-ink-500">Mengalihkan ke halaman masuk.</p>
        </div>
      </main>
    );
  }

  if (role) {
    const allowed = Array.isArray(role) ? role : [role];
    if (!allowed.includes(user.role)) {
      return (
        <main className="grid min-h-[calc(100vh-var(--nav-h))] place-items-center px-6">
          <div className="anim-fade-up text-center">
            <span className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-danger-bg text-danger">
              <ShieldAlert size={30} />
            </span>
            <p className="font-display text-lg font-bold">Akses ditolak</p>
            <p className="mt-1 text-sm text-ink-500">Halaman ini bukan untuk peranmu.</p>
            <Link href="/login" className="btn-anim mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 font-semibold text-white no-underline hover:bg-brand-700">
              <LogIn size={16} /> Ganti Akun
            </Link>
          </div>
        </main>
      );
    }
  }

  return <>{children}</>;
}
