"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { Chip } from "@/components/Chip";
import { Reveal } from "@/components/Reveal";
import ProfileClient from "../profil/ProfileClient";
import {
  KATEGORI,
  WILAYAH,
  STATUS_LABEL_ID as STATUS_LABEL,
  statusTone,
  priorityColor,
  priorityLabel,
  getKategori,
  KEGIATAN,
  KEGIATAN_LABEL,
  TREN_BULANAN,
  type Laporan,
  type StatusId,
  type WilayahId,
} from "@/lib/data";
import {
  FileText,
  Clock,
  CheckCircle2,
  TrendingUp,
  Flame,
  MapPin,
  Search,
  Filter,
  Sparkles,
  ShieldAlert,
  Building2,
  X,
  Map as MapIcon,
  CheckSquare,
  Home,
  BarChart3,
  History,
  Activity,
  User,
  ArrowRight,
  Layers,
  AlertCircle,
} from "lucide-react";
import dynamic from "next/dynamic";

const AdminMap = dynamic(() => import("@/components/AdminMap").then((m) => m.AdminMap), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-sm text-ink-500">Memuat peta…</div>,
});

const ChartBox = dynamic(() => import("@/components/ChartBox").then((m) => m.ChartBox), {
  ssr: false,
  loading: () => <div className="grid h-[260px] place-items-center text-xs text-ink-500">Memuat grafik…</div>,
});

type TabDinas = "home" | "analitik" | "laporan" | "profil";
type SubTabLaporan = "semua" | "riwayat";
type TimeRange = "hari_ini" | "minggu_ini" | "bulan_ini" | "tahun_ini" | "all";

