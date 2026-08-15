"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, LogIn, UserRound, ShieldCheck, HardHat, Eye, EyeOff } from "lucide-react";
import { useApp, type Role } from "@/lib/store";

const ROLES: { id: Role; label: string; desc: string; icon: any }[] = [
  { id: "warga", label: "Warga", desc: "Laporkan & pantau masalah lingkungan", icon: UserRound },
  { id: "admin", label: "Admin / Pemerintah", desc: "Verifikasi & kelola laporan", icon: ShieldCheck },
  { id: "petugas", label: "Petugas Lapangan", desc: "Tangani laporan yang ditugaskan", icon: HardHat },
];

export default function LoginPage() {
  const { login } = useApp();
  const router = useRouter();
  const [role, setRole] = useState<Role>("warga");
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [sandi, setSandi] = useState("");
  const [lihat, setLihat] = useState(false);

  function masuk(e: React.FormEvent) {
    e.preventDefault();
    if (!nama || !email) return;
    login(nama, email, role);
    router.push(role === "admin" ? "/dashboard" : role === "petugas" ? "/petugas" : "/warga");
  }

  const input =
    "w-full rounded-xl border border-ink-300 bg-surface px-4 py-3 text-sm text-cream outline-none transition-colors placeholder:text-ink-500 focus:border-brand-600 focus:ring-2 focus:ring-brand-100";

  return (
    <main className="grid min-h-[calc(100vh-var(--nav-h))] place-items-center px-6 py-12">
      <div className="anim-fade-up grid w-full max-w-[880px] overflow-hidden rounded-3xl bg-surface shadow-[var(--shadow-pop)] md:grid-cols-2">
        {/* Panel kiri */}
        <div className="relative hidden flex-col justify-between bg-ground-2 p-8 text-cream md:flex">
          <div className="flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-600 text-ink-900"><MapPin size={22} /></span>
            <span className="font-[family-name:var(--font-grotesk)] text-2xl font-extrabold tracking-tight">sigap</span>
          </div>
          <div>
            <h2 className="font-display text-3xl font-extrabold leading-tight tracking-tight text-cream-hi">Lapor Cepat,<br />Kota Tanggap.</h2>
            <p className="mt-3 text-sm text-sage-pale">Platform Smart Community dengan AI Multi-Agent untuk kota yang lebih responsif dan transparan.</p>
          </div>
          <p className="micro-label text-sage">Universitas Atma Jaya Yogyakarta · 2026</p>
        </div>

        {/* Form */}
        <form onSubmit={masuk} className="p-8">
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-cream-hi">Masuk ke SIGAP</h1>
          <p className="mt-1 text-sm text-ink-500">Pilih peran dan masuk untuk melanjutkan.</p>

          <div className="mt-6 space-y-2">
            {ROLES.map((r) => {
              const Ic = r.icon;
              return (
                <button
                  type="button"
                  key={r.id}
                  onClick={() => setRole(r.id)}
                  className={`flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition-all ${
                    role === r.id ? "border-brand-600 bg-brand-50 ring-2 ring-brand-100" : "border-ink-300 hover:border-brand-600/60"
                  }`}
                >
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${role === r.id ? "bg-brand-600 text-ink-900" : "bg-ground text-ink-700"}`}>
                    <Ic size={18} />
                  </span>
                  <span>
                    <span className="block text-sm font-bold text-cream">{r.label}</span>
                    <span className="block text-xs text-ink-500">{r.desc}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-5 space-y-3">
            <input className={input} placeholder="Nama lengkap" value={nama} onChange={(e) => setNama(e.target.value)} required />
            <input className={input} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <div className="relative">
              <input className={`${input} pr-11`} type={lihat ? "text" : "password"} placeholder="Kata sandi" value={sandi} onChange={(e) => setSandi(e.target.value)} required />
              <button type="button" onClick={() => setLihat(!lihat)} aria-label="Tampilkan sandi" className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-500">
                {lihat ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-anim mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 font-bold text-ink-900 hover:bg-brand-700">
            <LogIn size={18} /> Masuk sebagai {ROLES.find((r) => r.id === role)?.label}
          </button>
          <p className="mt-3 text-center text-xs text-ink-500">Demo — tidak ada kata sandi sungguhan yang diverifikasi.</p>
        </form>
      </div>
    </main>
  );
}
