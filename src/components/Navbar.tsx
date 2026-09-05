"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useLayoutEffect } from "react";
import { Menu, X, LogOut, LogIn, Sun, Moon } from "lucide-react";
import { useApp } from "@/lib/store";
import { NotifBell } from "@/components/NotifBell";
import { PERAN, NAV_TAMU, berandaPeran } from "@/lib/roles";

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { user, logout, theme, toggleTheme, hydrated } = useApp();
  const panelRef = useRef<HTMLElement>(null);

  // State untuk melacak section aktif saat di Landing Page
  const [activeHash, setActiveHash] = useState<string>("");

  // Sliding pill: posisi & ukuran dari DOM
  const navRef = useRef<HTMLUListElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Pantau scroll untuk update activeHash pada Landing Page
  useEffect(() => {
    if (pathname !== "/") {
      setActiveHash("");
      return;
    }

    if (typeof window !== "undefined" && window.location.hash) {
      setActiveHash(window.location.hash);
    }

    const sectionIds = ["fitur", "ai", "sla", "faq"];

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 120;

      if (window.scrollY < 200) {
        setActiveHash("");
        return;
      }

      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const id = sectionIds[i];
        const el = document.getElementById(id);
        if (el) {
          if (scrollPosition >= el.offsetTop) {
            setActiveHash("#" + id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const links = user ? PERAN[user.role].navigasi : NAV_TAMU;
  const beranda = user ? berandaPeran(user.role) : "/";

  // Kalkulasi posisi sliding pill berdasarkan item aktif
  const isActive = (href: string) => {
    if (pathname === "/") {
      if (href === "/") return activeHash === "";
      if (href.startsWith("/#")) return activeHash === href.replace("/", "");
      return false;
    }
    return pathname === href || (href !== "/" && pathname.startsWith(href));
  };

  // Gerakkan sliding pill ke elemen aktif
  useEffect(() => {
    const nav = navRef.current;
    const pill = pillRef.current;
    if (!nav || !pill) return;

    const activeEl = nav.querySelector<HTMLElement>("[data-active='true']");
    if (activeEl) {
      const navRect = nav.getBoundingClientRect();
      const elRect = activeEl.getBoundingClientRect();
      pill.style.width = `${elRect.width}px`;
      pill.style.left = `${elRect.left - navRect.left}px`;
      pill.style.opacity = "1";
    } else {
      pill.style.opacity = "0";
    }
  }, [activeHash, pathname, links]);

  // Handler klik link navigasi — smooth scroll untuk hash section
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("/#")) {
      const targetId = href.replace("/#", "");
      if (pathname === "/") {
        e.preventDefault();
        const elem = document.getElementById(targetId);
        if (elem) {
          elem.scrollIntoView({ behavior: "smooth" });
          window.history.pushState(null, "", href);
          setActiveHash("#" + targetId);
        }
      }
    } else if (href === "/") {
      if (pathname === "/") {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
        window.history.pushState(null, "", "/");
        setActiveHash("");
      }
    }
  };

  if (pathname === "/login" || pathname?.startsWith("/login")) {
    return null;
  }

  return (
    <header className="sticky top-0 z-[100] h-[var(--nav-h)] border-b border-ink-300 bg-bg/90 backdrop-blur-md transition-colors">
      <div className="relative mx-auto flex h-full max-w-[1400px] items-center px-6">
        {/* Logo */}
        <Link
          href={beranda}
          aria-label="SIGAP, kembali ke beranda"
          className="mr-auto flex items-center gap-2.5 py-3 no-underline"
        >
          <span className="font-display text-2xl font-extrabold tracking-tight text-cream-hi">
            SI<span className="text-tan">GAP</span>
          </span>
          {user ? (
            <span className="rounded-full bg-ground px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-sage border border-ink-300">
              {PERAN[user.role].singkat}
            </span>
          ) : (
            <span className="rounded-full bg-tan/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-tan border border-tan/20">
              v1.0
            </span>
          )}
        </Link>

        {/* ===== Desktop Navbar dengan Sliding Pill ===== */}
        <nav aria-label="Navigasi utama" className="absolute left-1/2 hidden -translate-x-1/2 md:block">
          {/* Container relatif agar pill bisa diposisikan absolut */}
          <ul
            ref={navRef}
            className="relative flex items-center gap-0.5 rounded-full border border-ink-300/80 bg-surface/80 p-1 shadow-sm backdrop-blur-sm"
          >
            {/* Sliding background pill */}
            <span
              ref={pillRef}
              aria-hidden="true"
              className="pointer-events-none absolute top-1 h-[calc(100%-8px)] rounded-full bg-tan shadow-md shadow-tan/25 opacity-0"
              style={{
                transition:
                  "left 280ms cubic-bezier(0.4, 0, 0.2, 1), width 280ms cubic-bezier(0.4, 0, 0.2, 1), opacity 180ms ease",
                willChange: "left, width",
              }}
            />

            {links.map((l) => {
              const active = isActive(l.href);
              return (
                <li key={l.href} className="relative z-10">
                  <Link
                    href={l.href}
                    data-active={active ? "true" : "false"}
                    onClick={(e) => handleNavClick(e, l.href)}
                    aria-current={active ? "page" : undefined}
                    className={`relative flex items-center rounded-full px-4 py-1.5 text-xs font-bold tracking-wide no-underline transition-colors duration-200 ${
                      active
                        ? "text-white"
                        : "text-sage-pale hover:text-cream-hi"
                    }`}
                  >
                    {l.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Tombol kanan */}
        <div className="ml-auto flex items-center gap-3 md:ml-0">
          <button
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
            className="grid h-10 w-10 place-items-center rounded-full border border-ink-300/70 bg-surface/80 text-sage-pale transition-all hover:bg-ground hover:text-cream shadow-sm hover:scale-105"
          >
            {theme === "dark" ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
          </button>

          {user && <NotifBell />}

          {hydrated && (user ? (
            <button
              onClick={logout}
              className="btn-anim hidden items-center gap-2 rounded-full border border-ink-300 bg-surface px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-sage-pale transition-colors hover:border-danger hover:text-danger shadow-sm md:inline-flex"
            >
              <LogOut size={14} aria-hidden="true" /> Keluar
            </button>
          ) : (
            <Link
              href="/login"
              className="btn-anim hidden items-center gap-2 rounded-full bg-tan px-5 py-2 font-display text-xs font-bold uppercase tracking-wider text-white no-underline shadow-md shadow-tan/20 hover:bg-tan-solid md:inline-flex"
            >
              <LogIn size={14} aria-hidden="true" /> Masuk
            </Link>
          ))}

          <button
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Tutup menu" : "Buka menu"}
            aria-expanded={open}
            aria-controls="menu-mobile"
            className="grid h-10 w-10 place-items-center rounded-full border border-ink-300 bg-surface text-sage-pale md:hidden"
          >
            {open ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* ===== Mobile Navbar ===== */}
      {open && (
        <nav
          id="menu-mobile"
          ref={panelRef}
          aria-label="Navigasi mobile"
          className="anim-fade-in border-b border-ink-300 bg-bg/95 backdrop-blur-md px-6 pb-6 pt-3 md:hidden shadow-lg"
        >
          <ul className="flex flex-col gap-1">
            {links.map((l) => {
              const active = isActive(l.href);
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    onClick={(e) => {
                      handleNavClick(e, l.href);
                      setOpen(false);
                    }}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-[44px] items-center rounded-xl px-4 text-sm font-semibold tracking-wide no-underline transition-all duration-200 ${
                      active
                        ? "bg-tan/15 text-tan font-bold"
                        : "text-sage-pale hover:bg-ground"
                    }`}
                  >
                    {l.label}
                  </Link>
                </li>
              );
            })}
            <li className="mt-3 border-t border-ink-300 pt-3">
              {user ? (
                <button
                  onClick={() => { logout(); setOpen(false); }}
                  className="flex min-h-[44px] w-full items-center gap-2 rounded-xl px-4 text-sm font-semibold text-danger hover:bg-danger/10"
                >
                  <LogOut size={16} aria-hidden="true" /> Keluar ({user.nama.split(" ")[0]})
                </button>
              ) : (
                <Link
                  href="/login"
                  className="flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-tan px-4 text-sm font-bold text-white no-underline shadow-md shadow-tan/20"
                >
                  <LogIn size={16} aria-hidden="true" /> Masuk ke Akun
                </Link>
              )}
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
