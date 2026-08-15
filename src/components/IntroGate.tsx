"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { PunchlineHero } from "@/components/PunchlineHero";

/* Intro punchline + PRELOAD landing:
   Landing SELALU ter-mount sejak awal agar font, chart, peta, dan
   observer termuat & menghitung posisi sebelum tampil — sehingga
   saat intro selesai, landing muncul mulus tanpa "patah".

   Intro di-cache di localStorage (sigap_intro_seen): hanya
   ditayangkan sekali; kunjungan berikutnya langsung masuk tanpa
   menunggu animasi. Flag dibaca lewat useEffect (bukan initializer)
   karena initializer ikut jalan saat SSR sehingga selalu false. */
export function IntroGate({ children }: { children: ReactNode }) {
  const [done, setDone] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let seen = false;
    try { seen = localStorage.getItem("sigap_intro_seen") === "1"; } catch { /* abaikan */ }
    setDone(seen);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || done) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    window.scrollTo(0, 0);
    return () => {
      document.documentElement.style.overflow = prev;
    };
  }, [ready, done]);

  const finish = useCallback(() => {
    document.documentElement.style.overflow = "";
    window.scrollTo(0, 0);
    setDone(true);
    try { localStorage.setItem("sigap_intro_seen", "1"); } catch { /* abaikan */ }
    // Landing di-preload tersembunyi → animasi per-huruf hero sudah
    // sempat habis terputar. Reset & putar ulang reveal untuk elemen
    // yang terlihat sekarang, sehingga "LAPOR CEPAT, KOTA TANGGAP."
    // berjalan letter-by-letter tepat saat landing muncul.
    requestAnimationFrame(() => {
      const vh = window.innerHeight;
      const els = document.querySelectorAll<HTMLElement>("[data-rev], [data-words]");
      els.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < vh * 1.15 && r.bottom > 0) el.classList.remove("is-rev");
      });
      void document.documentElement.offsetHeight; // commit state tersembunyi
      els.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < vh * 1.15 && r.bottom > 0) el.classList.add("is-rev");
      });
    });
  }, []);

  const showIntro = ready && !done;

  return (
    <>
      <div
        className={showIntro ? "intro-lock" : "anim-fade-up"}
        style={showIntro ? { visibility: "hidden", height: "100svh", overflow: "hidden" } : undefined}
        aria-hidden={showIntro}
        inert={showIntro ? true : undefined}
      >
        {children}
      </div>
      {showIntro && <PunchlineHero onDone={finish} />}
    </>
  );
}
