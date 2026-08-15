"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { PunchlineHero } from "@/components/PunchlineHero";

/* Intro punchline + PRELOAD landing:
   Landing SELALU ter-mount sejak awal agar font, chart, peta, dan
   observer termuat & menghitung posisi sebelum tampil — sehingga
   saat intro selesai, landing muncul mulus tanpa "patah".

   Intro di-cache (sigap_intro_seen di localStorage + cookie): hanya
   ditayangkan sekali; kunjungan berikutnya langsung masuk tanpa
   menunggu animasi. Flag dibaca dari server (cookie) agar SSR sudah
   merender hero terlihat (tidak ada flash kosong), lalu diverifikasi
   di client lewat localStorage. */
export function IntroGate({ children, introSeen = false }: { children: ReactNode; introSeen?: boolean }) {
  const [done, setDone] = useState(introSeen);
  const [cached, setCached] = useState(introSeen);
  const [ready, setReady] = useState(introSeen);

  useEffect(() => {
    let seen = introSeen;
    try { seen = localStorage.getItem("sigap_intro_seen") === "1"; } catch { /* abaikan */ }
    setCached(seen);
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
    try {
      localStorage.setItem("sigap_intro_seen", "1");
      document.cookie = "sigap_intro_seen=1; path=/; max-age=31536000; samesite=lax";
    } catch { /* abaikan */ }
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
        className={`${cached ? "intro-seen " : ""}${showIntro ? "intro-lock" : "anim-fade-up"}`}
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
