"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { LAPORAN, WILAYAH, type Laporan, type WilayahId, type StatusId } from "@/lib/data";
import { supabase } from "@/lib/supabase";

export type Role = "warga" | "admin" | "petugas" | "dinas";

export interface User {
  nama: string;
  email: string;
  role: Role;
  poin: number;
  level: number;
  lencana: string[];
  wilayah?: WilayahId; // hanya relevan untuk role "dinas"
  telepon?: string;
  alamat?: string;
  foto?: string;
}

export interface UserRecord {
  id: string;
  nama: string;
  email: string;
  role: Role;
  wilayah?: WilayahId;
  telepon?: string;
  alamat?: string;
  foto?: string;
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
  link?: string; // URL tujuan saat notif diklik (opsional)
}

export interface SinyalDarurat {
  id: string;
  jenisLabel: string; // "Keamanan / Kriminal" | "Kebakaran" | "Medis / Kecelakaan"
  lat: number;
  lng: number;
  pelapor: string;
  wilayah: WilayahId;
  waktu: string; // ISO string
}

interface AppState {
  user: User | null;
  hydrated: boolean;
  login: (nama: string, email: string, role: Role, wilayah?: WilayahId, telepon?: string, alamat?: string, foto?: string) => void;
  updateUser: (u: Partial<User>) => void;
  logout: () => void;
  notifs: Notif[];
  tandaiBaca: (id: number) => void;
  tandaiSemuaBaca: () => void;
  tambahNotif: (n: Omit<Notif, "id" | "baca">) => void;
  laporanWarga: Laporan[];
  tambahLaporan: (l: Laporan) => void;
  updateLaporanStatus: (id: string, newStatus: StatusId, notes?: string, fotoUrls?: string[], buktiPetugas?: import("@/lib/data").BuktiPetugas) => Promise<void>;
  kirimBuktiPetugas: (id: string, bukti: import("@/lib/data").BuktiPetugas, targetStatus?: StatusId) => Promise<void>;
  upvoted: Set<string>;
  upvote: (id: string) => void;
  tambahPoin: (n: number) => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
  // User management (admin-only)
  daftarUser: UserRecord[];
  tambahUser: (u: Omit<UserRecord, "id" | "bergabung">) => Promise<{ error?: string }>;
  updateUserRecord: (id: string, u: Partial<UserRecord>) => Promise<void>;
  hapusUser: (id: string) => void;
  ubahStatusUser: (id: string, aktif: boolean) => void;
  // Laporan management (admin & dinas)
  updateLaporan: (id: string, updatedData: Partial<Laporan>) => Promise<void>;
  hapusLaporan: (id: string) => Promise<void>;
  // Sinyal darurat dari tombol SOS warga
  sinyalDarurat: SinyalDarurat[];
  tambahSinyalDarurat: (s: SinyalDarurat) => void;
  hapusSinyalDarurat: (id: string) => void;
}

const Ctx = createContext<AppState | null>(null);

