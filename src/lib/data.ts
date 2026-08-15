// ============================================================
// SIGAP — Mock Dataset (TypeScript)
// 12 laporan realistis Kota Yogyakarta. Sumber: js/data.js (vanilla).
// ============================================================

export type KategoriId =
  | "jalan" | "sampah" | "banjir" | "lampu" | "keamanan" | "fasum";

export type StatusId =
  | "reported" | "verified" | "assigned" | "in_progress" | "resolved";

export interface Kategori {
  id: KategoriId;
  nama: string;
  ikon: string;
  warna: string;
}

export interface Lokasi { lat: number; lng: number; alamat: string; }

export interface AiResult {
  kategori: string;
  confidence: number;
  severity: number;
  dampak: string;
  priorityScore: number;
}

export interface Laporan {
  id: string;
  judul: string;
  kategori: KategoriId;
  lokasi: Lokasi;
  pelapor: string;
  waktu: string;
  status: StatusId;
  foto: number;
  dukungan: number;
  ai: AiResult;
  sla: string;
}

export const META = {
  platform: "SIGAP — Sistem Informasi & Gerak Aktif Pelaporan",
  wilayah: "Kota Yogyakarta, DIY",
  diperbarui: "2026-01-15T08:30:00+07:00",
};

export const KATEGORI: Kategori[] = [
  { id: "jalan",    nama: "Jalan & Infrastruktur", ikon: "road",   warna: "#0E9F6E" },
  { id: "sampah",   nama: "Sampah & Kebersihan",   ikon: "trash",  warna: "#F59E0B" },
  { id: "banjir",   nama: "Banjir & Drainase",     ikon: "water",  warna: "#3B82F6" },
  { id: "lampu",    nama: "Lampu Jalan",           ikon: "bulb",   warna: "#8B5CF6" },
  { id: "keamanan", nama: "Keamanan & Ketertiban", ikon: "shield", warna: "#E02424" },
  { id: "fasum",    nama: "Fasilitas Umum",        ikon: "park",   warna: "#0EA5E9" },
];

export const STATUS_ORDER: StatusId[] = ["reported", "verified", "assigned", "in_progress", "resolved"];

export const STATUS_LABEL: Record<StatusId, string> = {
  reported: "Reported",
  verified: "Verified",
  assigned: "Assigned",
  in_progress: "In Progress",
  resolved: "Resolved",
};

// Label Bahasa Indonesia sesuai proposal (Petugas Flow: "Diproses" / "Progres")
export const STATUS_LABEL_ID: Record<StatusId, string> = {
  reported: "Dilaporkan",
  verified: "Terverifikasi",
  assigned: "Ditugaskan",
  in_progress: "Diproses",
  resolved: "Selesai",
};

