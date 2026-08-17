"use client";
import { useEffect, useRef, useState } from "react";

/* ============================================================
   TYPEWRITER — headline utama diketik per karakter, jeda 50ms.

   Kenapa satu simpul teks, bukan satu <span> per huruf:
   headline hero bisa 25 karakter, dan versi per-span memaksa
   browser membuat ratusan kotak layout yang dianimasikan
   bersamaan. Di sini hanya string yang berubah, jadi biaya
   per frame nyaris nol dan hasil visualnya sama persis.

   Ruang tetap dipesan lewat teks bayangan transparan supaya
   baris di bawahnya tidak melompat saat karakter bertambah.
   ============================================================ */
export function Typewriter({
  text,
  speed = 50,
  startDelay = 200,
  className = "",
  caret = true,
  onDone,
}: {
  text: string;
  speed?: number;
  startDelay?: number;
  className?: string;
  caret?: boolean;
  onDone?: () => void;
}) {
  const [n, setN] = useState(0);
  const [mulai, setMulai] = useState(false);
  const wrap = useRef<HTMLSpanElement>(null);
  const selesaiRef = useRef(onDone);
  selesaiRef.current = onDone;

  /* Baru mengetik saat benar benar terlihat. Kalau headline ada di
     bawah lipatan, animasi tidak terbuang percuma. */
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const kurangGerak = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (kurangGerak) {
      setN(text.length);
      selesaiRef.current?.();
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) { setMulai(true); io.disconnect(); }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [text]);

  useEffect(() => {
    if (!mulai) return;
    let i = 0;
    let timer: ReturnType<typeof setTimeout>;
    const mulaiKetik = setTimeout(function ketik() {
      i += 1;
      setN(i);
      if (i < text.length) timer = setTimeout(ketik, speed);
      else selesaiRef.current?.();
    }, startDelay);
    return () => { clearTimeout(mulaiKetik); clearTimeout(timer); };
  }, [mulai, text, speed, startDelay]);

  const jadi = n >= text.length;

  return (
    /* aria-label memberi teks utuh ke pembaca layar sejak awal;
       potongan per karakter disembunyikan agar tidak dibaca ulang. */
    <span ref={wrap} className={`relative inline-block ${className}`} aria-label={text} role="text">
      {/* Bayangan pemesan ruang: tinggi dan lebar final sudah terkunci. */}
      <span aria-hidden="true" className="invisible">{text}</span>
      <span aria-hidden="true" className="absolute inset-0">
        {text.slice(0, n)}
        {caret && !jadi && <span className="typing-cursor" />}
      </span>
    </span>
  );
}
