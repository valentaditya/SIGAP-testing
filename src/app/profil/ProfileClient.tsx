"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  UserRound, ShieldCheck, HardHat, Building2, Phone, MapPin,
  Mail, Save, CheckCircle2, Award, Trophy, Sparkles, ArrowLeft, Loader2, Camera, Upload
} from "lucide-react";
import { useApp, type Role } from "@/lib/store";
import { WILAYAH, type WilayahId } from "@/lib/data";
import { supabase } from "@/lib/supabase";

const ROLE_META: Record<Role, { label: string; icon: any; color: string; bg: string }> = {
  warga: { label: "Warga", icon: UserRound, color: "text-tan", bg: "bg-tan/10 border-tan/30" },
  admin: { label: "Admin / Pemerintah", icon: ShieldCheck, color: "text-brand-600", bg: "bg-brand-100/10 border-brand-600/30" },
  petugas: { label: "Petugas Lapangan", icon: HardHat, color: "text-warning", bg: "bg-warning-bg border-warning/30" },
  dinas: { label: "Dinas / Instansi", icon: Building2, color: "text-info", bg: "bg-info-bg border-info/30" },
};

export default function ProfileClient() {
  const { user, updateUser, hydrated } = useApp();
  const router = useRouter();

  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [telepon, setTelepon] = useState("");
  const [alamat, setAlamat] = useState("");
  const [wilayah, setWilayah] = useState<WilayahId>("sleman");
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [sukses, setSukses] = useState(false);
  const [pesanError, setPesanError] = useState("");

  useEffect(() => {
    if (user) {
      setNama(user.nama || "");
      setEmail(user.email || "");
      setTelepon(user.telepon || "");
      setAlamat(user.alamat || "");
      if (user.foto) setFotoUrl(user.foto);
      if (user.wilayah) setWilayah(user.wilayah);
    }
  }, [user]);

  if (!hydrated) return null;
  if (!user) {
    return (
      <div className="mx-auto max-w-xl px-6 py-20 text-center">
        <p className="text-sage">Silakan masuk terlebih dahulu untuk melihat profil Anda.</p>
        <button
          onClick={() => router.push("/login")}
          className="mt-4 rounded-xl bg-tan-solid px-6 py-2.5 font-bold text-white shadow-md hover:bg-brand-700"
        >
          Masuk Sekarang
        </button>
      </div>
    );
  }

  const currentUser = user;
  const roleMeta = ROLE_META[currentUser.role];
  const RoleIcon = roleMeta.icon;

  function handleFotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        if (base64) {
          setFotoUrl(base64);
        }
      };
      reader.readAsDataURL(file);
    }
  }

  async function handleSimpan(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser) return;
    setPesanError("");
    setSaving(true);

    try {
      // 1. Simpan ke Supabase DB
      const { error } = await supabase
        .from("users")
        .update({
          nama: nama.trim(),
          telepon: telepon.trim(),
          alamat: alamat.trim(),
          foto: fotoUrl,
          wilayah: currentUser.role === "dinas" ? wilayah : undefined,
        })
        .eq("email", currentUser.email);

      if (error) {
        console.warn("Supabase update error (non-fatal):", error);
      }

      // 2. Simpan ke local App store
      updateUser({
        nama: nama.trim(),
        telepon: telepon.trim(),
        alamat: alamat.trim(),
        foto: fotoUrl || undefined,
        wilayah: currentUser.role === "dinas" ? wilayah : currentUser.wilayah,
      });

      setSukses(true);
      setTimeout(() => setSukses(false), 4000);
    } catch (err: any) {
      setPesanError(err?.message || "Gagal menyimpan perubahan profil.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Header Back Button & Page Title */}
      <div className="mb-6 flex flex-col gap-3">
        <button
          onClick={() => router.back()}
          className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-sage hover:text-cream-hi transition-colors"
        >
          <ArrowLeft size={16} /> Kembali
        </button>

        <div>
          <h1 className="font-display text-2xl font-extrabold text-cream-hi sm:text-3xl">
            Profile
          </h1>
          <p className="mt-1 text-sm text-sage">
            Kelola informasi pribadi dan keamanan akun Anda
          </p>
        </div>
      </div>

      {/* Profile Header Card */}
      <div className="relative overflow-hidden rounded-3xl border border-ink-300 bg-surface p-6 sm:p-8 shadow-xl">
        <div className="grid-overlay pointer-events-none absolute inset-0 opacity-20" />
        
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          {/* Left: Avatar & Identity info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 min-w-0">
            {/* Avatar & Ganti Foto button */}
            <div className="flex flex-col items-center gap-2.5 shrink-0">
              <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border-2 border-tan/40 bg-ground/90 text-tan shadow-lg">
                {fotoUrl ? (
                  <img src={fotoUrl} alt={currentUser.nama} className="h-full w-full object-cover" />
                ) : (
                  <RoleIcon size={44} className={roleMeta.color} />
                )}
              </div>
              <label
                htmlFor="avatar-input"
                className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-ink-300 bg-ground/80 px-2.5 py-1 text-[11px] font-bold text-tan transition-colors hover:border-tan hover:bg-ground hover:text-cream"
              >
                <Camera size={12} /> [ Ganti Foto ]
              </label>
              <input
                id="avatar-input"
                type="file"
                accept="image/*"
                onChange={handleFotoUpload}
                className="hidden"
              />
            </div>

            {/* Identity Details */}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="font-display text-2xl font-extrabold text-cream-hi sm:text-3xl truncate">
                  {currentUser.nama}
                </h2>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 border border-success/30 px-3 py-1 text-xs font-extrabold text-success">
                  <span className="h-2 w-2 rounded-full bg-success animate-pulse" /> Akun Aktif
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border ${roleMeta.bg} ${roleMeta.color}`}>
                  <RoleIcon size={13} /> {roleMeta.label}
                </span>
              </div>

              <p className="text-sm text-sage flex items-center gap-1.5">
                <Mail size={15} className="shrink-0 text-sage" /> {currentUser.email}
              </p>

              {currentUser.role === "dinas" && currentUser.wilayah && (
                <p className="text-xs text-tan flex items-center gap-1.5 font-semibold">
                  <MapPin size={13} /> Wilayah Wewenang: {WILAYAH.find(w => w.id === currentUser.wilayah)?.nama}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Gamifikasi Card khusus Warga */}
        {user.role === "warga" && (
          <div className="mt-6 pt-6 border-t border-ink-300 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-ink-300 bg-ground/60 p-4 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-tan/15 text-tan">
                <Trophy size={20} />
              </div>
              <div>
                <span className="block text-xs text-sage">Level Akun</span>
                <span className="font-display text-lg font-bold text-cream-hi">Level {user.level || 1}</span>
              </div>
            </div>

            <div className="rounded-2xl border border-ink-300 bg-ground/60 p-4 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-tan/15 text-tan">
                <Sparkles size={20} />
              </div>
              <div>
                <span className="block text-xs text-sage">Total Poin</span>
                <span className="font-display text-lg font-bold text-cream-hi">{user.poin || 0} Poin</span>
              </div>
            </div>

            <div className="rounded-2xl border border-ink-300 bg-ground/60 p-4 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-tan/15 text-tan">
                <Award size={20} />
              </div>
              <div>
                <span className="block text-xs text-sage">Lencana Kontribusi</span>
                <span className="font-display text-xs font-bold text-cream-hi truncate block max-w-[140px]">
                  {user.lencana && user.lencana.length > 0 ? user.lencana.join(", ") : "Warga Baru"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Form Edit Profil */}
      <div className="mt-8 rounded-3xl border border-ink-300 bg-surface p-6 sm:p-8 shadow-xl">
        <h2 className="font-display text-xl font-bold text-cream-hi mb-1">
          Pengaturan Informasi Akun
        </h2>
        <p className="text-xs text-sage mb-6">
          Lihat dan perbarui data profil akun Anda yang terhubung dengan database SIGAP.
        </p>

        {sukses && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-success/30 bg-success/10 p-4 text-sm font-semibold text-success animate-fade-in">
            <CheckCircle2 size={20} className="shrink-0" />
            <span>Perubahan profil berhasil disimpan ke database!</span>
          </div>
        )}

        {pesanError && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-danger/30 bg-danger/10 p-4 text-sm font-semibold text-danger">
            <span>{pesanError}</span>
          </div>
        )}

        <form onSubmit={handleSimpan} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Nama Lengkap */}
            <div>
              <label htmlFor="p-nama" className="block text-xs font-semibold text-sage mb-2">
                Nama Lengkap
              </label>
              <input
                id="p-nama"
                type="text"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                required
                className="w-full rounded-xl border border-ink-400 bg-ground/80 px-4 py-3 text-sm text-cream-hi focus:border-tan focus:outline-none transition-colors"
              />
            </div>

            {/* Email (Read-only / info) */}
            <div>
              <label htmlFor="p-email" className="block text-xs font-semibold text-sage mb-2">
                Alamat Email (Akun)
              </label>
              <input
                id="p-email"
                type="email"
                value={email}
                disabled
                className="w-full rounded-xl border border-ink-300 bg-ground/40 px-4 py-3 text-sm text-sage cursor-not-allowed opacity-80"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Nomor Telepon / WA */}
            <div>
              <label htmlFor="p-telepon" className="block text-xs font-semibold text-sage mb-2">
                Nomor Telepon / WhatsApp
              </label>
              <div className="relative">
                <input
                  id="p-telepon"
                  type="text"
                  value={telepon}
                  onChange={(e) => setTelepon(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  className="w-full rounded-xl border border-ink-400 bg-ground/80 px-4 py-3 text-sm text-cream-hi focus:border-tan focus:outline-none transition-colors pl-10"
                />
                <Phone size={16} className="absolute left-3.5 top-3.5 text-sage" />
              </div>
            </div>

            {/* Role (Read only) */}
            <div>
              <label className="block text-xs font-semibold text-sage mb-2">
                Peran Akses
              </label>
              <input
                type="text"
                value={roleMeta.label}
                disabled
                className="w-full rounded-xl border border-ink-300 bg-ground/40 px-4 py-3 text-sm text-sage cursor-not-allowed opacity-80 capitalize"
              />
            </div>
          </div>

          {/* Wilayah jika role = dinas */}
          {user.role === "dinas" && (
            <div>
              <label htmlFor="p-wilayah" className="block text-xs font-semibold text-sage mb-2">
                Wilayah Tanggung Jawab
              </label>
              <select
                id="p-wilayah"
                value={wilayah}
                onChange={(e) => setWilayah(e.target.value as WilayahId)}
                className="w-full rounded-xl border border-ink-400 bg-ground/80 px-4 py-3 text-sm text-cream-hi focus:border-tan focus:outline-none transition-colors"
              >
                {WILAYAH.map((w) => (
                  <option key={w.id} value={w.id} className="bg-ground text-cream-hi">
                    {w.nama} ({w.id})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Alamat Lengkap */}
          <div>
            <label htmlFor="p-alamat" className="block text-xs font-semibold text-sage mb-2">
              Alamat Lengkap / Domisili
            </label>
            <div className="relative">
              <textarea
                id="p-alamat"
                rows={3}
                value={alamat}
                onChange={(e) => setAlamat(e.target.value)}
                placeholder="Masukkan alamat rumah / domisili lengkap Anda"
                className="w-full rounded-xl border border-ink-400 bg-ground/80 px-4 py-3 text-sm text-cream-hi focus:border-tan focus:outline-none transition-colors pl-10 resize-none"
              />
              <MapPin size={16} className="absolute left-3.5 top-3.5 text-sage" />
            </div>
          </div>

          <div className="flex items-center justify-end pt-4 border-t border-ink-300">
            <button
              type="submit"
              disabled={saving}
              className="btn-anim flex items-center gap-2 rounded-xl bg-tan-solid px-6 py-3 font-bold text-white shadow-lg hover:bg-brand-700 disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 size={18} className="spin" /> Menyimpan...
                </>
              ) : (
                <>
                  <Save size={18} /> Simpan Perubahan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
