"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  LogIn, UserRound, ShieldCheck, HardHat, Eye, EyeOff, Loader2,
  AlertCircle, Siren, ArrowLeft, Check, Building2, CheckCircle2, XCircle,
  Phone, MapPin, Sparkles, UserPlus, ArrowRight, ShieldAlert, UserCheck,
} from "lucide-react";
import { useApp, type Role } from "@/lib/store";
import { TREN_BULANAN, WAKTU_RESPONS, WILAYAH, type WilayahId } from "@/lib/data";
import { supabase } from "@/lib/supabase";

const BUKTI = (() => {
  const totalMasuk = TREN_BULANAN.masuk.reduce((a, b) => a + b, 0);
  const totalSelesai = TREN_BULANAN.selesai.reduce((a, b) => a + b, 0);
  const rasio = Math.round((totalSelesai / totalMasuk) * 100);
  const jam = WAKTU_RESPONS.jam;
  return [
    { angka: `${totalMasuk}`, label: "laporan 6 bulan terakhir" },
    { angka: `${rasio}%`, label: "tuntas ditangani" },
    { angka: `${jam.at(-1)} jam`, label: "rata-rata respons" },
    { angka: "5", label: "daerah dalam pantauan" },
  ];
})();

type RoleDef = {
  id: Role;
  label: string;
  singkat: string;
  desc: string;
  icon: typeof UserRound;
  tujuan: string;
  janji: string[];
  demo: { nama: string; email: string };
};

