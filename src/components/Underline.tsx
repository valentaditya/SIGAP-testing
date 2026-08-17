"use client";
import { useEffect, useRef, type ReactNode } from "react";

/* ============================================================
   HAND-DRAWN UNDERLINE — coretan tangan di bawah kata kunci,
   tergambar saat kata masuk viewport.

   Dipakai HANYA untuk satu kata kunci per bagian. Kalau semua
   kata digarisbawahi, penekanannya hilang dan halaman jadi ramai.

   Mekanik: satu <path> SVG dengan stroke-dasharray = panjang
   kurva, lalu dashoffset dianimasikan ke 0. Ini hanya menganimasi
   satu properti pada satu elemen, jauh lebih murah daripada
   memecah kata menjadi span per huruf.
   ============================================================ */
export function Underline({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("is-drawn");
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) { el.classList.add("is-drawn"); io.disconnect(); }
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <span ref={ref} className={`underline-draw relative inline-block ${className}`}>
      {children}
      {/* preserveAspectRatio none: coretan meregang mengikuti lebar
          kata, jadi satu path melayani teks pendek maupun panjang. */}
      <svg
        aria-hidden="true"
        className="underline-svg"
        viewBox="0 0 200 12"
        preserveAspectRatio="none"
        fill="none"
      >
        <path
          d="M3 8.5c28-4 62-6.2 96-5.6 22 .4 44 2 98 4.4"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          style={{ transitionDelay: `${delay}ms` }}
        />
      </svg>
    </span>
  );
}