export const LAPORAN: Laporan[] = [
  { id: "SGP-2026-0112", judul: "Lubang besar di Jl. Kaliurang KM 5,2", kategori: "jalan",
    lokasi: { lat: -7.7603, lng: 110.3778, alamat: "Jl. Kaliurang KM 5,2, Sinduadi, Mlati" },
    pelapor: "Bu Ratna S.", waktu: "2026-01-12T06:45:00+07:00", status: "in_progress", foto: 3, dukungan: 47,
    ai: { kategori: "Jalan & Infrastruktur", confidence: 0.96, severity: 8.5, dampak: "Tinggi — jalur padat kendaraan & dekat sekolah", priorityScore: 8.7 }, sla: "48 jam" },
  { id: "SGP-2026-0109", judul: "TPS liar meluap ke bahu jalan", kategori: "sampah",
    lokasi: { lat: -7.8031, lng: 110.3625, alamat: "Jl. Bantul No. 88, Gedongkiwo, Mantrijeron" },
    pelapor: "Pak Darmadi", waktu: "2026-01-11T17:20:00+07:00", status: "verified", foto: 2, dukungan: 31,
    ai: { kategori: "Sampah & Kebersihan", confidence: 0.93, severity: 6.0, dampak: "Sedang — bau & potensi penyakit, dekat pasar", priorityScore: 6.8 }, sla: "72 jam" },
  { id: "SGP-2026-0108", judul: "Drainase tersumbat, air menggenang 30 cm", kategori: "banjir",
    lokasi: { lat: -7.7831, lng: 110.3889, alamat: "Jl. C. Simanjuntak, Terban, Gondokusuman" },
    pelapor: "Mas Gilang", waktu: "2026-01-11T15:05:00+07:00", status: "assigned", foto: 4, dukungan: 58,
    ai: { kategori: "Banjir & Drainase", confidence: 0.97, severity: 9.0, dampak: "Tinggi — genangan masuk rumah warga saat hujan", priorityScore: 9.2 }, sla: "24 jam" },
  { id: "SGP-2026-0105", judul: "Lampu PJU mati beruntun 6 titik", kategori: "lampu",
    lokasi: { lat: -7.8275, lng: 110.3967, alamat: "Jl. Imogiri Timur, Giwangan, Umbulharjo" },
    pelapor: "Bu Sari W.", waktu: "2026-01-10T20:12:00+07:00", status: "resolved", foto: 1, dukungan: 22,
    ai: { kategori: "Lampu Jalan", confidence: 0.91, severity: 5.5, dampak: "Sedang — rawan kecelakaan & tindak kriminal malam", priorityScore: 6.1 }, sla: "72 jam" },
  { id: "SGP-2026-0103", judul: "Portal parkir liar meresahkan pengguna jalan", kategori: "keamanan",
    lokasi: { lat: -7.7926, lng: 110.3658, alamat: "Jl. Malioboro, Sosromenduran, Gedongtengen" },
    pelapor: "Pak Heru N.", waktu: "2026-01-10T11:40:00+07:00", status: "resolved", foto: 2, dukungan: 39,
    ai: { kategori: "Keamanan & Ketertiban", confidence: 0.88, severity: 6.5, dampak: "Sedang — mengganggu kenyamanan wisatawan", priorityScore: 7.0 }, sla: "48 jam" },
  { id: "SGP-2026-0101", judul: "Ayunan taman rusak & berkarat", kategori: "fasum",
    lokasi: { lat: -7.8165, lng: 110.3856, alamat: "Taman Pintar, Panembahan, Kraton" },
    pelapor: "Bu Endah", waktu: "2026-01-09T09:30:00+07:00", status: "resolved", foto: 2, dukungan: 18,
    ai: { kategori: "Fasilitas Umum", confidence: 0.94, severity: 4.0, dampak: "Rendah — risiko cedera ringan anak", priorityScore: 4.5 }, sla: "7 hari" },
  { id: "SGP-2026-0098", judul: "Pohon tumbang menutup separuh jalan", kategori: "jalan",
    lokasi: { lat: -7.7708, lng: 110.4022, alamat: "Jl. Affandi, Caturtunggal, Depok" },
    pelapor: "Pak Bambang R.", waktu: "2026-01-08T16:55:00+07:00", status: "in_progress", foto: 5, dukungan: 64,
    ai: { kategori: "Jalan & Infrastruktur", confidence: 0.98, severity: 8.0, dampak: "Tinggi — arus lalu lintas lumpuh satu arah", priorityScore: 8.4 }, sla: "24 jam" },
  { id: "SGP-2026-0095", judul: "Sampah menyumbat aliran Kali Code", kategori: "banjir",
    lokasi: { lat: -7.7994, lng: 110.3589, alamat: "Bantaran Kali Code, Ngampilan" },
    pelapor: "Bu Lestari", waktu: "2026-01-08T10:15:00+07:00", status: "verified", foto: 3, dukungan: 41,
    ai: { kategori: "Banjir & Drainase", confidence: 0.9, severity: 7.5, dampak: "Tinggi — risiko luapan saat hujan deras", priorityScore: 7.6 }, sla: "48 jam" },
  { id: "SGP-2026-0092", judul: "Lampu taman padam total sepekan", kategori: "lampu",
    lokasi: { lat: -7.8219, lng: 110.3731, alamat: "Alun-Alun Kidul, Kraton" },
    pelapor: "Mas Fajar", waktu: "2026-01-07T19:40:00+07:00", status: "assigned", foto: 2, dukungan: 28,
    ai: { kategori: "Lampu Jalan", confidence: 0.89, severity: 5.0, dampak: "Sedang — area gelap rawan tindak kriminal", priorityScore: 5.8 }, sla: "72 jam" },
  { id: "SGP-2026-0089", judul: "Gang sempit jadi tempat pembuangan akhir liar", kategori: "sampah",
    lokasi: { lat: -7.8356, lng: 110.3812, alamat: "Gang Kemenangan, Prawirodirjan, Gondomanan" },
    pelapor: "Bu Yuni", waktu: "2026-01-07T08:20:00+07:00", status: "reported", foto: 2, dukungan: 15,
    ai: { kategori: "Sampah & Kebersihan", confidence: 0.87, severity: 5.5, dampak: "Sedang — bau menyengat & sarang penyakit", priorityScore: 5.5 }, sla: "72 jam" },
  { id: "SGP-2026-0085", judul: "Begal beraksi di underpass, minim penerangan", kategori: "keamanan",
    lokasi: { lat: -7.7489, lng: 110.3891, alamat: "Underpass Janti, Banguntapan" },
    pelapor: "Pak Agus T.", waktu: "2026-01-06T22:05:00+07:00", status: "reported", foto: 1, dukungan: 52,
    ai: { kategori: "Keamanan & Ketertiban", confidence: 0.85, severity: 8.0, dampak: "Tinggi — ancaman keselamatan pengendara malam", priorityScore: 8.1 }, sla: "24 jam" },
  { id: "SGP-2026-0082", judul: "Halte bus rusak, atap bocor & kursi patah", kategori: "fasum",
    lokasi: { lat: -7.7825, lng: 110.4145, alamat: "Jl. Solo KM 9, Kalasan" },
    pelapor: "Bu Sri M.", waktu: "2026-01-05T14:30:00+07:00", status: "resolved", foto: 2, dukungan: 12,
    ai: { kategori: "Fasilitas Umum", confidence: 0.92, severity: 3.5, dampak: "Rendah — ketidaknyamanan penumpang", priorityScore: 3.8 }, sla: "7 hari" },
];

