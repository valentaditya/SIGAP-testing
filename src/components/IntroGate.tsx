"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { PunchlineHero } from "@/components/PunchlineHero";

/* Intro punchline + PRELOAD landing:
   Landing SELALU ter-mount sejak awal agar font, chart, peta, dan
   observer termuat & menghitung posisi sebelum tampil — sehingga
   saat intro selesai, landing muncul mulus tanpa "patah".

   Agar animasi reveal landing TIDAK keburu selesai selama preload,
   wrapper diberi .intro-lock (CSS memaksa elemen [data-rev]/[data-words]
   tetap tersembunyi & tanpa transisi). Saat intro selesai, kunci
   dilepas: observer menandai ulang elemen dan animasi hero
   ("LAPOR CEPAT, KOTA TANGGAP" dsb.) berjalan normal. */
export function IntroGate({ children }: { children: ReactNode }) {
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (done) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    window.scrollTo(0, 0);
    return () => {
      document.documentElement.style.overflow = prev;
    };
  }, [done]);

  const finish = useCallback(() => {
    document.documentElement.style.overflow = "";
    window.scrollTo(0, 0);
    setDone(true);
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

  return (
    <>
      <div
        className={done ? "anim-fade-up" : "intro-lock"}
        style={done ? undefined : { visibility: "hidden", height: "100svh", overflow: "hidden" }}
        aria-hidden={!done}
        inert={!done ? true : undefined}
      >
        {children}
      </div>
      {!done && <PunchlineHero onDone={finish} />}
    </>
  );
}
