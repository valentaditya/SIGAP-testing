"use client";
import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { revealAtom } from "@/lib/reveal";

/* ============================================================
   ClipSlide — teks turun huruf demi huruf lewat jendela clip
   vertikal. Efek ini MAHAL (satu kotak layout per huruf), jadi
   sengaja dibatasi: hanya untuk satu headline penutup, bukan
   dipakai di seluruh halaman.

   Batas keras 34 karakter mencegahnya dipakai untuk paragraf,
   yang dulu membuat 2.500+ span dan menghancurkan performa scroll.
   ============================================================ */
export function ClipSlide({
  text,
  className = "",
  step = 45,
  base = 0,
  as: Tag = "span",
}: {
  text: string;
  className?: string;
  step?: number;
  base?: number;
  as?: "span" | "h1" | "h2" | "p" | "div";
}) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    return revealAtom(el);
  }, []);

  if (process.env.NODE_ENV !== "production" && text.length > 34) {
    console.warn(
      `[ClipSlide] "${text.slice(0, 20)}…" (${text.length} karakter) terlalu panjang. ` +
      `Efek per huruf hanya untuk headline pendek; gunakan <Rise> untuk teks biasa.`,
    );
  }

  const Comp = Tag as React.ElementType;
  let idx = 0;

  return (
    <Comp ref={ref} data-clip className={className} aria-label={text}>
      {text.split(" ").map((kata, wi, arr) => (
        <span key={wi} aria-hidden="true" className="inline-block whitespace-nowrap">
          {kata.split("").map((ch, ci) => {
            const d = base + idx++ * step;
            return (
              <span key={ci} className="inline-block overflow-hidden align-bottom">
                <span
                  className="cs-letter inline-block"
                  style={{ transitionDelay: `${d}ms` } as CSSProperties}
                >
                  {ch}
                </span>
              </span>
            );
          })}
          {wi < arr.length - 1 ? "\u00A0" : ""}
        </span>
      ))}
    </Comp>
  );
}

/* ============================================================
   Rise — kerja keras halaman: satu elemen naik dan memudar.
   Menggantikan pemakaian <Words> untuk judul & paragraf biasa.
   Satu transisi per blok, bukan per huruf.
   ============================================================ */
export function Rise({
  children,
  d = 0,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  d?: number;
  className?: string;
  as?: "div" | "span" | "li" | "p" | "h1" | "h2" | "h3" | "summary";
}) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    return revealAtom(el);
  }, []);

  const Comp = Tag as React.ElementType;
  return (
    <Comp ref={ref} data-rev className={className} style={{ "--d": `${d}ms` } as CSSProperties}>
      {children}
    </Comp>
  );
}

/* Nama lama dipertahankan agar halaman yang belum dimigrasi tetap
   berjalan; keduanya kini memakai mekanik satu elemen yang murah. */
export const Atom = Rise;
