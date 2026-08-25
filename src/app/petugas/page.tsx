"use client";

import { useState, useMemo } from "react";
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
} from "lucide-react";

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
  const { laporanWarga, tambahNotif } = useApp();

  // Local states
  const [statusMap, setStatusMap] = useState<Record<string, StatusId>>({});
  const [buktiMap, setBuktiMap] = useState<Record<string, { foto: number; catatan: string }>>({});

  // Navigation & Search/Filter states
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [kategoriFilter, setKategoriFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [showMap, setShowMap] = useState(true);

  // Modal Upload Form state
  const [modalTask, setModalTask] = useState<Laporan | null>(null);
  const [modalFoto, setModalFoto] = useState(1);
  const [modalCatatan, setModalCatatan] = useState("");

  function updateStatus(id: string, s: StatusId, judul: string) {
    setStatusMap((m) => ({ ...m, [id]: s }));
    tambahNotif({
      judul: s === "in_progress" ? "Penanganan Dimulai" : "Penanganan Selesai",
      pesan: `${id} — ${judul}`,
      waktu: "Baru saja",
      tone: s === "resolved" ? "success" : "warning",
    });
  }

  // Filtered task list
  const allPetugasTasks = useMemo(() => {
    return laporanWarga.map((l) => ({
      ...l,
      effectiveStatus: statusMap[l.id] ?? l.status,
    }));
  }, [laporanWarga, statusMap]);

  const filteredTasks = useMemo(() => {
    return allPetugasTasks.filter((t) => {
      // Must be assigned, in_progress, or recently updated by officer
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
    const existing = buktiMap[task.id];
    setModalTask(task);
    setModalFoto(existing?.foto ?? 1);
    setModalCatatan(existing?.catatan ?? "");
  }

  function handleSaveBuktiAndSubmit() {
    if (!modalTask) return;
    setBuktiMap((b) => ({
      ...b,
      [modalTask.id]: { foto: modalFoto, catatan: modalCatatan },
    }));
    updateStatus(modalTask.id, "resolved", modalTask.judul);
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
              Dashboard <span className="text-brand-600">Petugas</span>
            </h1>
            <p className="mt-1 text-sm text-ink-500">
              Kelola tugas penanganan di lapangan, navigasi lokasi, dan kirim bukti penyelesaian.
            </p>
          </div>
          <button
            onClick={() => setShowMap((v) => !v)}
            className="btn-anim inline-flex items-center gap-2 rounded-xl border border-ink-300 bg-surface px-4 py-2.5 text-sm font-semibold text-ink-700 shadow-sm transition-colors hover:border-brand-600 hover:text-cream"
          >
            <MapIcon size={16} /> {showMap ? "Sembunyikan Peta" : "Tampilkan Peta"}
          </button>
        </div>

        {/* Ringkasan Statistik */}
        <div className="anim-fade-up mb-6 grid grid-cols-2 gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-surface p-5 shadow-[var(--shadow-card)]">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Tugas Aktif</p>
            <p className="mt-1 font-display text-3xl font-extrabold">{activeCount}</p>
          </div>
          <div className="rounded-2xl bg-surface p-5 shadow-[var(--shadow-card)]">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Dalam Proses</p>
            <p className="mt-1 font-display text-3xl font-extrabold text-amber-600">{inProgressCount}</p>
          </div>
          <div className="rounded-2xl bg-surface p-5 shadow-[var(--shadow-card)]">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Selesai Ditangani</p>
            <p className="mt-1 font-display text-3xl font-extrabold text-success">{resolvedCount}</p>
          </div>
        </div>

        {/* Peta Interaktif Lokasi Tugas */}
        {showMap && (
          <section className="anim-fade-up mb-8">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-display text-lg font-bold">
                <MapIcon size={18} className="text-brand-600" /> Peta Lokasi Tugas Field
              </h2>
            </div>
            <div className="overflow-hidden rounded-2xl border border-white/10 shadow-[var(--shadow-card)]">
              <AdminMap height={340} />
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
              <option value="assigned">Ditugaskan</option>
              <option value="in_progress">Diproses</option>
              <option value="resolved">Selesai</option>
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
            <div className="max-h-[580px] overflow-y-auto pr-1.5 space-y-4 custom-scrollbar">
              {currentTasks.map((l) => {
                const k = getKategori(l.kategori);
                const st = l.effectiveStatus;
                const dataBukti = buktiMap[l.id];
                const fotoBukti = dataBukti?.foto ?? 0;

                return (
                  <div
                    key={l.id}
                    className="card-hover rounded-2xl bg-surface p-5 shadow-[var(--shadow-card)] border border-white/5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-mono text-xs font-bold text-ink-500">{l.id}</p>
                          {dataBukti?.catatan && (
                            <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-700">
                              Ada Catatan Bukti
                            </span>
                          )}
                        </div>
                        <h3 className="mt-1 font-display text-lg font-bold">{l.judul}</h3>
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-500">
                          <MapPin size={12} /> {l.lokasi.alamat}
                        </p>
                      </div>
                      <Chip tone={statusTone(st)}>{STATUS_LABEL[st]}</Chip>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-xl bg-brand-50/70 p-3">
                        <p className="text-[11px] font-bold uppercase text-ink-500">Kategori</p>
                        <p className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold" style={{ color: k.warna }}>
                          <span className="h-2 w-2 rounded-full" style={{ background: k.warna }} /> {k.nama}
                        </p>
                      </div>
                      <div className="rounded-xl bg-brand-50/70 p-3">
                        <p className="text-[11px] font-bold uppercase text-ink-500">Skor Urgensi</p>
                        <p className="mt-0.5 text-sm font-extrabold" style={{ color: priorityColor(l.ai.priorityScore) }}>
                          {l.ai.priorityScore} / 10
                        </p>
                      </div>
                      <div className="rounded-xl bg-brand-50/70 p-3">
                        <p className="text-[11px] font-bold uppercase text-ink-500">Estimasi SLA</p>
                        <p className="mt-0.5 text-sm font-extrabold">{l.sla}</p>
                      </div>
                    </div>

                    {/* Catatan Bukti Penanganan jika ada */}
                    {dataBukti?.catatan && (
                      <div className="mt-3 rounded-xl bg-ground/60 p-3 text-xs border border-ink-300/30">
                        <span className="font-bold text-brand-600">Catatan Hasil Penanganan:</span>{" "}
                        <span className="text-ink-700">{dataBukti.catatan}</span>
                      </div>
                    )}

                    {/* Tombol Aksi */}
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => handleNavigateMaps(l.lokasi.lat, l.lokasi.lng)}
                        className="btn-anim inline-flex items-center gap-1.5 rounded-xl border border-ink-300 px-4 py-2.5 text-sm font-semibold text-ink-700 transition-colors hover:border-brand-600 hover:text-brand-600"
                      >
                        <Navigation size={16} /> Menuju Lokasi (Maps)
                      </button>

                      {st !== "in_progress" && st !== "resolved" && (
                        <button
                          onClick={() => updateStatus(l.id, "in_progress", l.judul)}
                          className="btn-anim inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-600"
                        >
                          <PlayCircle size={16} /> Mulai Penanganan
                        </button>
                      )}

                      {st === "in_progress" && (
                        <button
                          onClick={() => handleOpenUploadModal(l)}
                          className="btn-anim inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
                        >
                          <Camera size={16} /> Form Upload Bukti {fotoBukti > 0 ? `(${fotoBukti})` : ""}
                        </button>
                      )}

                      {st === "resolved" && (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 rounded-xl bg-success-bg px-4 py-2.5 text-sm font-semibold text-success">
                            <CheckCircle2 size={16} /> Selesai & Terkirim ke Admin
                          </span>
                          <button
                            onClick={() => handleOpenUploadModal(l)}
                            className="inline-flex items-center gap-1 text-xs text-ink-500 hover:text-brand-600 underline"
                          >
                            Edit Bukti
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

        {/* MODAL FORM UPLOAD BUKTI PENANGANAN */}
        {modalTask && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/65 backdrop-blur-sm transition-opacity"
              onClick={() => setModalTask(null)}
            />
            <div className="anim-fade-up relative w-full max-w-lg rounded-3xl border border-white/15 bg-surface p-6 shadow-2xl md:p-8">
              {/* Header Modal */}
              <div className="flex items-start justify-between gap-4 border-b border-ink-300/30 pb-4">
                <div>
                  <span className="font-mono text-xs font-extrabold text-brand-600">{modalTask.id}</span>
                  <h3 className="mt-1 font-display text-xl font-extrabold text-cream">Form Bukti Penanganan</h3>
                  <p className="mt-0.5 text-xs text-ink-500">{modalTask.judul}</p>
                </div>
                <button
                  onClick={() => setModalTask(null)}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-ink-300/50 text-ink-500 transition-colors hover:bg-brand-50 hover:text-cream"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form Body */}
              <div className="mt-5 space-y-5">
                {/* Upload Foto Simulasi */}
                <div>
                  <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-cream">
                    <Camera size={15} className="text-brand-600" /> Unggah Foto Bukti Lapangan
                  </label>
                  <div
                    onClick={() => setModalFoto((f) => Math.min(f + 1, 5))}
                    className="grid cursor-pointer place-items-center rounded-xl border-2 border-dashed border-ink-300 bg-brand-50/40 p-6 text-center transition-colors hover:border-brand-600"
                  >
                    <Camera size={26} className="text-ink-400" />
                    <p className="mt-2 text-xs font-semibold text-cream">Klik untuk simulasi upload foto bukti</p>
                    <p className="text-[11px] text-ink-500">{modalFoto} foto terlampir (maks 5)</p>
                  </div>
                </div>

                {/* Catatan Penanganan */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-cream">
                    Catatan / Deskripsi Penanganan
                  </label>
                  <textarea
                    className="w-full min-h-[100px] rounded-xl border border-ink-300 bg-surface px-4 py-3 text-sm text-cream outline-none transition-colors placeholder:text-ink-500 focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
                    placeholder="Tuliskan tindakan perbaikan yang telah dilakukan di lokasi…"
                    value={modalCatatan}
                    onChange={(e) => setModalCatatan(e.target.value)}
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="mt-6 flex items-center justify-end gap-3 border-t border-ink-300/30 pt-4">
                <button
                  onClick={() => setModalTask(null)}
                  className="rounded-xl border border-ink-300/60 px-4 py-2.5 text-sm font-semibold text-ink-700 transition-colors hover:border-brand-600 hover:text-cream"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveBuktiAndSubmit}
                  className="btn-anim inline-flex items-center gap-2 rounded-xl bg-success px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-700"
                >
                  <Upload size={16} /> Simpan & Kirim ke Admin
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </RequireAuth>
  );
}

