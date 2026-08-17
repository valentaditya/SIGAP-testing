"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, X, LogOut, LogIn, Sun, Moon } from "lucide-react";
import { useApp } from "@/lib/store";
import { NotifBell } from "@/components/NotifBell";
import { PERAN, NAV_TAMU, berandaPeran } from "@/lib/roles";

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { user, logout, theme, toggleTheme, hydrated } = useApp();
  const panelRef = useRef<HTMLElement>(null);

  /* Menu ditutup saat pindah halaman; kalau tidak, panel mobile
     tetap menutupi konten tujuan setelah tautan diketuk.
     Ini reaksi terhadap perubahan rute (kejadian di luar React),
     jadi efek memang tempat yang tepat. */
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(false);
  }, [pathname]);

  /* Escape menutup menu mobile. */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  /* Navigasi mengikuti peran: menu yang tidak bisa dipakai tidak
     ditampilkan sama sekali, bukan ditampilkan lalu ditolak. */
  const links = user ? PERAN[user.role].navigasi : NAV_TAMU;
  const beranda = user ? berandaPeran(user.role) : "/";

  return (
    <header className="sticky top-0 z-[100] h-[var(--nav-h)] border-b-2 border-cream bg-bg">
      <div className="relative mx-auto flex h-full max-w-[1400px] items-center px-6">
        <Link
          href={beranda}
          aria-label="SIGAP, kembali ke beranda"
          className="mr-auto flex items-baseline gap-2 py-3 no-underline"
        >
          <span className="font-display text-2xl text-cream-hi">
            SI<span className="text-tan">GAP</span>
          </span>
          {/* Label peran menggantikan "beta": pengguna selalu tahu
              sedang berada di ruang siapa. */}
          {user ? (
            <span className="micro-label hidden border border-ink-300 px-2 py-0.5 text-sage sm:block">
              {PERAN[user.role].singkat}
            </span>
          ) : (
            <span className="micro-label hidden text-sage sm:block">beta</span>
          )}
        </Link>

        <nav aria-label="Navigasi utama" className="absolute left-1/2 hidden -translate-x-1/2 md:block">
          <ul className="flex items-center gap-5">
            {links.map((l) => {
              const active = pathname === l.href;
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    aria-current={active ? "page" : undefined}
                    className={`micro-label flex min-h-[44px] items-center px-2 no-underline transition-colors ${
                      active ? "text-tan" : "text-sage-pale hover:text-cream-hi"
                    }`}
                  >
                    {l.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2.5 md:ml-0">
          <button
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
            className="grid h-11 w-11 place-items-center text-sage-pale transition-colors hover:bg-ground"
          >
            {theme === "dark" ? <Sun size={20} aria-hidden="true" /> : <Moon size={20} aria-hidden="true" />}
          </button>

          {/* Notifikasi hanya berarti bagi pengguna yang sudah masuk. */}
          {user && <NotifBell />}

          {/* hydrated: sebelum localStorage terbaca, status masuk belum
              pasti. Merender tombol lebih dulu membuatnya berkedip
              "Masuk" lalu berubah jadi nama pengguna. */}
          {hydrated && (user ? (
            <button
              onClick={logout}
              className="hidden min-h-[44px] items-center gap-2 border border-ink-300 px-4 font-mono text-[11px] uppercase tracking-[0.2em] text-sage-pale transition-colors hover:border-danger hover:text-danger md:inline-flex"
            >
              <LogOut size={15} aria-hidden="true" /> Keluar
            </button>
          ) : (
            <Link
              href="/login"
              className="btn-anim hidden min-h-[44px] items-center gap-2 border-2 border-cream px-5 font-mono text-[11px] uppercase tracking-[0.2em] text-cream no-underline transition-colors hover:bg-cream hover:text-bg md:inline-flex"
            >
              <LogIn size={15} aria-hidden="true" /> Masuk
            </Link>
          ))}

          <button
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Tutup menu" : "Buka menu"}
            aria-expanded={open}
            aria-controls="menu-mobile"
            className="grid h-11 w-11 place-items-center text-sage-pale md:hidden"
          >
            {open ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {open && (
        <nav
          id="menu-mobile"
          ref={panelRef}
          aria-label="Navigasi utama"
          className="anim-fade-in border-b-2 border-cream bg-bg px-6 pb-6 pt-3 md:hidden"
        >
          <ul className="flex flex-col">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={pathname === l.href ? "page" : undefined}
                  className={`micro-label flex min-h-[48px] items-center no-underline ${
                    pathname === l.href ? "text-tan" : "text-sage-pale"
                  }`}
                >
                  {l.label}
                </Link>
              </li>
            ))}
            <li className="mt-2 border-t border-ink-300 pt-2">
              {user ? (
                <button
                  onClick={() => { logout(); setOpen(false); }}
                  className="micro-label flex min-h-[48px] w-full items-center gap-2 text-danger"
                >
                  <LogOut size={15} aria-hidden="true" /> Keluar ({user.nama.split(" ")[0]})
                </button>
              ) : (
                <Link href="/login" className="micro-label flex min-h-[48px] items-center gap-2 text-tan no-underline">
                  <LogIn size={15} aria-hidden="true" /> Masuk
                </Link>
              )}
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
