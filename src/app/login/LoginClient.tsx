"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  LogIn, UserRound, ShieldCheck, HardHat, Eye, EyeOff, Loader2,
  AlertCircle, Siren, EyeOff as Anon, ArrowLeft, Check, Building2, Database,
} from "lucide-react";
import { useApp, type Role } from "@/lib/store";
import { TREN_BULANAN, WAKTU_RESPONS, WILAYAH, type WilayahId } from "@/lib/data";
import { supabase } from "@/lib/supabase";

/* Angka bukti diturunkan dari data yang sama dengan dasbor — bukan
   ditulis tangan — supaya tidak pernah bertentangan dengan isi aplikasi. */
const BUKTI = (() => {
  const totalMasuk = TREN_BULANAN.masuk.reduce((a, b) => a + b, 0);
  const totalSelesai = TREN_BULANAN.selesai.reduce((a, b) => a + b, 0);
  const rasio = Math.round((totalSelesai / totalMasuk) * 100);
  const jam = WAKTU_RESPONS.jam;
  // const turun = Math.round(((jam[0] - jam.at(-1)!) / jam[0]) * 100);
  // Semua angka memakai rentang enam bulan yang sama. Mencampur
  // "bulan ini" dengan cacah data contoh membuat skalanya timpang
  // (mis. "89 laporan" bersebelahan dengan "4 selesai").
  return [
    { angka: `${totalMasuk}`, label: "laporan 6 bulan terakhir" },
    { angka: `${rasio}%`, label: "tuntas ditangani" },
    { angka: `${jam.at(-1)} jam`, label: "rata-rata respons" },
    // { angka: `−${turun}%`, label: "waktu tunggu sejak Agustus" },
    { angka: "5", label: "daerah dalam pantauan" },
  ];
})();

