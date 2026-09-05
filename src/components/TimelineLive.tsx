"use client";
import { Sparkles, Clock, CheckCircle2 } from "lucide-react";
import { Rise } from "@/components/Words";

/* Baris timeline: 5 tahap resolusi laporan */
const ROWS = [
  { n: "01", label: "Laporan Diterima", desc: "Foto bukti dan titik koordinat GPS tervalidasi otomatis oleh sistem." },
  { n: "02", label: "AI Menganalisis", desc: "Tiga agen AI mengukur kategori, bobot dampak, dan Skor Urgensi." },
  { n: "03", label: "Diverifikasi Admin", desc: "Penetapan antrean prioritas dan penerbitan tiket penanganan resmi." },
  { n: "04", label: "Tim Lapangan Bertindak", desc: "Unit petugas dinas terdekat diberangkatkan langsung menuju lokasi." },
  { n: "05", label: "Selesai & Terpublikasi", desc: "Warga menerima kabar, foto hasil penanganan, dan tercatat di data kota." },
];

export function TimelineLive() {
  return (
    <section className="border-b border-ink-300 bg-ground/40 py-28">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-tan" />
              <Rise className="micro-label text-sage">Siklus Resolusi Laporan</Rise>
            </div>
            <Rise as="h2" className="font-display mt-3 text-[clamp(2rem,4.5vw,3.5rem)] font-extrabold tracking-tight text-cream-hi">
              Dari lapor sampai <span className="text-tan">tuntas.</span>
            </Rise>
            <p className="mt-3 max-w-[54ch] text-base text-sage-pale font-normal">
              Transparansi setiap fase penanganan masalah warga dengan pelacakan status yang terukur.
            </p>
          </div>
          <Rise d={120} className="inline-flex items-center gap-2 rounded-full border border-ink-300 bg-surface px-4 py-2 text-xs font-semibold text-sage shadow-xs">
            <CheckCircle2 size={14} className="text-success" />
            <span>Target Penanganan Cepat &amp; Tuntas</span>
          </Rise>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {ROWS.map((r, i) => (
            <Rise
              key={r.n}
              d={i * 80}
              className="card-hover group flex flex-col justify-between rounded-3xl border border-ink-300 bg-surface p-6 shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-tan/10 font-display text-sm font-bold text-tan">
                    {r.n}
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-sage">
                    Tahap {r.n}
                  </span>
                </div>
                <h3 className="font-display mt-5 text-lg font-bold tracking-tight text-cream transition-colors group-hover:text-tan">
                  {r.label}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-sage-pale font-normal">
                  {r.desc}
                </p>
              </div>
            </Rise>
          ))}
        </div>
      </div>
    </section>
  );
}
