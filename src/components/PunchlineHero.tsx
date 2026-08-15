"use client";

import { useEffect, useRef, useState } from "react";

/* ============================================================
   HERO PUNCHLINE — ala mockup "Sigap-Hero-Dynamic-Punchline".
   Kicker atas → "ADA MASALAH?" → ROTATOR masalah (slide-down
   dari atas ke bawah, merah) → "SIGAPin AJA" raksasa → CTA.
   Semua reveal dari atas ke bawah, lembut, hormat reduced-motion.
   ============================================================ */

const MASALAH = ["BANJIR?", "JALAN RUSAK?", "SAMPAH NUMPUK?", "LAMPU MATI?", "DARURAT?"];

/* Rotator CEPAT: masalah berganti tiap 700ms, lalu rotasi TERAKHIR
   menggulung "SIGAPin AJA" masuk lewat mekanik rolling yang sama. */
const ROLL_MS = 700;

function SlideDownText({
  text, base = 0, step = 40, className = "", active,
}: {
  text: string; base?: number; step?: number; className?: string; active: boolean;
}) {
  return (
    <span className={`inline-block ${className}`} aria-label={text}>
      {text.split("").map((ch, i) => (
        <span key={i} aria-hidden className="inline-block overflow-hidden align-bottom">
          <span
            className="punch-letter inline-block will-change-transform"
            style={{
              transitionDelay: `${base + i * step}ms`,
              transform: active ? "translateY(0)" : "translateY(-120%)",
              opacity: active ? 1 : 0,
            }}
          >
            {ch === " " ? "\u00A0" : ch}
          </span>
        </span>
      ))}
    </span>
  );
}

export function PunchlineHero({ onDone }: { onDone: () => void }) {
  const [show, setShow] = useState(false);
  const [mi, setMi] = useState(0);
  const [showSolusi, setShowSolusi] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const done = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 80);
    return () => clearTimeout(t);
  }, []);

  /* Rotator masalah: cepat, berhenti di masalah terakhir */
  useEffect(() => {
    const t = setInterval(() => setMi((v) => Math.min(v + 1, MASALAH.length - 1)), ROLL_MS);
    return () => clearInterval(t);
  }, []);

  /* Setelah rolling selesai, "SIGAPin AJA" muncul DI BAWAH masalah terakhir */
  useEffect(() => {
    const t = setTimeout(() => setShowSolusi(true), ROLL_MS * MASALAH.length + 500);
    return () => clearTimeout(t);
  }, []);

  /* Auto lanjut ke landing setelah beberapa detik */
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const t = setTimeout(finish, 400);
      return () => clearTimeout(t);
    }
    const t = setTimeout(finish, 8600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function finish() {
    if (done.current) return;
    done.current = true;
    setLeaving(true);
    setTimeout(onDone, 1100);
  }

  return (
    <div
      ref={root}
      className={`fixed inset-0 z-[200] flex h-[100svh] flex-col overflow-hidden bg-bg transition-all duration-[1100ms] ${
        leaving ? "-translate-y-10 opacity-0" : "translate-y-0 opacity-100"
      }`}
      style={{ transitionTimingFunction: "cubic-bezier(0.22,1,0.36,1)" }}
    >
      {/* grid halus */}
      <div aria-hidden className="grid-overlay pointer-events-none absolute inset-0 opacity-60" />

      {/* kicker atas */}
      <div className="relative z-10 flex justify-center pt-10">
        <div className="flex items-center gap-3">
          <span className="h-px w-8 bg-ink-300" />
          <p className="micro-label text-sage-pale">KOTA TANGGAP, SELESAI.</p>
          <span className="h-px w-8 bg-ink-300" />
        </div>
      </div>

      {/* konten tengah */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 text-center">
        <h1 className="font-display leading-[0.9] text-cream" style={{ fontSize: "clamp(36px,7vw,86px)" }}>
          <SlideDownText text="ADA MASALAH?" active={show} base={100} step={46} />
        </h1>

        {/* rotator masalah — cepat, berhenti di masalah terakhir.
            leading normal + tinggi 1.25em agar huruf turun tidak terpotong */}
        <div
          className="relative mt-2 flex h-[1.25em] items-center justify-center overflow-hidden"
          style={{ fontSize: "clamp(34px,8vw,92px)" }}
        >
          <span className="invisible whitespace-nowrap px-2 font-display leading-normal">
            {MASALAH.reduce((a, c) => (c.length > a.length ? c : a))}
          </span>
          <span
            key={mi}
            className="punch-swap absolute inset-0 flex items-center justify-center whitespace-nowrap font-display uppercase leading-normal text-tan"
          >
            {MASALAH[mi]}
          </span>
        </div>

        {/* pembatas */}
        <div className="my-5 flex items-center gap-2">
          <span className="h-1 w-1 rounded-full bg-ink-300" />
          <span className="h-px w-16 bg-ink-300" />
          <span className="h-1 w-1 rounded-full bg-tan" />
          <span className="h-px w-16 bg-ink-300" />
          <span className="h-1 w-1 rounded-full bg-ink-300" />
        </div>

        {/* solusi — muncul DI BAWAH masalah terakhir setelah rolling selesai */}
        <h2
          className="font-display leading-[0.82] tracking-[-0.03em] text-cream transition-all duration-700"
          style={{
            fontSize: "clamp(56px,14vw,160px)",
            opacity: showSolusi ? 1 : 0,
            transform: showSolusi ? "translateY(0)" : "translateY(0.35em)",
            transitionTimingFunction: "cubic-bezier(0.22,1,0.36,1)",
          }}
        >
          <span className="text-cream">SIGAP</span>
          <span className="lowercase text-tan">in</span>
          <span className="text-cream"> AJA</span>
        </h2>

        <div className="mt-10 flex flex-col items-center gap-5">
          <SlideDownText
            text="LAPORKAN. KAMI TANGGAP. SELESAI."
            active={show}
            base={1900}
            step={16}
            className="micro-label text-sage-pale"
          />

        </div>
      </div>

      {/* footer pojok */}
      <div className="absolute bottom-6 left-6 z-10 hidden items-center gap-2.5 sm:flex">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-tan opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-tan" />
        </span>
        <span className="micro-label text-sage">Live · 2.4k Laporan Aktif</span>
      </div>
      <div className="absolute bottom-6 right-6 z-10">
        <p className="micro-label text-sage">SIGAP © 2026</p>
      </div>

      {/* watermark raksasa */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden opacity-[0.04]">
        <span className="whitespace-nowrap font-display leading-none tracking-[-0.05em] text-cream" style={{ fontSize: "22vw" }}>
          SIGAP
        </span>
      </div>
    </div>
  );
}