const LEVEL_THRESH = [0, 100, 250, 500, 900];

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [laporanWarga, setLaporanWarga] = useState<Laporan[]>(LAPORAN);
  const [upvoted, setUpvoted] = useState<Set<string>>(new Set());
  const [hydrated, setHydrated] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [daftarUser, setDaftarUser] = useState<UserRecord[]>([]);
  const [sinyalDarurat, setSinyalDarurat] = useState<SinyalDarurat[]>([]);

  // Hydrate dari localStorage & Supabase DB
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

    if (u) setUser(u);
    if (up.size) setUpvoted(up);
    setTheme(th);
    setHydrated(true);
  }, []);

  // Sync laporan table from Supabase DB on load
  useEffect(() => {
    if (!hydrated) return;
    async function fetchSupabaseLaporan() {
      try {
        let fotoCache: Record<string, string[]> = {};
        let buktiCache: Record<string, import("@/lib/data").BuktiPetugas> = {};
        try {
          const raw = localStorage.getItem("sigap_foto_cache");
          if (raw) fotoCache = JSON.parse(raw);
          const rawBukti = localStorage.getItem("sigap_bukti_cache");
          if (rawBukti) buktiCache = JSON.parse(rawBukti);
        } catch {}

        const { data, error } = await supabase
          .from("laporan")
          .select("*")
          .order("waktu", { ascending: false });

        if (!error && data && data.length > 0) {
          const mapped: Laporan[] = data.map((row: any) => {
            const defaultLaporan = LAPORAN.find((x) => x.id === row.id);
            let parsedBukti: import("@/lib/data").BuktiPetugas | undefined =
              row.bukti_petugas || buktiCache[row.id] || defaultLaporan?.buktiPetugas || undefined;
            let displayDampak = row.ai_dampak || "Dianalisis AI";

            if (row.ai_dampak && typeof row.ai_dampak === "string" && row.ai_dampak.includes("[BUKTI_PETUGAS]:")) {
              try {
                const match = row.ai_dampak.match(/\[BUKTI_PETUGAS\]:(.+?)\[\/BUKTI_PETUGAS\]/);
                if (match && match[1]) {
                  parsedBukti = JSON.parse(match[1]);
                  displayDampak = row.ai_dampak.replace(/\[BUKTI_PETUGAS\]:.+?\[\/BUKTI_PETUGAS\]/, "").trim();
                }
              } catch (e) {
                console.warn("Failed to parse buktiPetugas tag:", e);
              }
            }

            return {
              id: row.id,
              judul: row.judul,
              kategori: row.kategori,
              lokasi: { lat: row.lat, lng: row.lng, alamat: row.alamat },
              pelapor: row.pelapor,
              waktu: row.waktu,
              status: row.status,
              foto: row.foto || 1,
              fotoUrls: (row.foto_urls && row.foto_urls.length > 0) ? row.foto_urls : (fotoCache[row.id] || (defaultLaporan?.fotoUrls || [])),
              dukungan: row.dukungan || 0,
              buktiPetugas: parsedBukti,
              ai: {
                kategori: row.ai_kategori || row.kategori,
                confidence: row.ai_confidence || 0.9,
                severity: row.ai_severity || 7.0,
                dampak: displayDampak,
                priorityScore: row.ai_priority_score || 7.0,
                modelUsed: row.ai_model_used || undefined,
              },
              sla: row.sla || "48 jam",
              wilayah: row.wilayah,
            };
          });
          setLaporanWarga(mapped);
        }
      } catch (err) {
        console.warn("Supabase fetch laporan error:", err);
      }
    }
    fetchSupabaseLaporan();

    // Polling setiap 15 detik agar data selalu up-to-date
    const interval = setInterval(fetchSupabaseLaporan, 15_000);
    return () => clearInterval(interval);
  }, [hydrated]);

  // Sync users table from Supabase DB on load
  useEffect(() => {
    if (!hydrated) return;
    async function fetchSupabaseUsers() {
      try {
        const { data, error } = await supabase.from("users").select("*").order("created_at", { ascending: false });
        if (!error && data) {
          const mapped: UserRecord[] = data.map((u: any) => ({
            id: u.id,
            nama: u.nama,
            email: u.email,
            role: u.role || "warga",
            wilayah: u.wilayah || undefined,
            telepon: u.telepon || undefined,
            alamat: u.alamat || undefined,
            foto: u.foto || undefined,
            aktif: u.aktif !== undefined ? u.aktif : true,
            bergabung: u.created_at ? u.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
          }));
          setDaftarUser(mapped);

          if (user?.email) {
            const dbUser = data.find((row: any) => row.email === user.email);
            if (dbUser) {
              setUser((prev) =>
                prev
                  ? {
                      ...prev,
                      nama: dbUser.nama || prev.nama,
                      role: dbUser.role || prev.role,
                      wilayah: dbUser.wilayah || prev.wilayah,
                      telepon: dbUser.telepon || prev.telepon,
                      alamat: dbUser.alamat || prev.alamat,
                      foto: dbUser.foto || prev.foto,
                    }
                  : null
              );
            }
          }
        }
      } catch (err) {
        console.warn("Supabase fetch users error:", err);
      }
    }
    fetchSupabaseUsers();
  }, [hydrated, user?.email]);

  // Realtime Supabase Channel Listener for 'laporan' table
  useEffect(() => {
    if (!hydrated) return;
    const channel = supabase
      .channel("laporan-realtime-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "laporan" },
        (payload) => {
          if (payload.eventType === "UPDATE" && payload.new) {
            const row = payload.new;
            let parsedBukti: import("@/lib/data").BuktiPetugas | undefined = undefined;
            let displayDampak = row.ai_dampak || undefined;

            if (row.ai_dampak && typeof row.ai_dampak === "string" && row.ai_dampak.includes("[BUKTI_PETUGAS]:")) {
              try {
                const match = row.ai_dampak.match(/\[BUKTI_PETUGAS\]:(.+?)\[\/BUKTI_PETUGAS\]/);
                if (match && match[1]) {
                  parsedBukti = JSON.parse(match[1]);
                  displayDampak = row.ai_dampak.replace(/\[BUKTI_PETUGAS\]:.+?\[\/BUKTI_PETUGAS\]/, "").trim();
                }
              } catch {}
            }

            setLaporanWarga((prev) =>
              prev.map((l) => {
                if (l.id !== row.id) return l;
                const newFotoUrls = (row.foto_urls && row.foto_urls.length > 0) ? row.foto_urls : l.fotoUrls;
                return {
                  ...l,
                  status: row.status || l.status,
                  fotoUrls: newFotoUrls,
                  foto: newFotoUrls ? newFotoUrls.length : l.foto,
                  dukungan: row.dukungan !== undefined ? row.dukungan : l.dukungan,
                  buktiPetugas: parsedBukti !== undefined ? parsedBukti : l.buktiPetugas,
                  ai: {
                    ...l.ai,
                    dampak: displayDampak || l.ai.dampak,
                  },
                };
              })
            );
          } else if (payload.eventType === "INSERT" && payload.new) {
            const row = payload.new;
            setLaporanWarga((prev) => {
              if (prev.some((l) => l.id === row.id)) return prev;
              return [
                {
                  id: row.id,
                  judul: row.judul,
                  kategori: row.kategori,
                  lokasi: { lat: row.lat, lng: row.lng, alamat: row.alamat },
                  pelapor: row.pelapor,
                  waktu: row.waktu,
                  status: row.status,
                  foto: row.foto || 1,
                  fotoUrls: row.foto_urls || [],
                  dukungan: row.dukungan || 0,
                  ai: {
                    kategori: row.ai_kategori || row.kategori,
                    confidence: row.ai_confidence || 0.9,
                    severity: row.ai_severity || 7.0,
                    dampak: row.ai_dampak || "Dianalisis AI",
                    priorityScore: row.ai_priority_score || 7.0,
                    modelUsed: row.ai_model_used,
                  },
                  sla: row.sla || "48 jam",
                  wilayah: row.wilayah,
                },
                ...prev,
              ];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [hydrated]);

  // Sync sinyalDarurat secara otomatis dari laporanWarga (yang dipersist ke DB Supabase)
  useEffect(() => {
    const activeSosLaporan = laporanWarga.filter(
      (l) => (l.id.startsWith("SOS-") || l.judul.includes("SOS DARURAT")) && l.status !== "resolved"
    );

    const derived: SinyalDarurat[] = activeSosLaporan.map((l) => {
      let jenisLabel = "SOS Darurat";
      if (l.judul.includes("—")) {
        jenisLabel = l.judul.split("—")[1]?.trim() || "SOS Darurat";
      }
      return {
        id: l.id,
        jenisLabel,
        lat: l.lokasi.lat,
        lng: l.lokasi.lng,
        pelapor: l.pelapor,
        wilayah: l.wilayah,
        waktu: l.waktu,
      };
    });

    setSinyalDarurat((prev) => {
      const map = new Map<string, SinyalDarurat>();
      derived.forEach((item) => map.set(item.id, item));
      prev.forEach((item) => {
        if (!map.has(item.id)) map.set(item.id, item);
      });
      return Array.from(map.values());
    });
  }, [laporanWarga]);

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

  const login = (nama: string, email: string, role: Role, wilayah?: WilayahId, telepon?: string, alamat?: string, foto?: string) => {
    setUser({ nama, email, role, poin: 40, level: 1, lencana: ["Pelapor Pertama"], wilayah, telepon, alamat, foto });
  };

  const updateUser = (data: Partial<User>) => {
    setUser((u) => (u ? { ...u, ...data } : null));
  };

  const logout = () => setUser(null);

  const tandaiBaca = (id: number) =>
    setNotifs((ns) => ns.map((n) => (n.id === id ? { ...n, baca: true } : n)));
  const tandaiSemuaBaca = () => setNotifs((ns) => ns.map((n) => ({ ...n, baca: true })));

  const tambahNotif = (n: Omit<Notif, "id" | "baca">) =>
    setNotifs((ns) => [{ ...n, id: Date.now(), baca: false }, ...ns]);

  const updateLaporanStatus = async (
    id: string,
    newStatus: StatusId,
    notes?: string,
    fotoUrls?: string[],
    buktiPetugas?: import("@/lib/data").BuktiPetugas
  ) => {
    // 1. Optimistic Update React Local State & Cache
    setLaporanWarga((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        const mergedFoto = fotoUrls && fotoUrls.length > 0 
          ? Array.from(new Set([...(l.fotoUrls || []), ...fotoUrls])) 
          : l.fotoUrls;
        return {
          ...l,
          status: newStatus,
          fotoUrls: mergedFoto,
          foto: mergedFoto ? mergedFoto.length : l.foto,
          buktiPetugas: buktiPetugas !== undefined ? buktiPetugas : l.buktiPetugas,
        };
      })
    );

    if (fotoUrls && fotoUrls.length > 0) {
      try {
        const raw = localStorage.getItem("sigap_foto_cache");
        const cache = raw ? JSON.parse(raw) : {};
        cache[id] = Array.from(new Set([...(cache[id] || []), ...fotoUrls]));
        localStorage.setItem("sigap_foto_cache", JSON.stringify(cache));
      } catch {}
    }

    if (buktiPetugas) {
      try {
        const rawBukti = localStorage.getItem("sigap_bukti_cache");
        const buktiCache = rawBukti ? JSON.parse(rawBukti) : {};
        buktiCache[id] = buktiPetugas;
        localStorage.setItem("sigap_bukti_cache", JSON.stringify(buktiCache));
      } catch {}
    }

    // 2. Persist to Supabase DB
    try {
      const updatePayload: Record<string, unknown> = { status: newStatus };
      if (fotoUrls && fotoUrls.length > 0) {
        updatePayload.foto_urls = fotoUrls;
      }

      const { error } = await supabase.from("laporan").update(updatePayload).eq("id", id);
      if (error) {
        console.warn("Supabase update status laporan error:", error.message);
        if (error.message.includes("foto_urls") || error.code === "42703") {
          await supabase.from("laporan").update({ status: newStatus }).eq("id", id);
        }
      }
    } catch (err) {
      console.warn("Could not update laporan in Supabase DB:", err);
    }
  };

  const kirimBuktiPetugas = async (
    id: string,
    bukti: import("@/lib/data").BuktiPetugas,
    targetStatus: StatusId = "in_progress"
  ) => {
    setLaporanWarga((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        return {
          ...l,
          status: targetStatus,
          buktiPetugas: bukti,
        };
      })
    );

    try {
      const rawBukti = localStorage.getItem("sigap_bukti_cache");
      const buktiCache = rawBukti ? JSON.parse(rawBukti) : {};
      buktiCache[id] = bukti;
      localStorage.setItem("sigap_bukti_cache", JSON.stringify(buktiCache));
    } catch {}

    try {
      const target = laporanWarga.find((l) => l.id === id);
      const mergedPhotos = Array.from(new Set([...(target?.fotoUrls || []), ...(bukti.fotoUrls || [])]));
      
      const cleanDampak = (target?.ai.dampak || "Dianalisis AI").replace(/\[BUKTI_PETUGAS\]:.+?\[\/BUKTI_PETUGAS\]/, "").trim();
      const buktiTag = `[BUKTI_PETUGAS]:${JSON.stringify(bukti)}[/BUKTI_PETUGAS]`;
      const combinedDampak = `${cleanDampak} ${buktiTag}`.trim();

      const updatePayload: Record<string, unknown> = {
        status: targetStatus,
        ai_dampak: combinedDampak,
      };
      if (mergedPhotos.length > 0) {
        updatePayload.foto_urls = mergedPhotos;
        updatePayload.foto = mergedPhotos.length;
      }

      const { error } = await supabase.from("laporan").update(updatePayload).eq("id", id);
      if (error) {
        console.warn("Supabase kirimBuktiPetugas update error:", error.message);
      }
    } catch (err) {
      console.warn("Supabase kirimBuktiPetugas update failed:", err);
    }
  };

  const tambahLaporan = async (l: Laporan) => {
    setLaporanWarga((ls) => [l, ...ls]);
    if (l.fotoUrls && l.fotoUrls.length > 0) {
      try {
        const raw = localStorage.getItem("sigap_foto_cache");
        const cache = raw ? JSON.parse(raw) : {};
        cache[l.id] = l.fotoUrls;
        localStorage.setItem("sigap_foto_cache", JSON.stringify(cache));
      } catch {}
    }

    try {
      let userId: string | null = null;
      if (user?.email) {
        const { data: userData } = await supabase
          .from("users")
          .select("id")
          .eq("email", user.email)
          .single();
        if (userData?.id) userId = userData.id;
      }

      const insertPayload: Record<string, unknown> = {
        id: l.id,
        user_id: userId,
        pelapor: l.pelapor,
        judul: l.judul,
        kategori: l.kategori,
        status: l.status,
        waktu: l.waktu,
        lat: l.lokasi.lat,
        lng: l.lokasi.lng,
        alamat: l.lokasi.alamat,
        wilayah: l.wilayah,
        foto: l.foto,
        dukungan: l.dukungan,
        sla: l.sla,
        ai_kategori: l.ai.kategori,
        ai_confidence: l.ai.confidence,
        ai_severity: l.ai.severity,
        ai_dampak: l.ai.dampak,
        ai_priority_score: l.ai.priorityScore,
        ai_model_used: l.ai.modelUsed || "Local Intelligent Rules",
      };

      if (l.fotoUrls && l.fotoUrls.length > 0) {
        insertPayload.foto_urls = l.fotoUrls;
      }

      const { error: insertError } = await supabase.from("laporan").insert(insertPayload);
      if (insertError) {
        if (insertError.message.includes("foto_urls") || insertError.code === "42703") {
          const { foto_urls, ...withoutFoto } = insertPayload;
          void foto_urls;
          await supabase.from("laporan").insert(withoutFoto);
        }
      }
    } catch (err) {
      console.warn("Could not insert laporan to Supabase DB:", err);
    }

    if (l.ai.priorityScore >= 9) {
      const wilayahData = WILAYAH.find((w) => w.id === l.wilayah);
      const namaWilayah = wilayahData?.nama ?? "wilayah terkait";
      setNotifs((ns) => [
        {
          id: Date.now(),
          judul: "🚨 Laporan Darurat Masuk",
          pesan: `${l.id} di ${namaWilayah} memerlukan penanganan segera.`,
          waktu: "Baru saja",
          baca: false,
          tone: "danger" as const,
          link: "/peta",
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

  const tambahSinyalDarurat = (s: SinyalDarurat) => {
    setSinyalDarurat((prev) => [s, ...prev.filter((x) => x.id !== s.id)]);

    // Map jenis SOS ke kategori laporan (semua sinyal darurat masuk kategori "keamanan")
    let kat: import("@/lib/data").KategoriId = "keamanan";

    const wilayahData = WILAYAH.find((w) => w.id === s.wilayah);
    const namaWilayah = wilayahData?.nama ?? "Wilayah Terkait";

    // Buat objek Laporan darurat dengan priorityScore = 10 agar langsung naik ke prioritas tertinggi Dinas
    const sosLaporan: Laporan = {
      id: s.id,
      judul: `🚨 SOS Darurat — ${s.jenisLabel}`,
      kategori: kat,
      status: "reported",
      lokasi: { lat: s.lat, lng: s.lng, alamat: `GPS ${s.lat.toFixed(5)}, ${s.lng.toFixed(5)}` },
      pelapor: s.pelapor,
      waktu: s.waktu || new Date().toISOString(),
      foto: 0,
      dukungan: 0,
      sla: "15 menit",
      wilayah: s.wilayah,
      ai: {
        kategori: s.jenisLabel,
        confidence: 1.0,
        severity: 10,
        dampak: `Sinyal Darurat SOS ${s.pelapor} di ${namaWilayah}`,
        priorityScore: 10,
        modelUsed: "Emergency SOS",
      },
    };

    // Simpan ke state laporan & DB Supabase
    void tambahLaporan(sosLaporan);

    // Auto-notif danger ke bell untuk semua pengguna (termasuk dinas)
    setNotifs((ns) => [
      {
        id: Date.now(),
        judul: `🚨 Sinyal SOS — ${s.jenisLabel}`,
        pesan: `${s.pelapor} mengirim sinyal darurat di ${namaWilayah}.`,
        waktu: "Baru saja",
        baca: false,
        tone: "danger" as const,
        link: "/peta",
      },
      ...ns,
    ]);
  };

  const hapusSinyalDarurat = (id: string) => {
    setSinyalDarurat((prev) => prev.filter((s) => s.id !== id));
    // Set status laporan SOS ke resolved di state & Supabase DB
    void updateLaporanStatus(id, "resolved");
  };

  const upvote = async (id: string) => {
    if (upvoted.has(id)) return;
    setUpvoted((s) => new Set(s).add(id));
    setLaporanWarga((ls) => ls.map((l) => (l.id === id ? { ...l, dukungan: l.dukungan + 1 } : l)));
    tambahPoin(5);

    try {
      const target = laporanWarga.find((l) => l.id === id);
      if (target) {
        await supabase
          .from("laporan")
          .update({ dukungan: target.dukungan + 1 })
          .eq("id", id);
      }
    } catch (e) {
      console.warn("Supabase upvote sync failed:", e);
    }
  };

  // User management functions (via /api/admin-user — uses Service Role Key, bypass RLS)
  const tambahUser = async (u: Omit<UserRecord, "id" | "bergabung">): Promise<{ error?: string }> => {
    const tempId = `u${Date.now()}`;
    const newUser: UserRecord = {
      ...u,
      id: tempId,
      bergabung: new Date().toISOString().slice(0, 10),
    };
    // Optimistic update dulu
    setDaftarUser((prev) => [...prev, newUser]);

    try {
      const res = await fetch("/api/admin-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama: u.nama,
          email: u.email,
          role: u.role,
          wilayah: u.wilayah || null,
          telepon: u.telepon || null,
          alamat: u.alamat || null,
          aktif: u.aktif !== undefined ? u.aktif : true,
        }),
      });
      const result = await res.json();

      if (!res.ok || result.error) {
        // Rollback optimistic update jika gagal
        setDaftarUser((prev) => prev.filter((x) => x.id !== tempId));
        console.error("[tambahUser] API error:", result.error);
        return { error: result.error || "Gagal menyimpan user ke database" };
      }

      // Update id dengan id asli dari DB
      if (result.data?.id) {
        setDaftarUser((prev) =>
          prev.map((x) => (x.id === tempId ? { ...x, id: result.data.id } : x))
        );
      }
      return {};
    } catch (e: any) {
      setDaftarUser((prev) => prev.filter((x) => x.id !== tempId));
      console.error("[tambahUser] Fetch error:", e);
      return { error: e.message || "Network error" };
    }
  };

  const hapusUser = async (id: string) => {
    // Optimistic update
    const snapshot = daftarUser;
    setDaftarUser((prev) => prev.filter((u) => u.id !== id));
    try {
      const res = await fetch(`/api/admin-user?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!res.ok) {
        const result = await res.json();
        console.error("[hapusUser] API error:", result.error);
        setDaftarUser(snapshot); // rollback
      }
    } catch (e) {
      console.error("[hapusUser] Fetch error:", e);
      setDaftarUser(snapshot);
    }
  };

  const ubahStatusUser = async (id: string, aktif: boolean) => {
    // Optimistic update
    setDaftarUser((prev) => prev.map((u) => (u.id === id ? { ...u, aktif } : u)));
    try {
      const res = await fetch("/api/admin-user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, aktif }),
      });
      if (!res.ok) {
        const result = await res.json();
        console.error("[ubahStatusUser] API error:", result.error);
        // Rollback
        setDaftarUser((prev) => prev.map((u) => (u.id === id ? { ...u, aktif: !aktif } : u)));
      }
    } catch (e) {
      console.error("[ubahStatusUser] Fetch error:", e);
      setDaftarUser((prev) => prev.map((u) => (u.id === id ? { ...u, aktif: !aktif } : u)));
    }
  };

  const updateUserRecord = async (id: string, u: Partial<UserRecord>) => {
    // Optimistic update
    setDaftarUser((prev) => prev.map((item) => (item.id === id ? { ...item, ...u } : item)));
    try {
      const res = await fetch("/api/admin-user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...u }),
      });
      if (!res.ok) {
        const result = await res.json();
        console.error("[updateUserRecord] API error:", result.error);
      }
    } catch (e) {
      console.error("[updateUserRecord] Fetch error:", e);
    }
  };

  const updateLaporan = async (id: string, updatedData: Partial<Laporan>) => {
    setLaporanWarga((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        return {
          ...l,
          ...updatedData,
          lokasi: updatedData.lokasi ? { ...l.lokasi, ...updatedData.lokasi } : l.lokasi,
          ai: updatedData.ai ? { ...l.ai, ...updatedData.ai } : l.ai,
        };
      })
    );

    try {
      const dbPayload: Record<string, unknown> = {};
      if (updatedData.judul !== undefined) dbPayload.judul = updatedData.judul;
      if (updatedData.kategori !== undefined) dbPayload.kategori = updatedData.kategori;
      if (updatedData.status !== undefined) dbPayload.status = updatedData.status;
      if (updatedData.wilayah !== undefined) dbPayload.wilayah = updatedData.wilayah;
      if (updatedData.sla !== undefined) dbPayload.sla = updatedData.sla;

      if (updatedData.lokasi) {
        if (updatedData.lokasi.alamat !== undefined) dbPayload.alamat = updatedData.lokasi.alamat;
        if (updatedData.lokasi.lat !== undefined) dbPayload.lat = updatedData.lokasi.lat;
        if (updatedData.lokasi.lng !== undefined) dbPayload.lng = updatedData.lokasi.lng;
      }

      if (updatedData.ai) {
        if (updatedData.ai.kategori !== undefined) dbPayload.ai_kategori = updatedData.ai.kategori;
        if (updatedData.ai.confidence !== undefined) dbPayload.ai_confidence = updatedData.ai.confidence;
        if (updatedData.ai.severity !== undefined) dbPayload.ai_severity = updatedData.ai.severity;
        if (updatedData.ai.dampak !== undefined) dbPayload.ai_dampak = updatedData.ai.dampak;
        if (updatedData.ai.priorityScore !== undefined) dbPayload.ai_priority_score = updatedData.ai.priorityScore;
      }

      if (updatedData.fotoUrls !== undefined) {
        dbPayload.foto_urls = updatedData.fotoUrls;
        dbPayload.foto = updatedData.fotoUrls.length;
      }

      if (Object.keys(dbPayload).length > 0) {
        const { error } = await supabase.from("laporan").update(dbPayload).eq("id", id);
        if (error && (error.message.includes("foto_urls") || error.code === "42703")) {
          delete dbPayload.foto_urls;
          await supabase.from("laporan").update(dbPayload).eq("id", id);
        }
      }
    } catch (e) {
      console.warn("Supabase update laporan failed:", e);
    }
  };

  const hapusLaporan = async (id: string) => {
    setLaporanWarga((prev) => prev.filter((l) => l.id !== id));
    try {
      await supabase.from("laporan").delete().eq("id", id);
    } catch (e) {
      console.warn("Supabase delete laporan failed:", e);
    }
  };

  const value: AppState = {
    user, hydrated, login, updateUser, logout,
    notifs, tandaiBaca, tandaiSemuaBaca, tambahNotif,
    laporanWarga, tambahLaporan, updateLaporanStatus, kirimBuktiPetugas, updateLaporan, hapusLaporan, upvoted, upvote, tambahPoin,
    theme, toggleTheme,
    daftarUser, tambahUser, updateUserRecord, hapusUser, ubahStatusUser,
    sinyalDarurat, tambahSinyalDarurat, hapusSinyalDarurat,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp harus dipakai di dalam AppProvider");
  return ctx;
}