const ROLES: RoleDef[] = [
  {
    id: "warga",
    label: "Warga",
    singkat: "Warga",
    desc: "Lapor & pantau masalah lingkungan",
    icon: UserRound,
    tujuan: "/warga",
    janji: [
      "Kirim laporan dengan foto & titik lokasi",
      "Pantau status dari Diterima sampai Selesai",
      "Kumpulkan poin, lencana, dan naik peringkat",
    ],
    demo: { nama: "Budi Santoso", email: "budi@gmail.com" },
  },
  {
    id: "admin",
    label: "Admin / Pemerintah",
    singkat: "Admin",
    desc: "Verifikasi & kelola laporan masuk",
    icon: ShieldCheck,
    tujuan: "/dashboard",
    janji: [
      "Antrian laporan terurut Skor Urgensi 1–10",
      "Peta sebaran & analitik dampak kota",
      "Verifikasi, prioritaskan, tugaskan petugas",
    ],
    demo: { nama: "Super Admin SIGAP", email: "admin@sigap.go.id" },
  },
  {
    id: "petugas",
    label: "Petugas Lapangan",
    singkat: "Petugas",
    desc: "Tangani laporan yang ditugaskan",
    icon: HardHat,
    tujuan: "/petugas",
    janji: [
      "Daftar tugas harian beserta target SLA",
      "Navigasi ke titik lokasi laporan",
      "Unggah foto bukti penanganan",
    ],
    demo: { nama: "Petugas Surya", email: "surya@petugaslapangan.go.id" },
  },
  {
    id: "dinas",
    label: "Dinas / Instansi",
    singkat: "Dinas",
    desc: "Pantau & tangani laporan per wilayah",
    icon: Building2,
    tujuan: "/dinas",
    janji: [
      "Pantau laporan masuk di wilayah wewenang",
      "Auto-route laporan darurat (Skor AI >= 9)",
      "Ubah status penanganan langsung di sistem",
    ],
    demo: { nama: "Pak Hendra Wijaya", email: "kepala.dinas@slemankab.go.id" },
  },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type Errors = Partial<Record<"nama" | "email" | "sandi" | "reSandi" | "telepon" | "alamat", string>>;

export default function LoginClient() {
  const { login, updateUser, user, hydrated, tambahUser } = useApp();
  const router = useRouter();
  const params = useSearchParams();

  // Mode: "masuk" (Login) atau "daftar" (Register)
  const [mode, setMode] = useState<"masuk" | "daftar">("masuk");

  const roleAwal = (params.get("role") as Role) ?? "warga";
  const [role, setRole] = useState<Role>(
    ROLES.some((r) => r.id === roleAwal) ? roleAwal : "warga",
  );

  // Input state
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [sandi, setSandi] = useState("");
  const [reSandi, setReSandi] = useState("");

  // Input detail kelengkapan
  const [telepon, setTelepon] = useState("");
  const [alamat, setAlamat] = useState("");

  const [fWilayah, setFWilayah] = useState<WilayahId>("sleman");
  const [lihat, setLihat] = useState(false);
  const [lihatRe, setLihatRe] = useState(false);
  const [ingat, setIngat] = useState(true);
  const [errors, setErrors] = useState<Errors>({});
  const [sentuh, setSentuh] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [capsOn, setCapsOn] = useState(false);
  const [gagal, setGagal] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Modal State setelah register
  const [modalNotifLengkap, setModalNotifLengkap] = useState(false);
  const [modalFormLengkap, setModalFormLengkap] = useState(false);

  const aktif = useMemo(() => ROLES.find((r) => r.id === role)!, [role]);

  // Evaluasi Syarat Password Real-Time
  const reqMinLen = sandi.length >= 8;
  const reqUpper = /[A-Z]/.test(sandi);
  const reqLower = /[a-z]/.test(sandi);
  const reqNumber = /[0-9]/.test(sandi);
  const reqMatch = reSandi.length > 0 && sandi === reSandi;
  const passValid = reqMinLen && reqUpper && reqLower && reqNumber;

  useEffect(() => {
    if (role === "dinas") {
      setEmail("kepala.dinas@slemankab.go.id");
      setFWilayah("sleman");
    } else {
      if (mode === "masuk") setEmail("");
    }
    setSandi("");
    setReSandi("");
    setErrors({});
    setSentuh({});
  }, [role, mode]);

  /* Jika sudah login dan tidak dalam modal notif kelengkapan, redirect */
  useEffect(() => {
    if (!hydrated || !user || modalNotifLengkap || modalFormLengkap) return;
    const tujuan = ROLES.find((r) => r.id === user.role)?.tujuan ?? "/warga";
    router.replace(params.get("next") || tujuan);
  }, [hydrated, user, router, params, modalNotifLengkap, modalFormLengkap]);

  useEffect(() => {
    try {
      const t = localStorage.getItem("sigap_last_email");
      if (t && mode === "masuk") setEmail(t);
    } catch {}
  }, [mode]);

  function validasi(): Errors {
    const e: Errors = {};
    if (mode === "daftar") {
      if (nama.trim().length < 3) e.nama = "Nama lengkap minimal 3 karakter.";
      if (!EMAIL_RE.test(email.trim())) e.email = "Format email tidak valid.";
      if (!reqMinLen) e.sandi = "Kata sandi minimal 8 karakter.";
      else if (!reqUpper || !reqLower) e.sandi = "Harus mengandung huruf besar (A-Z) dan kecil (a-z).";
      else if (!reqNumber) e.sandi = "Harus mengandung minimal 1 angka (0-9).";
      if (!reqMatch) e.reSandi = "Konfirmasi kata sandi tidak cocok.";
    } else {
      if (!EMAIL_RE.test(email.trim())) e.email = "Format email belum benar.";
      if (sandi.length < 6) e.sandi = "Kata sandi minimal 6 karakter.";
    }
    return e;
  }

  function ubah(field: keyof Errors, nilai: string) {
    if (field === "nama") setNama(nilai);
    if (field === "email") setEmail(nilai);
    if (field === "sandi") setSandi(nilai);
    if (field === "reSandi") setReSandi(nilai);
    if (field === "telepon") setTelepon(nilai);
    if (field === "alamat") setAlamat(nilai);
    if (errors[field]) setErrors((p) => ({ ...p, [field]: undefined }));
    // Hapus error login saat user mulai mengetik ulang
    if (field === "email" || field === "sandi") setLoginError(null);
  }

  function blur(field: keyof Errors) {
    setSentuh((p) => ({ ...p, [field]: true }));
    const e = validasi();
    setErrors((p) => ({ ...p, [field]: e[field] }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validasi();
    setErrors(err);
    setSentuh({ nama: true, email: true, sandi: true, reSandi: true });

    if (Object.keys(err).length > 0) {
      setGagal(true);
      setTimeout(() => setGagal(false), 450);
      return;
    }

    setLoading(true);

    if (mode === "masuk") {
      try {
        if (ingat) localStorage.setItem("sigap_last_email", email.trim());
        else localStorage.removeItem("sigap_last_email");
      } catch {}

      try {
        const { data, error } = await supabase
          .from("users")
          .select("nama, email, role, wilayah, telepon, alamat, foto, aktif")
          .eq("email", email.trim())
          .eq("sandi", sandi)
          .eq("aktif", true)
          .single();

        if (!error && data) {
          setLoginError(null);
          login(
            data.nama,
            data.email,
            data.role as Role,
            data.wilayah ?? undefined,
            data.telepon ?? undefined,
            data.alamat ?? undefined,
            data.foto ?? undefined
          );
          router.push(params.get("next") || ROLES.find((r) => r.id === data.role)?.tujuan || "/");
          return;
        }
      } catch {}

      // Email/password tidak cocok — tolak login
      setLoginError("Email atau kata sandi salah. Silakan periksa kembali.");
      setGagal(true);
      setTimeout(() => setGagal(false), 450);
      setLoading(false);
    } else {
      // PROSES REGISTER — Otomatis Warga
      try {
        const { data: insertedData, error: insertError } = await supabase.from("users").insert([
          {
            nama: nama.trim(),
            email: email.trim(),
            sandi: sandi,
            role: "warga",
            telepon: telepon.trim() || null,
            alamat: alamat.trim() || null,
            aktif: true,
          },
        ]).select();
        if (insertError) {
          console.error("[SIGAP Register] Supabase insert error:", insertError.code, insertError.message, insertError.details, insertError.hint);
        } else {
          console.log("[SIGAP Register] Insert berhasil:", insertedData);
        }
      } catch (e) {
        console.error("[SIGAP Register] Exception:", e);
      }

      // Simpan ke store lokal
      tambahUser({
        nama: nama.trim(),
        email: email.trim(),
        role: "warga",
        telepon: telepon.trim() || undefined,
        alamat: alamat.trim() || undefined,
        aktif: true,
      });

      // Panggil login otomatis
      login(nama.trim(), email.trim(), "warga", undefined, telepon.trim() || undefined, alamat.trim() || undefined);
      setLoading(false);

      // Tandai bahwa user baru saja daftar agar dashboard warga tampilkan modal kelengkapan
      try { sessionStorage.setItem("sigap_baru_daftar", "1"); } catch {}

      // Redirect langsung ke dashboard warga
      router.push(params.get("next") || "/warga");
    }
  }

  function handleLengkapiSekarang() {
    setModalNotifLengkap(false);
    setModalFormLengkap(true);
  }

  function handleLengkapiNanti() {
    setModalNotifLengkap(false);
    router.push(params.get("next") || "/warga");
  }

  async function handleSimpanKelengkapan(e: React.FormEvent) {
    e.preventDefault();
    try {
      await supabase
        .from("users")
        .update({
          telepon: telepon.trim(),
          alamat: alamat.trim(),
        })
        .eq("email", email.trim());
    } catch {}

    updateUser({
      telepon: telepon.trim(),
      alamat: alamat.trim(),
    });
    setModalFormLengkap(false);
    router.push(params.get("next") || "/warga");
  }

  return (
    <main className="mx-auto grid min-h-[calc(100dvh-var(--nav-h))] max-w-[1080px] items-center px-5 py-8 sm:px-6 sm:py-12">
      <div
        className={`grid w-full overflow-hidden border border-ink-300 bg-surface md:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] ${
          gagal ? "shake" : "anim-fade-up"
        }`}
      >
        {/* ============ Panel kiri ============ */}
        <aside className="relative hidden flex-col justify-between border-r border-ink-300 bg-ground-2 p-8 md:flex">
          <div className="grid-overlay pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />

          <Link
            href="/"
            className="group relative -ml-1 flex min-h-[44px] w-fit items-center gap-2 self-start px-1 no-underline"
          >
            <ArrowLeft size={15} className="text-sage transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
            <span className="micro-label text-sage transition-colors group-hover:text-cream-hi">
              Kembali ke Beranda
            </span>
          </Link>

          <div className="relative">
            <span className="micro-label text-tan">
              {mode === "masuk" ? "Masuk sebagai" : "Pendaftaran Akun"}
            </span>
            <h2 className="font-display mt-3 text-[40px] leading-[0.92] text-cream-hi">
              {mode === "masuk" ? aktif.singkat : "Warga SIGAP"}
            </h2>
            <p className="mt-3 max-w-[34ch] text-sm text-sage-pale">
              {mode === "masuk"
                ? `${aktif.desc}.`
                : "Bergabung bersama ribuan warga Yogyakarta untuk melapor dan menjaga keasrian kota."}
            </p>

            <ul className="mt-7 space-y-3 border-t border-ink-300 pt-6">
              {(mode === "masuk"
                ? aktif.janji
                : [
                    "Registrasi cepat dalam beberapa langkah sederhana",
                    "Akses penuh fitur pelaporan & pemantauan real-time",
                    "Dapatkan poin partisipasi dan lencana kontribusi warga",
                  ]
              ).map((j) => (
                <li key={j} className="flex gap-3 text-sm text-cream">
                  <Check size={16} className="mt-0.5 shrink-0 text-tan" aria-hidden="true" />
                  <span>{j}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-5 border-t border-ink-300 pt-6">
              {BUKTI.map((b) => (
                <div key={b.label}>
                  <dt className="sr-only">{b.label}</dt>
                  <dd>
                    <span className="font-display block text-2xl leading-none text-cream-hi">
                      {b.angka}
                    </span>
                    <span className="mt-1.5 block text-xs text-sage">{b.label}</span>
                  </dd>
                </div>
              ))}
            </dl>
            <p className="micro-label mt-7 text-sage">
              Universitas Atma Jaya Yogyakarta · 2026
            </p>
          </div>
        </aside>

        {/* ============ Kolom kanan: Form ============ */}
        <div className="p-6 sm:p-8">
          <Link
            href="/"
            className="-ml-1 mb-4 inline-flex min-h-[44px] items-center gap-2 px-1 no-underline md:hidden"
          >
            <ArrowLeft size={15} className="text-sage" aria-hidden="true" />
            <span className="micro-label text-sage">Kembali</span>
          </Link>

          {/* Toggle Tab Masuk vs Daftar */}
          <div className="mb-6 flex rounded-xl border border-ink-300 bg-ground p-1">
            <button
              type="button"
              onClick={() => { setMode("masuk"); setLoginError(null); }}
              className={`flex-1 rounded-lg py-2.5 text-center text-sm font-bold transition-all ${
                mode === "masuk"
                  ? "bg-tan-solid text-white shadow-md"
                  : "text-sage hover:text-cream"
              }`}
            >
              <LogIn size={15} className="mr-1.5 inline-block" />
              Masuk
            </button>
            <button
              type="button"
              onClick={() => { setMode("daftar"); setLoginError(null); }}
              className={`flex-1 rounded-lg py-2.5 text-center text-sm font-bold transition-all ${
                mode === "daftar"
                  ? "bg-tan-solid text-white shadow-md"
                  : "text-sage hover:text-cream"
              }`}
            >
              <UserPlus size={15} className="mr-1.5 inline-block" />
              Daftar Akun Baru
            </button>
          </div>

          <h1 className="font-display text-[26px] leading-tight text-cream-hi sm:text-[30px]">
            {mode === "masuk" ? "Masuk ke SIGAP" : "Buat Akun Warga"}
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            {mode === "masuk"
              ? "Masukkan email dan kata sandi untuk mengakses akun Anda"
              : "Lengkapi nama, email, dan kata sandi untuk pendaftaran cepat"}
          </p>

          {loginError && (
            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-xs font-bold text-red-400 backdrop-blur-sm animate-fade-in">
              <ShieldAlert size={20} className="shrink-0 text-red-500" />
              <div className="flex-1">
                <p className="font-extrabold text-red-300">Login Gagal!</p>
                <p className="mt-0.5 text-red-400 font-normal">{loginError}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="mt-6">
            <div className="space-y-3.5">
              {/* Nama Lengkap (Khusus Mode Daftar) */}
              {mode === "daftar" && (
                <Field
                  id="f-nama"
                  label="Nama Lengkap"
                  value={nama}
                  onChange={(v) => ubah("nama", v)}
                  onBlur={() => blur("nama")}
                  error={sentuh.nama ? errors.nama : undefined}
                  autoComplete="name"
                />
              )}

              {/* Email */}
              <Field
                id="f-email"
                label="Alamat Email"
                type="email"
                value={email}
                onChange={(v) => ubah("email", v)}
                onBlur={() => blur("email")}
                error={sentuh.email ? errors.email : undefined}
                autoComplete="email"
                inputMode="email"
              />

              {/* Kata Sandi */}
              <Field
                id="f-sandi"
                label="Kata Sandi"
                type={lihat ? "text" : "password"}
                value={sandi}
                onChange={(v) => ubah("sandi", v)}
                onBlur={() => blur("sandi")}
                onKeyUp={(e) => setCapsOn(e.getModifierState?.("CapsLock") ?? false)}
                error={sentuh.sandi ? errors.sandi : undefined}
                autoComplete={mode === "masuk" ? "current-password" : "new-password"}
                hint={capsOn ? "Caps Lock sedang aktif." : undefined}
                aksi={
                  <button
                    type="button"
                    onClick={() => setLihat((v) => !v)}
                    aria-label={lihat ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                    className="grid mt-[5px] h-11 w-11 shrink-0 place-items-center text-sage hover:text-cream-hi"
                  >
                    {lihat ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
              />

              {mode === "daftar" && (
                <>
                  <Field
                    id="f-reSandi"
                    label="Ulangi Kata Sandi (Re-Password)"
                    type={lihatRe ? "text" : "password"}
                    value={reSandi}
                    onChange={(v) => ubah("reSandi", v)}
                    onBlur={() => blur("reSandi")}
                    error={sentuh.reSandi ? errors.reSandi : undefined}
                    autoComplete="new-password"
                    aksi={
                      <button
                        type="button"
                        onClick={() => setLihatRe((v) => !v)}
                        aria-label={lihatRe ? "Sembunyikan" : "Tampilkan"}
                        className="grid mt-[5px]h-11 w-11 shrink-0 place-items-center text-sage hover:text-cream-hi"
                      >
                        {lihatRe ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    }
                  />

                  {/* Real-time Password Checklist */}
                  <div className="rounded-xl border border-ink-300 bg-ground/60 p-3.5 space-y-1.5 text-xs">
                    <p className="font-semibold text-sage mb-2">Syarat Kata Sandi:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      <div className={`flex items-center gap-1.5 ${reqMinLen ? "text-success font-medium" : "text-ink-500"}`}>
                        {reqMinLen ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                        <span>Minimal 8 karakter</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${reqUpper && reqLower ? "text-success font-medium" : "text-ink-500"}`}>
                        {reqUpper && reqLower ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                        <span>Huruf besar & kecil (A-z)</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${reqNumber ? "text-success font-medium" : "text-ink-500"}`}>
                        {reqNumber ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                        <span>Minimal 1 angka (0-9)</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${reqMatch ? "text-success font-medium" : "text-ink-500"}`}>
                        {reqMatch ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                        <span>Re-password cocok</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Checkbox Ingat Email (Hanya pada mode masuk) */}
            {mode === "masuk" && (
              <div className="mt-3 flex items-center justify-between">
                <label className="flex cursor-pointer select-none items-center gap-2 text-sm text-ink-500">
                  <input
                    type="checkbox"
                    checked={ingat}
                    onChange={(e) => setIngat(e.target.checked)}
                    className="h-4 w-4 rounded accent-[var(--color-tan-solid)]"
                  />
                  Ingat email saya
                </label>
              </div>
            )}

            {/* Tombol Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-anim mt-5 flex min-h-[52px] w-full items-center justify-center gap-2.5 bg-tan-solid px-6 font-bold text-white transition-colors hover:bg-brand-700 disabled:cursor-wait disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="spin" aria-hidden="true" />
                  {mode === "masuk" ? "Memproses Masuk..." : "Mendaftarkan Akun..."}
                </>
              ) : mode === "masuk" ? (
                <>
                  <LogIn size={18} aria-hidden="true" />
                  Masuk ke SIGAP
                </>
              ) : (
                <>
                  <UserPlus size={18} aria-hidden="true" />
                  Daftar Sekarang
                </>
              )}
            </button>

            {/* Jalur Darurat */}
            <div className="mt-6 border-t border-ink-300 pt-5">
              <span className="micro-label mb-3 block text-sage">Layanan Cepat</span>
              <Link
                href="/lapor?darurat=1"
                className="flex min-h-[44px] items-center justify-center gap-2 border border-danger/60 px-4 text-xs font-semibold text-danger no-underline transition-colors hover:bg-danger/10 rounded-xl"
              >
                <Siren size={15} aria-hidden="true" /> Sinyal Kondisi Darurat
              </Link>
            </div>
          </form>
        </div>
      </div>

      {/* =========================================================
          MODAL 1: NOTIFIKASI "Whoops, bentar lagi data kamu lengkap!"
          ========================================================= */}
      {modalNotifLengkap && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-[480px] overflow-hidden rounded-3xl border border-ink-300 bg-surface p-6 sm:p-8 shadow-2xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-tan/15 text-tan border border-tan/30 mb-5">
              <Sparkles size={32} className="animate-pulse" />
            </div>

            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-tan/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-tan border border-tan/20 mb-2">
                Pendaftaran Berhasil!
              </span>
              <h3 className="font-display text-2xl font-extrabold text-cream-hi sm:text-3xl">
                Whoops, bentar lagi data kamu lengkap! 
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-sage-pale">
                Akun SIGAP kamu telah berhasil dibuat. Biar laporan masalah lingkunganmu bisa diproses lebih cepat dan akurat oleh tim lapangan, yuk lengkapi nomor telepon dan alamatmu sekarang!
              </p>
            </div>

            <div className="mt-7 flex flex-col gap-3">
              <button
                type="button"
                onClick={handleLengkapiSekarang}
                className="btn-anim flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-tan-solid font-bold text-white shadow-lg hover:bg-brand-700"
              >
                Lengkapi Sekarang <ArrowRight size={16} />
              </button>
              <button
                type="button"
                onClick={handleLengkapiNanti}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-ink-300 bg-ground/50 font-semibold text-sage transition-colors hover:text-cream hover:bg-ground"
              >
                Nanti Saja
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 2: FORMULIR KELENGKAPAN DATA (Telepon & Alamat)
          ========================================================= */}
      {modalFormLengkap && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-[500px] overflow-hidden rounded-3xl border border-ink-300 bg-surface p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-ink-300 pb-4 mb-6">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-tan/20 text-tan">
                <UserCheck size={20} />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-cream-hi">
                  Lengkapi Profil Kamu
                </h3>
                <p className="text-xs text-sage">Informasi kontak & lokasi penanganan</p>
              </div>
            </div>

            <form onSubmit={handleSimpanKelengkapan} className="space-y-4">
              <Field
                id="f-telepon"
                label="Nomor Telepon / WhatsApp"
                type="text"
                value={telepon}
                onChange={(v) => ubah("telepon", v)}
                autoComplete="tel"
                inputMode="tel"
                hint="Digunakan petugas untuk konfirmasi titik lokasi laporan"
              />

              <div>
                <div className="field flex items-stretch border border-ink-400 focus-within:border-tan">
                  <div className="field relative min-w-0 flex-1">
                    <input
                      id="f-alamat"
                      name="alamat"
                      type="text"
                      value={alamat}
                      onChange={(e) => ubah("alamat", e.target.value)}
                      placeholder=" "
                      className="field-input border-0"
                    />
                    <label htmlFor="f-alamat" className="field-label">Alamat Lengkap / Domisili</label>
                  </div>
                </div>
                <p className="mt-1.5 text-xs text-sage">Contoh: Jl. Babarsari No. 44, Depok, Sleman</p>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-ink-300">
                <button
                  type="button"
                  onClick={handleLengkapiNanti}
                  className="px-4 py-2.5 text-sm font-semibold text-sage hover:text-cream"
                >
                  Lewati
                </button>
                <button
                  type="submit"
                  className="btn-anim flex h-11 items-center justify-center gap-2 rounded-xl bg-tan-solid px-6 font-bold text-white shadow-md hover:bg-brand-700"
                >
                  Simpan & Lanjutkan <Check size={16} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

function Field({
  id, label, value, onChange, onBlur, onKeyUp, error, hint,
  type = "text", autoComplete, inputMode, aksi, inputRef,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  onKeyUp?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  error?: string;
  hint?: string;
  type?: string;
  autoComplete?: string;
  inputMode?: "email" | "text" | "numeric" | "tel";
  aksi?: React.ReactNode;
  inputRef?: React.Ref<HTMLInputElement>;
}) {
  const pesan = error || hint;
  const pesanId = pesan ? `${id}-msg` : undefined;

  return (
    <div>
      <div className="field flex items-stretch border border-ink-400 transition-colors focus-within:border-tan"
           style={{ borderColor: error ? "var(--color-danger)" : undefined }}>
        <div className="field relative min-w-0 flex-1">
          <input
            id={id}
            ref={inputRef}
            name={id.replace("f-", "")}
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            onKeyUp={onKeyUp}
            autoComplete={autoComplete}
            inputMode={inputMode}
            placeholder=" "
            aria-invalid={!!error}
            aria-describedby={pesanId}
            className="field-input border-0"
          />
          <label htmlFor={id} className="field-label">{label}</label>
        </div>
        {aksi}
      </div>
      {pesan && (
        <p
          id={pesanId}
          className={`mt-1.5 flex items-center gap-1.5 text-xs ${
            error ? "text-danger" : "text-sage"
          }`}
        >
          <AlertCircle size={13} aria-hidden="true" /> {pesan}
        </p>
      )}
    </div>
  );
}
