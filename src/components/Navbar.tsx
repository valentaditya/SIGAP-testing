"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, LogOut, LogIn, UserRound, LayoutDashboard, Sun, Moon } from "lucide-react";
import { useApp } from "@/lib/store";
import { NotifBell } from "@/components/NotifBell";

const LINKS = [
  { href: "/", label: "Beranda" },
  { href: "/lapor", label: "Form Pelaporan" },
  { href: "/dampak", label: "Dampak Kota" },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { user, logout, theme, toggleTheme } = useApp();
  const isAdminArea = pathname.startsWith("/dashboard");

  return (
    <header className="sticky top-0 z-[100] h-[var(--nav-h)] border-b-2 border-cream bg-bg">
      <div className="relative mx-auto flex h-full max-w-[1400px] items-center px-6">
        {/* Brand kiri: wordmark Anton, separuh merah */}
        <Link href="/" className="group mr-auto flex items-baseline gap-2 no-underline">
          <span className="font-display text-2xl text-cream-hi">
            SI<span className="text-tan">GAP</span>
          </span>
          <span className="micro-label hidden text-sage sm:block">beta</span>
          {isAdminArea && (
            <span className="micro-label ml-2 border border-success px-2 py-0.5 text-success">Admin</span>
          )}
        </Link>

        {/* Menu tengah (desktop) */}
        <nav aria-label="Navigasi utama" className="absolute left-1/2 hidden -translate-x-1/2 md:block">
          <ul className="flex items-center gap-7">
            {LINKS.map((l) => {
              const active = pathname === l.href;
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    aria-current={active ? "page" : undefined}
                    className={`micro-label no-underline transition-colors ${
                      active ? "text-tan" : "text-sage-pale hover:text-cream-hi"
                    }`}
                  >
                    {l.label}
                  </Link>
                </li>
              );
            })}
            {user?.role === "admin" && (
              <li>
                <Link href="/dashboard" className={`micro-label no-underline transition-colors ${pathname === "/dashboard" ? "text-tan" : "text-sage-pale hover:text-cream-hi"}`}>
                  Dashboard
                </Link>
              </li>
            )}
          </ul>
        </nav>

        {/* Aksi kanan */}
        <div className="ml-auto flex items-center gap-2.5 md:ml-0">
          <button
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Mode terang" : "Mode gelap"}
            className="grid h-[42px] w-[42px] place-items-center text-sage-pale transition-colors hover:bg-ground"
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <NotifBell />
          {user ? (
            <>
              <Link
                href={user.role === "admin" ? "/dashboard" : "/warga"}
                className="hidden items-center gap-2 border border-ink-300 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.2em] text-brand-600 no-underline transition-colors hover:bg-brand-50 md:inline-flex"
              >
                {user.role === "admin" ? <LayoutDashboard size={15} /> : <UserRound size={15} />}
                {user.nama.split(" ")[0]}
              </Link>
              <button
                onClick={logout}
                className="hidden items-center gap-2 border border-ink-300 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.2em] text-sage-pale transition-colors hover:border-danger hover:text-danger md:inline-flex"
              >
                <LogOut size={15} /> Keluar
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="btn-anim hidden items-center gap-2 border-2 border-cream px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.2em] text-cream no-underline transition-colors hover:bg-cream hover:text-bg md:inline-flex"
            >
              <LogIn size={15} /> Masuk
            </Link>
          )}
          <button
            onClick={() => setOpen(!open)}
            aria-label={open ? "Tutup menu" : "Buka menu"}
            aria-expanded={open}
            className="grid h-[42px] w-[42px] place-items-center text-sage-pale md:hidden"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Menu mobile */}
      {open && (
        <nav className="anim-fade-in border-b-2 border-cream bg-bg px-6 pb-7 pt-5 md:hidden">
          <ul className="flex flex-col gap-4">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} onClick={() => setOpen(false)} className={`micro-label block no-underline ${pathname === l.href ? "text-tan" : "text-sage-pale"}`}>
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              {user ? (
                <button onClick={() => { logout(); setOpen(false); }} className="micro-label text-danger">
                  Keluar ({user.nama.split(" ")[0]})
                </button>
              ) : (
                <Link href="/login" onClick={() => setOpen(false)} className="micro-label text-tan no-underline">
                  Masuk
                </Link>
              )}
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
