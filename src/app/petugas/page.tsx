"use client";

import { useState, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import { RequireAuth } from "@/components/RequireAuth";
import { useApp } from "@/lib/store";
import { Chip } from "@/components/Chip";
import {
  STATUS_LABEL_ID as STATUS_LABEL,
  statusTone,
  priorityColor,
  getKategori,
  KATEGORI,
  getFotoUrls,
  type StatusId,
  type Laporan,
} from "@/lib/data";
import {
  ClipboardList,
  MapPin,
  Navigation,
  Camera,
  CheckCircle2,
  Upload,
  PlayCircle,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  X,
  Map as MapIcon,
  Sparkles,
  User,
  Clock,
  Loader2,
  FileCheck,
  Eye,
  AlertCircle,
} from "lucide-react";
import ProfileClient from "../profil/ProfileClient";

const AdminMap = dynamic(() => import("@/components/AdminMap").then((m) => m.AdminMap), {
  ssr: false,
  loading: () => (
    <div className="grid h-[320px] place-items-center rounded-2xl bg-surface text-sm text-ink-500 shadow-[var(--shadow-card)]">
      Memuat peta lokasi tugas…
    </div>
  ),
});

const PAGE_SIZE = 4;

export default function PetugasDashboard() {
  const { user, laporanWarga, updateLaporanStatus, kirimBuktiPetugas, tambahNotif } = useApp();

  const [view, setView] = useState<"tugas" | "profil">("tugas");

  // Lightbox
  const [lightboxFoto, setLightboxFoto] = useState<string | null>(null);

  // Navigation & Search/Filter states
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [kategoriFilter, setKategoriFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [showMap, setShowMap] = useState(true);
  const [highlightedTaskId, setHighlightedTaskId] = useState<string | null>(null);

  // Modal Upload Proof Form state
  const [modalTask, setModalTask] = useState<Laporan | null>(null);
  const [modalFiles, setModalFiles] = useState<File[]>([]);
  const [modalPreviews, setModalPreviews] = useState<string[]>([]);
  const [modalCatatan, setModalCatatan] = useState("");
  const [isSubmittingBukti, setIsSubmittingBukti] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleStartHandling(task: Laporan) {
    updateLaporanStatus(task.id, "in_progress");
    tambahNotif({
      judul: "Penanganan Dimulai",
      pesan: `Anda telah memulai penanganan lapangan untuk: ${task.id} (${task.judul})`,
      waktu: "Baru saja",
      tone: "warning",
    });
  }

  // Filtered task list
  const allPetugasTasks = useMemo(() => {
    return laporanWarga.map((l) => ({
      ...l,
      effectiveStatus: l.status,
    }));
  }, [laporanWarga]);

  const filteredTasks = useMemo(() => {
    return allPetugasTasks.filter((t) => {
      // Must be assigned, in_progress, or resolved
      const isOfficerTask = ["assigned", "in_progress", "resolved"].includes(t.effectiveStatus);
      if (!isOfficerTask) return false;

      // Status filter
      if (statusFilter !== "all" && t.effectiveStatus !== statusFilter) return false;

      // Category filter
      if (kategoriFilter !== "all" && t.kategori !== kategoriFilter) return false;

      // Search query
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchTitle = t.judul.toLowerCase().includes(q);
        const matchId = t.id.toLowerCase().includes(q);
        const matchAddress = t.lokasi.alamat.toLowerCase().includes(q);
        if (!matchTitle && !matchId && !matchAddress) return false;
      }

      return true;
    });
  }, [allPetugasTasks, statusFilter, kategoriFilter, search]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / PAGE_SIZE));
  const currentTasks = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredTasks.slice(start, start + PAGE_SIZE);
  }, [filteredTasks, currentPage]);

  const activeCount = allPetugasTasks.filter((t) => ["assigned", "in_progress"].includes(t.effectiveStatus)).length;
  const inProgressCount = allPetugasTasks.filter((t) => t.effectiveStatus === "in_progress").length;
  const resolvedCount = allPetugasTasks.filter((t) => t.effectiveStatus === "resolved").length;

  function handleOpenUploadModal(task: Laporan) {
    setModalTask(task);
    setModalFiles([]);
    setModalCatatan(task.buktiPetugas?.catatan || "");
    setModalPreviews(task.buktiPetugas?.fotoUrls || []);
  }

  function handleSelectTaskFromMap(task: Laporan) {
    setHighlightedTaskId(task.id);
    if (statusFilter !== "all" && task.status !== statusFilter) setStatusFilter("all");
    if (kategoriFilter !== "all" && task.kategori !== kategoriFilter) setKategoriFilter("all");
    setSearch("");

    const idx = allPetugasTasks.findIndex((t) => t.id === task.id);
    if (idx !== -1) {
      setCurrentPage(Math.floor(idx / PAGE_SIZE) + 1);
    }

    setTimeout(() => {
      const el = document.getElementById(`task-card-${task.id}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 150);

    // Langsung buka modal informasi & tindakan agar petugas tidak perlu mencari lagi
    handleOpenUploadModal(task);
  }

  function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    const remainingSlots = 5 - modalPreviews.length;
    const toAdd = fileList.slice(0, remainingSlots);

    toAdd.forEach((file) => {
      setModalFiles((prev) => [...prev, file]);
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setModalPreviews((prev) => [...prev, ev.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  }

  function removeModalPhoto(index: number) {
    setModalPreviews((prev) => prev.filter((_, i) => i !== index));
    setModalFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSaveBuktiAndSubmit() {
    if (!modalTask) return;
    setIsSubmittingBukti(true);

    let uploadedStorageUrls: string[] = [];

    // Jika ada file fisik yang dipilih, upload ke Supabase Storage via endpoint
    if (modalFiles.length > 0) {
      try {
        const fd = new FormData();
        fd.append("laporanId", modalTask.id);
        modalFiles.forEach((f) => fd.append("files", f));

        const uploadRes = await fetch("/api/upload-foto", { method: "POST", body: fd });
        const uploadData = await uploadRes.json();
        if (uploadData.success && uploadData.urls?.length > 0) {
          uploadedStorageUrls = uploadData.urls;
        }
      } catch (e) {
        console.warn("Upload bukti penanganan ke storage error:", e);
      }
    }

    // Gabungkan URL permanen yang sudah ada / baru diupload
    const existingHttpUrls = modalPreviews.filter((u) => u.startsWith("http"));
    const finalProofUrls = Array.from(
      new Set([
        ...existingHttpUrls,
        ...uploadedStorageUrls,
        // Fallback simpan preview jika upload offline / gagal
        ...(uploadedStorageUrls.length === 0 ? modalPreviews : []),
      ])
    );

    const proofData = {
      fotoUrls: finalProofUrls,
      catatan: modalCatatan.trim() || "Penanganan lapangan telah diselesaikan oleh petugas. Menunggu verifikasi dinas.",
      waktu: new Date().toISOString(),
      petugas: user?.nama || "Petugas Lapangan",
    };

    // Kirim bukti ke dinas terkait (Status tetap in_progress dengan bukti siap ditinjau dinas)
    await kirimBuktiPetugas(modalTask.id, proofData, "in_progress");

    tambahNotif({
      judul: "Bukti Penanganan Terkirim ke Dinas",
      pesan: `Laporan ${modalTask.id} telah dikirimkan foto bukti & catatan. Menunggu konfirmasi verifikasi dari dinas.`,
      waktu: "Baru saja",
      tone: "info",
    });

    setIsSubmittingBukti(false);
    setModalTask(null);
  }

  function handleNavigateMaps(lat: number, lng: number) {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, "_blank");
  }

  return (
    <RequireAuth role="petugas">
      <main className="mx-auto max-w-[1060px] px-6 py-10">
        {/* Header Dashboard */}
        <div className="anim-fade-up mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-extrabold md:text-3xl">
              Dashboard <span className="text-brand-600">Petugas Lapangan</span>
            </h1>
            <p className="mt-1 text-sm text-ink-500">
              Kelola tugas lapangan, navigasi lokasi, dan unggah foto bukti penyelesaian untuk diverifikasi dinas.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-ink-300 bg-surface p-1.5 shadow-sm">
            <button
              onClick={() => setView("tugas")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-extrabold transition-all ${
                view === "tugas"
                  ? "bg-brand-600 text-white shadow-md"
                  : "text-ink-500 hover:text-cream hover:bg-ground/50"
              }`}
            >
              <ClipboardList size={15} /> Tugas Lapangan
            </button>
            <button
              onClick={() => setView("profil")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-extrabold transition-all ${
                view === "profil"
                  ? "bg-brand-600 text-white shadow-md"
                  : "text-ink-500 hover:text-cream hover:bg-ground/50"
              }`}
            >
              <User size={15} /> Profil Akun
            </button>
          </div>
        </div>

        {view === "profil" ? (
          <ProfileClient />
        ) : (
          <>
            {/* Toggle Show Map Button */}
            <div className="mb-4 text-right">
              <button
                onClick={() => setShowMap((v) => !v)}
                className="btn-anim inline-flex items-center gap-2 rounded-xl border border-ink-300 bg-surface px-4 py-2 text-xs font-semibold text-ink-700 shadow-sm transition-colors hover:border-brand-600 hover:text-cream"
              >
                <MapIcon size={14} /> {showMap ? "Sembunyikan Peta" : "Tampilkan Peta Lokasi"}
              </button>
            </div>

            {/* Ringkasan Statistik */}
            <div className="anim-fade-up mb-6 grid grid-cols-2 gap-4 md:grid-cols-3">
              <div className="rounded-2xl bg-surface p-5 shadow-[var(--shadow-card)] border border-white/5">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Tugas Aktif</p>
                <p className="mt-1 font-display text-3xl font-extrabold text-cream">{activeCount}</p>
              </div>
              <div className="rounded-2xl bg-surface p-5 shadow-[var(--shadow-card)] border border-white/5">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Dalam Proses</p>
                <p className="mt-1 font-display text-3xl font-extrabold text-amber-600">{inProgressCount}</p>
              </div>
              <div className="rounded-2xl bg-surface p-5 shadow-[var(--shadow-card)] border border-white/5">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Selesai Diverifikasi</p>
                <p className="mt-1 font-display text-3xl font-extrabold text-success">{resolvedCount}</p>
              </div>
            </div>

            {/* Peta Interaktif Lokasi Tugas */}
            {showMap && (
              <section className="anim-fade-up mb-8">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h2 className="flex items-center gap-2 font-display text-lg font-bold">
                      <MapIcon size={18} className="text-brand-600" /> Peta Lokasi Tugas Lapangan
                    </h2>
                    <p className="text-xs text-ink-500">
                      Klik salah satu pin masalah di peta untuk langsung menampilkan informasi dan menindaklanjuti tugas.
                    </p>
                  </div>
                </div>
                <div className="overflow-hidden rounded-2xl border border-white/10 shadow-[var(--shadow-card)]">
                  <AdminMap
                    height={340}
                    statusFilter={(l) => ["assigned", "in_progress", "resolved"].includes(l.status)}
                    onSelectLaporan={handleSelectTaskFromMap}
                  />
                </div>
              </section>
            )}

            {/* Bagian Filter & Daftar Tugas */}
            <section className="anim-fade-up space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 font-display text-xl font-extrabold">
                  <ClipboardList size={20} className="text-brand-600" /> Daftar Tugas Lapangan
                </h2>
                <span className="text-xs text-ink-500 font-medium">
                  Menampilkan {filteredTasks.length} tugas
                </span>
              </div>

              {/* Search & Filter Bar */}
              <div className="grid gap-3 rounded-2xl bg-surface p-4 shadow-[var(--shadow-card)] sm:grid-cols-[1fr_auto_auto]">
                {/* Search Input */}
                <div className="relative">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-500" />
                  <input
                    type="text"
                    placeholder="Cari ID tiket, judul, atau alamat lokasi…"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full rounded-xl border border-ink-300/60 bg-ground/50 py-2.5 pl-10 pr-4 text-sm text-cream outline-none transition-colors focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
                  />
                </div>

                {/* Filter Status */}
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="rounded-xl border border-ink-300/60 bg-ground/50 px-3 py-2.5 text-sm font-medium text-cream outline-none focus:border-brand-600"
                >
                  <option value="all">Semua Status</option>
                  <option value="assigned">Diteruskan ke Petugas</option>
                  <option value="in_progress">Dikerjakan Petugas</option>
                  <option value="resolved">Selesai & Terverifikasi</option>
                </select>

                {/* Filter Kategori */}
                <select
                  value={kategoriFilter}
                  onChange={(e) => {
                    setKategoriFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="rounded-xl border border-ink-300/60 bg-ground/50 px-3 py-2.5 text-sm font-medium text-cream outline-none focus:border-brand-600"
                >
                  <option value="all">Semua Kategori</option>
                  {KATEGORI.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.nama}
                    </option>
                  ))}
                </select>
              </div>

              {/* Empty state */}
              {filteredTasks.length === 0 && (
                <div className="rounded-2xl bg-surface p-10 text-center shadow-[var(--shadow-card)]">
                  <CheckCircle2 size={40} className="mx-auto text-ink-300" />
                  <p className="mt-3 font-semibold text-ink-700">Tidak ada tugas yang sesuai</p>
                  <p className="mt-1 text-xs text-ink-500">Coba ubah kata kunci pencarian atau filter status.</p>
                </div>
              )}

              {/* Scroll Area Khusus Daftar Tugas */}
              {filteredTasks.length > 0 && (
                <div className="space-y-4">
                  {currentTasks.map((l) => {
                    const k = getKategori(l.kategori);
                    const st = l.effectiveStatus;
                    const fotoUrls = getFotoUrls(l);
                    const bukti = l.buktiPetugas;
                    const hasBukti = !!bukti && bukti.fotoUrls && bukti.fotoUrls.length > 0;
                    const isHighlighted = highlightedTaskId === l.id;

                    return (
                      <div
                        id={`task-card-${l.id}`}
                        key={l.id}
                        className={`card-hover rounded-2xl bg-surface p-5 shadow-[var(--shadow-card)] border transition-all ${
                          isHighlighted
                            ? "border-brand-600 ring-2 ring-brand-600/60"
                            : "border-white/5"
                        }`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-mono text-xs font-bold text-brand-600">{l.id}</p>
                              {hasBukti && st !== "resolved" && (
                                <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-bold text-amber-500 border border-amber-500/30">
                                  Menunggu Verifikasi Dinas
                                </span>
                              )}
                              {st === "resolved" && (
                                <span className="rounded-full bg-success-bg px-2.5 py-0.5 text-[10px] font-bold text-success border border-success/30">
                                  Diverifikasi Selesai oleh Dinas
                                </span>
                              )}
                            </div>
                            <h3 className="mt-1 font-display text-lg font-bold text-cream">{l.judul}</h3>
                            <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-500">
                              <MapPin size={12} /> {l.lokasi.alamat}
                            </p>
                          </div>
                          <Chip tone={statusTone(st)}>{STATUS_LABEL[st]}</Chip>
                        </div>

                        {/* Foto Bukti Pelapor (Warga) */}
                        <div className="mt-3.5 rounded-xl border border-ink-300/30 bg-ground/40 p-3">
                          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-ink-500">
                            <Camera size={13} className="text-brand-600" /> Foto Laporan Kerusakan Awal (Warga)
                            <span className="ml-auto font-normal normal-case text-ink-400">
                              {fotoUrls.length} foto
                            </span>
                          </p>
                          <div className="flex flex-wrap items-center gap-2">
                            {fotoUrls.map((url, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setLightboxFoto(url)}
                                className="group relative h-20 w-24 shrink-0 overflow-hidden rounded-xl border border-ink-300/40 bg-surface transition-all hover:border-brand-600 hover:shadow-md focus:outline-none"
                              >
                                <img
                                  src={url}
                                  alt={`Foto Laporan ${idx + 1}`}
                                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/35">
                                  <Camera size={16} className="text-white opacity-0 transition-opacity group-hover:opacity-100" />
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Foto Bukti Penanganan Petugas jika sudah diupload */}
                        {hasBukti && (
                          <div className="mt-3 rounded-xl border border-brand-600/30 bg-brand-600/10 p-3">
                            <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-brand-500">
                              <CheckCircle2 size={13} /> Foto Bukti Hasil Penanganan (Petugas)
                              <span className="ml-auto font-normal normal-case text-ink-400">
                                {bukti.fotoUrls.length} foto terlampir
                              </span>
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                              {bukti.fotoUrls.map((url, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => setLightboxFoto(url)}
                                  className="group relative h-20 w-24 shrink-0 overflow-hidden rounded-xl border border-brand-600/40 bg-surface transition-all hover:border-brand-600 hover:shadow-md focus:outline-none"
                                >
                                  <img
                                    src={url}
                                    alt={`Bukti Penanganan ${idx + 1}`}
                                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                  />
                                </button>
                              ))}
                            </div>
                            {bukti.catatan && (
                              <p className="mt-2 text-xs text-cream-hi">
                                <span className="font-bold text-brand-500">Catatan Tindakan:</span> {bukti.catatan}
                              </p>
                            )}
                          </div>
                        )}

                        <div className="mt-4 grid gap-3 sm:grid-cols-3">
                          <div className="rounded-xl bg-brand-50/70 dark:bg-ground/60 p-3 border border-ink-300/20">
                            <p className="text-[11px] font-bold uppercase text-ink-500">Kategori</p>
                            <p className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold" style={{ color: k.warna }}>
                              <span className="h-2 w-2 rounded-full" style={{ background: k.warna }} /> {k.nama}
                            </p>
                          </div>
                          <div className="rounded-xl bg-brand-50/70 dark:bg-ground/60 p-3 border border-ink-300/20">
                            <p className="text-[11px] font-bold uppercase text-ink-500">Skor Urgensi</p>
                            <p className="mt-0.5 text-sm font-extrabold" style={{ color: priorityColor(l.ai.priorityScore) }}>
                              {l.ai.priorityScore} / 10
                            </p>
                          </div>
                          <div className="rounded-xl bg-brand-50/70 dark:bg-ground/60 p-3 border border-ink-300/20">
                            <p className="text-[11px] font-bold uppercase text-ink-500">Estimasi SLA</p>
                            <p className="mt-0.5 text-sm font-extrabold text-cream">{l.sla}</p>
                          </div>
                        </div>

                        {/* Tombol Aksi Lapangan */}
                        <div className="mt-4 flex flex-wrap items-center gap-2 pt-2 border-t border-ink-300/30">
                          <button
                            onClick={() => handleNavigateMaps(l.lokasi.lat, l.lokasi.lng)}
                            className="btn-anim inline-flex items-center gap-1.5 rounded-xl border border-ink-300 px-4 py-2.5 text-sm font-semibold text-ink-700 transition-colors hover:border-brand-600 hover:text-cream"
                          >
                            <Navigation size={16} /> Menuju Lokasi (Maps)
                          </button>

                          {st === "assigned" && (
                            <button
                              onClick={() => handleStartHandling(l)}
                              className="btn-anim inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 shadow-md"
                            >
                              <PlayCircle size={16} /> Mulai Penanganan
                            </button>
                          )}

                          {st === "in_progress" && (
                            <button
                              onClick={() => handleOpenUploadModal(l)}
                              className="btn-anim inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-700 shadow-md"
                            >
                              <Camera size={16} /> {hasBukti ? "Ubah / Tambah Foto Bukti" : "Form Upload Bukti (Kirim ke Dinas)"}
                            </button>
                          )}

                          {st === "resolved" && (
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1.5 rounded-xl bg-success-bg px-4 py-2 text-xs font-bold text-success border border-success/30">
                                <CheckCircle2 size={15} /> Telah Diverifikasi Selesai oleh Dinas
                              </span>
                              <button
                                onClick={() => handleOpenUploadModal(l)}
                                className="inline-flex items-center gap-1 text-xs text-ink-500 hover:text-brand-600 underline ml-2"
                              >
                                Lihat Bukti
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Pagination Controls */}
              {filteredTasks.length > 0 && (
                <div className="flex items-center justify-between border-t border-ink-300/40 pt-4 text-xs font-semibold">
                  <span className="text-ink-500">
                    Halaman <span className="font-bold text-cream">{currentPage}</span> dari{" "}
                    <span className="font-bold text-cream">{totalPages}</span>
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                      disabled={currentPage === 1}
                      className="inline-flex items-center gap-1 rounded-xl border border-ink-300/60 px-3 py-1.5 text-ink-700 transition-colors hover:border-brand-600 hover:text-cream disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronLeft size={16} /> Sebelumnya
                    </button>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="inline-flex items-center gap-1 rounded-xl border border-ink-300/60 px-3 py-1.5 text-ink-700 transition-colors hover:border-brand-600 hover:text-cream disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Selanjutnya <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </section>

            {/* MODAL FORM UPLOAD BUKTI PENANGANAN (INTERAKTIF & REAL FILE UPLOAD) */}
            {modalTask && (
              <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                <div
                  className="absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
                  onClick={() => !isSubmittingBukti && setModalTask(null)}
                />
                <div className="anim-fade-up relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/15 bg-surface p-6 shadow-2xl md:p-8">
                  {/* Header Modal */}
                  <div className="flex items-start justify-between gap-4 border-b border-ink-300/30 pb-4">
                    <div>
                      <span className="font-mono text-xs font-extrabold text-brand-600">{modalTask.id}</span>
                      <h3 className="mt-1 font-display text-xl font-extrabold text-cream">Form Bukti Hasil Penanganan</h3>
                      <p className="mt-0.5 text-xs text-ink-500">{modalTask.judul}</p>
                    </div>
                    <button
                      onClick={() => !isSubmittingBukti && setModalTask(null)}
                      disabled={isSubmittingBukti}
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-ink-300/50 text-ink-500 transition-colors hover:bg-brand-50 hover:text-cream disabled:opacity-40"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Form Body */}
                  <div className="mt-5 space-y-5">
                    {/* Foto Laporan Warga untuk Acuan Petugas */}
                    <div className="rounded-2xl border border-ink-300/40 bg-ground/50 p-3.5">
                      <label className="mb-2 flex items-center gap-1.5 text-xs font-bold text-ink-500 uppercase tracking-wider">
                        <Camera size={14} className="text-brand-600" /> Referensi Foto Kerusakan Awal (Warga)
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {getFotoUrls(modalTask).map((url, i) => (
                          <img
                            key={i}
                            src={url}
                            onClick={() => setLightboxFoto(url)}
                            alt={`Referensi foto ${i + 1}`}
                            className="h-20 w-28 rounded-xl object-cover border border-ink-300/40 cursor-pointer transition-transform hover:scale-105"
                          />
                        ))}
                      </div>
                    </div>

                    {/* Unggah Foto Hasil Penanganan (Input File Asli) */}
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <label className="flex items-center gap-1.5 text-sm font-semibold text-cream">
                          <Camera size={15} className="text-brand-600" /> Unggah Foto Bukti Hasil Perbaikan
                        </label>
                        <span className="text-xs text-ink-500">{modalPreviews.length} / 5 foto</span>
                      </div>

                      {/* Hidden native input */}
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        multiple
                        onChange={handleFilesSelected}
                        className="hidden"
                      />

                      {/* Dropzone / Upload button area */}
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="grid cursor-pointer place-items-center rounded-2xl border-2 border-dashed border-brand-600/50 bg-brand-50/20 hover:bg-brand-50/40 dark:bg-brand-900/10 dark:hover:bg-brand-900/20 p-6 text-center transition-all hover:border-brand-600 hover:shadow-md"
                      >
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-600/10 text-brand-600 mb-2">
                          <Upload size={24} />
                        </div>
                        <p className="text-sm font-bold text-cream">Klik di sini untuk memilih foto bukti</p>
                        <p className="mt-1 text-xs text-ink-500">Dukung format JPG, PNG (maksimal 5 foto bukti)</p>
                      </div>

                      {/* Preview Thumbnails */}
                      {modalPreviews.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2.5">
                          {modalPreviews.map((url, idx) => (
                            <div key={idx} className="relative group h-20 w-24 rounded-xl overflow-hidden border border-brand-600/40 shadow-sm">
                              <img src={url} alt={`Bukti preview ${idx + 1}`} className="h-full w-full object-cover" />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeModalPhoto(idx);
                                }}
                                className="absolute top-1 right-1 grid h-6 w-6 place-items-center rounded-full bg-danger text-white shadow hover:scale-110 transition-transform"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Catatan Penanganan */}
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-cream">
                        Catatan / Deskripsi Penanganan Lapangan
                      </label>
                      <textarea
                        className="w-full min-h-[100px] rounded-xl border border-ink-300 bg-surface px-4 py-3 text-sm text-cream outline-none transition-colors placeholder:text-ink-500 focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
                        placeholder="Contoh: Perbaikan jalan berlubang telah ditambal dengan aspal hotmix dan diratakan. Aliran drainase telah dinormalisasi…"
                        value={modalCatatan}
                        onChange={(e) => setModalCatatan(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Modal Actions */}
                  <div className="mt-6 flex items-center justify-end gap-3 border-t border-ink-300/30 pt-4">
                    <button
                      type="button"
                      disabled={isSubmittingBukti}
                      onClick={() => setModalTask(null)}
                      className="rounded-xl border border-ink-300/60 px-4 py-2.5 text-sm font-semibold text-ink-700 transition-colors hover:border-brand-600 hover:text-cream disabled:opacity-40"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      disabled={isSubmittingBukti}
                      onClick={handleSaveBuktiAndSubmit}
                      className="btn-anim inline-flex items-center gap-2 rounded-xl bg-success px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-700 shadow-md disabled:opacity-50"
                    >
                      {isSubmittingBukti ? (
                        <>
                          <Loader2 size={16} className="animate-spin" /> Mengirim Bukti ke Dinas…
                        </>
                      ) : (
                        <>
                          <Upload size={16} /> Simpan &amp; Kirim ke Dinas
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* MODAL LIGHTBOX OVERLAY PREVIEW FOTO */}
            {lightboxFoto && (
              <div
                className="fixed inset-0 z-[300] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md transition-opacity"
                onClick={() => setLightboxFoto(null)}
              >
                <div className="relative max-h-[90vh] max-w-4xl overflow-hidden rounded-2xl border border-white/20 bg-surface p-2 shadow-2xl">
                  <img
                    src={lightboxFoto}
                    alt="Pratinjau foto bukti"
                    className="max-h-[82vh] w-auto rounded-xl object-contain"
                  />
                  <button
                    onClick={() => setLightboxFoto(null)}
                    className="absolute top-4 right-4 grid h-10 w-10 place-items-center rounded-full bg-black/70 text-white transition-colors hover:bg-black"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </RequireAuth>
  );
}