export default function DinasClient() {
  const { user, laporanWarga, tambahNotif } = useApp();
  const router = useRouter();

  // Redirect jika bukan dinas
  useEffect(() => {
    if (user && user.role !== "dinas") {
      router.replace(user.role === "admin" ? "/dashboard" : "/warga");
    } else if (!user) {
      router.replace("/login?role=dinas");
    }
  }, [user, router]);

  const [activeTab, setActiveTab] = useState<TabDinas>("home");
  const [subTabLaporan, setSubTabLaporan] = useState<SubTabLaporan>("semua");
  const [search, setSearch] = useState("");
  const [filterKategori, setFilterKategori] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedLaporan, setSelectedLaporan] = useState<Laporan | null>(null);

  // Time Range Filter untuk Analitik
  const [analitikTimeRange, setAnalitikTimeRange] = useState<TimeRange>("all");

  // Local overrides status
  const [statusMap, setStatusMap] = useState<Record<string, StatusId>>({});

  const dinasWilayah = user?.wilayah ?? "sleman";
  const wilayahInfo = useMemo(() => WILAYAH.find((w) => w.id === dinasWilayah)!, [dinasWilayah]);
  const [mapWilayahFilter, setMapWilayahFilter] = useState<WilayahId | "semua">(dinasWilayah);

  useEffect(() => {
    if (dinasWilayah) setMapWilayahFilter(dinasWilayah);
  }, [dinasWilayah]);

  const liveLaporan = useMemo(() => {
    return laporanWarga
      .map((l) => ({
        ...l,
        status: statusMap[l.id] ?? l.status,
      }))
      .filter((l) => l.wilayah === dinasWilayah);
  }, [laporanWarga, statusMap, dinasWilayah]);

  // Live laporan terfilter rentang waktu analitik
  const liveLaporanAnalitik = useMemo(() => {
    if (analitikTimeRange === "all") return liveLaporan;
    const now = new Date("2026-01-15T23:59:59+07:00").getTime();
    const dayMs = 24 * 60 * 60 * 1000;
    return liveLaporan.filter((l) => {
      const t = new Date(l.waktu).getTime();
      const diffDays = (now - t) / dayMs;
      if (analitikTimeRange === "hari_ini") return diffDays <= 1;
      if (analitikTimeRange === "minggu_ini") return diffDays <= 7;
      if (analitikTimeRange === "bulan_ini") return diffDays <= 30;
      if (analitikTimeRange === "tahun_ini") return diffDays <= 365;
      return true;
    });
  }, [liveLaporan, analitikTimeRange]);

  // Filtered laporan berdasarkan subTab & dropdown
  const filteredLaporan = useMemo(() => {
    return liveLaporan.filter((l) => {
      const matchSub = subTabLaporan === "riwayat" ? l.status === "resolved" : true;
      const matchSearch =
        l.judul.toLowerCase().includes(search.toLowerCase()) ||
        l.id.toLowerCase().includes(search.toLowerCase()) ||
        l.lokasi.alamat.toLowerCase().includes(search.toLowerCase());
      const matchKategori = filterKategori === "all" || l.kategori === filterKategori;
      const matchStatus = filterStatus === "all" || l.status === filterStatus;
      return matchSub && matchSearch && matchKategori && matchStatus;
    });
  }, [liveLaporan, subTabLaporan, search, filterKategori, filterStatus]);

  // Log kegiatan hari ini untuk wilayah ini
  const logHariIni = useMemo(() => {
    const idsWilayah = new Set(liveLaporan.map((l) => l.id));
    const hariIniLogs = KEGIATAN["2026-01-15"] ?? [];
    return hariIniLogs.filter((k) => idsWilayah.has(k.laporanId));
  }, [liveLaporan]);
  // Pie Chart Data
  const pieLabels = useMemo(() => KATEGORI.map((k) => k.nama), []);
  const pieData = useMemo(
    () => KATEGORI.map((k) => liveLaporanAnalitik.filter((l) => l.kategori === k.id).length),
    [liveLaporanAnalitik]
  );
  const pieColors = useMemo(() => KATEGORI.map((k) => k.warna), []);

  if (!user || user.role !== "dinas") return null;

  // KPIs Summary metrics
  const total = liveLaporan.length;
  const baru = liveLaporan.filter((l) => l.status === "reported").length;
  const diproses = liveLaporan.filter((l) => ["verified", "assigned", "in_progress"].includes(l.status)).length;
  const selesai = liveLaporan.filter((l) => l.status === "resolved").length;
  const mendesak = liveLaporan.filter((l) => l.ai.priorityScore >= 7.5 && l.status !== "resolved").length;
  const laporanPerluPenanganan = liveLaporan
    .filter((l) => l.status !== "resolved")
    .sort((a, b) => b.ai.priorityScore - a.ai.priorityScore);

  const handleUpdateStatus = (id: string, nextStatus: StatusId) => {
    setStatusMap((prev) => ({ ...prev, [id]: nextStatus }));
    tambahNotif({
      judul: "Status Diperbarui",
      pesan: `Laporan ${id} kini berstatus: ${STATUS_LABEL[nextStatus]}.`,
      waktu: "Baru saja",
      tone: nextStatus === "resolved" ? "success" : "warning",
    });
    if (selectedLaporan?.id === id) {
      setSelectedLaporan((prev) => (prev ? { ...prev, status: nextStatus } : null));
    }
  };

  return (
    <div className="min-h-screen bg-ground pb-12">
      <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        {/* Header Dinas & Navigasi Tab */}
        <div className="anim-fade-up mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-ink-300/40 pb-5">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-success-bg text-success shadow-inner">
              <Building2 size={24} />
            </span>
            <div>
              <h1 className="font-display text-2xl font-extrabold text-cream-hi md:text-3xl">
                Dashboard Dinas
              </h1>
              <p className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold text-success">
                <MapPin size={14} /> {wilayahInfo?.nama} <span className="text-ink-500 font-normal">({wilayahInfo?.dinasEmail})</span>
              </p>
            </div>
          </div>

          {/* Navigation Tabs (Home, Analitik, Laporan) */}
          <div className="flex flex-wrap gap-2 rounded-2xl bg-surface p-1.5 border border-ink-300/40 shadow-sm">
            <button
              onClick={() => setActiveTab("home")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-extrabold transition-all ${
                activeTab === "home"
                  ? "bg-brand-600 text-white shadow-md"
                  : "text-ink-500 hover:text-cream hover:bg-ground/50"
              }`}
            >
              <Home size={15} /> Home
            </button>
            <button
              onClick={() => setActiveTab("analitik")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-extrabold transition-all ${
                activeTab === "analitik"
                  ? "bg-brand-600 text-white shadow-md"
                  : "text-ink-500 hover:text-cream hover:bg-ground/50"
              }`}
            >
              <BarChart3 size={15} /> Analitik
            </button>
            <button
              onClick={() => setActiveTab("laporan")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-extrabold transition-all ${
                activeTab === "laporan"
                  ? "bg-brand-600 text-white shadow-md"
                  : "text-ink-500 hover:text-cream hover:bg-ground/50"
              }`}
            >
              <FileText size={15} /> Laporan &amp; Riwayat ({total})
            </button>
            <button
              onClick={() => setActiveTab("profil")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-extrabold transition-all ${
                activeTab === "profil"
                  ? "bg-brand-600 text-white shadow-md"
                  : "text-ink-500 hover:text-cream hover:bg-ground/50"
              }`}
            >
              <User size={15} /> Profil Akun
            </button>
          </div>
        </div>

        {/* ============================================================
            TAB 1: HOME (Ringkasan, Perlu Penanganan, Peta, Aktivitas Terkini)
           ============================================================ */}
        {activeTab === "home" && (
          <Reveal>
            <div className="space-y-6">
              {/* 1. RINGKASAN LAPORAN (4 CARDS SEPERTI GAMBAR 2) */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
                {/* Total Laporan Wilayah */}
                <div className="rounded-3xl border border-ink-300/40 bg-surface p-5 shadow-[var(--shadow-card)]">
                  <p className="text-xs font-bold text-ink-500">Total Laporan Wilayah</p>
                  <p className="font-display text-3xl font-extrabold text-cream mt-2">{total}</p>
                  <p className="text-xs font-semibold text-brand-600 mt-2">
                    Auto-routed ke {wilayahInfo?.nama}
                  </p>
                </div>

                {/* Prioritas Darurat */}
                <div className="rounded-3xl border border-danger/30 bg-surface p-5 shadow-[var(--shadow-card)]">
                  <p className="text-xs font-bold text-danger flex items-center gap-1.5">
                    <Flame size={14} className="text-danger shrink-0" /> Prioritas Darurat (Skor ≥ 9)
                  </p>
                  <p className="font-display text-3xl font-extrabold text-danger mt-2">{mendesak}</p>
                  <p className="text-xs text-ink-500 mt-2">Penanganan &lt; 12 jam</p>
                </div>

                {/* Sedang Diproses */}
                <div className="rounded-3xl border border-warning/30 bg-surface p-5 shadow-[var(--shadow-card)]">
                  <p className="text-xs font-bold text-warning">Sedang Diproses</p>
                  <p className="font-display text-3xl font-extrabold text-warning mt-2">{diproses}</p>
                  <p className="text-xs text-ink-500 mt-2">Dalam pengerjaan tim</p>
                </div>

                {/* Selesai Dituntaskan */}
                <div className="rounded-3xl border border-success/30 bg-surface p-5 shadow-[var(--shadow-card)]">
                  <p className="text-xs font-bold text-success">Selesai Dituntaskan</p>
                  <p className="font-display text-3xl font-extrabold text-success mt-2">{selesai}</p>
                  <p className="text-xs font-bold text-success mt-2">
                    {total > 0 ? Math.round((selesai / total) * 100) : 0}% Tingkat Penyelesaian
                  </p>
                </div>
              </div>

              {/* 2. MIDDLE SECTION: PERLU PENANGANAN & PETA MONITORING */}
              <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
                {/* 🚨 PERLU PENANGANAN */}
                <div className="flex flex-col justify-between rounded-3xl border border-ink-300/40 bg-surface p-6 shadow-[var(--shadow-card)]">
                  <div>
                    <h3 className="font-display text-base font-extrabold text-cream flex items-center gap-2 mb-4">
                      🚨 PERLU PENANGANAN
                    </h3>

                    {laporanPerluPenanganan.length === 0 ? (
                      <div className="py-8 text-center text-ink-500 text-xs">
                        Tidak ada laporan aktif yang memerlukan penanganan saat ini.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {laporanPerluPenanganan.slice(0, 4).map((l) => {
                          const isHigh = l.ai.priorityScore >= 8.5;
                          return (
                            <div
                              key={l.id}
                              onClick={() => setSelectedLaporan(l)}
                              className="card-hover flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-ink-300/30 bg-ground/50 p-4 transition-all hover:border-brand-600/50"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-cream text-sm truncate">{l.judul}</p>
                                <p className="mt-0.5 text-xs text-ink-500 flex items-center gap-1">
                                  <MapPin size={11} /> {l.lokasi.alamat}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="font-display text-sm font-extrabold text-cream">
                                  {l.ai.priorityScore}
                                </span>
                                <span className={`h-3 w-3 rounded-full ${isHigh ? "bg-danger animate-ping" : "bg-warning"}`} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="mt-5 border-t border-ink-300/30 pt-4">
                    <button
                      onClick={() => setActiveTab("laporan")}
                      className="text-xs font-extrabold text-brand-600 hover:text-brand-700 flex items-center gap-1.5 transition-all"
                    >
                      Lihat semua <ArrowRight size={14} />
                    </button>
                  </div>
                </div>

                {/* 🗺 PETA MONITORING */}
                <div className="rounded-3xl border border-ink-300/40 bg-surface p-6 shadow-[var(--shadow-card)] flex flex-col justify-between">
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                      <h3 className="font-display text-base font-extrabold text-cream flex items-center gap-2">
                        🗺 PETA MONITORING
                      </h3>
                      {/* Filter Segmented Peta: Semua vs Wilayah Dinas */}
                      <div className="flex items-center gap-1 rounded-xl bg-ground p-1 border border-ink-300/40 text-xs">
                        <button
                          onClick={() => setMapWilayahFilter("semua")}
                          className={`rounded-lg px-2.5 py-1 font-bold transition-all ${
                            mapWilayahFilter === "semua"
                              ? "bg-brand-600 text-white shadow"
                              : "text-ink-500 hover:text-cream"
                          }`}
                        >
                          Semua DIY
                        </button>
                        <button
                          onClick={() => setMapWilayahFilter(dinasWilayah)}
                          className={`rounded-lg px-2.5 py-1 font-bold transition-all ${
                            mapWilayahFilter === dinasWilayah
                              ? "bg-brand-600 text-white shadow"
                              : "text-ink-500 hover:text-cream"
                          }`}
                        >
                          {wilayahInfo?.nama}
                        </button>
                      </div>
                    </div>

                    <div className="h-[230px] w-full overflow-hidden rounded-2xl border border-ink-300/40">
                      <AdminMap fill={true} wilayahFilter={mapWilayahFilter} />
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-ink-300/30 pt-3">
                    <span className="text-xs font-bold text-cream">
                      {mapWilayahFilter === "semua"
                        ? `${laporanWarga.filter((l) => l.status !== "resolved").length} titik aktif (DIY)`
                        : `${laporanPerluPenanganan.length} titik aktif (${wilayahInfo?.nama})`}
                    </span>
                    <span className="text-xs text-ink-500 font-medium">
                      Peta Terfokus
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. AKTIVITAS PENANGANAN TERKINI */}
              <div className="rounded-3xl border border-ink-300/40 bg-surface p-6 shadow-[var(--shadow-card)]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-base font-extrabold text-cream flex items-center gap-2">
                    AKTIVITAS PENANGANAN TERKINI
                  </h3>
                  <span className="text-xs font-bold text-ink-500">15 Jan 2026</span>
                </div>

                {logHariIni.length === 0 ? (
                  <div className="py-8 text-center text-ink-500 text-xs">
                    Belum ada log aktivitas penanganan terkini hari ini.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {logHariIni.slice(0, 5).map((log) => (
                      <div
                        key={log.id}
                        className="flex items-start gap-4 rounded-2xl border border-ink-300/30 bg-ground/50 p-4 transition-all hover:bg-ground/80"
                      >
                        <span className="font-mono text-xs font-bold text-brand-600 shrink-0 mt-0.5">
                          {log.jam}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-cream text-sm">{log.aktor}</p>
                          <p className="mt-0.5 text-xs text-ink-700 font-medium">{log.catatan}</p>
                          <span className="mt-1.5 inline-block font-mono text-[10px] font-bold text-ink-500">
                            ID Laporan: {log.laporanId}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Reveal>
        )}

        {/* ============================================================
            TAB 2: ANALITIK (Grafik Tren, Chart Batang & Pie, SLA, Filter Rentang Waktu)
           ============================================================ */}
        {activeTab === "analitik" && (
          <Reveal>
            <div className="space-y-6">
              {/* FILTER RENTANG WAKTU ANALITIK */}
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-ink-300/40 bg-surface p-5 shadow-sm">
                <div>
                  <h3 className="font-display text-sm font-extrabold text-cream flex items-center gap-2">
                    <Filter size={16} className="text-brand-600" /> Filter Rentang Waktu Analitik
                  </h3>
                  <p className="text-xs text-ink-500 mt-0.5">
                    Tampilkan visualisasi statistik &amp; grafik berdasarkan periode waktu terpilih
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5 rounded-2xl bg-ground p-1.5 border border-ink-300/40 text-xs">
                  <button
                    onClick={() => setAnalitikTimeRange("hari_ini")}
                    className={`rounded-xl px-3 py-1.5 font-extrabold transition-all ${
                      analitikTimeRange === "hari_ini"
                        ? "bg-brand-600 text-white shadow"
                        : "text-ink-500 hover:text-cream"
                    }`}
                  >
                    Hari Ini
                  </button>
                  <button
                    onClick={() => setAnalitikTimeRange("minggu_ini")}
                    className={`rounded-xl px-3 py-1.5 font-extrabold transition-all ${
                      analitikTimeRange === "minggu_ini"
                        ? "bg-brand-600 text-white shadow"
                        : "text-ink-500 hover:text-cream"
                    }`}
                  >
                    Minggu Ini
                  </button>
                  <button
                    onClick={() => setAnalitikTimeRange("bulan_ini")}
                    className={`rounded-xl px-3 py-1.5 font-extrabold transition-all ${
                      analitikTimeRange === "bulan_ini"
                        ? "bg-brand-600 text-white shadow"
                        : "text-ink-500 hover:text-cream"
                    }`}
                  >
                    Bulan Ini
                  </button>
                  <button
                    onClick={() => setAnalitikTimeRange("tahun_ini")}
                    className={`rounded-xl px-3 py-1.5 font-extrabold transition-all ${
                      analitikTimeRange === "tahun_ini"
                        ? "bg-brand-600 text-white shadow"
                        : "text-ink-500 hover:text-cream"
                    }`}
                  >
                    Tahun Ini
                  </button>
                  <button
                    onClick={() => setAnalitikTimeRange("all")}
                    className={`rounded-xl px-3 py-1.5 font-extrabold transition-all ${
                      analitikTimeRange === "all"
                        ? "bg-brand-600 text-white shadow"
                        : "text-ink-500 hover:text-cream"
                    }`}
                  >
                    Semua Waktu
                  </button>
                </div>
              </div>

              {/* KPIs Summary Terfilter */}
              {(() => {
                const totalA = liveLaporanAnalitik.length;
                const mendesakA = liveLaporanAnalitik.filter((l) => l.ai.priorityScore >= 9 && l.status !== "resolved").length;
                const diprosesA = liveLaporanAnalitik.filter((l) => ["verified", "assigned", "in_progress"].includes(l.status)).length;
                const selesaiA = liveLaporanAnalitik.filter((l) => l.status === "resolved").length;
                return (
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <div className="rounded-2xl border border-ink-300/40 bg-surface p-5 shadow-sm">
                      <p className="text-xs font-semibold text-ink-500">Total Laporan Periode</p>
                      <p className="font-display text-3xl font-extrabold text-cream mt-1">{totalA}</p>
                      <p className="text-[11px] text-brand-600 mt-1 font-medium">Auto-routed ke {wilayahInfo?.nama}</p>
                    </div>
                    <div className="rounded-2xl border border-danger/30 bg-surface p-5 shadow-sm">
                      <p className="text-xs font-semibold text-danger flex items-center gap-1">
                        <Flame size={13} /> Prioritas Darurat (Skor ≥ 9)
                      </p>
                      <p className="font-display text-3xl font-extrabold text-danger mt-1">{mendesakA}</p>
                      <p className="text-[11px] text-ink-500 mt-1">Penanganan &lt; 12 jam</p>
                    </div>
                    <div className="rounded-2xl border border-warning/30 bg-surface p-5 shadow-sm">
                      <p className="text-xs font-semibold text-warning">Sedang Diproses</p>
                      <p className="font-display text-3xl font-extrabold text-warning mt-1">{diprosesA}</p>
                      <p className="text-[11px] text-ink-500 mt-1">Dalam pengerjaan tim</p>
                    </div>
                    <div className="rounded-2xl border border-success/30 bg-surface p-5 shadow-sm">
                      <p className="text-xs font-semibold text-success">Selesai Dituntaskan</p>
                      <p className="font-display text-3xl font-extrabold text-success mt-1">{selesaiA}</p>
                      <p className="text-[11px] text-success mt-1 font-bold">
                        {totalA > 0 ? Math.round((selesaiA / totalA) * 100) : 0}% Tingkat Penyelesaian
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* BAR CHART & PIE CHART GRID */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* 📊 CHART BATANG (BAR CHART) */}
                <div className="rounded-3xl border border-ink-300/40 bg-surface p-6 shadow-sm">
                  <h3 className="font-display text-lg font-extrabold text-cream flex items-center gap-2 mb-1">
                    <BarChart3 size={18} className="text-brand-600" /> Chart Batang — Urgensi per Kategori
                  </h3>
                  <p className="text-xs text-ink-500 mb-4">Grafik batang stacked tingkat prioritas laporan per kategori</p>
                  <ChartBox def={{ kind: "barKatPrio" }} height={280} />
                </div>

                {/* 🍕 CHART PIE (PIE/DOUGHNUT CHART) */}
                <div className="rounded-3xl border border-ink-300/40 bg-surface p-6 shadow-sm">
                  <h3 className="font-display text-lg font-extrabold text-cream flex items-center gap-2 mb-1">
                    <Layers size={18} className="text-brand-600" /> Chart Pie — Distribusi Kategori
                  </h3>
                  <p className="text-xs text-ink-500 mb-4">Proporsi persentase laporan per kategori di {wilayahInfo?.nama}</p>
                  <ChartBox
                    def={{
                      kind: "doughnut",
                      labels: pieLabels,
                      data: pieData,
                      colors: pieColors,
                    }}
                    height={280}
                  />
                </div>
              </div>

              {/* VISUAL PROGRESS BREAKDOWN & TREN BULANAN SVG */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Visual Category Breakdown Progress Bars */}
                <div className="rounded-3xl border border-ink-300/40 bg-surface p-6 shadow-sm">
                  <h3 className="font-display text-lg font-extrabold text-cream flex items-center gap-2 mb-1">
                    <Layers size={18} className="text-brand-600" /> Persentase Distribusi Kategori (Visual)
                  </h3>
                  <p className="text-xs text-ink-500 mb-6">Detail volume &amp; rincian persentase per kategori</p>

                  <div className="space-y-4">
                    {KATEGORI.map((kat) => {
                      const count = liveLaporanAnalitik.filter((l) => l.kategori === kat.id).length;
                      const totalA = liveLaporanAnalitik.length;
                      const pct = totalA > 0 ? Math.round((count / totalA) * 100) : 0;
                      return (
                        <div key={kat.id} className="space-y-1.5">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="flex items-center gap-2 text-cream">
                              <span className="h-2.5 w-2.5 rounded-full" style={{ background: kat.warna }} />
                              {kat.nama}
                            </span>
                            <span className="text-ink-500">{count} laporan ({pct}%)</span>
                          </div>
                          <div className="h-2.5 w-full overflow-hidden rounded-full bg-ground">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${pct}%`, background: kat.warna }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Visual Bar Chart: Tren Bulanan Progress Bars */}
                <div className="rounded-3xl border border-ink-300/40 bg-surface p-6 shadow-sm">
                  <h3 className="font-display text-lg font-extrabold text-cream flex items-center gap-2 mb-1">
                    <TrendingUp size={18} className="text-brand-600" /> Volume Penanganan Per Bulan (Visual)
                  </h3>
                  <p className="text-xs text-ink-500 mb-6">Perkembangan volume penanganan 6 bulan terakhir</p>

                  <div className="space-y-4">
                    {TREN_BULANAN.labels.map((bulan, idx) => {
                      const masukVal = TREN_BULANAN.masuk[idx];
                      const selesaiVal = TREN_BULANAN.selesai[idx];
                      const maxVal = 100;
                      return (
                        <div key={bulan} className="space-y-1.5">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-cream">{bulan}</span>
                            <span className="text-ink-500">
                              Masuk: <strong className="text-brand-600">{masukVal}</strong> | Selesai: <strong className="text-success">{selesaiVal}</strong>
                            </span>
                          </div>
                          <div className="h-3 w-full overflow-hidden rounded-full bg-ground flex gap-1">
                            <div
                              className="h-full bg-brand-600 rounded-l-full transition-all duration-500"
                              style={{ width: `${(masukVal / maxVal) * 100}%` }}
                            />
                            <div
                              className="h-full bg-success rounded-r-full transition-all duration-500"
                              style={{ width: `${(selesaiVal / maxVal) * 100}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-6 flex items-center justify-center gap-6 border-t border-ink-300/30 pt-4 text-xs font-semibold">
                    <span className="flex items-center gap-2 text-brand-600">
                      <span className="h-3 w-3 rounded bg-brand-600" /> Laporan Masuk
                    </span>
                    <span className="flex items-center gap-2 text-success">
                      <span className="h-3 w-3 rounded bg-success" /> Laporan Selesai
                    </span>
                  </div>
                </div>
              </div>

              {/* TREN BULANAN LINE CHART & RADAR AI */}
              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-3xl border border-ink-300/40 bg-surface p-6 shadow-sm">
                  <h3 className="font-display text-lg font-extrabold text-cream flex items-center gap-2 mb-1">
                    <TrendingUp size={18} className="text-brand-600" /> Grafik Tren Line Chart — Laporan Masuk vs Selesai
                  </h3>
                  <p className="text-xs text-ink-500 mb-4">Perkembangan tren volume penanganan 6 bulan terakhir</p>
                  <ChartBox def={{ kind: "tren" }} height={260} />
                </div>

                <div className="rounded-3xl border border-ink-300/40 bg-surface p-6 shadow-sm">
                  <h3 className="font-display text-lg font-extrabold text-cream flex items-center gap-2 mb-1">
                    <Sparkles size={18} className="text-brand-600" /> Radar Evaluasi Multi-Agent AI
                  </h3>
                  <p className="text-xs text-ink-500 mb-4">Skor rata-rata performa &amp; kelengkapan laporan</p>
                  <ChartBox def={{ kind: "radar" }} height={260} />
                </div>
              </div>
            </div>
          </Reveal>
        )}

        {/* ============================================================
            TAB 3: LAPORAN (Full Laporan & Riwayat Selesai + Filter)
           ============================================================ */}
        {activeTab === "laporan" && (
          <Reveal>
            <div className="space-y-6">
              {/* Sub-tab & Search/Filter Controls */}
              <div className="rounded-3xl border border-ink-300/40 bg-surface p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  {/* Sub Tab: Semua vs Riwayat */}
                  <div className="flex items-center gap-2 rounded-xl bg-ground p-1 border border-ink-300/40">
                    <button
                      onClick={() => setSubTabLaporan("semua")}
                      className={`rounded-lg px-4 py-2 text-xs font-extrabold transition-all ${
                        subTabLaporan === "semua"
                          ? "bg-brand-600 text-white shadow"
                          : "text-ink-500 hover:text-cream"
                      }`}
                    >
                      Semua Laporan Wilayah ({liveLaporan.length})
                    </button>
                    <button
                      onClick={() => setSubTabLaporan("riwayat")}
                      className={`rounded-lg px-4 py-2 text-xs font-extrabold transition-all ${
                        subTabLaporan === "riwayat"
                          ? "bg-success text-white shadow"
                          : "text-ink-500 hover:text-cream"
                      }`}
                    >
                      Riwayat Selesai ({selesai})
                    </button>
                  </div>

                  {/* Filters */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cari ID / judul / lokasi…"
                        className="h-9.5 rounded-xl border border-ink-300/60 bg-ground pl-8 pr-3 text-xs text-cream placeholder-ink-500 focus:border-brand-600 focus:outline-none"
                      />
                    </div>

                    <select
                      value={filterKategori}
                      onChange={(e) => setFilterKategori(e.target.value)}
                      className="h-9.5 rounded-xl border border-ink-300/60 bg-ground px-3 text-xs text-cream focus:border-brand-600 focus:outline-none"
                    >
                      <option value="all">Semua Kategori</option>
                      {KATEGORI.map((k) => (
                        <option key={k.id} value={k.id}>{k.nama}</option>
                      ))}
                    </select>

                    {subTabLaporan === "semua" && (
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="h-9.5 rounded-xl border border-ink-300/60 bg-ground px-3 text-xs text-cream focus:border-brand-600 focus:outline-none"
                      >
                        <option value="all">Semua Status</option>
                        <option value="reported">Dilaporkan</option>
                        <option value="verified">Terverifikasi</option>
                        <option value="assigned">Ditugaskan</option>
                        <option value="in_progress">Diproses</option>
                        <option value="resolved">Selesai</option>
                      </select>
                    )}
                  </div>
                </div>

                {/* Tabel Laporan */}
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[650px] text-sm">
                    <thead>
                      <tr className="border-b border-ink-300/40 text-left text-xs font-bold uppercase tracking-wider text-ink-500">
                        <th className="pb-3 pr-3">ID &amp; Judul Laporan</th>
                        <th className="pb-3 pr-3">Kategori</th>
                        <th className="pb-3 pr-3">Prioritas AI</th>
                        <th className="pb-3 pr-3">Status</th>
                        <th className="pb-3 text-right">Tindakan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink-300/20">
                      {filteredLaporan.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-10 text-center text-ink-500">
                            Tidak ada laporan yang sesuai dengan kriteria filter.
                          </td>
                        </tr>
                      )}
                      {filteredLaporan.map((l) => {
                        const kat = getKategori(l.kategori);
                        const isUrgent = l.ai.priorityScore >= 8.5;
                        return (
                          <tr
                            key={l.id}
                            className={`group transition-colors hover:bg-ground/40 ${
                              isUrgent && l.status !== "resolved" ? "bg-danger-bg/10" : ""
                            }`}
                          >
                            <td className="py-4 pr-3">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-brand-600">{l.id}</span>
                                {isUrgent && (
                                  <span className="rounded bg-danger/10 px-1.5 py-0.5 text-[10px] font-extrabold text-danger animate-pulse">
                                    🚨 DARURAT
                                  </span>
                                )}
                              </div>
                              <p className="font-semibold text-cream mt-0.5 group-hover:text-cream-hi">
                                {l.judul}
                              </p>
                              <p className="text-xs text-ink-500 flex items-center gap-1 mt-1">
                                <MapPin size={11} /> {l.lokasi.alamat}
                              </p>
                            </td>
                            <td className="py-4 pr-3">
                              <span
                                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
                                style={{ background: `${kat.warna}1a`, color: kat.warna }}
                              >
                                <span className="h-1.5 w-1.5 rounded-full" style={{ background: kat.warna }} />
                                {kat.nama}
                              </span>
                            </td>
                            <td className="py-4 pr-3">
                              <span
                                className="font-display text-sm font-extrabold block"
                                style={{ color: priorityColor(l.ai.priorityScore) }}
                              >
                                {l.ai.priorityScore} · {priorityLabel(l.ai.priorityScore)}
                              </span>
                              <span className="text-[11px] text-ink-500">SLA: {l.sla}</span>
                            </td>
                            <td className="py-4 pr-3">
                              <Chip tone={statusTone(l.status)}>{STATUS_LABEL[l.status]}</Chip>
                            </td>
                            <td className="py-4 text-right">
                              <button
                                onClick={() => setSelectedLaporan(l)}
                                className="rounded-xl border border-brand-600/40 bg-brand-50 px-3.5 py-1.5 text-xs font-bold text-brand-700 hover:bg-brand-600 hover:text-white transition-all"
                              >
                                Detail &amp; Respon
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </Reveal>
        )}

        {/* TAB 4: PROFIL DINAS */}
        {activeTab === "profil" && (
          <Reveal>
            <ProfileClient />
          </Reveal>
        )}

        {/* MODAL DETAIL LAPORAN & UPDATE STATUS */}
        {selectedLaporan && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/65 backdrop-blur-sm transition-opacity"
              onClick={() => setSelectedLaporan(null)}
            />
            <div className="anim-fade-up relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-white/15 bg-surface p-6 shadow-2xl md:p-8">
              {/* Header Modal */}
              <div className="flex items-start justify-between gap-4 border-b border-ink-300/30 pb-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-extrabold text-brand-600">{selectedLaporan.id}</span>
                    <Chip tone={statusTone(selectedLaporan.status)}>{STATUS_LABEL[selectedLaporan.status]}</Chip>
                  </div>
                  <h3 className="mt-2 font-display text-xl font-extrabold text-cream md:text-2xl">{selectedLaporan.judul}</h3>
                </div>
                <button
                  onClick={() => setSelectedLaporan(null)}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-ink-300/50 text-ink-500 transition-colors hover:bg-brand-50 hover:text-cream"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body Modal */}
              <div className="mt-5 space-y-5">
                {/* Informasi Lokasi & Pelapor */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-ink-300/40 bg-ground/50 p-4">
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-ink-500">
                      <MapPin size={14} className="text-brand-600" /> Lokasi Laporan
                    </p>
                    <p className="mt-1 text-sm font-bold text-cream">{selectedLaporan.lokasi.alamat}</p>
                  </div>

                  <div className="rounded-2xl border border-ink-300/40 bg-ground/50 p-4">
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-ink-500">
                      <User size={14} className="text-brand-600" /> Identitas Pelapor
                    </p>
                    <p className="mt-1 text-sm font-bold text-cream">{selectedLaporan.pelapor}</p>
                    <p className="mt-0.5 text-xs text-ink-500">Waktu: {new Date(selectedLaporan.waktu).toLocaleString("id-ID")}</p>
                  </div>
                </div>

                {/* AI Priority & SLA */}
                <div className="rounded-2xl border border-brand-600/30 bg-gradient-to-br from-brand-600/10 to-transparent p-5">
                  <h4 className="flex items-center gap-2 font-display text-sm font-extrabold text-cream">
                    <Sparkles size={16} className="text-brand-600" /> AI Urgensi &amp; Target SLA
                  </h4>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-ink-500">Skor Urgensi AI</p>
                      <p className="mt-0.5 font-display text-lg font-extrabold" style={{ color: priorityColor(selectedLaporan.ai.priorityScore) }}>
                        {selectedLaporan.ai.priorityScore} / 10 · {priorityLabel(selectedLaporan.ai.priorityScore)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-ink-500">Estimasi Penanganan (SLA)</p>
                      <p className="mt-0.5 font-display text-lg font-extrabold text-cream">{selectedLaporan.sla}</p>
                    </div>
                  </div>
                  <p className="mt-3 border-t border-brand-600/20 pt-2 text-xs font-medium text-cream-hi">
                    {selectedLaporan.ai.dampak}
                  </p>
                </div>

                {/* Tindakan Status Dinas */}
                <div className="rounded-2xl border border-ink-300/40 bg-ground/50 p-5 space-y-3">
                  <h4 className="font-display text-sm font-extrabold text-cream">Perbarui Status Penanganan Dinas</h4>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {selectedLaporan.status === "reported" && (
                      <button
                        onClick={() => handleUpdateStatus(selectedLaporan.id, "verified")}
                        className="flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-brand-700 transition-colors"
                      >
                        <CheckSquare size={14} /> Verifikasi
                      </button>
                    )}
                    {["reported", "verified", "assigned"].includes(selectedLaporan.status) && (
                      <button
                        onClick={() => handleUpdateStatus(selectedLaporan.id, "in_progress")}
                        className="flex items-center justify-center gap-2 rounded-xl bg-warning px-4 py-2.5 text-xs font-bold text-white hover:opacity-90 transition-opacity"
                      >
                        <TrendingUp size={14} /> Proses Penanganan
                      </button>
                    )}
                    {selectedLaporan.status === "in_progress" && (
                      <button
                        onClick={() => handleUpdateStatus(selectedLaporan.id, "resolved")}
                        className="flex items-center justify-center gap-2 rounded-xl bg-success px-4 py-2.5 text-xs font-bold text-white hover:bg-success-hi transition-colors"
                      >
                        <CheckCircle2 size={14} /> Selesaikan Penanganan
                      </button>
                    )}
                    {selectedLaporan.status === "resolved" && (
                      <div className="col-span-3 rounded-xl border border-success/30 bg-success-bg/20 p-3 text-center text-xs font-bold text-success flex items-center justify-center gap-1.5">
                        <CheckCircle2 size={16} /> Penanganan Telah Tuntas &amp; Dikonfirmasi
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer Modal */}
              <div className="mt-6 text-right border-t border-ink-300/30 pt-4">
                <button
                  onClick={() => setSelectedLaporan(null)}
                  className="rounded-xl border border-ink-300/50 px-5 py-2 text-sm font-semibold text-ink-700 transition-colors hover:border-brand-600 hover:text-cream"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
