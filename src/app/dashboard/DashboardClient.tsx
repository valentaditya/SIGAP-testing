"use client";

import { useEffect, useMemo, useState } from "react";
import { Sidebar, type DashboardView } from "@/components/Sidebar";
import { Chip } from "@/components/Chip";
import { Reveal } from "@/components/Reveal";
import {
  WILAYAH,
  KEGIATAN,
  KEGIATAN_LABEL,
  type Kegiatan,
  type KegiatanTipe,
  type WilayahId,
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
} from "lucide-react";
import { useApp, type Role, type UserRecord } from "@/lib/store";

const TIPE_META: Record<KegiatanTipe, { icon: any; cls: string }> = {
  baru: { icon: FilePlus2, cls: "bg-info-bg text-info" },
  verifikasi: { icon: BadgeCheck, cls: "bg-brand-100 text-brand-600" },
  penugasan: { icon: UserCheck, cls: "bg-warning-bg text-warning" },
  penanganan: { icon: Wrench, cls: "bg-warning-bg text-warning" },
  selesai: { icon: CheckCircle2, cls: "bg-success-bg text-success" },
};

export default function DashboardClient() {
  const [view, setView] = useState<DashboardView>("pengguna");
  const { daftarUser, tambahUser, hapusUser, ubahStatusUser, laporanWarga } = useApp();

  // State untuk Tab Manajemen User
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

  // State untuk Tab Log Keseluruhan Data
  const [logSearch, setLogSearch] = useState("");
  const [logWilayahFilter, setLogWilayahFilter] = useState<"semua" | WilayahId>("semua");
  const [logTipeFilter, setLogTipeFilter] = useState<"semua" | KegiatanTipe>("semua");
  const [logHariFilter, setLogHariFilter] = useState<string>("2026-01-15");

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [view]);

  // Combined User Records Filtered
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

  // Combined Logs Filtered
  const allLogsWithMeta = useMemo(() => {
    const rawList = KEGIATAN[logHariFilter] ?? [];
    return rawList.map((k) => {
      const lap = laporanWarga.find((l) => l.id === k.laporanId);
      return {
        ...k,
        wilayah: lap?.wilayah ?? "sleman",
        judulLaporan: lap?.judul ?? "Laporan Infrastruktur",
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

  const countDinas = daftarUser.filter((u) => u.role === "dinas").length;
  const countPetugas = daftarUser.filter((u) => u.role === "petugas").length;
  const countWarga = daftarUser.filter((u) => u.role === "warga").length;
  const countAktif = daftarUser.filter((u) => u.aktif).length;

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNama || !newEmail) return;
    tambahUser({
      nama: newNama,
      email: newEmail,
      role: newRole,
      wilayah: newRole === "dinas" ? newWilayah : undefined,
      aktif: true,
    });
    setNewNama("");
    setNewEmail("");
    setShowAddUserModal(false);
  };

  return (
    <div className="grid min-h-[calc(100vh-var(--nav-h))] w-full grid-cols-1 lg:grid-cols-[240px_1fr]">
      <Sidebar view={view} onChange={setView} />

      <main className="w-full max-w-none p-5 md:p-8 bg-ground">
        {/* VIEW 1: MANAJEMEN USER (Dinas, Petugas, Warga) */}
        {view === "pengguna" && (
          <Reveal>
            <div className="space-y-6">
              {/* Header section */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink-300/40 pb-5">
                <div>
                  <h1 className="font-display text-2xl font-extrabold text-cream-hi md:text-3xl flex items-center gap-2.5">
                    <Users className="text-brand-600" /> Kelola Manajemen User System
                  </h1>
                  <p className="mt-1 text-sm text-ink-500">
                    Pemisahan dan pengelolaan akun instansi Dinas, Petugas Lapangan, dan Warga pelapor.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddUserModal(true)}
                  className="btn-anim inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-brand-700"
                >
                  <UserPlus size={16} /> Tambah User Baru
                </button>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div
                  onClick={() => setRoleTab("dinas")}
                  className={`card-hover cursor-pointer rounded-2xl border p-4 transition-all ${
                    roleTab === "dinas" ? "border-brand-600 bg-brand-50/20" : "border-ink-300/40 bg-surface"
                  }`}
                >
                  <p className="text-xs font-bold text-ink-500 flex items-center gap-1.5">
                    <Building2 size={14} className="text-brand-600" /> Akun Dinas
                  </p>
                  <p className="font-display text-2xl font-extrabold text-cream mt-1">{countDinas}</p>
                </div>
                <div
                  onClick={() => setRoleTab("petugas")}
                  className={`card-hover cursor-pointer rounded-2xl border p-4 transition-all ${
                    roleTab === "petugas" ? "border-brand-600 bg-brand-50/20" : "border-ink-300/40 bg-surface"
                  }`}
                >
                  <p className="text-xs font-bold text-ink-500 flex items-center gap-1.5">
                    <HardHat size={14} className="text-warning" /> Petugas Lapangan
                  </p>
                  <p className="font-display text-2xl font-extrabold text-cream mt-1">{countPetugas}</p>
                </div>
                <div
                  onClick={() => setRoleTab("warga")}
                  className={`card-hover cursor-pointer rounded-2xl border p-4 transition-all ${
                    roleTab === "warga" ? "border-brand-600 bg-brand-50/20" : "border-ink-300/40 bg-surface"
                  }`}
                >
                  <p className="text-xs font-bold text-ink-500 flex items-center gap-1.5">
                    <UserRound size={14} className="text-success" /> Warga Pelapor
                  </p>
                  <p className="font-display text-2xl font-extrabold text-cream mt-1">{countWarga}</p>
                </div>
                <div className="rounded-2xl border border-ink-300/40 bg-surface p-4">
                  <p className="text-xs font-bold text-success flex items-center gap-1.5">
                    <CheckCircle2 size={14} /> Total User Aktif
                  </p>
                  <p className="font-display text-2xl font-extrabold text-success mt-1">{countAktif}</p>
                </div>
              </div>

              {/* Controls & Filter */}
              <div className="rounded-3xl border border-ink-300/40 bg-surface p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  {/* Role Tabs */}
                  <div className="flex flex-wrap gap-1.5 rounded-xl bg-ground p-1 border border-ink-300/40">
                    <button
                      onClick={() => setRoleTab("dinas")}
                      className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-extrabold transition-all ${
                        roleTab === "dinas" ? "bg-brand-600 text-white shadow" : "text-ink-500 hover:text-cream"
                      }`}
                    >
                      <Building2 size={13} /> Dinas ({countDinas})
                    </button>
                    <button
                      onClick={() => setRoleTab("petugas")}
                      className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-extrabold transition-all ${
                        roleTab === "petugas" ? "bg-brand-600 text-white shadow" : "text-ink-500 hover:text-cream"
                      }`}
                    >
                      <HardHat size={13} /> Petugas ({countPetugas})
                    </button>
                    <button
                      onClick={() => setRoleTab("warga")}
                      className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-extrabold transition-all ${
                        roleTab === "warga" ? "bg-brand-600 text-white shadow" : "text-ink-500 hover:text-cream"
                      }`}
                    >
                      <UserRound size={13} /> Warga ({countWarga})
                    </button>
                    <button
                      onClick={() => setRoleTab("semua")}
                      className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-extrabold transition-all ${
                        roleTab === "semua" ? "bg-brand-600 text-white shadow" : "text-ink-500 hover:text-cream"
                      }`}
                    >
                      Semua User ({daftarUser.length})
                    </button>
                  </div>

                  {/* Filters */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
                      <input
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        placeholder="Cari nama / email…"
                        className="h-9 rounded-xl border border-ink-300/60 bg-ground pl-8 pr-3 text-xs text-cream placeholder-ink-500 focus:border-brand-600 focus:outline-none"
                      />
                    </div>

                    <select
                      value={userStatusFilter}
                      onChange={(e) => setUserStatusFilter(e.target.value as any)}
                      className="h-9 rounded-xl border border-ink-300/60 bg-ground px-2.5 text-xs text-cream focus:border-brand-600 focus:outline-none"
                    >
                      <option value="semua">Semua Status</option>
                      <option value="aktif">Status: Aktif</option>
                      <option value="nonaktif">Status: Nonaktif</option>
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
                  <table className="w-full min-w-[650px] text-sm">
                    <thead>
                      <tr className="border-b border-ink-300/40 text-left text-xs font-bold uppercase tracking-wider text-ink-500">
                        <th className="pb-3 pr-3">User &amp; Contact</th>
                        <th className="pb-3 pr-3">Peran / Role</th>
                        <th className="pb-3 pr-3">Wilayah / Instansi</th>
                        <th className="pb-3 pr-3">Status</th>
                        <th className="pb-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink-300/20">
                      {filteredUsers.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-ink-500">
                            Tidak ada data user yang sesuai kriteria filter.
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
                              <button
                                onClick={() => hapusUser(u.id)}
                                className="text-xs font-bold text-danger hover:underline inline-flex items-center gap-1"
                              >
                                <Trash2 size={13} /> Hapus
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

        {/* VIEW 2: LOG KESELURUHAN DATA DINAS */}
        {view === "log" && (
          <Reveal>
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink-300/40 pb-5">
                <div>
                  <h1 className="font-display text-2xl font-extrabold text-cream-hi md:text-3xl flex items-center gap-2.5">
                    <Activity className="text-brand-600" /> Log Keseluruhan Aktivitas Data Dinas
                  </h1>
                  <p className="mt-1 text-sm text-ink-500">
                    Jejak rekam aktivitas verifikasi, penugasan, dan penanganan di seluruh wilayah instansi dinas.
                  </p>
                </div>
              </div>

              {/* Log Controls */}
              <div className="rounded-3xl border border-ink-300/40 bg-surface p-6 shadow-sm space-y-6">
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
                        placeholder="Cari ID laporan / aktor / catatan…"
                        className="h-9 rounded-xl border border-ink-300/60 bg-ground pl-8 pr-3 text-xs text-cream placeholder-ink-500 focus:border-brand-600 focus:outline-none"
                      />
                    </div>

                    <select
                      value={logWilayahFilter}
                      onChange={(e) => setLogWilayahFilter(e.target.value as any)}
                      className="h-9 rounded-xl border border-ink-300/60 bg-ground px-2.5 text-xs text-cream focus:border-brand-600 focus:outline-none"
                    >
                      <option value="semua">Semua Wilayah Dinas</option>
                      {WILAYAH.map((w) => (
                        <option key={w.id} value={w.id}>{w.nama}</option>
                      ))}
                    </select>

                    <select
                      value={logTipeFilter}
                      onChange={(e) => setLogTipeFilter(e.target.value as any)}
                      className="h-9 rounded-xl border border-ink-300/60 bg-ground px-2.5 text-xs text-cream focus:border-brand-600 focus:outline-none"
                    >
                      <option value="semua">Semua Tipe Aktivitas</option>
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
                    Tidak ada catatan log kegiatan yang memenuhi kriteria filter.
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
                            <span className="text-[10px] text-ink-500">Waktu Aktivitas</span>
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

        {/* MODAL TAMBAH USER BARU */}
        {showAddUserModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/65 backdrop-blur-sm transition-opacity"
              onClick={() => setShowAddUserModal(false)}
            />
            <div className="anim-fade-up relative w-full max-w-md rounded-3xl border border-white/15 bg-surface p-6 shadow-2xl md:p-8">
              <div className="flex items-center justify-between border-b border-ink-300/30 pb-4">
                <h3 className="font-display text-lg font-extrabold text-cream flex items-center gap-2">
                  <UserPlus size={18} className="text-brand-600" /> Tambah User Akun Baru
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
                    placeholder="cth: Pak Budi Rahardjo"
                    className="w-full rounded-xl border border-ink-300/60 bg-ground p-3 text-cream outline-none focus:border-brand-600"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-bold text-ink-500">Alamat Email</label>
                  <input
                    required
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="cth: budi@dinas.go.id"
                    className="w-full rounded-xl border border-ink-300/60 bg-ground p-3 text-cream outline-none focus:border-brand-600"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-bold text-ink-500">Peran / Role User</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as Role)}
                    className="w-full rounded-xl border border-ink-300/60 bg-ground p-3 text-cream outline-none focus:border-brand-600"
                  >
                    <option value="dinas">Instansi Dinas</option>
                    <option value="petugas">Petugas Lapangan</option>
                    <option value="warga">Warga Pelapor</option>
                  </select>
                </div>

                {newRole === "dinas" && (
                  <div>
                    <label className="mb-1 block font-bold text-ink-500">Wilayah Kerja Dinas</label>
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
                    Simpan User
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
