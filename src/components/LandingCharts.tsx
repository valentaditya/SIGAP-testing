"use client";

import { ChartBox } from "@/components/ChartBox";
import { KATEGORI, LAPORAN, TREN_BULANAN } from "@/lib/data";

export function LandingCharts() {
  const perKat = KATEGORI.map((k) => ({
    nama: k.nama,
    warna: k.warna,
    jumlah: LAPORAN.filter((l) => l.kategori === k.id).length,
  })).filter((x) => x.jumlah > 0);

  return (
    <div className="mt-10 grid gap-5 md:grid-cols-3">
      <div className="rounded-2xl bg-surface p-6 shadow-[var(--shadow-card)]">
        <h3 className="font-display font-bold">Kategori Laporan</h3>
        <p className="mb-3 text-sm text-ink-500">Distribusi 12 laporan aktif</p>
        <ChartBox
          def={{
            kind: "doughnut",
            labels: perKat.map((x) => x.nama),
            data: perKat.map((x) => x.jumlah),
            colors: perKat.map((x) => x.warna),
          }}
          height={240}
        />
      </div>
      <div className="rounded-2xl bg-surface p-6 shadow-[var(--shadow-card)]">
        <h3 className="font-display font-bold">Waktu Respons</h3>
        <p className="mb-3 text-sm text-ink-500">Rata-rata jam, makin kecil makin cepat</p>
        <ChartBox def={{ kind: "tren" }} height={240} />
      </div>
      <div className="rounded-2xl bg-surface p-6 shadow-[var(--shadow-card)]">
        <h3 className="font-display font-bold">Tren Bulanan</h3>
        <p className="mb-3 text-sm text-ink-500">Laporan masuk vs selesai</p>
        <ChartBox def={{ kind: "barKatPrio" }} height={240} />
      </div>
    </div>
  );
}
