"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { LAPORAN, type Laporan } from "@/lib/data";

export type Role = "warga" | "admin" | "petugas";

export interface User {
  nama: string;
  email: string;
  role: Role;
  poin: number;
  level: number;
  lencana: string[];
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
  login: (nama: string, email: string, role: Role) => void;
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
}

const Ctx = createContext<AppState | null>(null);

const SEED_NOTIFS: Notif[] = [
  { id: 1, judul: "Laporan Diverifikasi", pesan: "SGP-2026-0108 telah diverifikasi admin.", waktu: "5 mnt lalu", baca: false, tone: "info" },
  { id: 2, judul: "Tim Ditugaskan", pesan: "SGP-2026-0098 kini ditangani tim lapangan.", waktu: "1 jam lalu", baca: false, tone: "warning" },
  { id: 3, judul: "Laporan Selesai", pesan: "SGP-2026-0101 telah diselesaikan. Terima kasih!", waktu: "3 jam lalu", baca: true, tone: "success" },
];

const LEVEL_THRESH = [0, 100, 250, 500, 900];

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [notifs, setNotifs] = useState<Notif[]>(SEED_NOTIFS);
  const [laporanWarga, setLaporanWarga] = useState<Laporan[]>(LAPORAN);
  const [upvoted, setUpvoted] = useState<Set<string>>(new Set());
  const [hydrated, setHydrated] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

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

  const login = (nama: string, email: string, role: Role) => {
    setUser({ nama, email, role, poin: 40, level: 1, lencana: ["Pelapor Pertama"] });
  };

  const logout = () => setUser(null);

  const tandaiBaca = (id: number) =>
    setNotifs((ns) => ns.map((n) => (n.id === id ? { ...n, baca: true } : n)));
  const tandaiSemuaBaca = () => setNotifs((ns) => ns.map((n) => ({ ...n, baca: true })));

  const tambahNotif = (n: Omit<Notif, "id" | "baca">) =>
    setNotifs((ns) => [{ ...n, id: Date.now(), baca: false }, ...ns]);

  const tambahLaporan = (l: Laporan) => setLaporanWarga((ls) => [l, ...ls]);

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

  const value: AppState = {
    user, hydrated, login, logout,
    notifs, tandaiBaca, tandaiSemuaBaca, tambahNotif,
    laporanWarga, tambahLaporan, upvoted, upvote, tambahPoin,
    theme, toggleTheme,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp harus dipakai di dalam AppProvider");
  return ctx;
}
