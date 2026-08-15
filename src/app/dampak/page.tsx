"use client";

import { ChartBox } from "@/components/ChartBox";
import { Counter } from "@/components/Counter";
import { Reveal } from "@/components/Reveal";
import { KATEGORI, LAPORAN, TREN_BULANAN, WAKTU_RESPONS } from "@/lib/data";
import { TrendingUp, PieChart, Activity, Clock } from "lucide-react";

export default function DampakPage() {
  const total = LAPORAN.length;
  const selesai = LAPORAN.filter((l) => l.status === "resolved").length;
  const tingkatSelesai = Math.round((selesai / total) * 100);
  const avgSkor = Math.round((LAPORAN.reduce((a, b) => a + b.ai.priorityScore, 0) / total) * 10) / 10;

  const perKat = KATEGORI.map((k) => ({
    nama: k.nama, warna: k.warna,
    jumlah: LAPORAN.filter((l) => l.kategori === k.id).length,
  })).filter((x) => x.jumlah > 0);

  const stats = [
    { icon: Activity, lbl: "Total Laporan", val: total, suffix: "" },
    { icon: TrendingUp, lbl: "Tingkat Penyelesaian", val: tingkatSelesai, suffix: "%" },
    { icon: Clock, lbl: "Respons Tercepat (jam)", val: 24, suffix: "" },
    { icon: PieChart, lbl: "Rata-rata Skor (1–10)", val: avgSkor, suffix: "" },
  ];

  return (
    <main className="mx-auto max-w-[1160px] px-6 py-12">
      <Reveal className="mb-10 text-center">
        <p className="text-xs font-bold uppercase tracking-[.12em] text-brand-600">City Impact Dashboard</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold md:text-4xl">Dampak SIGAP untuk Kota</h1>
        <p className="mx-auto mt-3 max-w-[560px] text-ink-500">Statistik dan visualisasi persebaran laporan, kategori, dan tingkat penyelesaian sebagai gambaran dampak nyata SIGAP.</p>
      </Reveal>

      {/* Stat cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s, i) => {
          const Ic = s.icon;
          return (
            <Reveal key={s.lbl} delay={i * 70} className="card-hover rounded-2xl bg-surface p-5 shadow-[var(--shadow-card)]">
              <span className="mb-3 grid h-11 w-11 place-items-center rounded-xl bg-brand-100 text-brand-600"><Ic size={20} /></span>
              <p className="font-display text-3xl font-extrabold text-brand-600">
                <Counter to={s.val} suffix={s.suffix} decimals={s.lbl.includes("1–10") ? 1 : 0} />
              </p>
              <p className="mt-1 text-sm text-ink-500">{s.lbl}</p>
            </Reveal>
          );
        })}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Reveal className="card-hover rounded-2xl bg-surface p-6 shadow-[var(--shadow-card)]">
          <h3 className="font-display font-bold">Distribusi Kategori</h3>
          <p className="mb-3 text-sm text-ink-500">Jumlah laporan per kategori masalah</p>
          <ChartBox def={{ kind: "doughnut", labels: perKat.map((x) => x.nama), data: perKat.map((x) => x.jumlah), colors: perKat.map((x) => x.warna) }} height={260} />
        </Reveal>
        <Reveal delay={90} className="card-hover rounded-2xl bg-surface p-6 shadow-[var(--shadow-card)]">
          <h3 className="font-display font-bold">Tren 6 Bulan</h3>
          <p className="mb-3 text-sm text-ink-500">Laporan masuk vs diselesaikan</p>
          <ChartBox def={{ kind: "tren" }} height={260} />
        </Reveal>
      </div>
    </main>
  );
}
