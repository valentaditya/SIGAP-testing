"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { LAPORAN, WILAYAH, type Laporan, type WilayahId } from "@/lib/data";

export type Role = "warga" | "admin" | "petugas" | "dinas";

export interface User {
  nama: string;
  email: string;
  role: Role;
  poin: number;
  level: number;
  lencana: string[];
  wilayah?: WilayahId; // hanya relevan untuk role "dinas"
}

export interface UserRecord {
  id: string;
  nama: string;
  email: string;
  role: Role;
  wilayah?: WilayahId;
  aktif: boolean;
  bergabung: string;
}

export interface Notif {
  id: number;
  judul: string;
  pesan: string;
  waktu: string;
  baca: boolean;
  tone: "info" | "success" | "warning" | "danger";
}

interface AppState {
  user: User | null;
  hydrated: boolean;
  login: (nama: string, email: string, role: Role, wilayah?: WilayahId) => void;
  logout: () => void;
  notifs: Notif[];
  tandaiBaca: (id: number) => void;
  tandaiSemuaBaca: () => void;
  tambahNotif: (n: Omit<Notif, "id" | "baca">) => void;
  laporanWarga: Laporan[];
  tambahLaporan: (l: Laporan) => void;
  upvoted: Set<string>;
  upvote: (id: string) => void;
  tambahPoin: (n: number) => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
  // User management (admin-only)
  daftarUser: UserRecord[];
  tambahUser: (u: Omit<UserRecord, "id" | "bergabung">) => void;
  hapusUser: (id: string) => void;
  ubahStatusUser: (id: string, aktif: boolean) => void;
}

const Ctx = createContext<AppState | null>(null);

const SEED_NOTIFS: Notif[] = [
  { id: 1, judul: "Laporan Diverifikasi", pesan: "SGP-2026-0108 telah diverifikasi admin.", waktu: "5 mnt lalu", baca: false, tone: "info" },
  { id: 2, judul: "Tim Ditugaskan", pesan: "SGP-2026-0098 kini ditangani tim lapangan.", waktu: "1 jam lalu", baca: false, tone: "warning" },
  { id: 3, judul: "Laporan Selesai", pesan: "SGP-2026-0101 telah diselesaikan. Terima kasih!", waktu: "3 jam lalu", baca: true, tone: "success" },
];

// Data awal user management
const SEED_USERS: UserRecord[] = [
  { id: "u001", nama: "Budi Santoso", email: "budi.admin@jogjakota.go.id", role: "admin", aktif: true, bergabung: "2025-06-01" },
  { id: "u002", nama: "Agus Prasetyo", email: "agus.petugas@sigap.id", role: "petugas", aktif: true, bergabung: "2025-07-15" },
  { id: "u003", nama: "Rina Kusuma", email: "rina.warga@sigap.id", role: "warga", aktif: true, bergabung: "2025-08-20" },
  { id: "u004", nama: "Pak Hendra Wijaya", email: "kepala.dinas@slemankab.go.id", role: "dinas", wilayah: "sleman", aktif: true, bergabung: "2025-09-01" },
  { id: "u005", nama: "Bu Dewi Rahayu", email: "kepala.dinas@bantulkab.go.id", role: "dinas", wilayah: "bantul", aktif: true, bergabung: "2025-09-01" },
  { id: "u006", nama: "Pak Tono Susanto", email: "kepala.dinas@jogjakota.go.id", role: "dinas", wilayah: "kota_yogya", aktif: true, bergabung: "2025-09-01" },
  { id: "u007", nama: "Bu Sinta Nurhayati", email: "kepala.dinas@gunungkidulkab.go.id", role: "dinas", wilayah: "gunungkidul", aktif: false, bergabung: "2025-10-01" },
];

