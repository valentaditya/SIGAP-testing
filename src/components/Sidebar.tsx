"use client";
import { Users, Activity, UserRound } from "lucide-react";

export type DashboardView = "pengguna" | "log" | "profil";

/* Menu dashboard Admin — Fokus Manajemen User, Log Keseluruhan Data & Profil */
const MENU: { id: DashboardView; label: string; icon: any; no: string; desc: string }[] = [
  { id: "pengguna", label: "Manajemen User", icon: Users, no: "01", desc: "Kelola akun Dinas, Petugas & Warga" },
  { id: "log", label: "Log Keseluruhan Data", icon: Activity, no: "02", desc: "Riwayat & aktivitas seluruh dinas" },
  { id: "profil", label: "Profil Admin", icon: UserRound, no: "03", desc: "Lihat & ubah informasi akun" },
];

export function Sidebar({
  view,
  onChange,
}: {
  view: DashboardView;
  onChange: (v: DashboardView) => void;
}) {
  return (
    <aside aria-label="Navigasi dashboard" className="border-r border-ink-300 bg-ground">
      <div className="sticky top-[var(--nav-h)] h-[calc(100vh-var(--nav-h))] overflow-y-auto py-7">
        <p className="micro-label mb-4 px-6 text-sage font-bold">Admin Portal</p>
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
        <p className="micro-label mt-8 px-6 text-sage font-bold">Wilayah Cangkupan</p>
        <p className="px-6 text-xs text-sage-pale font-medium">Kota Yogyakarta &amp; DIY</p>
      </div>
    </aside>
  );
}
