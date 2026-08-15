"use client";
import { useRouter } from "next/navigation";
import { LayoutGrid, FileText, LogOut } from "lucide-react";
import { useApp } from "@/lib/store";

export type DashboardView = "overview" | "laporan";

/* Menu dashboard — navigasi tab (bukan scroll-spy) */
const MENU: { id: DashboardView; label: string; icon: any; no: string; desc: string }[] = [
  { id: "overview", label: "Overview", icon: LayoutGrid, no: "01", desc: "Peta · kegiatan · analitik" },
  { id: "laporan", label: "Laporan", icon: FileText, no: "02", desc: "Daftar & filter lengkap" },
];

export function Sidebar({
  view,
  onChange,
}: {
  view: DashboardView;
  onChange: (v: DashboardView) => void;
}) {
  const { logout } = useApp();
  const router = useRouter();

  function keluar() {
    logout();
    router.replace("/login");
  }

  return (
    <aside aria-label="Navigasi dashboard" className="border-r border-ink-300 bg-ground">
      <div className="sticky top-0 flex h-screen flex-col overflow-y-auto py-6">
        {/* Brand */}
        <div className="mb-6 px-6">
          <p className="font-display text-2xl text-cream-hi">
            SI<span className="text-tan">GAP</span>
          </p>
          <p className="micro-label mt-1 text-sage">Menu Admin</p>
        </div>

        {/* Tab menu */}
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
                  isActive ? "border-tan text-cream" : "border-transparent text-sage-pale hover:text-cream"
                }`}
              >
                <span className={`font-mono text-[10px] tracking-[0.2em] ${isActive ? "text-tan" : "text-sage group-hover:text-sage-pale"}`}>
                  {s.no}
                </span>
                <Icon size={17} strokeWidth={1.8} className={isActive ? "text-tan" : ""} />
                <span className="min-w-0">
                  <span className={`block text-[.9375rem] ${isActive ? "font-semibold" : "font-medium"}`}>{s.label}</span>
                  <span className={`mt-0.5 block truncate text-[.6875rem] ${isActive ? "text-sage-pale" : "text-sage"}`}>{s.desc}</span>
                </span>
              </button>
            );
          })}
        </nav>

        {/* Wilayah + Keluar */}
        <div className="mt-auto px-6 pt-8">
          <p className="micro-label text-sage">Wilayah</p>
          <p className="mt-1 text-xs text-sage-pale">Kota Yogyakarta, DIY</p>
          <button
            onClick={keluar}
            className="mt-5 flex w-full items-center gap-2 border-t border-ink-300 pt-4 text-sm font-semibold text-sage-pale transition-colors hover:text-danger"
          >
            <LogOut size={15} /> Keluar
          </button>
        </div>
      </div>
    </aside>
  );
}
