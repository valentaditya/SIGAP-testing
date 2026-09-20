"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { RequireAuth } from "@/components/RequireAuth";
import { useApp } from "@/lib/store";
import { Chip } from "@/components/Chip";
import { STATUS_LABEL_ID as STATUS_LABEL, statusTone, priorityColor, priorityLabel, getKategori, type Laporan } from "@/lib/data";
import {
  FileText, Plus, ThumbsUp, MapPin, Camera,
  ChevronRight, History, Map as MapIcon, CheckCircle2, TrendingUp, X, Sparkles, Clock, User, ShieldAlert,
  ArrowRight, Phone, UserCheck, Activity, Building2,
} from "lucide-react";
import ProfileClient from "../profil/ProfileClient";
import { supabase } from "@/lib/supabase";

const AdminMap = dynamic(() => import("@/components/AdminMap").then((m) => m.AdminMap), {
  ssr: false,
  loading: () => (
    <div className="grid h-[380px] place-items-center rounded-2xl bg-surface text-sm text-ink-500 shadow-[var(--shadow-card)]">
      Memuat peta laporan…
    </div>
  ),
});

type TabType = "aktif" | "history" | "peta" | "profil";

export default function WargaDashboard() {
  const { user, laporanWarga, upvote, upvoted, updateUser } = useApp();
  const nama = user?.nama ?? "Warga";
  const [activeTab, setActiveTab] = useState<TabType>("aktif");
  const [detail, setDetail] = useState<Laporan | null>(null);
  const [lightboxFoto, setLightboxFoto] = useState<string | null>(null);

  // Modal baru daftar
  const [modalNotif, setModalNotif] = useState(false);
  const [modalForm, setModalForm] = useState(false);
  const [telepon, setTelepon] = useState("");
  const [alamat, setAlamat] = useState("");
  const [savingLengkap, setSavingLengkap] = useState(false);
  const checkedRef = useRef(false);

  // Cek sessionStorage saat pertama mount — tampilkan modal jika user baru daftar
  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;
    try {
      const flag = sessionStorage.getItem("sigap_baru_daftar");
      if (flag === "1") {
        sessionStorage.removeItem("sigap_baru_daftar");
        // Tunda sedikit agar dashboard sudah ter-render
        setTimeout(() => setModalNotif(true), 600);
      }
    } catch {}
  }, []);

  async function handleSimpanKelengkapan(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSavingLengkap(true);
    try {
      await supabase
        .from("users")
        .update({ telepon: telepon.trim(), alamat: alamat.trim() })
        .eq("email", user.email);
    } catch {}
    updateUser({ telepon: telepon.trim(), alamat: alamat.trim() });
    setSavingLengkap(false);
    setModalForm(false);
  }

  const milikSaya = laporanWarga.filter((l) => {
    const pName = l.pelapor ? l.pelapor.trim().toLowerCase() : "";
    const uName = nama.trim().toLowerCase();
    const firstName = uName.split(" ")[0];
    return pName === uName || (firstName.length > 2 && pName.includes(firstName)) || (pName.length > 2 && uName.includes(pName));
  });

  const riwayatSaya = milikSaya.filter((l) => l.status === "resolved");

  return (
    <RequireAuth role="warga">
      {/* ===== MODAL 1: NOTIFIKASI BARU DAFTAR ===== */}
      {modalNotif && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-[480px] overflow-hidden rounded-3xl border border-ink-300 bg-surface p-6 sm:p-8 shadow-2xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-tan/15 text-tan border border-tan/30 mb-5">
              <Sparkles size={32} className="animate-pulse" />
            </div>

            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-tan/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-tan border border-tan/20 mb-2">
                Pendaftaran Berhasil
              </span>
              <h3 className="font-display text-2xl font-extrabold text-cream-hi sm:text-3xl">
                Lengkapi Profil Anda
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-sage-pale">
                Lengkapi nomor telepon dan alamat agar petugas dapat menghubungi Anda dan menindaklanjuti laporan dengan cepat.
              </p>
            </div>

            <div className="mt-7 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => { setModalNotif(false); setModalForm(true); }}
                className="btn-anim flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-tan-solid font-bold text-white shadow-lg hover:bg-brand-700"
              >
                Lengkapi Sekarang <ArrowRight size={16} />
              </button>
              <button
                type="button"
                onClick={() => setModalNotif(false)}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-ink-300 bg-ground/50 font-semibold text-sage transition-colors hover:text-cream hover:bg-ground"
              >
                Nanti Saja
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL 2: FORM KELENGKAPAN DATA ===== */}
      {modalForm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-[500px] overflow-hidden rounded-3xl border border-ink-300 bg-surface p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-ink-300 pb-4 mb-6">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-tan/20 text-tan">
                <UserCheck size={20} />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-cream-hi">Lengkapi Profil</h3>
                <p className="text-xs text-sage">Nomor kontak dan domisili</p>
              </div>
            </div>

            <form onSubmit={handleSimpanKelengkapan} className="space-y-4">
              {/* Telepon */}
              <div className="field flex items-stretch border border-ink-400 focus-within:border-tan transition-colors">
                <div className="field relative min-w-0 flex-1">
                  <input
                    id="wl-telepon"
                    type="text"
                    value={telepon}
                    onChange={(e) => setTelepon(e.target.value)}
                    placeholder=" "
                    className="field-input border-0"
                  />
                  <label htmlFor="wl-telepon" className="field-label">Nomor Telepon / WhatsApp</label>
                </div>
              </div>
              <p className="text-xs text-sage">Nomor aktif untuk konfirmasi petugas di lokasi</p>

              {/* Alamat */}
              <div className="field flex items-stretch border border-ink-400 focus-within:border-tan transition-colors">
                <div className="field relative min-w-0 flex-1">
                  <input
                    id="wl-alamat"
                    type="text"
                    value={alamat}
                    onChange={(e) => setAlamat(e.target.value)}
                    placeholder=" "
                    className="field-input border-0"
                  />
                  <label htmlFor="wl-alamat" className="field-label">Alamat / Domisili</label>
                </div>
              </div>
              <p className="text-xs text-sage">Contoh: Jl. Babarsari No. 44, Depok, Sleman</p>

              <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-ink-300">
                <button
                  type="button"
                  onClick={() => setModalForm(false)}
                  className="px-4 py-2.5 text-sm font-semibold text-sage hover:text-cream"
                >
                  Lewati
                </button>
                <button
                  type="submit"
                  disabled={savingLengkap}
                  className="btn-anim flex h-11 items-center justify-center gap-2 rounded-xl bg-tan-solid px-6 font-bold text-white shadow-md hover:bg-brand-700 disabled:opacity-60"
                >
                  <CheckCircle2 size={16} /> Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-[1160px] px-3.5 sm:px-6 py-6 sm:py-10">
        {/* Sapaan */}
        <div className="anim-fade-up mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-extrabold">
              Halo, <span className="text-brand-600">{nama}</span>
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-ink-500">
              Pantau laporan Anda dan perkembangan penanganan di lingkungan sekitar.
            </p>
          </div>
          <Link
            href="/lapor"
            className="btn-anim inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-xs sm:text-sm font-semibold text-ink-900 no-underline hover:bg-brand-700 shrink-0"
          >
            <Plus size={18} /> Buat Laporan
          </Link>
        </div>

        {/* Tab Navigation */}
        <div className="anim-fade-up mb-6 flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-ink-300/40 pb-4 w-full">
          <button
            onClick={() => setActiveTab("aktif")}
            className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-bold transition-all ${
              activeTab === "aktif"
                ? "bg-brand-600 text-white shadow-md"
                : "bg-surface text-ink-700 hover:bg-brand-50 hover:text-cream"
            }`}
          >
            <FileText size={15} /> Laporan Aktif
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-bold transition-all ${
              activeTab === "history"
                ? "bg-brand-600 text-white shadow-md"
                : "bg-surface text-ink-700 hover:bg-brand-50 hover:text-cream"
            }`}
          >
            <History size={15} /> Riwayat ({riwayatSaya.length})
          </button>
          <button
            onClick={() => setActiveTab("peta")}
            className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-bold transition-all ${
              activeTab === "peta"
                ? "bg-brand-600 text-white shadow-md"
                : "bg-surface text-ink-700 hover:bg-brand-50 hover:text-cream"
            }`}
          >
            <MapIcon size={15} /> Peta Laporan
          </button>
          <button
            onClick={() => setActiveTab("profil")}
            className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-bold transition-all ${
              activeTab === "profil"
                ? "bg-brand-600 text-white shadow-md"
                : "bg-surface text-ink-700 hover:bg-brand-50 hover:text-cream"
            }`}
          >
            <User size={15} /> Profil
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
                  Daftar laporan yang telah ditangani dan diselesaikan oleh dinas terkait.
                </p>
              </div>
            </div>

            {riwayatSaya.length === 0 ? (
              <div className="rounded-2xl bg-surface p-10 text-center shadow-[var(--shadow-card)]">
                <CheckCircle2 size={40} className="mx-auto text-ink-300" />
                <p className="mt-3 font-semibold text-ink-700">Belum ada laporan selesai</p>
                <p className="mt-1 text-xs text-ink-500">Laporan yang sudah ditangani akan muncul di sini.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {riwayatSaya.map((l) => {
                  const k = getKategori(l.kategori);
                  return (
                    <div
                      key={l.id}
                      onClick={() => setDetail(l)}
                      className="card-hover cursor-pointer rounded-2xl bg-surface p-5 shadow-[var(--shadow-card)] transition-all hover:ring-2 hover:ring-brand-600/50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-ink-500">{l.id}</span>
                          <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-bold text-brand-700">
                            Laporan Saya
                          </span>
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
                <MapIcon size={20} className="text-brand-600" /> Peta Sebaran Laporan
              </h2>
              <p className="mt-1 text-sm text-ink-500">
                Lihat titik lokasi seluruh laporan aktif dan penyelesaian di wilayah Yogyakarta.
              </p>
            </div>
            <div className="overflow-hidden rounded-2xl border border-white/10 shadow-[var(--shadow-card)]" style={{ height: "480px" }}>
              <AdminMap fill />
            </div>
          </section>
        )}

        {/* TAB 4: PROFIL AKUN WARGA */}
        {activeTab === "profil" && (
          <ProfileClient />
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
                      <MapPin size={14} className="text-brand-600" /> Lokasi Kejadian
                    </p>
                    <p className="mt-1 text-sm font-bold text-cream">{detail.lokasi.alamat}</p>
                    <p className="mt-0.5 text-[11px] font-mono text-ink-500">
                      Lat {detail.lokasi.lat.toFixed(4)}, Lng {detail.lokasi.lng.toFixed(4)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-ink-300/40 bg-brand-50/40 p-4">
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-ink-500">
                      <User size={14} className="text-brand-600" /> Pelapor
                    </p>
                    <p className="mt-1 text-sm font-bold text-cream">{detail.pelapor}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-[11px] text-ink-500">
                      <Clock size={11} /> {new Date(detail.waktu).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>

                {/* Kategori & Dukungan */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-ink-300/40 p-3 text-center">
                    <p className="text-[11px] font-bold text-ink-500 uppercase">Kategori</p>
                    <p className="mt-1 text-xs font-bold" style={{ color: getKategori(detail.kategori).warna }}>
                      {getKategori(detail.kategori).nama}
                    </p>
                  </div>
                  <div className="rounded-xl border border-ink-300/40 p-3 text-center">
                    <p className="text-[11px] font-bold text-ink-500 uppercase">Dukungan Warga</p>
                    <p className="mt-1 flex items-center justify-center gap-1 text-xs font-bold text-brand-600">
                      <ThumbsUp size={13} /> {detail.dukungan} warga
                    </p>
                  </div>
                </div>

                {/* Foto Bukti Pelapor */}
                <div className="rounded-2xl border border-ink-300/40 bg-ground/50 p-4">
                  <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase text-ink-500">
                    <Camera size={13} className="text-brand-600" /> Foto Laporan
                    <span className="ml-auto font-normal normal-case text-ink-400">
                      {(detail.fotoUrls && detail.fotoUrls.length > 0) ? `${detail.fotoUrls.length} foto` : "Tidak ada foto"}
                    </span>
                  </p>
                  {detail.fotoUrls && detail.fotoUrls.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {detail.fotoUrls.map((url, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setLightboxFoto(url)}
                          className="group relative aspect-square overflow-hidden rounded-xl border border-ink-300/40 bg-ground transition-all hover:border-brand-600 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
                        >
                          <img
                            src={url}
                            alt={`Foto bukti ${i + 1}`}
                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
                            <Camera size={20} className="text-white opacity-0 transition-opacity group-hover:opacity-100" />
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex h-20 items-center justify-center gap-2 rounded-xl border border-dashed border-ink-300/50 text-xs text-ink-500">
                      <Camera size={16} className="opacity-40" /> Tidak ada foto
                    </div>
                  )}
                </div>

                {/* Foto Bukti Penanganan Petugas */}
                {detail.buktiPetugas && detail.buktiPetugas.fotoUrls && detail.buktiPetugas.fotoUrls.length > 0 && (
                  <div className="rounded-2xl border border-success/40 bg-success-bg/15 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-success">
                        <CheckCircle2 size={15} /> Foto Penanganan Petugas
                      </p>
                      <span className="text-[10px] font-bold text-success bg-success-bg px-2.5 py-0.5 rounded-full border border-success/30">
                        Hasil Kerja
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {detail.buktiPetugas.fotoUrls.map((url, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setLightboxFoto(url)}
                          className="group relative h-20 w-28 overflow-hidden rounded-xl border border-success/40 bg-surface transition-all hover:border-success hover:shadow-md focus:outline-none"
                        >
                          <img
                            src={url}
                            alt={`Bukti Selesai ${idx + 1}`}
                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/35">
                            <Camera size={18} className="text-white opacity-0 transition-opacity group-hover:opacity-100" />
                          </div>
                        </button>
                      ))}
                    </div>
                    {detail.buktiPetugas.catatan && (
                      <p className="text-xs text-cream-hi mt-2 bg-surface/60 p-2.5 rounded-xl border border-success/20">
                        <span className="font-bold text-success">Catatan Petugas:</span> {detail.buktiPetugas.catatan}
                      </p>
                    )}
                  </div>
                )}

                {/* TIMELINE PERKEMBANGAN LAPORAN */}
                <div className="rounded-2xl border border-brand-600/30 bg-surface/80 p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-ink-300/30 pb-3">
                    <h4 className="flex items-center gap-2 font-display text-sm font-extrabold text-cream">
                      <Activity size={16} className="text-brand-600" /> Perkembangan Laporan
                    </h4>
                    <span className="text-[11px] font-semibold text-brand-600 bg-brand-50/70 dark:bg-brand-900/30 px-2.5 py-0.5 rounded-full border border-brand-600/20">
                      Status Terkini
                    </span>
                  </div>

                  <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-ink-300/40">
                    {/* Step 1: Laporan Dibuat */}
                    <div className="relative">
                      <span className="absolute -left-6 top-0.5 grid h-5 w-5 place-items-center rounded-full bg-success text-white text-[10px] font-bold">
                        ✓
                      </span>
                      <p className="text-xs font-bold text-cream">1. Laporan Diterima</p>
                      <p className="text-[11px] text-ink-500 mt-0.5">
                        Laporan diterima oleh sistem dan diteruskan ke dinas terkait.
                      </p>
                      <p className="text-[10px] text-ink-400 mt-0.5 font-mono">{new Date(detail.waktu).toLocaleString("id-ID")}</p>
                    </div>

                    {/* Step 2: Ditinjau Dinas */}
                    <div className="relative">
                      <span className={`absolute -left-6 top-0.5 grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold ${
                        ["verified", "assigned", "in_progress", "resolved"].includes(detail.status)
                          ? "bg-success text-white"
                          : "bg-ink-300/50 text-ink-500"
                      }`}>
                        {["verified", "assigned", "in_progress", "resolved"].includes(detail.status) ? "✓" : "2"}
                      </span>
                      <p className={`text-xs font-bold ${["verified", "assigned", "in_progress", "resolved"].includes(detail.status) ? "text-cream" : "text-ink-500"}`}>
                        2. Diverifikasi Dinas
                      </p>
                      <p className="text-[11px] text-ink-500 mt-0.5">
                        Dinas memeriksa laporan dan menyiapkan penugasan ke petugas.
                      </p>
                    </div>

                    {/* Step 3: Diteruskan ke Petugas */}
                    <div className="relative">
                      <span className={`absolute -left-6 top-0.5 grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold ${
                        ["assigned", "in_progress", "resolved"].includes(detail.status)
                          ? "bg-success text-white"
                          : "bg-ink-300/50 text-ink-500"
                      }`}>
                        {["assigned", "in_progress", "resolved"].includes(detail.status) ? "✓" : "3"}
                      </span>
                      <p className={`text-xs font-bold ${["assigned", "in_progress", "resolved"].includes(detail.status) ? "text-cream" : "text-ink-500"}`}>
                        3. Ditugaskan ke Petugas
                      </p>
                      <p className="text-[11px] text-ink-500 mt-0.5">
                        Laporan masuk ke daftar tugas kerja petugas lapangan.
                      </p>
                    </div>

                    {/* Step 4: Dikerjakan & Kirim Bukti */}
                    <div className="relative">
                      <span className={`absolute -left-6 top-0.5 grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold ${
                        detail.status === "resolved"
                          ? "bg-success text-white"
                          : detail.status === "in_progress"
                          ? "bg-amber-500 text-white animate-pulse"
                          : "bg-ink-300/50 text-ink-500"
                      }`}>
                        {detail.status === "resolved" ? "✓" : "4"}
                      </span>
                      <p className={`text-xs font-bold ${["in_progress", "resolved"].includes(detail.status) ? "text-cream" : "text-ink-500"}`}>
                        4. Dikerjakan Petugas
                      </p>
                      <p className="text-[11px] text-ink-500 mt-0.5">
                        {detail.buktiPetugas?.fotoUrls?.length
                          ? "Petugas telah selesai menangani masalah dan melampirkan foto hasil kerja."
                          : detail.status === "in_progress"
                          ? "Petugas sedang melakukan pengerjaan di lapangan."
                          : "Menunggu penanganan di lokasi."}
                      </p>
                      {detail.buktiPetugas?.waktu && (
                        <p className="text-[10px] text-brand-600 mt-0.5 font-mono">
                          Waktu: {new Date(detail.buktiPetugas.waktu).toLocaleString("id-ID")}
                        </p>
                      )}
                    </div>

                    {/* Step 5: Selesai & Terverifikasi Dinas */}
                    <div className="relative">
                      <span className={`absolute -left-6 top-0.5 grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold ${
                        detail.status === "resolved"
                          ? "bg-success text-white"
                          : "bg-ink-300/50 text-ink-500"
                      }`}>
                        {detail.status === "resolved" ? "✓" : "5"}
                      </span>
                      <p className={`text-xs font-bold ${detail.status === "resolved" ? "text-success" : "text-ink-500"}`}>
                        5. Selesai
                      </p>
                      <p className="text-[11px] text-ink-500 mt-0.5">
                        {detail.status === "resolved"
                          ? "Dinas telah menyetujui hasil penanganan. Laporan selesai."
                          : "Menunggu konfirmasi penyelesaian dari dinas terkait."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card Informasi Penanganan */}
                <div className="rounded-2xl border border-brand-600/30 bg-gradient-to-br from-brand-600/10 to-transparent p-5">
                  <h4 className="flex items-center gap-2 font-display text-sm font-extrabold text-cream">
                    <Sparkles size={16} className="text-brand-600" /> Informasi Penanganan
                  </h4>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-ink-500">Tingkat Prioritas</p>
                      <p className="mt-0.5 font-display text-lg font-extrabold" style={{ color: priorityColor(detail.ai.priorityScore) }}>
                        {detail.ai.priorityScore} / 10 · {priorityLabel(detail.ai.priorityScore)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-ink-500">Target Penanganan</p>
                      <p className="mt-0.5 font-display text-lg font-extrabold text-cream">{detail.sla}</p>
                    </div>
                  </div>
                  <div className="mt-3 border-t border-brand-600/20 pt-3">
                    <p className="text-xs text-ink-500">Catatan Kondisi:</p>
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
      {/* LIGHTBOX FOTO */}
      {lightboxFoto && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={() => setLightboxFoto(null)}
        >
          <button
            onClick={() => setLightboxFoto(null)}
            className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <X size={20} />
          </button>
          <img
            src={lightboxFoto}
            alt="Foto bukti laporan"
            className="max-h-[85vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </RequireAuth>
  );
}