/* ============================================================
   Peran + tujuan setelah masuk. Satu sumber kebenaran supaya
   redirect, teks tombol, dan panel kiri tidak pernah beda.
   ============================================================ */
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
    demo: { nama: "Rina Kusuma", email: "rina.warga@sigap.id" },
  },
  {
    id: "admin",
    label: "Admin / Pemerintah",
    singkat: "Admin",
    desc: "Verifikasi & kelola laporan masuk",
    icon: ShieldCheck,
    tujuan: "/dashboard",
    janji: [
      "Antrian laporan terurut Skor Urgensi 1\u201310",
      "Peta sebaran & analitik dampak kota",
      "Verifikasi, prioritaskan, tugaskan petugas",
    ],
    demo: { nama: "Budi Santoso", email: "budi.admin@jogjakota.go.id" },
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
    demo: { nama: "Agus Prasetyo", email: "agus.petugas@sigap.id" },
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

type Errors = Partial<Record<"nama" | "email" | "sandi", string>>;

export default function LoginClient() {
  const { login, user, hydrated } = useApp();
  const router = useRouter();
  const params = useSearchParams();

  // Peran awal boleh datang dari URL: /login?role=admin
  const roleAwal = (params.get("role") as Role) ?? "warga";
  const [role, setRole] = useState<Role>(
    ROLES.some((r) => r.id === roleAwal) ? roleAwal : "warga",
  );
  // const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [sandi, setSandi] = useState("");
  const [fWilayah, setFWilayah] = useState<WilayahId>("sleman");
  const [lihat, setLihat] = useState(false);
  const [ingat, setIngat] = useState(true);
  const [errors, setErrors] = useState<Errors>({});
  const [sentuh, setSentuh] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [capsOn, setCapsOn] = useState(false);
  const [gagal, setGagal] = useState(false);

  const aktif = useMemo(() => ROLES.find((r) => r.id === role)!, [role]);
  const radioRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const namaRef = useRef<HTMLInputElement>(null);

  // Sesuaikan nilai demo saat role berubah
  useEffect(() => {
    if (role === "dinas") {
      // setNama("Pak Hendra Wijaya");
      setEmail("kepala.dinas@slemankab.go.id");
      setFWilayah("sleman");
    } else {
      // setNama("");
      setEmail("");
    }
    setSandi("");
    setErrors({});
    setSentuh({});
  }, [role]);

  /* Sudah login? langsung antar ke ruangnya, jangan tahan di /login. */
  useEffect(() => {
    if (!hydrated || !user) return;
    const tujuan = ROLES.find((r) => r.id === user.role)?.tujuan ?? "/warga";
    router.replace(params.get("next") || tujuan);
  }, [hydrated, user, router, params]);

  /* Ingat email terakhir supaya tidak mengetik ulang tiap kunjungan.
     localStorage hanya ada di klien, jadi pengisian wajib terjadi setelah
     hidrasi — kalau dibaca saat render, HTML server dan klien berbeda.
     Ini pengecualian sah dari aturan set-state-in-effect: sekali jalan,
     tanpa dependensi, dan tidak memicu putaran render. */
  useEffect(() => {
    try {
      const t = localStorage.getItem("sigap_last_email");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (t) setEmail(t);
    } catch {}
  }, []);

  function validasi(): Errors {
    const e: Errors = {};
    // if (nama.trim().length < 3) e.nama = "Nama minimal 3 karakter.";
    if (!EMAIL_RE.test(email.trim())) e.email = "Format email belum benar.";
    if (sandi.length < 6) e.sandi = "Kata sandi minimal 6 karakter.";
    return e;
  }

  /* Pola "hukum belakangan, maafkan segera":
     - saat mengetik  → error yang ada langsung dihapus (tidak mengomel),
     - saat blur      → baru divalidasi, jadi pengguna tahu sebelum submit.
     Sebelumnya error hanya muncul setelah tombol ditekan, sehingga
     kesalahan ketik baru ketahuan di ujung alur. */
  function ubah(field: keyof Errors, nilai: string) {
    // if (field === "nama") setNama(nilai);
    if (field === "email") setEmail(nilai);
    if (field === "sandi") setSandi(nilai);
    if (errors[field]) setErrors((p) => ({ ...p, [field]: undefined }));
  }

  function blur(field: keyof Errors) {
    setSentuh((p) => ({ ...p, [field]: true }));
    const e = validasi();
    setErrors((p) => ({ ...p, [field]: e[field] }));
  }

  // function isiDemo() {
  //   if (role === "dinas") {
  //     if (fWilayah === "sleman") {
  //       // setNama("Pak Hendra Wijaya");
  //       setEmail("kepala.dinas@slemankab.go.id");
  //     } else if (fWilayah === "bantul") {
  //       // setNama("Bu Dewi Rahayu");
  //       setEmail("kepala.dinas@bantulkab.go.id");
  //     } else if (fWilayah === "kota_yogya") {
  //       // setNama("Pak Tono Susanto");
  //       setEmail("kepala.dinas@jogjakota.go.id");
  //     } else if (fWilayah === "gunungkidul") {
  //       // setNama("Bu Sinta Nurhayati");
  //       setEmail("kepala.dinas@gunungkidulkab.go.id");
  //     }
  //   } else {
  //     // setNama(aktif.demo.nama);
  //     setEmail(aktif.demo.email);
  //   }
  //   setSandi("demo1234");
  //   setErrors({});
  //   setSentuh({});
  // }

  async function masuk(e: React.FormEvent) {
    e.preventDefault();
    const err = validasi();
    setErrors(err);
    setSentuh({ nama: true, email: true, sandi: true });

    if (Object.keys(err).length) {
      setGagal(true);
      setTimeout(() => setGagal(false), 450);
      const urut: (keyof Errors)[] = ["nama", "email", "sandi"];
      const pertama = urut.find((k) => err[k]);
      document.getElementById(`f-${pertama}`)?.focus();
      return;
    }

    setLoading(true);
    try {
      if (ingat) localStorage.setItem("sigap_last_email", email.trim());
      else localStorage.removeItem("sigap_last_email");
    } catch {}

    // Coba login via tabel users di Supabase
    try {
      const { data, error } = await supabase
        .from("users")
        .select("nama, email, role, wilayah, aktif")
        .eq("email", email.trim())
        .eq("sandi", sandi)
        .eq("aktif", true)
        .single();

      if (!error && data) {
        // Login berhasil dari DB Supabase
        login(data.nama, data.email, data.role as Role, data.wilayah ?? undefined);
        router.push(params.get("next") || ROLES.find((r) => r.id === data.role)?.tujuan || "/");
        return;
      }
    } catch {
      // Supabase tidak tersedia — lanjut ke fallback demo
    }

    // Fallback: demo login lokal (jika belum ada di tabel Supabase)
    // await new Promise((r) => setTimeout(r, 400));
    // login(email.trim(), email.trim(), role, role === "dinas" ? fWilayah : undefined);
    // router.push(params.get("next") || aktif.tujuan);
  }

  /* Radiogroup: panah kiri/kanan/atas/bawah memindah pilihan (pola WAI-ARIA). */
  function navRole(e: React.KeyboardEvent, i: number) {
    const maju = e.key === "ArrowDown" || e.key === "ArrowRight";
    const mundur = e.key === "ArrowUp" || e.key === "ArrowLeft";
    if (!maju && !mundur) return;
    e.preventDefault();
    const next = (i + (maju ? 1 : -1) + ROLES.length) % ROLES.length;
    setRole(ROLES[next].id);
    radioRefs.current[next]?.focus();
  }

  return (
    <main className="mx-auto grid min-h-[calc(100dvh-var(--nav-h))] max-w-[1080px] items-center px-5 py-8 sm:px-6 sm:py-12">
      <div
        className={`grid w-full overflow-hidden border border-ink-300 bg-surface md:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] ${
          gagal ? "shake" : "anim-fade-up"
        }`}
      >
        {/* ============ Panel kiri: konteks yang berubah per peran ============ */}
        <aside className="relative hidden flex-col justify-between border-r border-ink-300 bg-ground-2 p-8 md:flex">
          <div className="grid-overlay pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />

          {/* self-start: tanpa ini flex-col meregangkan tautan selebar panel,
             sehingga area klik jauh lebih besar dari teks yang terlihat. */}
          <Link
            href="/"
            className="group relative -ml-1 flex min-h-[44px] w-fit items-center gap-2 self-start px-1 no-underline"
          >
            <ArrowLeft size={15} className="text-sage transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
            <span className="micro-label text-sage transition-colors group-hover:text-cream-hi">
              Kembali
            </span>
          </Link>

          <div className="relative">
            <span className="micro-label text-tan">Masuk sebagai</span>
            <h2 className="font-display mt-3 text-[40px] leading-[0.92] text-cream-hi">
              {aktif.singkat}
            </h2>
            <p className="mt-3 max-w-[34ch] text-sm text-sage-pale">{aktif.desc}.</p>

            {/* Janji konkret per peran: menjawab "saya dapat apa setelah masuk?" */}
            <ul className="mt-7 space-y-3 border-t border-ink-300 pt-6">
              {aktif.janji.map((j) => (
                <li key={j} className="flex gap-3 text-sm text-cream">
                  <Check size={16} className="mt-0.5 mb-6 shrink-0 text-tan" aria-hidden="true" />
                  <span>{j}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Bukti ringkas: mengisi ruang kosong panel sekaligus menjawab
              "apakah platform ini benar dipakai?" sebelum orang mendaftar. */}
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

        {/* ============ Kolom kanan: formulir ============ */}
        <div className="p-6 sm:p-8">
          {/* Brand kompak — hanya mobile, karena desktop sudah punya panel kiri */}
          <Link
            href="/"
            className="-ml-1 mb-4 inline-flex min-h-[44px] items-center gap-2 px-1 no-underline md:hidden"
          >
            <ArrowLeft size={15} className="text-sage" aria-hidden="true" />
            <span className="micro-label text-sage">Kembali</span>
          </Link>

          <h1 className="font-display text-[28px] leading-none text-cream-hi sm:text-[32px]">
            Masuk ke SIGAP
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <p className="text-sm text-ink-500">
              masukan email dan sandi untuk masuk ke akun anda
            </p>
            {/* <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2.5 py-0.5 text-[11px] font-bold text-success">
              <Database size={10} /> Supabase Terhubung
            </span> */}
          </div>

          <form onSubmit={masuk} noValidate className="mt-7">
            {/* ---------- Pilih peran ---------- */}
            {/* <div
              role="radiogroup"
              aria-labelledby="label-peran"
              className="space-y-2"
            >
              <span id="label-peran" className="micro-label mb-3 block text-sage">
                Peran
              </span>
              {ROLES.map((r, i) => {
                const Ic = r.icon;
                const dipilih = role === r.id;
                return (
                  <button
                    key={r.id}
                    ref={(el) => { radioRefs.current[i] = el; }}
                    type="button"
                    role="radio"
                    aria-checked={dipilih}
                    tabIndex={dipilih ? 0 : -1}
                    onClick={() => setRole(r.id)}
                    onKeyDown={(e) => navRole(e, i)}
                    className="role-card"
                  >
                    <span
                      className={`grid h-10 w-10 shrink-0 place-items-center transition-colors ${
                        dipilih ? "bg-tan-solid text-white" : "bg-ground text-sage"
                      }`}
                    >
                      <Ic size={18} aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-cream">{r.label}</span>
                      <span className="block truncate text-xs text-ink-500">{r.desc}</span>
                    </span>
                  </button>
                );
              })}
            </div> */}

            {/* Pilihan wilayah khusus Dinas */}
            {/* {role === "dinas" && (
              <div className="mt-4 animate-fade-in rounded-2xl border border-ink-300/40 bg-surface/50 p-4">
                <label htmlFor="f-wilayah" className="micro-label mb-2 block text-sage">
                  Pilih Instansi / Wilayah Dinas
                </label>
                <select
                  id="f-wilayah"
                  value={fWilayah}
                  onChange={(e) => {
                    const nextW = e.target.value as WilayahId;
                    setFWilayah(nextW);
                    if (nextW === "sleman") {
                      // setNama("Pak Hendra Wijaya");
                      setEmail("kepala.dinas@slemankab.go.id");
                    } else if (nextW === "bantul") {
                      // setNama("Bu Dewi Rahayu");
                      setEmail("kepala.dinas@bantulkab.go.id");
                    } else if (nextW === "kota_yogya") {
                      // setNama("Pak Tono Susanto");
                      setEmail("kepala.dinas@jogjakota.go.id");
                    } else if (nextW === "gunungkidul") {
                      // setNama("Bu Sinta Nurhayati");
                      setEmail("kepala.dinas@gunungkidulkab.go.id");
                    }
                  }}
                  className="h-11 w-full rounded-xl border border-ink-400 bg-ground px-3 text-sm text-cream focus:border-tan focus:outline-none"
                >
                  {WILAYAH.map((w) => (
                    <option key={w.id} value={w.id} className="bg-surface text-cream">
                      {w.nama}
                    </option>
                  ))}
                </select>
              </div>
            )} */}

            {/* ---------- Identitas ---------- */}
            <div className="mt-6 space-y-3">
              {/* <Field
                id="f-nama"
                label="Nama lengkap"
                value={nama}
                onChange={(v) => ubah("nama", v)}
                onBlur={() => blur("nama")}
                error={sentuh.nama ? errors.nama : undefined}
                autoComplete="name"
                inputRef={namaRef}
              /> */}

              <Field
                id="f-email"
                label="Email"
                type="email"
                value={email}
                onChange={(v) => ubah("email", v)}
                onBlur={() => blur("email")}
                error={sentuh.email ? errors.email : undefined}
                autoComplete="email"
                inputMode="email"
              />

              <Field
                id="f-sandi"
                label="Kata sandi"
                type={lihat ? "text" : "password"}
                value={sandi}
                onChange={(v) => ubah("sandi", v)}
                onBlur={() => blur("sandi")}
                onKeyUp={(e) => setCapsOn(e.getModifierState?.("CapsLock") ?? false)}
                error={sentuh.sandi ? errors.sandi : undefined}
                autoComplete="current-password"
                hint={capsOn ? "Caps Lock sedang aktif." : undefined}
                aksi={
                  <button
                    type="button"
                    onClick={() => setLihat((v) => !v)}
                    aria-label={lihat ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                    aria-pressed={lihat}
                    className="grid h-11 w-11 shrink-0 place-items-center text-sage transition-colors hover:text-cream-hi"
                  >
                    {lihat ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
              />
            </div>

            {/* ---------- Baris bantu ---------- */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3">
              <label className="flex min-h-[44px] cursor-pointer select-none items-center gap-2.5 pr-2 text-sm text-ink-500">
                <input
                  type="checkbox"
                  checked={ingat}
                  onChange={(e) => setIngat(e.target.checked)}
                  className="h-[18px] w-[18px] shrink-0 accent-[var(--color-tan-solid)]"
                />
                Ingat email saya
              </label>
              {/* <button
                type="button"
                onClick={isiDemo}
                className="micro-label flex min-h-[44px] items-center px-1 text-tan underline-offset-4 hover:underline"
              >
                Isi contoh demo
              </button> */}
            </div>


            {/* ---------- Submit ---------- */}
            <button
              type="submit"
              disabled={loading}
              className="btn-anim mt-5 flex min-h-[52px] w-full items-center justify-center gap-2.5 bg-tan-solid px-6 font-bold text-white transition-colors hover:bg-brand-700 disabled:cursor-wait disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="spin" aria-hidden="true" />
                  Menyiapkan ruang {aktif.singkat}…
                </>
              ) : (
                <>
                  <LogIn size={18} aria-hidden="true" />
                  Masuk sebagai {aktif.singkat}
                </>
              )}
            </button>

            {/* Status untuk pembaca layar */}
            <p aria-live="polite" className="sr-only">
              {loading ? "Sedang memproses masuk" : ""}
              {Object.values(errors).filter(Boolean).join(" ")}
            </p>

            {/* ---------- Jalur tanpa akun ----------
                Realitas lapangan: darurat & laporan sensitif tidak boleh
                terhalang formulir masuk. Dua pintu ini selalu terbuka. */}
            <div className="mt-6 border-t border-ink-300 pt-5">
              <span className="micro-label mb-3 block text-sage">Tanpa akun</span>
              <div className="grid gap-1 sm:grid-cols-1 ">
                {/* <Link
                  href="/lapor?anonim=1"
                  className="flex min-h-[48px] items-center justify-center gap-2 border border-ink-400 px-4 text-sm font-semibold text-cream no-underline transition-colors hover:border-cream-hi"
                >
                  <Anon size={16} aria-hidden="true" /> Lapor anonim
                </Link> */}
                <Link
                  href="/lapor?darurat=1"
                  className="flex min-h-[48px] items-center justify-center gap-2 border border-danger px-4 text-sm font-semibold text-danger no-underline transition-colors hover:bg-danger-bg"
                >
                  <Siren size={16} aria-hidden="true" /> Kondisi darurat
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}

/* ============================================================
   Field: label melayang + pesan galat. Dipisah supaya semantik
   (label ↔ input ↔ aria-describedby) konsisten di semua input.
   ============================================================ */
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
