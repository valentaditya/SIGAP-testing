import type { Role } from "@/lib/store";

/* ============================================================
   SATU SUMBER KEBENARAN UNTUK HAK AKSES PER PERAN.

   Sebelum berkas ini ada, aturan peran tersebar di banyak tempat
   dan saling bertentangan. Contoh nyata yang ditemukan:
   navbar mengirim petugas ke /warga, sementara /warga sendiri
   hanya untuk peran warga, sehingga petugas terlempar keluar.

   Semua keputusan "boleh atau tidak" sekarang dibaca dari sini:
   navigasi, penjaga rute, dan tombol aksi.
   ============================================================ */

export type Kemampuan =
  | "buat_laporan"      // mengirim laporan baru
  | "lihat_laporan_sendiri"
  | "upvote"            // mendukung laporan warga lain
  | "gamifikasi"        // poin, lencana, papan peringkat
  | "lihat_semua_laporan"
  | "lihat_laporan_wilayah"  // hanya laporan di wilayah dinas sendiri
  | "verifikasi"        // menyetujui / menolak laporan masuk
  | "tugaskan"          // menunjuk petugas untuk laporan
  | "ubah_status"       // menandai proses / selesai di lapangan
  | "analitik"          // grafik, tren, ekspor
  | "kelola_pengguna"   // tambah / hapus / ubah user (admin only)
  | "sinyal_darurat";

export interface DefinisiPeran {
  id: Role;
  label: string;
  singkat: string;
  beranda: string;
  kemampuan: readonly Kemampuan[];
  /* Menu yang tampil setelah masuk. Sengaja berbeda tiap peran:
     menu yang tidak bisa dipakai hanya menambah beban pilihan. */
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

/* Navigasi untuk pengunjung yang belum masuk. */
export const NAV_TAMU = [
  { href: "/", label: "Beranda" },
  { href: "/lapor", label: "Form Pelaporan" },
  { href: "/dampak", label: "Dampak Kota" },
] as const;

export function bisa(role: Role | undefined, k: Kemampuan): boolean {
  if (!role) return false;
  return PERAN[role].kemampuan.includes(k);
}

export function berandaPeran(role: Role | undefined): string {
  return role ? PERAN[role].beranda : "/";
}

/* Peran yang diizinkan untuk tiap rute terproteksi.
   Rute yang tidak terdaftar bersifat publik. */
export const AKSES_RUTE: Record<string, readonly Role[]> = {
  "/dashboard": ["admin"],
  "/petugas": ["petugas"],
  "/warga": ["warga"],
  "/dinas": ["dinas"],
};

export function bolehMasukRute(path: string, role: Role | undefined): boolean {
  const entri = Object.entries(AKSES_RUTE).find(([p]) => path.startsWith(p));
  if (!entri) return true;              // rute publik
  if (!role) return false;              // butuh masuk dulu
  return entri[1].includes(role);
}
