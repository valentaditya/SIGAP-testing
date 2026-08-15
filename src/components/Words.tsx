"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { revealAtom } from "@/lib/reveal";

/* Pecah teks menjadi huruf per huruf; tiap huruf turun lewat jendela
   clip vertikal (slide-down) dengan stagger — dipakai di SELURUH landing.
   Satu IntersectionObserver (di lib/reveal) yang mengungkap semuanya. */
export function Words({
  text, className = "", base = 0, as: Tag = "span",
}: {
  text: string;
  className?: string;
  base?: number;
  as?: "span" | "p" | "h1" | "h2" | "h3" | "div";
}) {
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.classList.add("is-rev");
    return revealAtom(el);
  }, []);
  const Comp: any = Tag;
  let idx = 0;
  /* Stagger adaptif: teks panjang pakai step lebih kecil supaya total
     durasi reveal tetap wajar (maks ~1.6 detik). */
  const total = text.replace(/ /g, "").length || 1;
  const step = Math.min(45, Math.max(12, Math.round(1600 / total)));
  return (
    <Comp ref={ref} data-words className={className} aria-label={text}>
      {text.split(" ").map((word, wi) => (
        <span key={wi} aria-hidden className="inline-block whitespace-nowrap">
          {word.split("").map((ch, ci) => {
            const d = (base + idx++) * step;
            return (
              <span key={ci} className="inline-block overflow-hidden align-bottom">
                <span className="wletter inline-block will-change-transform" style={{ transitionDelay: `${d}ms` }}>
                  {ch}
                </span>
              </span>
            );
          })}
          {wi < text.split(" ").length - 1 ? "\u00A0" : ""}
        </span>
      ))}
    </Comp>
  );
}

/* Atom tunggal dengan delay sendiri (40–100ms × indeks) */
export function Atom({
  children, d = 0, className = "", as: Tag = "div",
}: {
  children: ReactNode;
  d?: number;
  className?: string;
  as?: "div" | "span" | "li" | "p" | "h3" | "summary";
}) {
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.classList.add("is-rev");
    return revealAtom(el);
  }, []);
  const Comp: any = Tag;
  return (
    <Comp ref={ref} data-rev className={className} style={{ "--d": `${d}ms` } as React.CSSProperties}>
      {children}
    </Comp>
  );
}