const LEVEL_THRESH = [0, 100, 250, 500, 900];

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [notifs, setNotifs] = useState<Notif[]>(SEED_NOTIFS);
  const [laporanWarga, setLaporanWarga] = useState<Laporan[]>(LAPORAN);
  const [upvoted, setUpvoted] = useState<Set<string>>(new Set());
  const [hydrated, setHydrated] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [daftarUser, setDaftarUser] = useState<UserRecord[]>(SEED_USERS);

  // Hydrate dari localStorage.
  // Semua pembacaan digabung jadi SATU commit batch supaya tidak memicu
  // render berantai. localStorage mustahil dibaca saat render server,
  // jadi efek sekali-jalan ini memang satu-satunya tempat yang benar.
  useEffect(() => {
    let u: User | null = null;
    let up: Set<string> = new Set();
    let th: "light" | "dark" = "light";
    try {
      const rawU = localStorage.getItem("sigap_user");
      if (rawU) u = JSON.parse(rawU) as User;
      const rawUp = localStorage.getItem("sigap_upvoted");
      if (rawUp) up = new Set(JSON.parse(rawUp) as string[]);
      const rawTh = localStorage.getItem("sigap_theme");
      if (rawTh === "dark" || rawTh === "light") th = rawTh;
      else if (window.matchMedia("(prefers-color-scheme: dark)").matches) th = "dark";
    } catch {}
    // React membatch keempatnya menjadi satu commit, jadi hanya ada
    // satu render tambahan setelah hidrasi.
    /* eslint-disable react-hooks/set-state-in-effect */
    if (u) setUser(u);
    if (up.size) setUpvoted(up);
    setTheme(th);
    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      if (user) localStorage.setItem("sigap_user", JSON.stringify(user));
      else localStorage.removeItem("sigap_user");
    } catch {}
  }, [user, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem("sigap_upvoted", JSON.stringify([...upvoted])); } catch {}
  }, [upvoted, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem("sigap_theme", theme); } catch {}
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme, hydrated]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  function levelDariPoin(p: number) {
    let lv = 1;
    LEVEL_THRESH.forEach((t, i) => { if (p >= t) lv = i + 1; });
    return lv;
  }

  function lencanaDari(p: number, jmlLapor: number): string[] {
    const b: string[] = [];
    if (jmlLapor >= 1) b.push("Pelapor Pertama");
    if (p >= 100) b.push("Warga Aktif");
    if (p >= 250) b.push("Pahlawan Lingkungan");
    if (p >= 500) b.push("Guardian Kota");
    return b;
  }

  const login = (nama: string, email: string, role: Role, wilayah?: WilayahId) => {
    setUser({ nama, email, role, poin: 40, level: 1, lencana: ["Pelapor Pertama"], wilayah });
  };

  const logout = () => setUser(null);

  const tandaiBaca = (id: number) =>
    setNotifs((ns) => ns.map((n) => (n.id === id ? { ...n, baca: true } : n)));
  const tandaiSemuaBaca = () => setNotifs((ns) => ns.map((n) => ({ ...n, baca: true })));

  const tambahNotif = (n: Omit<Notif, "id" | "baca">) =>
    setNotifs((ns) => [{ ...n, id: Date.now(), baca: false }, ...ns]);

  const tambahLaporan = (l: Laporan) => {
    setLaporanWarga((ls) => [l, ...ls]);
    // AUTO-ROUTING: jika priorityScore >= 9, kirim notif darurat ke dinas terkait
    if (l.ai.priorityScore >= 9) {
      const wilayahData = WILAYAH.find((w) => w.id === l.wilayah);
      const namaWilayah = wilayahData?.nama ?? "wilayah terkait";
      setNotifs((ns) => [
        {
          id: Date.now(),
          judul: "🚨 DARURAT — Auto-Route ke Dinas",
          pesan: `${l.id} (Skor ${l.ai.priorityScore}/10) di ${namaWilayah} — diteruskan otomatis ke dinas.`,
          waktu: "Baru saja",
          baca: false,
          tone: "danger",
        },
        ...ns,
      ]);
    }
  };

  const tambahPoin = (n: number) =>
    setUser((u) => {
      if (!u) return u;
      const poin = u.poin + n;
      return { ...u, poin, level: levelDariPoin(poin), lencana: lencanaDari(poin, laporanWarga.length) };
    });

  const upvote = (id: string) => {
    if (upvoted.has(id)) return;
    setUpvoted((s) => new Set(s).add(id));
    setLaporanWarga((ls) => ls.map((l) => (l.id === id ? { ...l, dukungan: l.dukungan + 1 } : l)));
    tambahPoin(5);
  };

  // User management functions
  const tambahUser = (u: Omit<UserRecord, "id" | "bergabung">) => {
    const newUser: UserRecord = {
      ...u,
      id: `u${Date.now()}`,
      bergabung: new Date().toISOString().slice(0, 10),
    };
    setDaftarUser((prev) => [...prev, newUser]);
  };

  const hapusUser = (id: string) => {
    setDaftarUser((prev) => prev.filter((u) => u.id !== id));
  };

  const ubahStatusUser = (id: string, aktif: boolean) => {
    setDaftarUser((prev) => prev.map((u) => (u.id === id ? { ...u, aktif } : u)));
  };

  const value: AppState = {
    user, hydrated, login, logout,
    notifs, tandaiBaca, tandaiSemuaBaca, tambahNotif,
    laporanWarga, tambahLaporan, upvoted, upvote, tambahPoin,
    theme, toggleTheme,
    daftarUser, tambahUser, hapusUser, ubahStatusUser,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp harus dipakai di dalam AppProvider");
  return ctx;
}
