"use client";

import { useEffect, useMemo, useState } from "react";
import { Sidebar, type DashboardView } from "@/components/Sidebar";
import { Chip } from "@/components/Chip";
import { Reveal } from "@/components/Reveal";
import ProfileClient from "../profil/ProfileClient";
import {
  WILAYAH,
  KEGIATAN,
  KEGIATAN_LABEL,
  KATEGORI,
  STATUS_LABEL_ID,
  getFotoUrls,
  type Kegiatan,
  type KegiatanTipe,
  type WilayahId,
  type KategoriId,
  type StatusId,
  type Laporan,
} from "@/lib/data";
import {
  Users,
  Building2,
  HardHat,
  UserRound,
  Search,
  Filter,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Activity,
  CheckCircle2,
  BadgeCheck,
  UserCheck,
  Wrench,
  FilePlus2,
  MapPin,
  Shield,
  X,
  UserPlus,
  Camera,
  Edit,
  Pencil,
  FileText,
  AlertTriangle,
  Clock,
  ExternalLink,
  Sparkles,
  Check,
  RefreshCw,
} from "lucide-react";
import { useApp, type Role, type UserRecord } from "@/lib/store";

const TIPE_META: Record<KegiatanTipe, { icon: any; cls: string }> = {
  baru: { icon: FilePlus2, cls: "bg-info-bg text-info" },
  verifikasi: { icon: BadgeCheck, cls: "bg-brand-100 text-brand-600" },
  penugasan: { icon: UserCheck, cls: "bg-warning-bg text-warning" },
  penanganan: { icon: Wrench, cls: "bg-warning-bg text-warning" },
  selesai: { icon: CheckCircle2, cls: "bg-success-bg text-success" },
};

const STATUS_BADGE_STYLE: Record<StatusId, string> = {
  reported: "bg-info-bg text-info border-info/30",
  verified: "bg-brand-50 text-brand-600 border-brand-600/30",
  assigned: "bg-warning-bg text-warning border-warning/30",
  in_progress: "bg-amber-500/10 text-amber-500 border-amber-500/30",
  resolved: "bg-success-bg text-success border-success/30",
};

