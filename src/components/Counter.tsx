"use client";

import { useEffect, useRef, useState } from "react";

// Angka berjalan naik saat terlihat (animated counter)
// `delay` = mundur mulai (ms); hormati prefers-reduced-motion.
export function Counter({
  to, dur = 1400, suffix = "", className = "", decimals = 0, delay = 0,
}: {
  to: number; dur?: number; suffix?: string; className?: string; decimals?: number; delay?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [val, setVal] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
              // easeOutCubic
              const eased = 1 - Math.pow(1 - p, 3);
              setVal(Math.round(to * eased * Math.pow(10, decimals)) / Math.pow(10, decimals));
              if (p < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
          }
        });
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [to, dur, delay, decimals]);

  return (
    <span ref={ref} className={className}>
      {val.toLocaleString("id-ID", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}
    </span>
  );
}
