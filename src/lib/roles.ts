import type { Role } from "@/lib/store";

export type Kemampuan =
  | "buat_laporan"
  | "lihat_laporan_sendiri"
  | "upvote"
  | "gamifikasi"
  | "lihat_semua_laporan"
  | "lihat_laporan_wilayah"
  | "verifikasi"
  | "tugaskan"
  | "ubah_status"
  | "analitik"
  | "kelola_pengguna"
  | "sinyal_darurat";

export interface DefinisiPeran {
  id: Role;
  label: string;
  singkat: string;
  beranda: string;
  kemampuan: readonly Kemampuan[];
  navigasi: readonly { href: string; label: string }[];
}

export const PERAN: Record<Role, DefinisiPeran> = {
  warga: {
    id: "warga",
    label: "Warga",
    singkat: "Warga",
    beranda: "/warga",
    kemampuan: [
      "buat_laporan",
      "lihat_laporan_sendiri",
      "upvote",
      "gamifikasi",
      "sinyal_darurat",
    ],
    navigasi: [],
  },
  admin: {
    id: "admin",
    label: "Admin / Pemerintah",
    singkat: "Admin",
    beranda: "/dashboard",
    kemampuan: [
      "lihat_semua_laporan",
      "verifikasi",
      "tugaskan",
      "analitik",
      "ubah_status",
      "kelola_pengguna",
    ],
    navigasi: [],
  },
  petugas: {
    id: "petugas",
    label: "Petugas Lapangan",
    singkat: "Petugas",
    beranda: "/petugas",
    kemampuan: ["ubah_status", "lihat_semua_laporan", "sinyal_darurat"],
    navigasi: [],
  },
  dinas: {
    id: "dinas",
    label: "Dinas / Instansi",
    singkat: "Dinas",
    beranda: "/dinas",
    kemampuan: ["lihat_laporan_wilayah"],
    navigasi: [],
  },
};

export const NAV_TAMU = [
  { href: "/", label: "Beranda" },
  { href: "/#fitur", label: "Fitur" },
  { href: "/#ai", label: "Kecerdasan AI" },
  { href: "/#sla", label: "Standar SLA" },
  { href: "/#faq", label: "FAQ" },
  { href: "/peta", label: "Peta Laporan" },
] as const;

export function bisa(role: Role | undefined, k: Kemampuan): boolean {
  if (!role) return false;
  return PERAN[role].kemampuan.includes(k);
}

export function berandaPeran(role: Role | undefined): string {
  return role ? PERAN[role].beranda : "/";
}

export const AKSES_RUTE: Record<string, readonly Role[]> = {
  "/dashboard": ["admin"],
  "/petugas": ["petugas"],
  "/warga": ["warga"],
  "/dinas": ["dinas"],
  "/profil": ["warga", "admin", "petugas", "dinas"],
};

export function bolehMasukRute(path: string, role: Role | undefined): boolean {
  const entri = Object.entries(AKSES_RUTE).find(([p]) => path.startsWith(p));
  if (!entri) return true;
  if (!role) return false;
  return entri[1].includes(role);
}
