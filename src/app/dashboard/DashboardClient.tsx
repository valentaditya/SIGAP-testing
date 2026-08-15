"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Sidebar } from "@/components/Sidebar";
import { Chip } from "@/components/Chip";
import { ChartBox } from "@/components/ChartBox";
import { Counter } from "@/components/Counter";
import { Reveal } from "@/components/Reveal";
import {
  LAPORAN, KATEGORI, STATUS_ORDER, STATUS_LABEL, statusTone,
  priorityColor, priorityLabel, getKategori,
} from "@/lib/data";
import {
  FileText, Clock, CheckCircle2, TrendingUp, ThumbsUp, Camera, ArrowUpDown, Flame,
} from "lucide-react";

const AdminMap = dynamic(() => import("@/components/AdminMap").then((m) => m.AdminMap), {
  ssr: false,
  loading: () => <div className="grid h-[420px] place-items-center text-sm text-ink-500">Memuat peta…</div>,
});

type SortKey = "id" | "judul" | "kategori" | "dukungan" | "priority" | "status";

export default function DashboardClient() {
  const [filter, setFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("priority");
  const [sortDir, setSortDir] = useState<1 | -1>(-1);

  const aktif = LAPORAN.filter((x) => x.status !== "resolved");
  const avg = Math.round((LAPORAN.reduce((a, b) => a + b.ai.priorityScore, 0) / LAPORAN.length) * 10) / 10;
  const kritis = LAPORAN.filter((x) => x.ai.priorityScore >= 9).length;
  const menunggu = LAPORAN.filter((x) => x.status === "reported").length;
  const diproses = LAPORAN.filter((x) => ["verified", "assigned", "in_progress"].includes(x.status)).length;
  const selesai = LAPORAN.filter((x) => x.status === "resolved").length;

  const kpis = [
    { lbl: "Total Laporan", val: LAPORAN.length, sub: "12 laporan aktif & selesai", tone: "neutral" as const, icon: FileText },
    { lbl: "Menunggu Verifikasi", val: menunggu, sub: "Perlu tindakan admin", tone: "danger" as const, icon: Clock },
    { lbl: "Sedang Diproses", val: diproses, sub: "Sudah ditugaskan", tone: "warning" as const, icon: TrendingUp },
    { lbl: "Selesai", val: selesai, sub: "Bulan berjalan", tone: "success" as const, icon: CheckCircle2 },
    { lbl: "Skor Darurat ≥9", val: kritis, sub: "Prioritas tertinggi", tone: "danger" as const, icon: Flame },
  ];

  const rows = LAPORAN
    .filter((l) => filter === "all" || l.status === filter)
    .sort((a, b) => {
      let x: any, y: any;
      switch (sortKey) {
        case "judul": x = a.judul; y = b.judul; break;
        case "kategori": x = getKategori(a.kategori).nama; y = getKategori(b.kategori).nama; break;
        case "dukungan": x = a.dukungan; y = b.dukungan; break;
        case "status": x = STATUS_ORDER.indexOf(a.status); y = STATUS_ORDER.indexOf(b.status); break;
        case "id": x = a.id; y = b.id; break;
        default: x = a.ai.priorityScore; y = b.ai.priorityScore;
      }
      return (x < y ? -1 : x > y ? 1 : 0) * sortDir;
    });

  function toggleSort(k: SortKey) {
    if (sortKey === k) setSortDir((d) => (d === 1 ? -1 : 1));
    else { setSortKey(k); setSortDir(k === "priority" || k === "dukungan" ? -1 : 1); }
  }

  const TH = ({ k, children }: { k: SortKey; children: React.ReactNode }) => (
    <th
      onClick={() => toggleSort(k)}
      className="cursor-pointer select-none whitespace-nowrap border-b-2 border-[#EEF1F0] px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-[.06em] text-ink-500 hover:text-brand-600"
    >
      <span className="inline-flex items-center gap-1">
        {children}
        <ArrowUpDown size={12} className={sortKey === k ? "opacity-100 text-brand-600" : "opacity-40"} />
      </span>
    </th>
  );

  return (
    <div className="grid min-h-[calc(100vh-var(--nav-h))] w-full grid-cols-1 lg:grid-cols-[240px_1fr]">
      <Sidebar />

      <main id="overview" className="w-full max-w-none p-5 md:p-8">
        {/* ===== Header ===== */}
        <Reveal className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-extrabold md:text-3xl">
              Selamat pagi, <span className="text-brand-600">Pak Bimo</span>{" "}
              <span role="img" aria-label="lambaian tangan">👋</span>
            </h1>
            <p className="mt-1 text-sm text-ink-500">
              Ringkasan laporan wilayah Kota Yogyakarta · diperbarui 15 Jan 2026, 08.30 WIB
            </p>
            <p className="micro-label mt-2 text-sage">01 · ringkasan hari ini</p>
          </div>
          <a
            href="#laporan"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white no-underline shadow-[var(--shadow-card)] transition-colors hover:bg-brand-700"
          >
            Tinjau Antrean Verifikasi
          </a>
        </Reveal>

        {/* ===== KPI ===== */}
        <div className="mb-7 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          {kpis.map((k, i) => {
            const Ic = k.icon;
            return (
              <Reveal key={k.lbl} delay={i * 80} className="rounded-2xl bg-surface p-5 shadow-[var(--shadow-card)]">
                <div className="mb-1.5 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[.06em] text-ink-500">{k.lbl}</p>
                  <Ic size={16} className="text-ink-300" />
                </div>
                <p className="font-display text-3xl font-extrabold leading-tight">
                  <Counter to={k.val} dur={850} delay={i * 80} />
                </p>
                <div className="mt-2">
                  <Chip tone={k.tone === "neutral" ? "neutral" : k.tone}>{k.sub}</Chip>
                </div>
              </Reveal>
            );
          })}
        </div>

        {/* ===== Analitik ===== */}
        <section id="analitik" className="mb-7">
          <Reveal delay={110} className="mb-5 flex items-baseline justify-between border-t-2 border-cream pt-4">
            <h2 className="font-display text-xl font-bold">Analitik</h2>
            <p className="micro-label text-sage">02 · performa penanganan</p>
          </Reveal>
          <div className="mb-5 grid grid-cols-1 gap-5 xl:grid-cols-[1.2fr_.8fr]">
            <Reveal delay={150} className="rounded-2xl bg-surface p-6 shadow-[var(--shadow-card)]">
              <h3 className="font-display text-lg font-bold">Antrean per Kategori & Prioritas</h3>
              <p className="mb-4 text-sm text-ink-500">Laporan aktif (belum selesai) — batang merah menandai banyak kasus darurat</p>
              <ChartBox def={{ kind: "barKatPrio" }} height={300} />
            </Reveal>
            <Reveal delay={190} className="rounded-2xl bg-surface p-6 shadow-[var(--shadow-card)]">
              <h3 className="font-display text-lg font-bold">Rata-rata Priority Score</h3>
              <p className="mb-4 text-sm text-ink-500">Seluruh laporan aktif saat ini</p>
              <div className="relative">
                <ChartBox def={{ kind: "gauge", value: avg }} height={220} />
                <div className="pointer-events-none absolute inset-x-0 bottom-2 text-center">
                  <div className="font-display text-4xl font-extrabold" style={{ color: priorityColor(avg) }}>
                    <Counter to={avg} decimals={1} dur={950} delay={340} />
                  </div>
                  <div className="text-sm text-ink-500">{priorityLabel(avg)}</div>
                </div>
              </div>
            </Reveal>
          </div>

          {/* ===== Analitik bawah ===== */}
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.2fr_.8fr]">
            <Reveal delay={230} className="rounded-2xl bg-surface p-6 shadow-[var(--shadow-card)]">
              <h3 className="font-display text-lg font-bold">Tren 6 Bulan Terakhir</h3>
              <p className="mb-4 text-sm text-ink-500">Laporan masuk vs diselesaikan</p>
              <ChartBox def={{ kind: "tren" }} height={260} />
            </Reveal>
            <Reveal delay={270} className="rounded-2xl bg-surface p-6 shadow-[var(--shadow-card)]">
              <h3 className="font-display text-lg font-bold">Faktor Pembentuk Skor</h3>
              <p className="mb-4 text-sm text-ink-500">Kontribusi rata-rata tiap faktor analisis AI</p>
              <ChartBox def={{ kind: "radar" }} height={260} />
            </Reveal>
          </div>
        </section>

        {/* ===== Tabel laporan ===== */}
        <Reveal delay={310} className="mb-5 flex items-baseline justify-between border-t-2 border-cream pt-4">
          <h2 className="font-display text-xl font-bold">Laporan</h2>
          <p className="micro-label text-sage">03 · antrean kerja</p>
        </Reveal>
        <section id="laporan" className="anim-fade-in mb-5 rounded-2xl bg-surface p-6 shadow-[var(--shadow-card)]" style={{ animationDelay: "360ms" }}>
          <h3 className="font-display text-lg font-bold">Daftar Laporan</h3>
          <p className="mb-4 text-sm text-ink-500">Klik judul kolom untuk mengurutkan · diurutkan berdasarkan Priority Score secara bawaan</p>

          <div className="mb-4 flex flex-wrap gap-2">
            {["all", ...STATUS_ORDER].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`rounded-full border px-4 py-2 text-[.8125rem] font-semibold transition-all ${
                  filter === s
                    ? "border-brand-600 bg-brand-600 text-white"
                    : "border-ink-300 text-sage-pale hover:border-brand-600 hover:text-brand-600"
                }`}
              >
                {s === "all" ? "Semua" : STATUS_LABEL[s as keyof typeof STATUS_LABEL]}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto rounded-2xl">
            <table className="w-full border-collapse bg-surface text-sm">
              <thead>
                <tr>
                  <TH k="id">Tiket</TH>
                  <TH k="judul">Laporan</TH>
                  <TH k="kategori">Kategori</TH>
                  <TH k="dukungan">Dukungan</TH>
                  <TH k="priority">Priority</TH>
                  <TH k="status">Status</TH>
                </tr>
              </thead>
              <tbody>
                {rows.map((l, ri) => {
                  const k = getKategori(l.kategori);
                  return (
                    <tr key={l.id} className="row-in transition-colors hover:bg-brand-50" style={{ animationDelay: `${ri * 45}ms` }}>
                      <td className="border-b border-ink-300 px-4 py-3.5 align-middle font-mono text-[.8rem] font-semibold text-ink-700">{l.id}</td>
                      <td className="border-b border-ink-300 px-4 py-3.5 align-middle">
                        <div className="font-semibold">{l.judul}</div>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-ink-500">
                          {l.lokasi.alamat}
                          <span className="inline-flex items-center gap-0.5"><Camera size={11} />{l.foto}</span>
                        </div>
                      </td>
                      <td className="border-b border-ink-300 px-4 py-3.5 align-middle">
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                          style={{ background: `${k.warna}1a`, color: k.warna }}
                        >
                          <span className="h-[7px] w-[7px] rounded-full" style={{ background: k.warna }} />
                          {k.nama}
                        </span>
                      </td>
                      <td className="border-b border-ink-300 px-4 py-3.5 align-middle">
                        <span className="inline-flex items-center gap-1 font-semibold">
                          {l.dukungan} <ThumbsUp size={13} className="text-amber-500" />
                        </span>
                      </td>
                      <td className="border-b border-ink-300 px-4 py-3.5 align-middle">
                        <div className="flex items-center gap-2">
                          <span className="font-display font-extrabold" style={{ color: priorityColor(l.ai.priorityScore) }}>
                            {l.ai.priorityScore}
                          </span>
                          <span className="h-1.5 w-16 overflow-hidden rounded-full bg-[#EEF1F0]">
                            <span
                              className="block h-full rounded-full"
                              style={{ width: `${l.ai.priorityScore * 10}%`, background: priorityColor(l.ai.priorityScore) }}
                            />
                          </span>
                        </div>
                      </td>
                      <td className="border-b border-ink-300 px-4 py-3.5 align-middle">
                        <Chip tone={statusTone(l.status)}>{STATUS_LABEL[l.status]}</Chip>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* ===== Peta ===== */}
        <Reveal delay={400} className="mb-5 flex items-baseline justify-between border-t-2 border-cream pt-4">
          <h2 className="font-display text-xl font-bold">Peta</h2>
          <p className="micro-label text-sage">04 · sebaran wilayah</p>
        </Reveal>
        <section id="peta" className="anim-fade-in rounded-2xl bg-surface p-6 shadow-[var(--shadow-card)]" style={{ animationDelay: "440ms" }}>
          <h3 className="font-display text-lg font-bold">Peta Sebaran Laporan</h3>
          <p className="mb-4 text-sm text-ink-500">Warna penanda = tingkat prioritas dari AI Multi-Agent</p>
          <AdminMap />
          <div className="mt-4 flex flex-wrap gap-2">
            <Chip tone="danger">Darurat (≥9)</Chip>
            <Chip tone="warning">Tinggi (7–8.9)</Chip>
            <Chip tone="success">Sedang / Rendah (&lt;7)</Chip>
          </div>
        </section>
      </main>
    </div>
  );
}
