"use client";

const ITEMS = [
  "Lapor Cepat", "AI Multi-Agent", "Priority Score", "Geotagging",
  "Issue Tracking", "Early Warning", "Emergency Button", "Gamifikasi",
  "Laporan Anonim", "City Impact", "Kota Tanggap", "Transparan",
];

// Strip teks berjalan (marquee) — pola umum landing modern
export function Marquee() {
  const row = [...ITEMS, ...ITEMS];
  return (
    <div className="overflow-hidden border-b border-ink-900/[.06] bg-surface py-4">
      <div className="marquee flex w-max items-center gap-8 whitespace-nowrap">
        {row.map((t, i) => (
          <span key={i} className="flex items-center gap-8 font-display text-sm font-bold uppercase tracking-[.14em] text-ink-500">
            {t}
            <span className="h-1.5 w-1.5 rounded-full bg-brand-600" />
          </span>
        ))}
      </div>
    </div>
  );
}
