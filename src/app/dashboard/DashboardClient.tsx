"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Sidebar, type DashboardView } from "@/components/Sidebar";
import { Chip } from "@/components/Chip";
import { ChartBox } from "@/components/ChartBox";
import { Counter } from "@/components/Counter";
import { Reveal } from "@/components/Reveal";
import {
  LAPORAN, KATEGORI, STATUS_ORDER, STATUS_LABEL, statusTone,
  priorityColor, priorityLabel, getKategori,
  KEGIATAN, KEGIATAN_HARI, KEGIATAN_LABEL, HARI_LAPORAN, formatHari,
  type KegiatanTipe,
} from "@/lib/data";
import {
  FileText, Clock, CheckCircle2, TrendingUp, Flame, ThumbsUp, Camera, ArrowUpDown,
  Search, X, RotateCcw, Filter, MapPin,
  Wrench, BadgeCheck, UserCheck, FilePlus2,
} from "lucide-react";
import { useApp } from "@/lib/store";

const AdminMap = dynamic(() => import("@/components/AdminMap").then((m) => m.AdminMap), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-sm text-ink-500">Memuat peta…</div>,
});

type SortKey = "id" | "judul" | "kategori" | "dukungan" | "priority" | "status";
type FilterPrioritas = "all" | "darurat" | "tinggi" | "sedang" | "rendah";

/* Ikon + warna per tipe kegiatan harian */
const TIPE_META: Record<KegiatanTipe, { icon: any; cls: string }> = {
  baru: { icon: FilePlus2, cls: "bg-info-bg text-info" },
  verifikasi: { icon: BadgeCheck, cls: "bg-brand-100 text-brand-600" },
  penugasan: { icon: UserCheck, cls: "bg-warning-bg text-warning" },
  penanganan: { icon: Wrench, cls: "bg-warning-bg text-warning" },
  selesai: { icon: CheckCircle2, cls: "bg-success-bg text-success" },
};

export default function DashboardClient() {
  const [view, setView] = useState<DashboardView>("overview");

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [view]);

  return (
    <div className="grid min-h-[calc(100vh-var(--nav-h))] w-full grid-cols-1 lg:grid-cols-[240px_1fr]">
      <Sidebar view={view} onChange={setView} />
      <main className="w-full max-w-none p-5 md:p-8">
        {view === "overview" ? <Overview onGoLaporan={() => setView("laporan")} /> : <LaporanView />}
      </main>
    </div>
  );
}

/* ============================================================
   OVERVIEW — peta di highlight duluan → KPI → kegiatan 1 hari → analitik
   ============================================================ */
