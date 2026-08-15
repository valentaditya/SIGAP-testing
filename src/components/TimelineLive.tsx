"use client";
import { useEffect, useRef, useState } from "react";
import { registerStage } from "@/lib/scroll-choreo";

/* Baris timeline: timestamp mono, judul Anton, catatan mono */
const ROWS = [
  { t: "T+00:04", label: "Laporan diterima", note: "foto + lokasi tervalidasi" },
  { t: "T+00:12", label: "AI Multi-Agent menilai", note: "kategori · dampak · prioritas" },
  { t: "T+00:24", label: "Diverifikasi admin", note: "antrean prioritas terbentuk" },
  { t: "T+02:10", label: "Tim lapangan ditugaskan", note: "unit terdekat dikirim" },
  { t: "T+23:40", label: "Selesai & terpublikasi", note: "warga menerima kabar · maks 24 jam" },
];
/* Satu seri menit — jam, jarak, status, dan baris yang menyala
   SEMUA diinterpolasi dari array ini sehingga tidak mungkin saling bertentangan.
   Menit dibuat GENAP & total ≤ 24 jam (1440 menit). */
const MINUTES = [0, 4, 12, 24, 130, 1420];
const KM_PER_MIN = 0.012; // ~0,72 km/jam penanganan tersebar

function fmt(mm: number) {
  const m = Math.floor(mm);
  const s = Math.floor((mm - m) * 60);
  const hh = Math.floor(m / 60);
  const rem = m % 60;
  return hh > 0
    ? `${String(hh).padStart(2, "0")}:${String(rem).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${String(rem).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function TimelineLive() {
  const wrap = useRef<HTMLDivElement>(null);
  const pin = useRef<HTMLDivElement>(null);
  const [p, setP] = useState(0);

  useEffect(() => {
    const w = wrap.current;
    const pEl = pin.current;
    if (!w || !pEl) return;
    let raf = 0;
    const loop = () => {
      const v = parseFloat(pEl.style.getPropertyValue("--p") || "0");
      setP((prev) => (Math.abs(prev - v) > 0.002 ? v : prev));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const unregister = registerStage(w, pEl);
    return () => {
      cancelAnimationFrame(raf);
      unregister();
    };
  }, []);

  /* Interpolasi piecewise dari seri menit */
  const seg = Math.min(ROWS.length - 1, Math.floor(p * ROWS.length));
  const segP = Math.min(1, Math.max(0, p * ROWS.length - seg));
  const mm = MINUTES[seg] + (MINUTES[seg + 1] - MINUTES[seg]) * segP;
  const km = (mm * KM_PER_MIN).toFixed(1);
  const lit = Math.min(ROWS.length - 1, Math.floor(p * ROWS.length + 0.0001));

  return (
    <div ref={wrap} className="relative border-y-2 border-cream bg-ground" style={{ height: "400svh" }}>
      <div ref={pin} className="sticky top-0 flex h-[100svh] items-center overflow-hidden">
        <div className="mx-auto grid w-full max-w-[1180px] gap-12 px-6 lg:grid-cols-2">
          {/* Kiri: headline + lima baris ber-rule */}
          <div>
            <p className="micro-label text-sage">Siklus satu laporan</p>
            <h2 className="font-display mt-4 text-[clamp(2.2rem,5.4vw,4.4rem)] text-cream-hi">
              Dari lapor sampai <span className="text-tan">tuntas.</span>
            </h2>
            <div className="mt-8">
              {ROWS.map((r, i) => (
                <div
                  key={r.t}
                  className="flex items-baseline gap-5 border-t border-ink-300 py-4 transition-opacity duration-500 last:border-b"
                  style={{ opacity: i <= lit ? 1 : 0.3 }}
                >
                  <span className="micro-label w-[9ch] shrink-0 text-tan">{r.t}</span>
                  <span className="font-display text-lg text-cream md:text-xl">{r.label}</span>
                  <span className="micro-label ml-auto hidden text-right text-sage md:block">{r.note}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Kanan: panel jam ber-border 2px */}
          <div className="flex items-center">
            <div className="relative aspect-square w-full max-w-[440px] border-2 border-cream p-7">
              <div className="flex items-center justify-between">
                <span className="micro-label text-sage">RUN / SGP-2026-0108</span>
                <span className="micro-label text-tan">{ROWS[lit].label}</span>
              </div>
              <p className="micro-label mt-10 text-sage">Elapsed</p>
              <p className="font-display mt-2 text-[clamp(3.2rem,8vw,6.4rem)] leading-none text-tan">{fmt(mm)}</p>
              <p className="micro-label mt-6 text-sage">
                Jarak penanganan <span className="text-cream">{km} km</span>
              </p>
              {/* Meter merah 6px di dasar panel */}
              <div className="absolute bottom-0 left-0 h-[6px] bg-tan" style={{ width: `${p * 100}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