export default function DashboardClient() {
  const [view, setView] = useState<DashboardView>("pengguna");
  const {
    daftarUser,
    tambahUser,
    updateUserRecord,
    hapusUser,
    ubahStatusUser,
    laporanWarga,
    tambahLaporan,
    updateLaporan,
    hapusLaporan,
  } = useApp();

  const [toast, setToast] = useState<{ type: "success" | "danger" | "info"; msg: string } | null>(null);

  const showToast = (msg: string, type: "success" | "danger" | "info" = "success") => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [view]);

  // ==========================================
  // STATE MANAJEMEN USER
  // ==========================================
  const [roleTab, setRoleTab] = useState<Role | "semua">("dinas");
  const [userSearch, setUserSearch] = useState("");
  const [userStatusFilter, setUserStatusFilter] = useState<"semua" | "aktif" | "nonaktif">("semua");
  const [userWilayahFilter, setUserWilayahFilter] = useState<"semua" | WilayahId>("semua");

  // State Modal Tambah User
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newNama, setNewNama] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<Role>("dinas");
  const [newWilayah, setNewWilayah] = useState<WilayahId>("sleman");
  const [newTelepon, setNewTelepon] = useState("");
  const [newAlamat, setNewAlamat] = useState("");

  // State Modal Edit User
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [editNama, setEditNama] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState<Role>("dinas");
  const [editWilayah, setEditWilayah] = useState<WilayahId | "">("");
  const [editTelepon, setEditTelepon] = useState("");
  const [editAlamat, setEditAlamat] = useState("");

  // State Modal Hapus User
  const [userToDelete, setUserToDelete] = useState<UserRecord | null>(null);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return daftarUser.filter((u) => {
      const matchRole = roleTab === "semua" || u.role === roleTab;
      const matchSearch =
        u.nama.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase());
      const matchStatus =
        userStatusFilter === "semua"
          ? true
          : userStatusFilter === "aktif"
          ? u.aktif
          : !u.aktif;
      const matchWilayah =
        userWilayahFilter === "semua" || u.wilayah === userWilayahFilter;

      return matchRole && matchSearch && matchStatus && matchWilayah;
    });
  }, [daftarUser, roleTab, userSearch, userStatusFilter, userWilayahFilter]);

  const countDinasTotal = daftarUser.filter((u) => u.role === "dinas").length;
  const countDinasAktif = daftarUser.filter((u) => u.role === "dinas" && u.aktif).length;

  const countPetugasTotal = daftarUser.filter((u) => u.role === "petugas").length;
  const countPetugasAktif = daftarUser.filter((u) => u.role === "petugas" && u.aktif).length;

  const countWargaTotal = daftarUser.filter((u) => u.role === "warga").length;
  const countWargaAktif = daftarUser.filter((u) => u.role === "warga" && u.aktif).length;

  const countUserTotal = daftarUser.length;
  const countUserAktif = daftarUser.filter((u) => u.aktif).length;

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNama || !newEmail) return;
    const result = await tambahUser({
      nama: newNama,
      email: newEmail,
      role: newRole,
      wilayah: newRole === "dinas" ? newWilayah : undefined,
      telepon: newTelepon || undefined,
      alamat: newAlamat || undefined,
      aktif: true,
    });
    if (result.error) {
      showToast(`Gagal menambahkan pengguna: ${result.error}`, "danger");
      return;
    }
    setNewNama("");
    setNewEmail("");
    setNewTelepon("");
    setNewAlamat("");
    setShowAddUserModal(false);
    showToast(`Pengguna ${newNama} berhasil ditambahkan.`);
  };

  const handleOpenEditUser = (u: UserRecord) => {
    setEditingUser(u);
    setEditNama(u.nama);
    setEditEmail(u.email);
    setEditRole(u.role);
    setEditWilayah(u.wilayah || "");
    setEditTelepon(u.telepon || "");
    setEditAlamat(u.alamat || "");
    setShowEditUserModal(true);
  };

  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    updateUserRecord(editingUser.id, {
      nama: editNama,
      email: editEmail,
      role: editRole,
      wilayah: editRole === "dinas" ? (editWilayah as WilayahId) : undefined,
      telepon: editTelepon || undefined,
      alamat: editAlamat || undefined,
    });
    setShowEditUserModal(false);
    setEditingUser(null);
    showToast(`Perubahan berhasil disimpan.`);
  };

  const handleConfirmDeleteUser = () => {
    if (!userToDelete) return;
    hapusUser(userToDelete.id);
    showToast(`Pengguna berhasil dihapus.`, "danger");
    setUserToDelete(null);
  };

  // ==========================================
  // STATE MANAJEMEN LAPORAN & INFRASTRUKTUR
  // ==========================================
  const [laporanSearch, setLaporanSearch] = useState("");
  const [laporanStatusFilter, setLaporanStatusFilter] = useState<"semua" | StatusId>("semua");
  const [laporanKategoriFilter, setLaporanKategoriFilter] = useState<"semua" | KategoriId>("semua");
  const [laporanWilayahFilter, setLaporanWilayahFilter] = useState<"semua" | WilayahId>("semua");

  // State Modal Tambah Laporan
  const [showAddLaporanModal, setShowAddLaporanModal] = useState(false);
  const [newLapJudul, setNewLapJudul] = useState("");
  const [newLapKategori, setNewLapKategori] = useState<KategoriId>("jalan");
  const [newLapWilayah, setNewLapWilayah] = useState<WilayahId>("sleman");
  const [newLapAlamat, setNewLapAlamat] = useState("");
  const [newLapPelapor, setNewLapPelapor] = useState("Admin");
  const [newLapSla, setNewLapSla] = useState("48 jam");
  const [newLapSeverity, setNewLapSeverity] = useState(7);
  const [newLapFotoUrl, setNewLapFotoUrl] = useState("https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600");

  // State Modal Edit Laporan
  const [showEditLaporanModal, setShowEditLaporanModal] = useState(false);
  const [editingLaporan, setEditingLaporan] = useState<Laporan | null>(null);
  const [editLapJudul, setEditLapJudul] = useState("");
  const [editLapKategori, setEditLapKategori] = useState<KategoriId>("jalan");
  const [editLapStatus, setEditLapStatus] = useState<StatusId>("reported");
  const [editLapWilayah, setEditLapWilayah] = useState<WilayahId>("sleman");
  const [editLapAlamat, setEditLapAlamat] = useState("");
  const [editLapSla, setEditLapSla] = useState("48 jam");
  const [editLapSeverity, setEditLapSeverity] = useState(7);
  const [editLapPriority, setEditLapPriority] = useState(7);
  const [editLapDampak, setEditLapDampak] = useState("");

  // State Modal Hapus Laporan
  const [laporanToDelete, setLaporanToDelete] = useState<Laporan | null>(null);

  // Filtered Laporan
  const filteredLaporan = useMemo(() => {
    return laporanWarga.filter((l) => {
      const matchSearch =
        l.id.toLowerCase().includes(laporanSearch.toLowerCase()) ||
        l.judul.toLowerCase().includes(laporanSearch.toLowerCase()) ||
        l.pelapor.toLowerCase().includes(laporanSearch.toLowerCase()) ||
        l.lokasi.alamat.toLowerCase().includes(laporanSearch.toLowerCase());
      const matchStatus = laporanStatusFilter === "semua" || l.status === laporanStatusFilter;
      const matchKategori = laporanKategoriFilter === "semua" || l.kategori === laporanKategoriFilter;
      const matchWilayah = laporanWilayahFilter === "semua" || l.wilayah === laporanWilayahFilter;

      return matchSearch && matchStatus && matchKategori && matchWilayah;
    });
  }, [laporanWarga, laporanSearch, laporanStatusFilter, laporanKategoriFilter, laporanWilayahFilter]);

  const countReported = laporanWarga.filter((l) => l.status === "reported").length;
  const countVerified = laporanWarga.filter((l) => l.status === "verified").length;
  const countInProgress = laporanWarga.filter((l) => l.status === "assigned" || l.status === "in_progress").length;
  const countResolved = laporanWarga.filter((l) => l.status === "resolved").length;

  const handleCreateLaporan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLapJudul || !newLapAlamat) return;

    const newId = `SGP-2026-${String(Math.floor(1000 + Math.random() * 9000))}`;
    const newLap: Laporan = {
      id: newId,
      judul: newLapJudul,
      kategori: newLapKategori,
      lokasi: { lat: -7.7825, lng: 110.366, alamat: newLapAlamat },
      pelapor: newLapPelapor || "Admin",
      waktu: new Date().toISOString(),
      status: "reported",
      foto: 1,
      fotoUrls: newLapFotoUrl ? [newLapFotoUrl] : ["https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600"],
      dukungan: 0,
      sla: newLapSla,
      wilayah: newLapWilayah,
      ai: {
        kategori: KATEGORI.find((k) => k.id === newLapKategori)?.nama || "Jalan",
        confidence: 0.95,
        severity: newLapSeverity,
        dampak: "Analisis Admin SIGAP",
        priorityScore: newLapSeverity,
        modelUsed: "Admin Input",
      },
    };

    tambahLaporan(newLap);
    setNewLapJudul("");
    setNewLapAlamat("");
    setShowAddLaporanModal(false);
    showToast(`Laporan berhasil dibuat.`);
  };

  const handleOpenEditLaporan = (l: Laporan) => {
    setEditingLaporan(l);
    setEditLapJudul(l.judul);
    setEditLapKategori(l.kategori);
    setEditLapStatus(l.status);
    setEditLapWilayah(l.wilayah);
    setEditLapAlamat(l.lokasi.alamat);
    setEditLapSla(l.sla);
    setEditLapSeverity(l.ai.severity);
    setEditLapPriority(l.ai.priorityScore);
    setEditLapDampak(l.ai.dampak);
    setShowEditLaporanModal(true);
  };

  const handleSaveEditLaporan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLaporan) return;

    updateLaporan(editingLaporan.id, {
      judul: editLapJudul,
      kategori: editLapKategori,
      status: editLapStatus,
      wilayah: editLapWilayah,
      sla: editLapSla,
      lokasi: { ...editingLaporan.lokasi, alamat: editLapAlamat },
      ai: {
        ...editingLaporan.ai,
        severity: Number(editLapSeverity),
        priorityScore: Number(editLapPriority),
        dampak: editLapDampak,
      },
    });

    setShowEditLaporanModal(false);
    setEditingLaporan(null);
    showToast(`Laporan berhasil diperbarui.`);
  };

  const handleConfirmDeleteLaporan = () => {
    if (!laporanToDelete) return;
    hapusLaporan(laporanToDelete.id);
    showToast(`Laporan berhasil dihapus.`, "danger");
    setLaporanToDelete(null);
  };

  // ==========================================
  // STATE LOG KESELURUHAN DATA
  // ==========================================
  const [logSearch, setLogSearch] = useState("");
  const [logWilayahFilter, setLogWilayahFilter] = useState<"semua" | WilayahId>("semua");
  const [logTipeFilter, setLogTipeFilter] = useState<"semua" | KegiatanTipe>("semua");
  const [logHariFilter, setLogHariFilter] = useState<string>("2026-01-15");

  const allLogsWithMeta = useMemo(() => {
    const rawList = KEGIATAN[logHariFilter] ?? [];
    return rawList.map((k) => {
      const lap = laporanWarga.find((l) => l.id === k.laporanId);
      return {
        ...k,
        laporanObj: lap,
        wilayah: lap?.wilayah ?? "sleman",
        judulLaporan: lap?.judul ?? "Laporan",
      };
    });
  }, [logHariFilter, laporanWarga]);

  const filteredLogs = useMemo(() => {
    return allLogsWithMeta.filter((log) => {
      const matchSearch =
        log.laporanId.toLowerCase().includes(logSearch.toLowerCase()) ||
        log.aktor.toLowerCase().includes(logSearch.toLowerCase()) ||
        (log.catatan ?? "").toLowerCase().includes(logSearch.toLowerCase());
      const matchWilayah = logWilayahFilter === "semua" || log.wilayah === logWilayahFilter;
      const matchTipe = logTipeFilter === "semua" || log.tipe === logTipeFilter;
      return matchSearch && matchWilayah && matchTipe;
    });
  }, [allLogsWithMeta, logSearch, logWilayahFilter, logTipeFilter]);

  return (
    <div className="grid min-h-[calc(100vh-var(--nav-h))] w-full grid-cols-1 lg:grid-cols-[240px_1fr]">
      <Sidebar view={view} onChange={setView} />

      <main className="w-full max-w-none p-3.5 sm:p-6 md:p-8 bg-ground relative">
        {/* TOAST FEEDBACK */}
        {toast && (
          <div
            className={`fixed bottom-6 right-6 z-[300] flex items-center gap-3 rounded-2xl border px-4 py-3 text-xs font-bold text-white shadow-2xl anim-fade-up ${
              toast.type === "danger"
                ? "border-red-500/40 bg-red-950/90 text-red-200"
                : toast.type === "info"
                ? "border-blue-500/40 bg-blue-950/90 text-blue-200"
                : "border-emerald-500/40 bg-emerald-950/90 text-emerald-200"
            }`}
          >
            <CheckCircle2 size={16} />
            <span>{toast.msg}</span>
          </div>
        )}

        {/* VIEW 1: MANAJEMEN USER (CRUD) */}
        {view === "pengguna" && (
          <Reveal>
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ink-300/40 pb-5">
                <div>
                  <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-extrabold text-cream-hi flex items-center gap-2.5">
                    <Users className="text-brand-600 shrink-0" /> Manajemen Pengguna
                  </h1>
                  <p className="mt-1 text-xs sm:text-sm text-ink-500">
                    Kelola akun dan hak akses dinas serta petugas.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddUserModal(true)}
                  className="btn-anim inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-brand-700 shrink-0"
                >
                  <UserPlus size={16} /> Tambah Pengguna
                </button>
              </div>

              {/* Summary Cards (Aktif | Total) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <div
                  onClick={() => setRoleTab("dinas")}
                  className={`card-hover cursor-pointer rounded-2xl border p-4 transition-all ${
                    roleTab === "dinas" ? "border-brand-600 bg-brand-50/20" : "border-ink-300/40 bg-surface"
                  }`}
                >
                  <p className="text-xs font-bold text-ink-500 flex items-center justify-between gap-1.5">
                    <span className="flex items-center gap-1.5"><Building2 size={14} className="text-brand-600" /> Dinas</span>
                    <span className="text-[10px] text-ink-500 font-normal">Aktif | Total</span>
                  </p>
                  <p className="font-display text-2xl font-extrabold text-cream mt-1 flex items-baseline gap-1.5">
                    <span>{countDinasAktif}</span>
                    <span className="text-base font-semibold text-ink-500">| {countDinasTotal}</span>
                  </p>
                </div>
                <div
                  onClick={() => setRoleTab("petugas")}
                  className={`card-hover cursor-pointer rounded-2xl border p-4 transition-all ${
                    roleTab === "petugas" ? "border-brand-600 bg-brand-50/20" : "border-ink-300/40 bg-surface"
                  }`}
                >
                  <p className="text-xs font-bold text-ink-500 flex items-center justify-between gap-1.5">
                    <span className="flex items-center gap-1.5"><HardHat size={14} className="text-warning" /> Petugas</span>
                    <span className="text-[10px] text-ink-500 font-normal">Aktif | Total</span>
                  </p>
                  <p className="font-display text-2xl font-extrabold text-cream mt-1 flex items-baseline gap-1.5">
                    <span>{countPetugasAktif}</span>
                    <span className="text-base font-semibold text-ink-500">| {countPetugasTotal}</span>
                  </p>
                </div>

                <div className="rounded-2xl border border-ink-300/40 bg-surface p-4 sm:col-span-2 md:col-span-2">
                  <p className="text-xs font-bold text-success flex items-center justify-between gap-1.5">
                    <span className="flex items-center gap-1.5"><CheckCircle2 size={14} /> Total Pengguna</span>
                    <span className="text-[10px] text-ink-500 font-normal">Aktif | Total</span>
                  </p>
                  <p className="font-display text-2xl font-extrabold text-success mt-1 flex items-baseline gap-1.5">
                    <span>{countUserAktif}</span>
                    <span className="text-base font-semibold text-ink-500">| {countUserTotal}</span>
                  </p>
                </div>
              </div>

              {/* Controls & User Table */}
              <div className="rounded-3xl border border-ink-300/40 bg-surface p-4 sm:p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  {/* Role Tabs */}
                  <div className="flex flex-wrap gap-1.5 rounded-xl bg-ground p-1 border border-ink-300/40">
                    <button
                      onClick={() => setRoleTab("dinas")}
                      className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-extrabold transition-all ${
                        roleTab === "dinas" ? "bg-brand-600 text-white shadow" : "text-ink-500 hover:text-cream"
                      }`}
                    >
                      <Building2 size={13} /> Dinas ({countDinasTotal})
                    </button>
                    <button
                      onClick={() => setRoleTab("petugas")}
                      className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-extrabold transition-all ${
                        roleTab === "petugas" ? "bg-brand-600 text-white shadow" : "text-ink-500 hover:text-cream"
                      }`}
                    >
                      <HardHat size={13} /> Petugas ({countPetugasTotal})
                    </button>

                    <button
                      onClick={() => setRoleTab("semua")}
                      className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-extrabold transition-all ${
                        roleTab === "semua" ? "bg-brand-600 text-white shadow" : "text-ink-500 hover:text-cream"
                      }`}
                    >
                      Semua ({daftarUser.length})
                    </button>
                  </div>

                  {/* Search & Filters */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
                      <input
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        placeholder="Cari nama atau email..."
                        className="h-9 rounded-xl border border-ink-300/60 bg-ground pl-8 pr-3 text-xs text-cream placeholder-ink-500 focus:border-brand-600 focus:outline-none"
                      />
                    </div>

                    <select
                      value={userStatusFilter}
                      onChange={(e) => setUserStatusFilter(e.target.value as any)}
                      className="h-9 rounded-xl border border-ink-300/60 bg-ground px-2.5 text-xs text-cream focus:border-brand-600 focus:outline-none"
                    >
                      <option value="semua">Semua Status</option>
                      <option value="aktif">Aktif</option>
                      <option value="nonaktif">Nonaktif</option>
                    </select>

                    <select
                      value={userWilayahFilter}
                      onChange={(e) => setUserWilayahFilter(e.target.value as any)}
                      className="h-9 rounded-xl border border-ink-300/60 bg-ground px-2.5 text-xs text-cream focus:border-brand-600 focus:outline-none"
                    >
                      <option value="semua">Semua Wilayah</option>
                      {WILAYAH.map((w) => (
                        <option key={w.id} value={w.id}>{w.nama}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Users Table */}
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] text-sm">
                    <thead>
                      <tr className="border-b border-ink-300/40 text-left text-xs font-bold uppercase tracking-wider text-ink-500">
                        <th className="pb-3 pr-3">Pengguna</th>
                        <th className="pb-3 pr-3">Peran</th>
                        <th className="pb-3 pr-3">Wilayah</th>
                        <th className="pb-3 pr-3">Status</th>
                        <th className="pb-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink-300/20">
                      {filteredUsers.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-ink-500">
                            Belum ada pengguna yang sesuai.
                          </td>
                        </tr>
                      )}
                      {filteredUsers.map((u) => {
                        const wData = u.wilayah ? WILAYAH.find((w) => w.id === u.wilayah) : null;
                        return (
                          <tr key={u.id} className="transition-colors hover:bg-ground/40">
                            <td className="py-3.5 pr-3">
                              <p className="font-bold text-cream">{u.nama}</p>
                              <p className="font-mono text-xs text-ink-500">{u.email}</p>
                              {u.telepon && <p className="text-[11px] text-ink-500">Tel: {u.telepon}</p>}
                            </td>
                            <td className="py-3.5 pr-3">
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-ground border border-ink-300/40 px-2.5 py-1 text-xs font-bold capitalize text-cream">
                                {u.role === "dinas" && <Building2 size={12} className="text-brand-600" />}
                                {u.role === "petugas" && <HardHat size={12} className="text-warning" />}
                                {u.role === "warga" && <UserRound size={12} className="text-success" />}
                                {u.role === "admin" && <Shield size={12} className="text-danger" />}
                                {u.role}
                              </span>
                            </td>
                            <td className="py-3.5 pr-3">
                              {wData ? (
                                <span className="text-xs font-medium text-success flex items-center gap-1">
                                  <MapPin size={11} /> {wData.nama}
                                </span>
                              ) : (
                                <span className="text-xs text-ink-500">—</span>
                              )}
                            </td>
                            <td className="py-3.5 pr-3">
                              <button
                                onClick={() => ubahStatusUser(u.id, !u.aktif)}
                                className="inline-flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                              >
                                {u.aktif ? (
                                  <span className="flex items-center gap-1 text-success">
                                    <ToggleRight size={18} /> Aktif
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-ink-500">
                                    <ToggleLeft size={18} /> Nonaktif
                                  </span>
                                )}
                              </button>
                            </td>
                            <td className="py-3.5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleOpenEditUser(u)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-ink-300/50 bg-ground px-2.5 py-1 text-xs font-bold text-cream hover:border-brand-600 hover:text-brand-600"
                                >
                                  <Pencil size={12} /> Edit
                                </button>
                                <button
                                  onClick={() => setUserToDelete(u)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-danger/30 bg-danger-bg px-2.5 py-1 text-xs font-bold text-danger hover:bg-danger hover:text-white"
                                >
                                  <Trash2 size={12} /> Hapus
                                </button>
                              </div>
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

        {/* VIEW 2: MANAJEMEN LAPORAN & INFRASTRUKTUR (CRUD) */}
        {view === "laporan" && (
          <Reveal>
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ink-300/40 pb-5">
                <div>
                  <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-extrabold text-cream-hi flex items-center gap-2.5">
                    <FileText className="text-brand-600 shrink-0" /> Manajemen Laporan
                  </h1>
                  <p className="mt-1 text-xs sm:text-sm text-ink-500">
                    Kelola data, status, dan prioritas laporan.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddLaporanModal(true)}
                  className="btn-anim inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-brand-700 shrink-0"
                >
                  <Plus size={16} /> Tambah Laporan
                </button>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <div
                  onClick={() => setLaporanStatusFilter("semua")}
                  className={`card-hover cursor-pointer rounded-2xl border p-4 transition-all ${
                    laporanStatusFilter === "semua" ? "border-brand-600 bg-brand-50/20" : "border-ink-300/40 bg-surface"
                  }`}
                >
                  <p className="text-xs font-bold text-ink-500 flex items-center gap-1.5">
                    <FileText size={14} className="text-brand-600" /> Total Laporan
                  </p>
                  <p className="font-display text-2xl font-extrabold text-cream mt-1">{laporanWarga.length}</p>
                </div>
                <div
                  onClick={() => setLaporanStatusFilter("reported")}
                  className={`card-hover cursor-pointer rounded-2xl border p-4 transition-all ${
                    laporanStatusFilter === "reported" ? "border-brand-600 bg-brand-50/20" : "border-ink-300/40 bg-surface"
                  }`}
                >
                  <p className="text-xs font-bold text-info flex items-center gap-1.5">
                    <AlertTriangle size={14} /> Belum Diverifikasi
                  </p>
                  <p className="font-display text-2xl font-extrabold text-info mt-1">{countReported}</p>
                </div>
                <div
                  onClick={() => setLaporanStatusFilter("in_progress")}
                  className={`card-hover cursor-pointer rounded-2xl border p-4 transition-all ${
                    laporanStatusFilter === "in_progress" ? "border-brand-600 bg-brand-50/20" : "border-ink-300/40 bg-surface"
                  }`}
                >
                  <p className="text-xs font-bold text-amber-500 flex items-center gap-1.5">
                    <Wrench size={14} /> Diproses
                  </p>
                  <p className="font-display text-2xl font-extrabold text-amber-500 mt-1">{countInProgress}</p>
                </div>
                <div
                  onClick={() => setLaporanStatusFilter("resolved")}
                  className={`card-hover cursor-pointer rounded-2xl border p-4 transition-all ${
                    laporanStatusFilter === "resolved" ? "border-brand-600 bg-brand-50/20" : "border-ink-300/40 bg-surface"
                  }`}
                >
                  <p className="text-xs font-bold text-success flex items-center gap-1.5">
                    <CheckCircle2 size={14} /> Selesai
                  </p>
                  <p className="font-display text-2xl font-extrabold text-success mt-1">{countResolved}</p>
                </div>
              </div>

              {/* Controls & Table */}
              <div className="rounded-3xl border border-ink-300/40 bg-surface p-4 sm:p-6 shadow-sm space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink-300/30 pb-4">
                  {/* Search */}
                  <div className="relative w-full sm:w-64">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
                    <input
                      value={laporanSearch}
                      onChange={(e) => setLaporanSearch(e.target.value)}
                      placeholder="Cari ID, judul, atau pelapor..."
                      className="w-full h-9 rounded-xl border border-ink-300/60 bg-ground pl-8 pr-3 text-xs text-cream placeholder-ink-500 focus:border-brand-600 focus:outline-none"
                    />
                  </div>

                  {/* Filters */}
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={laporanStatusFilter}
                      onChange={(e) => setLaporanStatusFilter(e.target.value as any)}
                      className="h-9 rounded-xl border border-ink-300/60 bg-ground px-2.5 text-xs text-cream focus:border-brand-600 focus:outline-none"
                    >
                      <option value="semua">Semua Status</option>
                      <option value="reported">Dilaporkan</option>
                      <option value="verified">Diverifikasi</option>
                      <option value="assigned">Ditugaskan</option>
                      <option value="in_progress">Diproses</option>
                      <option value="resolved">Selesai</option>
                    </select>

                    <select
                      value={laporanKategoriFilter}
                      onChange={(e) => setLaporanKategoriFilter(e.target.value as any)}
                      className="h-9 rounded-xl border border-ink-300/60 bg-ground px-2.5 text-xs text-cream focus:border-brand-600 focus:outline-none"
                    >
                      <option value="semua">Semua Kategori</option>
                      {KATEGORI.map((k) => (
                        <option key={k.id} value={k.id}>{k.nama}</option>
                      ))}
                    </select>

                    <select
                      value={laporanWilayahFilter}
                      onChange={(e) => setLaporanWilayahFilter(e.target.value as any)}
                      className="h-9 rounded-xl border border-ink-300/60 bg-ground px-2.5 text-xs text-cream focus:border-brand-600 focus:outline-none"
                    >
                      <option value="semua">Semua Wilayah</option>
                      {WILAYAH.map((w) => (
                        <option key={w.id} value={w.id}>{w.nama}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Table Laporan */}
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px] text-sm">
                    <thead>
                      <tr className="border-b border-ink-300/40 text-left text-xs font-bold uppercase tracking-wider text-ink-500">
                        <th className="pb-3 pr-3">Laporan</th>
                        <th className="pb-3 pr-3">Kategori &amp; Wilayah</th>
                        <th className="pb-3 pr-3">Prioritas</th>
                        <th className="pb-3 pr-3">Status</th>
                        <th className="pb-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink-300/20">
                      {filteredLaporan.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-ink-500">
                            Belum ada laporan yang sesuai.
                          </td>
                        </tr>
                      )}
                      {filteredLaporan.map((l) => {
                        const wData = WILAYAH.find((w) => w.id === l.wilayah);
                        const kData = KATEGORI.find((k) => k.id === l.kategori);
                        const badgeStyle = STATUS_BADGE_STYLE[l.status] || "bg-ground text-cream";

                        return (
                          <tr key={l.id} className="transition-colors hover:bg-ground/40">
                            <td className="py-3.5 pr-3">
                              <span className="font-mono text-[11px] font-extrabold text-brand-600 block">{l.id}</span>
                              <p className="font-bold text-cream line-clamp-1">{l.judul}</p>
                              <p className="text-[11px] text-ink-500 flex items-center gap-1.5 mt-0.5">
                                <span>Pelapor: {l.pelapor}</span>
                                <span>·</span>
                                <span>{l.lokasi.alamat}</span>
                              </p>
                            </td>
                            <td className="py-3.5 pr-3">
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-cream">
                                {kData?.nama || l.kategori}
                              </span>
                              <p className="text-[11px] text-success flex items-center gap-1 mt-0.5">
                                <MapPin size={10} /> {wData?.nama}
                              </p>
                            </td>
                            <td className="py-3.5 pr-3">
                              <div className="flex items-center gap-2">
                                <span className={`grid h-7 w-7 place-items-center rounded-lg font-mono text-xs font-extrabold ${
                                  l.ai.priorityScore >= 8 ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"
                                }`}>
                                  {l.ai.priorityScore}
                                </span>
                                <div className="text-[10px] text-ink-500">
                                  <p className="font-bold text-cream-hi">SLA: {l.sla}</p>
                                  <p>Sev: {l.ai.severity}/10</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 pr-3">
                              <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold capitalize ${badgeStyle}`}>
                                {STATUS_LABEL_ID[l.status]}
                              </span>
                            </td>
                            <td className="py-3.5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleOpenEditLaporan(l)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-ink-300/50 bg-ground px-2.5 py-1 text-xs font-bold text-cream hover:border-brand-600 hover:text-brand-600"
                                >
                                  <Pencil size={12} /> Edit
                                </button>
                                <button
                                  onClick={() => setLaporanToDelete(l)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-danger/30 bg-danger-bg px-2.5 py-1 text-xs font-bold text-danger hover:bg-danger hover:text-white"
                                >
                                  <Trash2 size={12} /> Hapus
                                </button>
                              </div>
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

        {/* VIEW 3: LOG KESELURUHAN DATA DINAS */}
        {view === "log" && (
          <Reveal>
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ink-300/40 pb-5">
                <div>
                  <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-extrabold text-cream-hi flex items-center gap-2.5">
                    <Activity className="text-brand-600 shrink-0" /> Log Aktivitas
                  </h1>
                  <p className="mt-1 text-xs sm:text-sm text-ink-500">
                    Riwayat aktivitas verifikasi, penugasan, dan penanganan.
                  </p>
                </div>
              </div>

              {/* Log Controls */}
              <div className="rounded-3xl border border-ink-300/40 bg-surface p-4 sm:p-6 shadow-sm space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink-300/30 pb-4">
                  {/* Date selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-ink-500">Tanggal:</span>
                    <select
                      value={logHariFilter}
                      onChange={(e) => setLogHariFilter(e.target.value)}
                      className="h-9 rounded-xl border border-ink-300/60 bg-ground px-3 text-xs font-bold text-cream focus:border-brand-600 focus:outline-none"
                    >
                      <option value="2026-01-15">Hari Ini (15 Jan 2026)</option>
                      <option value="2026-01-14">Kemarin (14 Jan 2026)</option>
                    </select>
                  </div>

                  {/* Filters */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
                      <input
                        value={logSearch}
                        onChange={(e) => setLogSearch(e.target.value)}
                        placeholder="Cari ID, petugas, atau catatan..."
                        className="h-9 rounded-xl border border-ink-300/60 bg-ground pl-8 pr-3 text-xs text-cream placeholder-ink-500 focus:border-brand-600 focus:outline-none"
                      />
                    </div>

                    <select
                      value={logWilayahFilter}
                      onChange={(e) => setLogWilayahFilter(e.target.value as any)}
                      className="h-9 rounded-xl border border-ink-300/60 bg-ground px-2.5 text-xs text-cream focus:border-brand-600 focus:outline-none"
                    >
                      <option value="semua">Semua Wilayah</option>
                      {WILAYAH.map((w) => (
                        <option key={w.id} value={w.id}>{w.nama}</option>
                      ))}
                    </select>

                    <select
                      value={logTipeFilter}
                      onChange={(e) => setLogTipeFilter(e.target.value as any)}
                      className="h-9 rounded-xl border border-ink-300/60 bg-ground px-2.5 text-xs text-cream focus:border-brand-600 focus:outline-none"
                    >
                      <option value="semua">Semua Aktivitas</option>
                      <option value="baru">Laporan Baru</option>
                      <option value="verifikasi">Verifikasi</option>
                      <option value="penugasan">Penugasan</option>
                      <option value="penanganan">Penanganan</option>
                      <option value="selesai">Selesai</option>
                    </select>
                  </div>
                </div>

                {/* Timeline Log List */}
                {filteredLogs.length === 0 ? (
                  <div className="py-12 text-center text-ink-500 text-sm">
                    Belum ada aktivitas yang sesuai.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredLogs.map((log) => {
                      const Meta = TIPE_META[log.tipe];
                      const Icon = Meta.icon;
                      const wData = WILAYAH.find((w) => w.id === log.wilayah);
                      return (
                        <div
                          key={log.id}
                          className="card-hover flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-ink-300/40 bg-ground/50 p-4 transition-all hover:border-brand-600/40"
                        >
                          <div className="flex items-center gap-3.5">
                            <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl font-bold ${Meta.cls}`}>
                              <Icon size={18} />
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-cream text-sm">{log.aktor}</span>
                                <span className="rounded-full bg-surface border border-ink-300/40 px-2 py-0.5 text-[10px] font-bold text-brand-600">
                                  {KEGIATAN_LABEL[log.tipe]}
                                </span>
                              </div>
                              <p className="mt-0.5 text-xs text-ink-700">{log.catatan}</p>
                              <p className="mt-1 text-[11px] text-ink-500 flex items-center gap-2">
                                <span className="font-mono font-bold text-cream-hi">ID: {log.laporanId}</span>
                                <span>·</span>
                                <span className="flex items-center gap-1 text-success">
                                  <MapPin size={10} /> {wData?.nama}
                                </span>
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="font-mono text-xs font-bold text-ink-500 block">{log.jam}</span>
                            <span className="text-[10px] text-ink-500">Waktu</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </Reveal>
        )}

        {/* VIEW 4: PROFIL ADMIN */}
        {view === "profil" && (
          <Reveal>
            <ProfileClient />
          </Reveal>
        )}

        {/* ========================================== */}
        {/* MODAL 1: TAMBAH USER BARU */}
        {/* ========================================== */}
        {showAddUserModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/65 backdrop-blur-sm transition-opacity"
              onClick={() => setShowAddUserModal(false)}
            />
            <div className="anim-fade-up relative w-full max-w-md rounded-3xl border border-white/15 bg-surface p-6 shadow-2xl md:p-8">
              <div className="flex items-center justify-between border-b border-ink-300/30 pb-4">
                <h3 className="font-display text-lg font-extrabold text-cream flex items-center gap-2">
                  <UserPlus size={18} className="text-brand-600" /> Tambah Pengguna Baru
                </h3>
                <button
                  onClick={() => setShowAddUserModal(false)}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-ink-300/50 text-ink-500 hover:text-cream"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="mt-5 space-y-4 text-xs">
                <div>
                  <label className="mb-1 block font-bold text-ink-500">Nama Lengkap</label>
                  <input
                    required
                    value={newNama}
                    onChange={(e) => setNewNama(e.target.value)}
                    placeholder="Contoh: Budi Rahardjo"
                    className="w-full rounded-xl border border-ink-300/60 bg-ground p-3 text-cream outline-none focus:border-brand-600"
                  />
                  {newNama && (
                    <p className="mt-1.5 flex items-center gap-1.5 rounded-lg border border-brand-600/20 bg-brand-50/10 px-2.5 py-1.5 text-[11px] text-ink-500">
                      <span className="shrink-0 font-bold text-brand-600">🔑 Password awal:</span>
                      <code className="font-mono font-bold text-cream select-all">
                        {newNama.toLowerCase().replace(/\s+/g, "")}
                      </code>
                      <span className="text-ink-500">(dapat diubah nanti)</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block font-bold text-ink-500">Email</label>
                  <input
                    required
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Contoh: budi@dinas.go.id"
                    className="w-full rounded-xl border border-ink-300/60 bg-ground p-3 text-cream outline-none focus:border-brand-600"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-bold text-ink-500">Peran</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as Role)}
                    className="w-full rounded-xl border border-ink-300/60 bg-ground p-3 text-cream outline-none focus:border-brand-600"
                  >
                    <option value="dinas">Dinas</option>
                    <option value="petugas">Petugas</option>
                  </select>
                </div>

                {newRole === "dinas" && (
                  <div>
                    <label className="mb-1 block font-bold text-ink-500">Wilayah</label>
                    <select
                      value={newWilayah}
                      onChange={(e) => setNewWilayah(e.target.value as WilayahId)}
                      className="w-full rounded-xl border border-ink-300/60 bg-ground p-3 text-cream outline-none focus:border-brand-600"
                    >
                      {WILAYAH.map((w) => (
                        <option key={w.id} value={w.id}>{w.nama}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="mb-1 block font-bold text-ink-500">Nomor Telepon (opsional)</label>
                  <input
                    value={newTelepon}
                    onChange={(e) => setNewTelepon(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="w-full rounded-xl border border-ink-300/60 bg-ground p-3 text-cream outline-none focus:border-brand-600"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddUserModal(false)}
                    className="rounded-xl border border-ink-300/60 px-4 py-2.5 font-semibold text-ink-700 hover:text-cream"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-brand-600 px-5 py-2.5 font-bold text-white hover:bg-brand-700"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* MODAL 2: EDIT USER */}
        {/* ========================================== */}
        {showEditUserModal && editingUser && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/65 backdrop-blur-sm transition-opacity"
              onClick={() => setShowEditUserModal(false)}
            />
            <div className="anim-fade-up relative w-full max-w-md rounded-3xl border border-white/15 bg-surface p-6 shadow-2xl md:p-8">
              <div className="flex items-center justify-between border-b border-ink-300/30 pb-4">
                <h3 className="font-display text-lg font-extrabold text-cream flex items-center gap-2">
                  <Pencil size={18} className="text-brand-600" /> Edit Pengguna
                </h3>
                <button
                  onClick={() => setShowEditUserModal(false)}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-ink-300/50 text-ink-500 hover:text-cream"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveEditUser} className="mt-5 space-y-4 text-xs">
                <div>
                  <label className="mb-1 block font-bold text-ink-500">Nama Lengkap</label>
                  <input
                    required
                    value={editNama}
                    onChange={(e) => setEditNama(e.target.value)}
                    className="w-full rounded-xl border border-ink-300/60 bg-ground p-3 text-cream outline-none focus:border-brand-600"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-bold text-ink-500">Email</label>
                  <input
                    required
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full rounded-xl border border-ink-300/60 bg-ground p-3 text-cream outline-none focus:border-brand-600"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-bold text-ink-500">Peran</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as Role)}
                    className="w-full rounded-xl border border-ink-300/60 bg-ground p-3 text-cream outline-none focus:border-brand-600"
                  >
                    <option value="dinas">Dinas</option>
                    <option value="petugas">Petugas</option>
                  </select>
                </div>

                {editRole === "dinas" && (
                  <div>
                    <label className="mb-1 block font-bold text-ink-500">Wilayah</label>
                    <select
                      value={editWilayah}
                      onChange={(e) => setEditWilayah(e.target.value as WilayahId)}
                      className="w-full rounded-xl border border-ink-300/60 bg-ground p-3 text-cream outline-none focus:border-brand-600"
                    >
                      {WILAYAH.map((w) => (
                        <option key={w.id} value={w.id}>{w.nama}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="mb-1 block font-bold text-ink-500">Nomor Telepon</label>
                  <input
                    value={editTelepon}
                    onChange={(e) => setEditTelepon(e.target.value)}
                    className="w-full rounded-xl border border-ink-300/60 bg-ground p-3 text-cream outline-none focus:border-brand-600"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEditUserModal(false)}
                    className="rounded-xl border border-ink-300/60 px-4 py-2.5 font-semibold text-ink-700 hover:text-cream"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-brand-600 px-5 py-2.5 font-bold text-white hover:bg-brand-700"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* MODAL 3: KONFIRMASI HAPUS USER */}
        {/* ========================================== */}
        {userToDelete && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/65 backdrop-blur-sm transition-opacity"
              onClick={() => setUserToDelete(null)}
            />
            <div className="anim-fade-up relative w-full max-w-sm rounded-3xl border border-white/15 bg-surface p-6 shadow-2xl text-center">
              <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-danger-bg text-danger">
                <AlertTriangle size={24} />
              </div>
              <h3 className="font-display text-base font-extrabold text-cream">Hapus pengguna ini?</h3>
              <p className="mt-2 text-xs text-ink-500">
                Hapus akun <strong className="text-cream">{userToDelete.nama}</strong> ({userToDelete.email})?
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <button
                  onClick={() => setUserToDelete(null)}
                  className="rounded-xl border border-ink-300/60 px-4 py-2 text-xs font-semibold text-ink-700 hover:text-cream"
                >
                  Batal
                </button>
                <button
                  onClick={handleConfirmDeleteUser}
                  className="rounded-xl bg-danger px-5 py-2 text-xs font-bold text-white hover:bg-red-700"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* MODAL 4: TAMBAH LAPORAN BARU */}
        {/* ========================================== */}
        {showAddLaporanModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/65 backdrop-blur-sm transition-opacity"
              onClick={() => setShowAddLaporanModal(false)}
            />
            <div className="anim-fade-up relative w-full max-w-lg rounded-3xl border border-white/15 bg-surface p-6 shadow-2xl md:p-8 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-ink-300/30 pb-4">
                <h3 className="font-display text-lg font-extrabold text-cream flex items-center gap-2">
                  <Plus size={18} className="text-brand-600" /> Tambah Laporan
                </h3>
                <button
                  onClick={() => setShowAddLaporanModal(false)}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-ink-300/50 text-ink-500 hover:text-cream"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreateLaporan} className="mt-5 space-y-4 text-xs">
                <div>
                  <label className="mb-1 block font-bold text-ink-500">Judul</label>
                  <input
                    required
                    value={newLapJudul}
                    onChange={(e) => setNewLapJudul(e.target.value)}
                    placeholder="Contoh: Jalan berlubang di Jl. Kaliurang"
                    className="w-full rounded-xl border border-ink-300/60 bg-ground p-3 text-cream outline-none focus:border-brand-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block font-bold text-ink-500">Kategori</label>
                    <select
                      value={newLapKategori}
                      onChange={(e) => setNewLapKategori(e.target.value as KategoriId)}
                      className="w-full rounded-xl border border-ink-300/60 bg-ground p-3 text-cream outline-none focus:border-brand-600"
                    >
                      {KATEGORI.map((k) => (
                        <option key={k.id} value={k.id}>{k.nama}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block font-bold text-ink-500">Wilayah</label>
                    <select
                      value={newLapWilayah}
                      onChange={(e) => setNewLapWilayah(e.target.value as WilayahId)}
                      className="w-full rounded-xl border border-ink-300/60 bg-ground p-3 text-cream outline-none focus:border-brand-600"
                    >
                      {WILAYAH.map((w) => (
                        <option key={w.id} value={w.id}>{w.nama}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block font-bold text-ink-500">Lokasi</label>
                  <input
                    required
                    value={newLapAlamat}
                    onChange={(e) => setNewLapAlamat(e.target.value)}
                    placeholder="Contoh: Jl. Kaliurang KM 7, Depok, Sleman"
                    className="w-full rounded-xl border border-ink-300/60 bg-ground p-3 text-cream outline-none focus:border-brand-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block font-bold text-ink-500">Pelapor</label>
                    <input
                      value={newLapPelapor}
                      onChange={(e) => setNewLapPelapor(e.target.value)}
                      placeholder="Nama pelapor"
                      className="w-full rounded-xl border border-ink-300/60 bg-ground p-3 text-cream outline-none focus:border-brand-600"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-bold text-ink-500">Target Waktu</label>
                    <select
                      value={newLapSla}
                      onChange={(e) => setNewLapSla(e.target.value)}
                      className="w-full rounded-xl border border-ink-300/60 bg-ground p-3 text-cream outline-none focus:border-brand-600"
                    >
                      <option value="24 jam">24 Jam (Darurat)</option>
                      <option value="48 jam">48 Jam (Standar)</option>
                      <option value="72 jam">72 Jam (Sedang)</option>
                      <option value="7 hari">7 Hari (Rendah)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block font-bold text-ink-500">Tingkat Keparahan (1-10)</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={newLapSeverity}
                    onChange={(e) => setNewLapSeverity(Number(e.target.value))}
                    className="w-full rounded-xl border border-ink-300/60 bg-ground p-3 text-cream outline-none focus:border-brand-600"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-bold text-ink-500">URL Foto (opsional)</label>
                  <input
                    value={newLapFotoUrl}
                    onChange={(e) => setNewLapFotoUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full rounded-xl border border-ink-300/60 bg-ground p-3 text-cream outline-none focus:border-brand-600"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddLaporanModal(false)}
                    className="rounded-xl border border-ink-300/60 px-4 py-2.5 font-semibold text-ink-700 hover:text-cream"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-brand-600 px-5 py-2.5 font-bold text-white hover:bg-brand-700"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* MODAL 5: EDIT LAPORAN */}
        {/* ========================================== */}
        {showEditLaporanModal && editingLaporan && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/65 backdrop-blur-sm transition-opacity"
              onClick={() => setShowEditLaporanModal(false)}
            />
            <div className="anim-fade-up relative w-full max-w-lg rounded-3xl border border-white/15 bg-surface p-6 shadow-2xl md:p-8 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-ink-300/30 pb-4">
                <h3 className="font-display text-lg font-extrabold text-cream flex items-center gap-2">
                  <Pencil size={18} className="text-brand-600" /> Edit Laporan ({editingLaporan.id})
                </h3>
                <button
                  onClick={() => setShowEditLaporanModal(false)}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-ink-300/50 text-ink-500 hover:text-cream"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveEditLaporan} className="mt-5 space-y-4 text-xs">
                <div>
                  <label className="mb-1 block font-bold text-ink-500">Judul</label>
                  <input
                    required
                    value={editLapJudul}
                    onChange={(e) => setEditLapJudul(e.target.value)}
                    className="w-full rounded-xl border border-ink-300/60 bg-ground p-3 text-cream outline-none focus:border-brand-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block font-bold text-ink-500">Status</label>
                    <select
                      value={editLapStatus}
                      onChange={(e) => setEditLapStatus(e.target.value as StatusId)}
                      className="w-full rounded-xl border border-ink-300/60 bg-ground p-3 font-bold text-cream outline-none focus:border-brand-600"
                    >
                      <option value="reported">Dilaporkan</option>
                      <option value="verified">Diverifikasi</option>
                      <option value="assigned">Ditugaskan</option>
                      <option value="in_progress">Diproses</option>
                      <option value="resolved">Selesai</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block font-bold text-ink-500">Kategori</label>
                    <select
                      value={editLapKategori}
                      onChange={(e) => setEditLapKategori(e.target.value as KategoriId)}
                      className="w-full rounded-xl border border-ink-300/60 bg-ground p-3 text-cream outline-none focus:border-brand-600"
                    >
                      {KATEGORI.map((k) => (
                        <option key={k.id} value={k.id}>{k.nama}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block font-bold text-ink-500">Wilayah</label>
                    <select
                      value={editLapWilayah}
                      onChange={(e) => setEditLapWilayah(e.target.value as WilayahId)}
                      className="w-full rounded-xl border border-ink-300/60 bg-ground p-3 text-cream outline-none focus:border-brand-600"
                    >
                      {WILAYAH.map((w) => (
                        <option key={w.id} value={w.id}>{w.nama}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block font-bold text-ink-500">Target Waktu</label>
                    <select
                      value={editLapSla}
                      onChange={(e) => setEditLapSla(e.target.value)}
                      className="w-full rounded-xl border border-ink-300/60 bg-ground p-3 text-cream outline-none focus:border-brand-600"
                    >
                      <option value="24 jam">24 Jam (Darurat)</option>
                      <option value="48 jam">48 Jam (Standar)</option>
                      <option value="72 jam">72 Jam (Sedang)</option>
                      <option value="7 hari">7 Hari (Rendah)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block font-bold text-ink-500">Lokasi</label>
                  <input
                    required
                    value={editLapAlamat}
                    onChange={(e) => setEditLapAlamat(e.target.value)}
                    className="w-full rounded-xl border border-ink-300/60 bg-ground p-3 text-cream outline-none focus:border-brand-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block font-bold text-ink-500">Tingkat Keparahan (1-10)</label>
                    <input
                      type="number"
                      step="0.1"
                      min={1}
                      max={10}
                      value={editLapSeverity}
                      onChange={(e) => setEditLapSeverity(Number(e.target.value))}
                      className="w-full rounded-xl border border-ink-300/60 bg-ground p-3 text-cream outline-none focus:border-brand-600"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-bold text-ink-500">Skor Prioritas (1-10)</label>
                    <input
                      type="number"
                      step="0.1"
                      min={1}
                      max={10}
                      value={editLapPriority}
                      onChange={(e) => setEditLapPriority(Number(e.target.value))}
                      className="w-full rounded-xl border border-ink-300/60 bg-ground p-3 text-cream outline-none focus:border-brand-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block font-bold text-ink-500">Catatan Dampak</label>
                  <textarea
                    rows={2}
                    value={editLapDampak}
                    onChange={(e) => setEditLapDampak(e.target.value)}
                    className="w-full rounded-xl border border-ink-300/60 bg-ground p-3 text-cream outline-none focus:border-brand-600"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEditLaporanModal(false)}
                    className="rounded-xl border border-ink-300/60 px-4 py-2.5 font-semibold text-ink-700 hover:text-cream"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-brand-600 px-5 py-2.5 font-bold text-white hover:bg-brand-700"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* MODAL 6: KONFIRMASI HAPUS LAPORAN */}
        {/* ========================================== */}
        {laporanToDelete && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/65 backdrop-blur-sm transition-opacity"
              onClick={() => setLaporanToDelete(null)}
            />
            <div className="anim-fade-up relative w-full max-w-sm rounded-3xl border border-white/15 bg-surface p-6 shadow-2xl text-center">
              <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-danger-bg text-danger">
                <AlertTriangle size={24} />
              </div>
              <h3 className="font-display text-base font-extrabold text-cream">Hapus laporan ini?</h3>
              <p className="mt-2 text-xs text-ink-500">
                Hapus laporan <strong className="text-cream">{laporanToDelete.id}</strong> ("{laporanToDelete.judul}")?
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <button
                  onClick={() => setLaporanToDelete(null)}
                  className="rounded-xl border border-ink-300/60 px-4 py-2 text-xs font-semibold text-ink-700 hover:text-cream"
                >
                  Batal
                </button>
                <button
                  onClick={handleConfirmDeleteLaporan}
                  className="rounded-xl bg-danger px-5 py-2 text-xs font-bold text-white hover:bg-red-700"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