function Overview({ onGoLaporan }: { onGoLaporan: () => void }) {
  const { user } = useApp();
  const [day, setDay] = useState(KEGIATAN_HARI[0].key);
  const [expanded, setExpanded] = useState(false);
  const kegiatan = KEGIATAN[day] ?? [];
  const dayInfo = KEGIATAN_HARI.find((h) => h.key === day);
  const nama = user?.nama?.trim() || "Admin";
  const sapaan = /^(pak|bu)\s/i.test(nama) ? nama : `Pak ${nama}`;
  const tampil = expanded ? kegiatan : kegiatan.slice(0, 6);

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

  return (
    <>
      {/* ===== Header ===== */}
      <Reveal className="mb-7 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold md:text-3xl">
            Selamat pagi, <span className="text-brand-600">{sapaan}</span>{" "}
            <span role="img" aria-label="lambaian tangan">👋</span>
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Ringkasan laporan wilayah Kota Yogyakarta · diperbarui 15 Jan 2026, 08.30 WIB
          </p>
          <p className="micro-label mt-2 text-sage">01 · ringkasan hari ini</p>
        </div>
        <button
          onClick={onGoLaporan}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-[var(--shadow-card)] transition-colors hover:bg-brand-700"
        >
          <FileText size={16} /> Tinjau Antrean Verifikasi
        </button>
      </Reveal>

      {/* ===== KPI — di atas peta ===== */}
      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
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

      {/* ===== 01 · PETA (kecil) + LOG KEGIATAN (ringkas) berdampingan ===== */}
      <section id="peta" className="mb-8">
        <Reveal className="mb-5 flex items-baseline justify-between border-t-2 border-cream pt-4">
          <div>
            <h2 className="font-display text-xl font-bold md:text-2xl">Peta &amp; Log Kegiatan</h2>
            <p className="mt-1 text-sm text-ink-500">
              Sebaran laporan di peta — di sebelahnya, kegiatan proses yang terjadi hari ini
            </p>
          </div>
          <p className="micro-label text-sage">01 · fokus utama</p>
        </Reveal>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.15fr_.85fr]">
          {/* Peta — mengisi tinggi agar bawahnya sejajar dengan log kegiatan */}
          <Reveal delay={80}>
            <div className="relative flex h-full flex-col overflow-hidden rounded-3xl border-2 border-tan/50 bg-surface shadow-[var(--shadow-pop)]">
              <div className="pointer-events-none absolute left-4 top-4 z-[900] flex items-center gap-2 rounded-full bg-bg/90 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[.14em] text-tan ring-1 ring-tan/40 backdrop-blur">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-tan opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-tan" />
                </span>
                Fokus Utama
              </div>
              <div className="pointer-events-none absolute right-4 top-4 z-[900] hidden items-center gap-4 rounded-2xl bg-bg/90 px-3.5 py-2 ring-1 ring-white/10 backdrop-blur sm:flex">
                <div className="text-center">
                  <p className="font-display text-base font-extrabold leading-none text-cream">{aktif.length}</p>
                  <p className="mt-0.5 text-[9px] uppercase tracking-[.12em] text-sage">Aktif</p>
                </div>
                <div className="h-7 w-px bg-ink-300" />
                <div className="text-center">
                  <p className="font-display text-base font-extrabold leading-none text-tan">{kritis}</p>
                  <p className="mt-0.5 text-[9px] uppercase tracking-[.12em] text-sage">Darurat</p>
                </div>
              </div>

              <div className="min-h-[260px] flex-1 max-h-[560px]">
                <AdminMap fill />
              </div>

              <div className="flex flex-wrap items-center gap-2 border-t border-ink-300 bg-ground px-4 py-3">
                <span className="mr-1 inline-flex items-center gap-1.5 text-xs font-semibold text-sage-pale">
                  <MapPin size={13} className="text-tan" /> Legenda
                </span>
                <Chip tone="danger">Darurat (≥9)</Chip>
                <Chip tone="warning">Tinggi (7–8.9)</Chip>
                <Chip tone="success">Sedang / Rendah</Chip>
              </div>
            </div>
          </Reveal>

          {/* Log kegiatan — ringkas, tidak terlalu panjang */}
          <Reveal delay={120} className="flex h-full flex-col rounded-2xl bg-surface p-5 shadow-[var(--shadow-card)]">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-display text-base font-bold">Log Kegiatan</h3>
                <p className="text-xs text-ink-500">{dayInfo?.tanggal} · {kegiatan.length} kegiatan</p>
              </div>
              <div className="flex gap-1">
                {KEGIATAN_HARI.map((h) => (
                  <button
                    key={h.key}
                    onClick={() => { setDay(h.key); setExpanded(false); }}
                    className={`rounded-full border px-3 py-1.5 text-[11px] font-bold transition-all ${
                      day === h.key
                        ? "border-tan bg-tan text-white"
                        : "border-ink-300 text-sage-pale hover:border-tan hover:text-tan"
                    }`}
                  >
                    {h.label}
                  </button>
                ))}
              </div>
            </div>

            <ul id="kegiatan" className="space-y-0.5">
              {tampil.map((k, i) => {
                const meta = TIPE_META[k.tipe];
                const Ic = meta.icon;
                const l = LAPORAN.find((x) => x.id === k.laporanId);
                const kat = l ? getKategori(l.kategori) : null;
                const isLast = i === tampil.length - 1;
                return (
                  <li key={k.id} className="flex gap-3">
                    <div className="w-[2.75rem] shrink-0 pt-1.5 text-right">
                      <span className="font-mono text-[11px] font-semibold text-tan">{k.jam}</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${meta.cls}`}>
                        <Ic size={12} />
                      </span>
                      {!isLast && <span className="w-px flex-1 bg-ink-300" />}
                    </div>
                    <div className="min-w-0 pb-3">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="text-[13px] font-bold">{KEGIATAN_LABEL[k.tipe]}</span>
                        {kat && (
                          <span
                            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                            style={{ background: `${kat.warna}1a`, color: kat.warna }}
                          >
                            <span className="h-1.5 w-1.5 rounded-full" style={{ background: kat.warna }} />
                            {kat.nama}
                          </span>
                        )}
                        <span className="text-[11px] text-ink-500">{k.aktor}</span>
                      </div>
                      <p className="mt-0.5 truncate text-[13px] font-medium text-ink-700">{l?.judul ?? k.laporanId}</p>
                    </div>
                  </li>
                );
              })}
            </ul>

            {kegiatan.length > 6 && (
              <button
                onClick={() => setExpanded((e) => !e)}
                className="mt-auto inline-flex items-center justify-center gap-1.5 rounded-xl border border-ink-300 px-4 py-2 text-xs font-bold text-sage-pale transition-colors hover:border-tan hover:text-tan"
              >
                {expanded ? "Sembunyikan" : `Lihat ${kegiatan.length - 6} kegiatan lainnya`}
              </button>
            )}
          </Reveal>
        </div>
      </section>

      {/* ===== 03 · ANALITIK — hanya di bagian bawah ===== */}
      <section id="analitik" className="mb-7">
        <Reveal delay={110} className="mb-5 flex items-baseline justify-between border-t-2 border-cream pt-4">
          <div>
            <h2 className="font-display text-xl font-bold">Analitik</h2>
            <p className="mt-1 text-sm text-ink-500">Performa penanganan dan pembentukan skor prioritas</p>
          </div>
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
    </>
  );
}

/* ============================================================
   LAPORAN — menu tersendiri dengan filter lengkap
   (pencarian, hari, kategori, status, prioritas)
   ============================================================ */
function LaporanView() {
  const [q, setQ] = useState("");
  const [hari, setHari] = useState("all");
  const [kategori, setKategori] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [prioritas, setPrioritas] = useState<FilterPrioritas>("all");
  const [sortKey, setSortKey] = useState<SortKey>("priority");
  const [sortDir, setSortDir] = useState<1 | -1>(-1);

  const rows = useMemo(() => {
    return LAPORAN.filter((l) => {
      if (hari !== "all" && l.waktu.slice(0, 10) !== hari) return false;
      if (kategori !== "all" && l.kategori !== kategori) return false;
      if (status !== "all" && l.status !== status) return false;
      if (prioritas !== "all" && priorityLabel(l.ai.priorityScore).toLowerCase() !== prioritas) return false;
      if (q.trim()) {
        const t = q.trim().toLowerCase();
        const hay = `${l.id} ${l.judul} ${l.pelapor} ${l.lokasi.alamat} ${l.ai.kategori}`.toLowerCase();
        if (!hay.includes(t)) return false;
      }
      return true;
    }).sort((a, b) => {
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
  }, [q, hari, kategori, status, prioritas, sortKey, sortDir]);

  const jumlahFilterAktif = [q.trim(), hari !== "all", kategori !== "all", status !== "all", prioritas !== "all"].filter(Boolean).length;

  function reset() {
    setQ(""); setHari("all"); setKategori("all"); setStatus("all"); setPrioritas("all");
  }

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

  const selectCls =
    "rounded-xl border border-ink-300 bg-surface px-3.5 py-2.5 text-sm font-medium text-ink-700 outline-none transition-colors focus:border-brand-600";

  return (
    <>
      {/* ===== Header ===== */}
      <Reveal className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold md:text-3xl">Daftar Laporan</h1>
          <p className="mt-1 text-sm text-ink-500">
            Seluruh laporan warga — cari, saring, dan urutkan sesuai kebutuhan
          </p>
          <p className="micro-label mt-2 text-sage">02 · menu laporan</p>
        </div>
        <p className="text-sm text-ink-500">
          Menampilkan <span className="font-display font-extrabold text-cream">{rows.length}</span> dari {LAPORAN.length} laporan
        </p>
      </Reveal>

      {/* ===== Panel filter ===== */}
      <Reveal delay={60} className="mb-5 rounded-2xl bg-surface p-6 shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-center gap-3">
          {/* Pencarian */}
          <div className="relative min-w-[220px] flex-1">
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-500" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari tiket, judul, pelapor, alamat…"
              className="w-full rounded-xl border border-ink-300 bg-bg py-2.5 pl-10 pr-9 text-sm text-ink-700 outline-none transition-colors placeholder:text-ink-500 focus:border-brand-600"
            />
            {q && (
              <button
                onClick={() => setQ("")}
                aria-label="Bersihkan pencarian"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-500 hover:text-tan"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Hari */}
          <select value={hari} onChange={(e) => setHari(e.target.value)} className={selectCls} aria-label="Filter hari">
            <option value="all">Semua hari</option>
            {HARI_LAPORAN.map((d) => (
              <option key={d} value={d}>{formatHari(d)}</option>
            ))}
          </select>

          {/* Prioritas */}
          <select value={prioritas} onChange={(e) => setPrioritas(e.target.value as FilterPrioritas)} className={selectCls} aria-label="Filter prioritas">
            <option value="all">Semua prioritas</option>
            <option value="darurat">Darurat (≥9)</option>
            <option value="tinggi">Tinggi (7–8.9)</option>
            <option value="sedang">Sedang (5–6.9)</option>
            <option value="rendah">Rendah (&lt;5)</option>
          </select>

          {/* Reset */}
          <button
            onClick={reset}
            disabled={jumlahFilterAktif === 0}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all ${
              jumlahFilterAktif > 0
                ? "border-tan text-tan hover:bg-brand-50"
                : "cursor-not-allowed border-ink-300 text-ink-500 opacity-50"
            }`}
          >
            <RotateCcw size={14} /> Reset
          </button>
        </div>

        {/* Kategori */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="mr-1 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[.08em] text-sage">
            <Filter size={12} /> Kategori
          </span>
          <button
            onClick={() => setKategori("all")}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all ${
              kategori === "all"
                ? "border-tan bg-tan text-white"
                : "border-ink-300 text-sage-pale hover:border-tan hover:text-tan"
            }`}
          >
            Semua
          </button>
          {KATEGORI.map((k) => (
            <button
              key={k.id}
              onClick={() => setKategori(kategori === k.id ? "all" : k.id)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all ${
                kategori === k.id
                  ? "border-tan text-tan"
                  : "border-ink-300 text-sage-pale hover:border-tan hover:text-tan"
              }`}
            >
              <span className="h-2 w-2 rounded-full" style={{ background: k.warna }} />
              {k.nama}
            </button>
          ))}
        </div>

        {/* Status */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="mr-1 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[.08em] text-sage">
            <Clock size={12} /> Status
          </span>
          {["all", ...STATUS_ORDER].map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all ${
                status === s
                  ? "border-tan bg-tan text-white"
                  : "border-ink-300 text-sage-pale hover:border-tan hover:text-tan"
              }`}
            >
              {s === "all" ? "Semua" : STATUS_LABEL[s as keyof typeof STATUS_LABEL]}
            </button>
          ))}
          {jumlahFilterAktif > 0 && (
            <span className="ml-auto inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600">
              <Filter size={12} /> {jumlahFilterAktif} filter aktif
            </span>
          )}
        </div>
      </Reveal>

      {/* ===== Tabel ===== */}
      <Reveal delay={100} className="anim-fade-in rounded-2xl bg-surface p-6 shadow-[var(--shadow-card)]">
        <h3 className="font-display text-lg font-bold">Daftar Laporan</h3>
        <p className="mb-4 text-sm text-ink-500">Klik judul kolom untuk mengurutkan · diurutkan berdasarkan Priority Score secara bawaan</p>

        {rows.length === 0 ? (
          <div className="grid place-items-center rounded-2xl border border-dashed border-ink-300 px-6 py-16 text-center">
            <div>
              <Search size={28} className="mx-auto mb-3 text-ink-500" />
              <p className="font-display font-bold">Tidak ada laporan yang cocok</p>
              <p className="mt-1 text-sm text-ink-500">Coba ubah kata kunci atau longgarkan filter.</p>
              <button onClick={reset} className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-tan px-4 py-2 text-sm font-semibold text-tan hover:bg-brand-50">
                <RotateCcw size={14} /> Reset semua filter
              </button>
            </div>
          </div>
        ) : (
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
        )}
      </Reveal>
    </>
  );
}
