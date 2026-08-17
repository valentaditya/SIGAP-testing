"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { KATEGORI, priorityLabel, priorityColor, SKOR_DARURAT, type KategoriId } from "@/lib/data";
import { Icon } from "@/components/Icon";
import { Chip } from "@/components/Chip";
import {
  MapPin, Camera, FileText, CheckCircle2, ArrowRight, ArrowLeft,
  Bot, Network, Gauge, Sparkles, Ticket, EyeOff, UserRound,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { bisa } from "@/lib/roles";
import { useSearchParams } from "next/navigation";

const MiniMap = dynamic(() => import("@/components/MiniMap").then((m) => m.MiniMap), {
  ssr: false,
  loading: () => <div className="grid h-[280px] place-items-center text-sm text-ink-500">Memuat peta…</div>,
});

type Step = 1 | 2 | 3;
type Phase = "form" | "running" | "done";

// 3 agen AI sesuai proposal: klasifikasi, analisis dampak, penentuan prioritas
const AGENT_STEPS = [
  { icon: Bot, nama: "Agent 1 — Klasifikasi", desc: "Mengklasifikasikan jenis permasalahan…" },
  { icon: Network, nama: "Agent 2 — Analisis Dampak", desc: "Menganalisis dampak sosial & lokasi…" },
  { icon: Gauge, nama: "Agent 3 — Prioritas", desc: "Menghitung Skor Urgensi (1–10) & SLA…" },
];

// Dibuat di luar komponen supaya jelas ini efek samping milik event,
// bukan nilai yang boleh dihitung selama render.
function buatNomorTiket() {
  return `SGP-2026-0${113 + Math.floor(Math.random() * 40)}`;
}

export default function LaporClient() {
  const { user, tambahLaporan, tambahPoin, tambahNotif } = useApp();
  const params = useSearchParams();
  const [step, setStep] = useState<Step>(1);
  const [phase, setPhase] = useState<Phase>("form");
  const [runIdx, setRunIdx] = useState(0);

  // Jalur "tanpa akun" dari halaman masuk membuka form dalam mode siap pakai:
  // ?anonim=1 → identitas disembunyikan, ?darurat=1 → kategori keamanan.
  const [anonim, setAnonim] = useState(params.get("anonim") === "1");

  const [kategori, setKategori] = useState<KategoriId>(
    params.get("darurat") === "1" ? "keamanan" : "jalan",
  );
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [alamat, setAlamat] = useState("");
  const [judul, setJudul] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [foto, setFoto] = useState(0);

  const result = useMemo(() => {
    const k = KATEGORI.find((x) => x.id === kategori)!;
    const base = { jalan: 7.8, sampah: 6.2, banjir: 8.8, lampu: 5.8, keamanan: 8.2, fasum: 4.2 }[kategori];
    const panjang = Math.min(deskripsi.length / 40, 1.2);
    const score = Math.round(Math.min(base + panjang + foto * 0.2, 9.8) * 10) / 10;
    const severity = score;
    // Confidence diturunkan dari kelengkapan input, bukan acak.
    // Sebelumnya Math.random() membuat angka berubah tiap render
    // sehingga nilai yang tampil ≠ nilai yang tersimpan.
    const lengkap = (deskripsi.length >= 40 ? 1 : deskripsi.length / 40) * 0.08 + Math.min(foto, 3) * 0.017;
    const conf = Math.min(0.85 + lengkap, 0.98).toFixed(2);
    const darurat = score >= SKOR_DARURAT;
    const sla = darurat ? "Segera (< 12 jam)" : score >= 8 ? "24 jam" : score >= 5.5 ? "48–72 jam" : "5–7 hari";
    return { k, score, severity, conf, sla, darurat };
  }, [kategori, deskripsi, foto]);

  // Nomor tiket dibuat sekali saat pelapor menekan kirim, bukan saat render.
  // Sebelumnya dihitung inline sehingga berubah tiap render — nomor yang
  // tersimpan di store bisa berbeda dari yang dibaca pelapor di layar.
  const [tiket, setTiket] = useState("");
  const pelaporNama = anonim ? "Anonim" : (user?.nama ?? "Warga");

  function submit() {
    const nomor = buatNomorTiket();
    setTiket(nomor);
    setPhase("running");
    setRunIdx(0);
    let i = 0;
    const t = setInterval(() => {
      i++;
      setRunIdx(i);
      if (i >= AGENT_STEPS.length) {
        clearInterval(t);
        // `nomor` dioper eksplisit: closure ini terbentuk sebelum state
        // `tiket` sempat commit, jadi membacanya dari state akan kosong.
        setTimeout(() => { selesaiAnalisis(nomor); setPhase("done"); }, 500);
      }
    }, 900);
  }

  function selesaiAnalisis(nomor: string) {
    const k = KATEGORI.find((x) => x.id === kategori)!;
    tambahLaporan({
      id: nomor, judul, kategori,
      lokasi: { lat: pos?.lat ?? -7.7956, lng: pos?.lng ?? 110.3695, alamat },
      pelapor: pelaporNama, waktu: new Date().toISOString(), status: "reported",
      foto, dukungan: 0,
      ai: { kategori: k.nama, confidence: parseFloat(result.conf), severity: result.severity, dampak: "Dianalisis AI Multi-Agent", priorityScore: result.score },
      sla: result.sla,
    });
    // Poin hanya untuk warga. Admin dan petugas memakai formulir ini
    // untuk mencatat temuan dinas, bukan berlomba di papan peringkat;
    // memberi mereka poin akan mengotori peringkat warga.
    // Pelapor anonim juga tidak dapat poin, sebab tidak ada akun
    // yang bisa dikreditkan.
    const dapatPoin = bisa(user?.role, "gamifikasi") && !anonim;
    if (dapatPoin) tambahPoin(25);
    tambahNotif({
      judul: "Laporan Terkirim",
      pesan: `${nomor} — ${judul}.${dapatPoin ? " +25 poin" : ""}`,
      waktu: "Baru saja",
      tone: "success",
    });
  }

  const input =
    "w-full rounded-xl border border-ink-300 bg-surface px-4 py-3 text-sm text-cream outline-none transition-colors placeholder:text-ink-500 focus:border-brand-600 focus:ring-2 focus:ring-brand-100";

  return (
    <main className="mx-auto max-w-[860px] px-6 py-12">
      <div className="mb-8 text-center">
        <Chip tone="brand" className="mb-4"><FileText size={13} /> Form Pelaporan</Chip>
        <h1 className="font-display text-3xl font-extrabold md:text-4xl">Laporkan Masalah di Sekitarmu</h1>
        <p className="mt-3 text-ink-500">Isi 3 langkah singkat — AI Multi-Agent kami yang menilai prioritasnya.</p>
      </div>

      {phase === "form" && (
        <div className="rounded-2xl bg-surface p-6 shadow-[var(--shadow-card)] md:p-8">
          {/* Stepper */}
          <ol className="mb-8 flex items-center gap-2">
            {[1, 2, 3].map((n) => (
              <li key={n} className="flex flex-1 items-center gap-2">
                <span
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-full font-display text-sm font-bold ${
                    step >= n ? "bg-brand-600 text-white" : "border border-ink-300 text-ink-500"
                  }`}
                >
                  {n}
                </span>
                <span className={`hidden text-sm font-semibold sm:block ${step >= n ? "text-ink-900" : "text-ink-500"}`}>
                  {n === 1 ? "Lokasi & Kategori" : n === 2 ? "Detail" : "Tinjau"}
                </span>
                {n < 3 && <span className={`h-0.5 flex-1 rounded ${step > n ? "bg-brand-600" : "bg-ink-300"}`} />}
              </li>
            ))}
          </ol>

          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-semibold">Kategori Masalah</label>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {KATEGORI.map((k) => (
                    <button
                      key={k.id}
                      onClick={() => setKategori(k.id)}
                      className={`flex items-center gap-2.5 rounded-xl border p-3.5 text-left text-sm font-semibold transition-all ${
                        kategori === k.id
                          ? "border-brand-600 bg-brand-50 text-brand-700 ring-2 ring-brand-100"
                          : "border-ink-300 text-ink-700 hover:border-brand-600 hover:text-cream"
                      }`}
                    >
                      <span
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-white"
                        style={{ background: k.warna }}
                      >
                        <Icon name={k.ikon} size={18} />
                      </span>
                      {k.nama}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
                  <MapPin size={15} className="text-brand-600" /> Tandai Lokasi di Peta
                </label>
                <MiniMap
                  value={pos}
                  onPick={(p) => {
                    setPos(p);
                    setAlamat(`Lat ${p.lat.toFixed(4)}, Lng ${p.lng.toFixed(4)}`);
                  }}
                />
                <input
                  className={`${input} mt-3`}
                  placeholder="Atau ketik alamat lengkap…"
                  value={alamat}
                  onChange={(e) => setAlamat(e.target.value)}
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setStep(2)}
                  disabled={!alamat}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Lanjut <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-semibold">Judul Laporan</label>
                <input className={input} placeholder="cth: Lubang besar di tengah jalan" value={judul} onChange={(e) => setJudul(e.target.value)} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold">Deskripsi Detail</label>
                <textarea
                  className={`${input} min-h-[120px] resize-y`}
                  placeholder="Jelaskan kondisi, sejak kapan, dan seberapa parah…"
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
                  <Camera size={15} className="text-brand-600" /> Foto Pendukung
                </label>
                <div
                  onClick={() => setFoto((f) => Math.min(f + 1, 5))}
                  className="grid cursor-pointer place-items-center rounded-xl border-2 border-dashed border-ink-300 bg-brand-50/50 p-8 text-center transition-colors hover:border-brand-600 hover:text-cream"
                >
                  <Camera size={28} className="text-ink-300" />
                  <p className="mt-2 text-sm font-semibold text-ink-700">Klik untuk simulasi unggah foto</p>
                  <p className="text-xs text-ink-500">{foto} foto terlampir (maks 5)</p>
                </div>
              </div>
              <div className="flex justify-between">
                <button onClick={() => setStep(1)} className="inline-flex items-center gap-2 rounded-xl border border-ink-300 px-5 py-3 font-semibold text-ink-700 hover:border-brand-600 hover:text-cream">
                  <ArrowLeft size={18} /> Kembali
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!judul || !deskripsi}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Lanjut <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="rounded-xl bg-brand-50 p-5">
                <h3 className="mb-3 font-display font-bold">Ringkasan Laporan</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex gap-2"><dt className="w-28 shrink-0 text-ink-500">Kategori</dt><dd className="font-semibold">{result.k.nama}</dd></div>
                  <div className="flex gap-2"><dt className="w-28 shrink-0 text-ink-500">Lokasi</dt><dd className="font-semibold">{alamat}</dd></div>
                  <div className="flex gap-2"><dt className="w-28 shrink-0 text-ink-500">Judul</dt><dd className="font-semibold">{judul}</dd></div>
                  <div className="flex gap-2"><dt className="w-28 shrink-0 text-ink-500">Deskripsi</dt><dd>{deskripsi}</dd></div>
                  <div className="flex gap-2"><dt className="w-28 shrink-0 text-ink-500">Foto</dt><dd>{foto} terlampir</dd></div>
                  <div className="flex gap-2"><dt className="w-28 shrink-0 text-ink-500">Pelapor</dt><dd className="font-semibold">{pelaporNama}</dd></div>
                </dl>
              </div>

              {/* Toggle Anonim */}
              <button
                type="button"
                onClick={() => setAnonim(!anonim)}
                className={`flex w-full items-center justify-between rounded-xl border p-4 transition-all ${
                  anonim ? "border-brand-600 bg-brand-50 ring-2 ring-brand-100" : "border-ink-300 hover:border-brand-600/60"
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className={`grid h-10 w-10 place-items-center rounded-lg ${anonim ? "bg-brand-600 text-ink-900" : "bg-ground text-ink-700"}`}>
                    {anonim ? <EyeOff size={18} /> : <UserRound size={18} />}
                  </span>
                  <span className="text-left">
                    <span className="block text-sm font-bold text-cream">Lapor sebagai anonim</span>
                    <span className="block text-xs text-ink-500">Identitasmu tidak ditampilkan ke publik (untuk laporan sensitif)</span>
                  </span>
                </span>
                <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${anonim ? "bg-brand-600" : "bg-ink-300"}`}>
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-cream-hi transition-all ${anonim ? "left-[22px]" : "left-0.5"}`} />
                </span>
              </button>

              <div className="flex justify-between">
                <button onClick={() => setStep(2)} className="inline-flex items-center gap-2 rounded-xl border border-ink-300 px-5 py-3 font-semibold text-ink-700 hover:border-brand-600 hover:text-cream">
                  <ArrowLeft size={18} /> Kembali
                </button>
                <button onClick={submit} className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-700">
                  <Sparkles size={18} /> Kirim & Analisis AI
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* RUNNING */}
      {phase === "running" && (
        <div className="rounded-2xl bg-surface p-6 shadow-[var(--shadow-card)] md:p-8">
          <h2 className="mb-1 text-center font-display text-2xl font-extrabold">AI Multi-Agent Menganalisis…</h2>
          <p className="mb-8 text-center text-sm text-ink-500">Laporanmu sedang diproses oleh 3 agen AI secara berurutan.</p>
          <div className="mx-auto max-w-[480px] space-y-3">
            {AGENT_STEPS.map((a, i) => {
              const Ic = a.icon;
              const state = i < runIdx ? "done" : i === runIdx ? "run" : "wait";
              return (
                <div
                  key={a.nama}
                  className={`flex items-center gap-4 rounded-xl border p-4 transition-all ${
                    state === "done" ? "border-success bg-success-bg/50" : state === "run" ? "border-brand-600 bg-brand-50" : "border-ink-300/60 opacity-50"
                  }`}
                >
                  <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${state === "done" ? "bg-success text-ink-900" : "bg-brand-600 text-ink-900"}`}>
                    {state === "done" ? <CheckCircle2 size={20} /> : <Ic size={20} className={state === "run" ? "animate-pulse" : ""} />}
                  </span>
                  <div>
                    <p className="font-semibold text-cream">{a.nama}</p>
                    <p className="text-xs text-ink-500">{state === "done" ? "Selesai ✓" : a.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DONE */}
      {phase === "done" && (
        <div className="rounded-2xl bg-surface p-6 shadow-[var(--shadow-card)] md:p-8">
          <div className="mb-6 text-center">
            <span className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-success-bg text-success"><CheckCircle2 size={34} /></span>
            <h2 className="font-display text-2xl font-extrabold">Laporan Terkirim & Teranalisis</h2>
            <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-ink-500">
              <Ticket size={15} /> Nomor tiket: <span className="font-mono font-bold text-ink-900">{tiket}</span>
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-ink-300/60 p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-ink-500">Kategori (AI)</p>
              <p className="mt-1 flex items-center gap-2 font-display text-lg font-bold">
                <span className="grid h-8 w-8 place-items-center rounded-lg text-white" style={{ background: result.k.warna }}>
                  <Icon name={result.k.ikon} size={16} />
                </span>
                {result.k.nama}
              </p>
              <p className="mt-1 text-xs text-ink-500">Confidence: {(parseFloat(result.conf) * 100).toFixed(0)}%</p>
            </div>
            <div className="rounded-xl border border-ink-300/60 p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-ink-500">Severity</p>
              <p className="mt-1 font-display text-lg font-bold">{result.severity} / 10</p>
              <p className="mt-1 text-xs text-ink-500">Estimasi tingkat keparahan</p>
            </div>
            <div className="rounded-xl border border-ink-300/60 p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-ink-500">Skor Urgensi</p>
              <p className="mt-1 font-display text-lg font-bold" style={{ color: priorityColor(result.score) }}>
                {result.score} / 10 <span className="text-sm font-semibold text-ink-500">· {priorityLabel(result.score)}</span>
              </p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#EEF1F0]">
                <div className="h-full rounded-full" style={{ width: `${result.score * 10}%`, background: priorityColor(result.score) }} />
              </div>
              {result.darurat && (
                <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-600">
                  ⚠ Skor ≥ 9 — Prioritas Darurat, diteruskan ke jalur penanganan darurat
                </p>
              )}
            </div>
            <div className="rounded-xl border border-ink-300/60 p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-ink-500">Estimasi SLA</p>
              <p className="mt-1 font-display text-lg font-bold">{result.sla}</p>
              <p className="mt-1 text-xs text-ink-500">Target waktu penanganan</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a href="/dashboard" className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white no-underline hover:bg-brand-700">
              Lihat di Dashboard <ArrowRight size={18} />
            </a>
            <button
              onClick={() => { setPhase("form"); setStep(1); setJudul(""); setDeskripsi(""); setFoto(0); setAlamat(""); setPos(null); }}
              className="inline-flex items-center gap-2 rounded-xl border border-ink-300 px-6 py-3 font-semibold text-ink-700 hover:border-brand-600 hover:text-cream"
            >
              Buat Laporan Baru
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
