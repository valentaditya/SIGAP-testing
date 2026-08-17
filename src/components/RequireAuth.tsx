"use client";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useApp, type Role } from "@/lib/store";
import { PERAN, berandaPeran } from "@/lib/roles";
import { ShieldAlert, LogIn, ArrowRight } from "lucide-react";
import Link from "next/link";

// Proteksi halaman berdasarkan peran.
// - Tanpa role: cukup harus login.
// - Dengan role: harus login DAN perannya cocok.
//
// Perbaikan: memakai `hydrated` dari store, bukan setTimeout(60ms) yang
// menebak-nebak. Pada perangkat lambat timeout bisa habis sebelum
// localStorage terbaca → pengguna yang sudah login ikut terlempar ke /login.
export function RequireAuth({
  children,
  role,
}: {
  children: React.ReactNode;
  role?: Role | Role[];
}) {
  const { user, hydrated } = useApp();
  const router = useRouter();
  const pathname = usePathname();

  const allowed = role ? (Array.isArray(role) ? role : [role]) : null;
  const cocok = !allowed || (user ? allowed.includes(user.role) : false);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      // Simpan tujuan agar setelah masuk pengguna kembali ke halaman ini,
      // bukan dibuang ke beranda peran.
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (!cocok) {
      // Tujuan diambil dari definisi peran terpusat. Sebelumnya rantai
      // ternary ini diulang di beberapa berkas dan sempat tidak sinkron
      // dengan navbar, sehingga petugas dikirim ke ruang warga.
      router.replace(berandaPeran(user.role));
    }
  }, [hydrated, user, cocok, router, pathname]);

  if (!hydrated || !user) {
    return (
      <main className="grid min-h-[calc(100dvh-var(--nav-h))] place-items-center px-6">
        <div className="anim-fade-in text-center" role="status" aria-live="polite">
          <span className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-brand-100 text-brand-600">
            <ShieldAlert size={30} aria-hidden="true" />
          </span>
          <p className="font-display text-lg font-bold">Memeriksa akses…</p>
          <p className="mt-1 text-sm text-ink-500">Mengalihkan ke halaman masuk.</p>
        </div>
      </main>
    );
  }

  if (!cocok) {
    return (
      <main className="grid min-h-[calc(100dvh-var(--nav-h))] place-items-center px-6">
        <div className="anim-fade-up text-center">
          <span className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-danger-bg text-danger">
            <ShieldAlert size={30} aria-hidden="true" />
          </span>
          <p className="font-display text-lg font-bold">Halaman ini bukan untuk peran {PERAN[user.role].singkat}</p>
          <p className="mt-1 text-sm text-ink-500">
            Kami mengantar kamu kembali ke ruang {PERAN[user.role].singkat}.
          </p>
          {/* Dua jalan keluar yang jelas: lanjut ke ruang sendiri, atau
              ganti akun. Sebelumnya hanya ada "Ganti Akun", yang memaksa
              keluar padahal pengguna cuma salah alamat. */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={berandaPeran(user.role)}
              className="btn-anim inline-flex min-h-[44px] items-center gap-2 bg-tan-solid px-5 font-semibold text-white no-underline hover:bg-brand-700"
            >
              Ke ruang {PERAN[user.role].singkat} <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link
              href="/login"
              className="inline-flex min-h-[44px] items-center gap-2 border border-ink-300 px-5 font-semibold text-ink-700 no-underline transition-colors hover:border-cream"
            >
              <LogIn size={16} aria-hidden="true" /> Ganti akun
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
