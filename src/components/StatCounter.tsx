"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Angka statistik besar dengan count-up saat masuk viewport.
 * `pad` = minimum digit (zero-pad, mis. 2 -> "06").
 * `prefix`/`suffix` tetap statis; hanya angka yang beranimasi.
 * Hormati prefers-reduced-motion.
 */
export function StatCounter({
  to,
  dur = 1600,
  delay = 0,
  pad = 0,
  prefix = "",
  suffix = "",
  className = "",
}: {
  to: number;
  dur?: number;
  delay?: number;
  pad?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [val, setVal] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !started.current) {
            started.current = true;
            io.unobserve(e.target);
            if (reduceMotion) {
              setVal(to);
              return;
            }
            const t0 = performance.now() + delay;
            const tick = (t: number) => {
              const p = Math.min((t - t0) / dur, 1);
              if (p <= 0) {
                requestAnimationFrame(tick);
                return;
              }
              // easeOutExpo — cepat di awal, halus mendarat
              const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
              setVal(Math.round(to * eased));
              if (p < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
          }
        });
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [to, dur, delay]);

  const shown = pad > 0 ? String(val).padStart(pad, "0") : String(val);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {shown}
      {suffix}
    </span>
  );
}