export const TREN_BULANAN = {
  labels: ["Agu", "Sep", "Okt", "Nov", "Des", "Jan"],
  masuk: [38, 45, 52, 61, 74, 89],
  selesai: [31, 40, 47, 55, 66, 78],
};

export const WAKTU_RESPONS = { jam: [52, 47, 41, 36, 30, 24] };

// ---------- Helper ----------
export function getKategori(id: KategoriId): Kategori {
  return KATEGORI.find((k) => k.id === id) ?? KATEGORI[0];
}

// Skala Skor Urgensi 1–10 sesuai proposal. Skor >= 9 = prioritas darurat.
export function priorityColor(score: number): string {
  if (score >= 9) return "#E02424";
  if (score >= 7) return "#F59E0B";
  if (score >= 5) return "#3B82F6";
  return "#0E9F6E";
}

export function priorityLabel(score: number): string {
  if (score >= 9) return "Darurat";
  if (score >= 7) return "Tinggi";
  if (score >= 5) return "Sedang";
  return "Rendah";
}

export const SKOR_DARURAT = 9;
export const SKOR_MAKS = 10;

export function statusTone(status: StatusId): "neutral" | "info" | "warning" | "success" {
  switch (status) {
    case "verified": return "info";
    case "assigned":
    case "in_progress": return "warning";
    case "resolved": return "success";
    default: return "neutral";
  }
}
