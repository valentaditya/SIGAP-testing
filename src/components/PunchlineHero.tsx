"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Typewriter } from "@/components/Typewriter";

/* ============================================================
   INTRO — dulu menahan pengguna 8,6 detik tanpa jalan keluar.
   Sekarang: headline diketik per karakter (50ms), total sekitar
   3,4 detik, dan BISA dilewati kapan saja (klik, tombol apa pun,
   atau scroll). Intro yang tidak bisa dilewati adalah pola yang
   menghukum pengunjung berulang.
   ============================================================ */

const HEADLINE = "ADA MASALAH? SIGAPin AJA.";
const MASALAH = ["BANJIR", "JALAN RUSAK", "SAMPAH NUMPUK", "LAMPU MATI"];

export function PunchlineHero({ onDone }: { onDone: () => void }) {
  const [keluar, setKeluar] = useState(false);
  const [selesaiKetik, setSelesaiKetik] = useState(false);
  const [mi, setMi] = useState(0);
  const done = useRef(false);

  const finish = useCallback(() => {
    if (done.current) return;
    done.current = true;
    setKeluar(true);
    setTimeout(onDone, 620);
  }, [onDone]);

  /* Rotator kata masalah berjalan setelah headline selesai diketik. */
  useEffect(() => {
    if (!selesaiKetik) return;
    const t = setInterval(() => setMi((v) => v + 1), 620);
    return () => clearInterval(t);
  }, [selesaiKetik]);

  /* Tutup otomatis, tapi jauh lebih cepat dari sebelumnya. */
  useEffect(() => {
    const kurangGerak = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = setTimeout(finish, kurangGerak ? 300 : 4200);
    return () => clearTimeout(t);
  }, [finish]);

  /* Bisa dilewati: klik, tombol apa pun, scroll, atau sentuh. */
  useEffect(() => {
    const lewati = () => finish();
    window.addEventListener("keydown", lewati);
    window.addEventListener("wheel", lewati, { passive: true });
    window.addEventListener("touchstart", lewati, { passive: true });
    return () => {
      window.removeEventListener("keydown", lewati);
      window.removeEventListener("wheel", lewati);
      window.removeEventListener("touchstart", lewati);
    };
  }, [finish]);

  return (
    <div
      onClick={finish}
      role="button"
      tabIndex={0}
      aria-label="Lewati intro"
      className={`fixed inset-0 z-[200] flex h-[100svh] cursor-pointer flex-col items-center justify-center overflow-hidden bg-bg px-6 transition-all duration-[620ms] ${
        keluar ? "pointer-events-none -translate-y-6 opacity-0" : "opacity-100"
      }`}
      style={{ transitionTimingFunction: "cubic-bezier(0.22,1,0.36,1)" }}
    >
      <div aria-hidden="true" className="grid-overlay pointer-events-none absolute inset-0 opacity-50" />

      <div className="relative z-10 w-full max-w-[1100px] text-center">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-ink-300 bg-surface/80 px-4 py-1.5 shadow-sm">
          <span className="h-2 w-2 rounded-full bg-tan animate-pulse" />
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-sage">
            Sistem Informasi &amp; Gerak Aktif Pelaporan
          </span>
        </div>

        {/* Headline utama: diketik per karakter dengan jeda 50ms. */}
        <h1
          className="font-display font-extrabold tracking-tight text-cream-hi"
          style={{ fontSize: "clamp(36px,7.5vw,96px)", lineHeight: 1.05 }}
        >
          <Typewriter text={HEADLINE} speed={50} startDelay={250} onDone={() => setSelesaiKetik(true)} />
        </h1>

        {/* Kata masalah berganti setelah headline selesai */}
        <div className="mt-8 flex h-9 items-center justify-center gap-3" aria-hidden="true">
          <span
            className={`h-px bg-ink-300 transition-all duration-500 ${selesaiKetik ? "w-12 opacity-100" : "w-0 opacity-0"}`}
          />
          <span className="inline-flex items-center rounded-full bg-tan/10 px-4 py-1 font-mono text-xs font-bold uppercase tracking-wider text-tan border border-tan/20">
            {selesaiKetik && (
              <span key={mi} className="punch-swap inline-block">
                {MASALAH[mi % MASALAH.length]}
              </span>
            )}
          </span>
          <span
            className={`h-px bg-ink-300 transition-all duration-500 ${selesaiKetik ? "w-12 opacity-100" : "w-0 opacity-0"}`}
          />
        </div>
      </div>

      <p
        className={`font-mono text-xs font-semibold uppercase tracking-wider absolute bottom-8 text-sage transition-opacity duration-500 ${
          selesaiKetik ? "opacity-100" : "opacity-0"
        }`}
      >
        Ketuk layar untuk lanjut
      </p>
    </div>
  );
}
