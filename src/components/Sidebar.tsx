"use client";
import { useEffect, useState } from "react";
import { LayoutGrid, FileText, Map as MapIcon, BarChart3 } from "lucide-react";

/* Urutan menu = urutan visual section di dokumen */
const SECTIONS = [
  { id: "overview", label: "Overview", icon: LayoutGrid, no: "01" },
  { id: "analitik", label: "Analitik", icon: BarChart3, no: "02" },
  { id: "laporan", label: "Laporan", icon: FileText, no: "03" },
  { id: "peta", label: "Peta", icon: MapIcon, no: "04" },
];

export function Sidebar() {
  const [active, setActive] = useState("overview");

  useEffect(() => {
    function sync() {
      const els = SECTIONS.map((s) => document.getElementById(s.id)).filter(
        (el): el is HTMLElement => !!el
      );
      if (!els.length) return;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (window.scrollY >= maxScroll - 4) {
        setActive(els[els.length - 1].id);
        return;
      }
      const ref = window.scrollY + window.innerHeight * 0.45;
      let current = els[0];
      for (const el of els) {
        if (el.getBoundingClientRect().top + window.scrollY <= ref) current = el;
      }
      setActive(current.id);
    }
    sync();
    window.addEventListener("scroll", sync, { passive: true });
    return () => window.removeEventListener("scroll", sync);
  }, []);

  return (
    <aside aria-label="Navigasi dashboard" className="border-r border-ink-300 bg-ground">
      <div className="sticky top-[var(--nav-h)] h-[calc(100vh-var(--nav-h))] overflow-y-auto py-7">
        <p className="micro-label mb-4 px-6 text-sage">Menu</p>
        <nav>
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            const isActive = active === s.id;
            return (
              <a
                key={s.id}
                href={`#${s.id}`}
                aria-current={isActive ? "true" : undefined}
                className={`group relative flex items-center gap-3 border-l-2 px-6 py-3.5 no-underline transition-colors ${
                  isActive
                    ? "border-tan text-cream"
                    : "border-transparent text-sage-pale hover:text-cream"
                }`}
              >
                <span className={`font-mono text-[10px] tracking-[0.2em] ${isActive ? "text-tan" : "text-sage group-hover:text-sage-pale"}`}>
                  {s.no}
                </span>
                <Icon size={17} strokeWidth={1.8} className={isActive ? "text-tan" : ""} />
                <span className={`text-[.9375rem] ${isActive ? "font-semibold" : "font-medium"}`}>
                  {s.label}
                </span>
              </a>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
