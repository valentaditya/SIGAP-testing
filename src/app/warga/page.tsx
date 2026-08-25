"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { RequireAuth } from "@/components/RequireAuth";
import { useApp } from "@/lib/store";
import { Chip } from "@/components/Chip";
import { STATUS_LABEL_ID as STATUS_LABEL, statusTone, priorityColor, priorityLabel, getKategori, type Laporan } from "@/lib/data";
import {
  FileText, Plus, ThumbsUp, MapPin, Camera,
  ChevronRight, History, Map as MapIcon, CheckCircle2, TrendingUp, X, Sparkles, Clock, User, ShieldAlert,
} from "lucide-react";

const AdminMap = dynamic(() => import("@/components/AdminMap").then((m) => m.AdminMap), {
  ssr: false,
  loading: () => (
    <div className="grid h-[380px] place-items-center rounded-2xl bg-surface text-sm text-ink-500 shadow-[var(--shadow-card)]">
      Memuat peta laporan…
    </div>
  ),
});

type TabType = "aktif" | "history" | "peta";

export default function WargaDashboard() {
  const { user, laporanWarga, upvote, upvoted } = useApp();
  const nama = user?.nama ?? "Warga";
  const [activeTab, setActiveTab] = useState<TabType>("aktif");
  const [detail, setDetail] = useState<Laporan | null>(null);

  const milikSaya = laporanWarga.filter(
    (l) => l.pelapor === nama || l.pelapor.includes(nama.split(" ")[0])
  );

  const riwayatSaya = laporanWarga.filter(
    (l) => l.status === "resolved" && (l.pelapor === nama || l.pelapor.includes(nama.split(" ")[0]))
  );

  const semuaRiwayat = laporanWarga.filter((l) => l.status === "resolved");

  return (
    <RequireAuth role="warga">
      <main className="mx-auto max-w-[1160px] px-6 py-10">
        {/* Sapaan */}
        <div className="anim-fade-up mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-extrabold md:text-3xl">
              Halo, <span className="text-brand-600">{nama}</span>
            </h1>
            <p className="mt-1 text-sm text-ink-500">
              Pantau laporanmu dan jelajahi perkembangan fasilitas serta kondisi lingkungan terkini.
            </p>
          </div>
          <Link
            href="/lapor"
            className="btn-anim inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 font-semibold text-ink-900 no-underline hover:bg-brand-700"
          >
            <Plus size={18} /> Buat Laporan
          </Link>
        </div>

        {/* Tab Navigation */}
        <div className="anim-fade-up mb-6 flex flex-wrap gap-2 border-b border-ink-300/40 pb-4">
          <button
            onClick={() => setActiveTab("aktif")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
              activeTab === "aktif"
                ? "bg-brand-600 text-white shadow-md"
                : "bg-surface text-ink-700 hover:bg-brand-50 hover:text-cream"
            }`}
          >
            <FileText size={16} /> Laporan Aktif
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
              activeTab === "history"
                ? "bg-brand-600 text-white shadow-md"
                : "bg-surface text-ink-700 hover:bg-brand-50 hover:text-cream"
            }`}
          >
            <History size={16} /> History ({riwayatSaya.length > 0 ? riwayatSaya.length : semuaRiwayat.length})
          </button>
          <button
            onClick={() => setActiveTab("peta")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
              activeTab === "peta"
                ? "bg-brand-600 text-white shadow-md"
                : "bg-surface text-ink-700 hover:bg-brand-50 hover:text-cream"
            }`}
          >
            <MapIcon size={16} /> Peta Laporan
          </button>
        </div>

        {/* TAB 1: LAPORAN AKTIF */}
        {activeTab === "aktif" && (
          <div className="space-y-8">
            {/* Laporan saya */}
            <section className="anim-fade-up">
              <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-extrabold">
                <FileText size={20} className="text-brand-600" /> Laporan Saya
              </h2>
              {milikSaya.length === 0 ? (
                <div className="rounded-2xl bg-surface p-10 text-center shadow-[var(--shadow-card)]">
                  <FileText size={40} className="mx-auto text-ink-300" />
                  <p className="mt-3 font-semibold text-ink-700">Belum ada laporan</p>
                  <p className="mt-1 text-sm text-ink-500">Mulai laporkan masalah di lingkunganmu.</p>
                  <Link
                    href="/lapor"
                    className="btn-anim mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 font-semibold text-white no-underline hover:bg-brand-700"
                  >
                    <Plus size={16} /> Buat Laporan Pertama
                  </Link>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {milikSaya.map((l) => {
                    const k = getKategori(l.kategori);
                    return (
                      <div
                        key={l.id}
                        onClick={() => setDetail(l)}
                        className="card-hover cursor-pointer rounded-2xl bg-surface p-5 shadow-[var(--shadow-card)] transition-all hover:ring-2 hover:ring-brand-600/50"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="font-mono text-xs font-bold text-ink-500">{l.id}</p>
                          <Chip tone={statusTone(l.status)}>{STATUS_LABEL[l.status]}</Chip>
                        </div>
                        <h3 className="mt-2 font-display font-bold">{l.judul}</h3>
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-500">
                          <MapPin size={12} /> {l.lokasi.alamat}
                        </p>
                        <div className="mt-3 flex items-center justify-between">
                          <span
                            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                            style={{ background: `${k.warna}1a`, color: k.warna }}
                          >
                            <span className="h-1.5 w-1.5 rounded-full" style={{ background: k.warna }} /> {k.nama}
                          </span>
                          <span className="text-sm font-extrabold" style={{ color: priorityColor(l.ai.priorityScore) }}>
                            {l.ai.priorityScore}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Laporan sekitar + upvote */}
            <section className="anim-fade-up">
              <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-extrabold">
                <TrendingUp size={20} className="text-brand-600" /> Laporan di Sekitarmu
              </h2>
              <div className="space-y-3">
                {laporanWarga.slice(0, 5).map((l) => {
                  const k = getKategori(l.kategori);
                  const sudah = upvoted.has(l.id);
                  return (
                    <div
                      key={l.id}
                      onClick={() => setDetail(l)}
                      className="card-hover flex cursor-pointer flex-wrap items-center gap-4 rounded-2xl bg-surface p-4 shadow-[var(--shadow-card)] transition-all hover:ring-2 hover:ring-brand-600/50"
                    >
                      <span
                        className="grid h-12 w-12 shrink-0 place-items-center rounded-xl text-white"
                        style={{ background: k.warna }}
                      >
                        <MapPin size={20} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{l.judul}</p>
                        <p className="mt-0.5 flex items-center gap-2 text-xs text-ink-500">
                          <span className="flex items-center gap-1">
                            <Camera size={11} /> {l.foto}
                          </span>
                          · {l.lokasi.alamat}
                        </p>
                      </div>
                      <Chip tone={statusTone(l.status)}>{STATUS_LABEL[l.status]}</Chip>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          upvote(l.id);
                        }}
                        disabled={sudah}
                        className={`btn-anim inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition-all ${
                          sudah ? "cursor-default bg-brand-100 text-brand-700" : "bg-brand-600 text-white hover:bg-brand-700"
                        }`}
                      >
                        <ThumbsUp size={15} className={sudah ? "fill-brand-700" : ""} /> {l.dukungan}
                      </button>
                      <ChevronRight size={18} className="text-ink-300" />
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* TAB 2: HISTORY (RIWAYAT) */}
        {activeTab === "history" && (
          <section className="anim-fade-up space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="flex items-center gap-2 font-display text-xl font-extrabold">
                  <History size={20} className="text-brand-600" /> Riwayat Laporan Selesai
                </h2>
                <p className="mt-1 text-sm text-ink-500">
                  Daftar laporan yang telah berhasil ditangani dan diselesaikan oleh tim dinas terkait.
                </p>
              </div>
            </div>

            {semuaRiwayat.length === 0 ? (
              <div className="rounded-2xl bg-surface p-10 text-center shadow-[var(--shadow-card)]">
                <CheckCircle2 size={40} className="mx-auto text-ink-300" />
                <p className="mt-3 font-semibold text-ink-700">Belum ada riwayat laporan selesai</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {semuaRiwayat.map((l) => {
                  const k = getKategori(l.kategori);
                  const isMilikSaya = l.pelapor === nama || l.pelapor.includes(nama.split(" ")[0]);
                  return (
                    <div
                      key={l.id}
                      onClick={() => setDetail(l)}
                      className="card-hover cursor-pointer rounded-2xl bg-surface p-5 shadow-[var(--shadow-card)] transition-all hover:ring-2 hover:ring-brand-600/50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-ink-500">{l.id}</span>
                          {isMilikSaya && (
                            <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-bold text-brand-700">
                              Laporan Saya
                            </span>
                          )}
                        </div>
                        <Chip tone="success">Selesai ✓</Chip>
                      </div>
                      <h3 className="mt-2 font-display font-bold text-cream">{l.judul}</h3>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-500">
                        <MapPin size={12} /> {l.lokasi.alamat}
                      </p>
                      <div className="mt-3 flex items-center justify-between border-t border-ink-300/30 pt-3 text-xs">
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                          style={{ background: `${k.warna}1a`, color: k.warna }}
                        >
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: k.warna }} /> {k.nama}
                        </span>
                        <span className="text-ink-500">Pelapor: <span className="font-medium text-cream">{l.pelapor}</span></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* TAB 3: PETA LAPORAN (MAPS) */}
        {activeTab === "peta" && (
          <section className="anim-fade-up space-y-4">
            <div>
              <h2 className="flex items-center gap-2 font-display text-xl font-extrabold">
                <MapIcon size={20} className="text-brand-600" /> Peta Sebaran Laporan Lingkungan
              </h2>
              <p className="mt-1 text-sm text-ink-500">
                Lihat titik lokasi seluruh laporan aktif dan penyelesaian di wilayah Yogyakarta secara aktual.
              </p>
            </div>
            <div className="overflow-hidden rounded-2xl border border-white/10 shadow-[var(--shadow-card)]" style={{ height: "480px" }}>
              <AdminMap fill />
            </div>
          </section>
        )}

        {/* MODAL DETAIL LAPORAN */}
        {detail && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/65 backdrop-blur-sm transition-opacity"
              onClick={() => setDetail(null)}
            />
            <div className="anim-fade-up relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-white/15 bg-surface p-6 shadow-2xl md:p-8">
              {/* Header Modal */}
              <div className="flex items-start justify-between gap-4 border-b border-ink-300/30 pb-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-extrabold text-brand-600">{detail.id}</span>
                    <Chip tone={statusTone(detail.status)}>{STATUS_LABEL[detail.status]}</Chip>
                  </div>
                  <h3 className="mt-2 font-display text-xl font-extrabold text-cream md:text-2xl">{detail.judul}</h3>
                </div>
                <button
                  onClick={() => setDetail(null)}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-ink-300/50 text-ink-500 transition-colors hover:bg-brand-50 hover:text-cream"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body Modal */}
              <div className="mt-5 space-y-5">
                {/* Informasi Lokasi & Pelapor */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-ink-300/40 bg-brand-50/40 p-4">
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-ink-500">
                      <MapPin size={14} className="text-brand-600" /> Lokasi Laporan
                    </p>
                    <p className="mt-1 text-sm font-bold text-cream">{detail.lokasi.alamat}</p>
                    <p className="mt-0.5 text-[11px] font-mono text-ink-500">
                      Lat {detail.lokasi.lat.toFixed(4)}, Lng {detail.lokasi.lng.toFixed(4)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-ink-300/40 bg-brand-50/40 p-4">
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-ink-500">
                      <User size={14} className="text-brand-600" /> Informasi Pelapor
                    </p>
                    <p className="mt-1 text-sm font-bold text-cream">{detail.pelapor}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-[11px] text-ink-500">
                      <Clock size={11} /> {new Date(detail.waktu).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>

                {/* Kategori & Dukungan & Foto */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl border border-ink-300/40 p-3 text-center">
                    <p className="text-[11px] font-bold text-ink-500 uppercase">Kategori</p>
                    <p className="mt-1 text-xs font-bold" style={{ color: getKategori(detail.kategori).warna }}>
                      {getKategori(detail.kategori).nama}
                    </p>
                  </div>
                  <div className="rounded-xl border border-ink-300/40 p-3 text-center">
                    <p className="text-[11px] font-bold text-ink-500 uppercase">Foto Bukti</p>
                    <p className="mt-1 flex items-center justify-center gap-1 text-xs font-bold text-cream">
                      <Camera size={13} /> {detail.foto} foto
                    </p>
                  </div>
                  <div className="rounded-xl border border-ink-300/40 p-3 text-center">
                    <p className="text-[11px] font-bold text-ink-500 uppercase">Dukungan</p>
                    <p className="mt-1 flex items-center justify-center gap-1 text-xs font-bold text-brand-600">
                      <ThumbsUp size={13} /> {detail.dukungan} warga
                    </p>
                  </div>
                </div>

                {/* Card Analisis AI Multi-Agent */}
                <div className="rounded-2xl border border-brand-600/30 bg-gradient-to-br from-brand-600/10 to-transparent p-5">
                  <h4 className="flex items-center gap-2 font-display text-sm font-extrabold text-cream">
                    <Sparkles size={16} className="text-brand-600" /> Analisis AI Multi-Agent
                  </h4>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-ink-500">Skor Urgensi (Prioritas)</p>
                      <p className="mt-0.5 font-display text-lg font-extrabold" style={{ color: priorityColor(detail.ai.priorityScore) }}>
                        {detail.ai.priorityScore} / 10 · {priorityLabel(detail.ai.priorityScore)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-ink-500">Estimasi Penanganan (SLA)</p>
                      <p className="mt-0.5 font-display text-lg font-extrabold text-cream">{detail.sla}</p>
                    </div>
                  </div>
                  <div className="mt-3 border-t border-brand-600/20 pt-3">
                    <p className="text-xs text-ink-500">Analisis Dampak:</p>
                    <p className="mt-1 text-xs font-semibold text-cream-hi">{detail.ai.dampak}</p>
                  </div>
                </div>
              </div>

              {/* Footer Modal */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-ink-300/30 pt-4">
                <button
                  onClick={() => upvote(detail.id)}
                  disabled={upvoted.has(detail.id)}
                  className={`btn-anim inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all ${
                    upvoted.has(detail.id)
                      ? "bg-brand-100 text-brand-700 cursor-default"
                      : "bg-brand-600 text-white hover:bg-brand-700"
                  }`}
                >
                  <ThumbsUp size={16} className={upvoted.has(detail.id) ? "fill-brand-700" : ""} />
                  {upvoted.has(detail.id) ? "Sudah Didukung" : `Dukung Laporan (${detail.dukungan})`}
                </button>
                <button
                  onClick={() => setDetail(null)}
                  className="rounded-xl border border-ink-300/50 px-5 py-2.5 text-sm font-semibold text-ink-700 transition-colors hover:border-brand-600 hover:text-cream"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </RequireAuth>
  );
}


