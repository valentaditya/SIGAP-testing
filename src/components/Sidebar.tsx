"use client";
import { Users, FileText, Activity, UserRound } from "lucide-react";

export type DashboardView = "pengguna" | "laporan" | "log" | "profil";

/* Menu dashboard Admin */
const MENU: { id: DashboardView; label: string; icon: any; no: string; desc: string }[] = [
  { id: "pengguna", label: "Pengguna", icon: Users, no: "01", desc: "Kelola akun pengguna" },
  { id: "laporan", label: "Laporan", icon: FileText, no: "02", desc: "Kelola data laporan" },
  { id: "log", label: "Log Aktivitas", icon: Activity, no: "03", desc: "Riwayat aktivitas sistem" },
  { id: "profil", label: "Profil", icon: UserRound, no: "04", desc: "Informasi akun admin" },
];

export function Sidebar({
  view,
  onChange,
}: {
  view: DashboardView;
  onChange: (v: DashboardView) => void;
}) {
  return (
    <>
      {/* Mobile Horizontal Tabs (< lg) */}
      <nav aria-label="Navigasi dashboard" className="lg:hidden sticky top-[var(--nav-h)] z-30 border-b border-ink-300 bg-ground/95 backdrop-blur-md px-3 py-2.5 shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          {MENU.map((s) => {
            const Icon = s.icon;
            const isActive = view === s.id;
            return (
              <button
                key={s.id}
                onClick={() => onChange(s.id)}
                aria-current={isActive ? "true" : undefined}
                className={`flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-brand-600 text-white shadow-md shadow-brand-600/25 font-bold"
                    : "bg-surface border border-ink-300/60 text-sage-pale hover:text-cream hover:bg-surface/80"
                }`}
              >
                <Icon size={15} strokeWidth={isActive ? 2.2 : 1.8} />
                <span className="whitespace-nowrap">{s.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Desktop Vertical Sidebar (>= lg) */}
      <aside aria-label="Navigasi dashboard" className="hidden lg:block border-r border-ink-300 bg-ground">
        <div className="sticky top-[var(--nav-h)] h-[calc(100vh-var(--nav-h))] overflow-y-auto py-7">
          <p className="micro-label mb-4 px-6 text-sage font-bold">Menu Admin</p>
          <nav className="space-y-1">
            {MENU.map((s) => {
              const Icon = s.icon;
              const isActive = view === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => onChange(s.id)}
                  aria-current={isActive ? "true" : undefined}
                  className={`group relative flex w-full items-center gap-3 border-l-2 px-6 py-3.5 text-left no-underline transition-colors ${
                    isActive ? "border-brand-600 text-cream bg-surface/50" : "border-transparent text-sage-pale hover:text-cream"
                  }`}
                >
                  <span className={`font-mono text-[10px] tracking-[0.2em] ${isActive ? "text-brand-600 font-bold" : "text-sage group-hover:text-sage-pale"}`}>
                    {s.no}
                  </span>
                  <Icon size={17} strokeWidth={1.8} className={isActive ? "text-brand-600" : ""} />
                  <span className="min-w-0">
                    <span className={`block text-[.9375rem] ${isActive ? "font-semibold" : "font-medium"}`}>{s.label}</span>
                    <span className={`mt-0.5 block truncate text-[.6875rem] ${isActive ? "text-sage-pale" : "text-sage"}`}>{s.desc}</span>
                  </span>
                </button>
              );
            })}
          </nav>
          <p className="micro-label mt-8 px-6 text-sage font-bold">Wilayah Kerja</p>
          <p className="px-6 text-xs text-sage-pale font-medium">Daerah Istimewa Yogyakarta</p>
        </div>
      </aside>
    </>
  );
}
