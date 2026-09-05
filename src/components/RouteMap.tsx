"use client";
import { useEffect, useRef } from "react";
import { registerStage } from "@/lib/scroll-choreo";

/* Lattice node deterministik: 26 titik spiral phyllotaxis,
   sisi 1px antar pasangan yang dekat, SATU rute merah ditelusuri
   sejauh progress scroll — dengan kepala berdenyut. */
const N = 26;
const GOLDEN = 2.399963; // radian
const LINK = 0.34;       // ambang jarak sisi (relatif radius)
const ROUTE = [0, 3, 7, 12, 18, 25]; // subset indeks tetap

type Pt = { x: number; y: number };

function lattice(): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i < N; i++) {
    const a = i * GOLDEN;
    const r = Math.sqrt(i / N);
    pts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
  }
  return pts;
}

export function RouteMap() {
  const wrap = useRef<HTMLDivElement>(null);
  const pin = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const pRef = useRef(0);

  useEffect(() => {
    const w = wrap.current;
    const pEl = pin.current;
    const cv = canvas.current;
    if (!w || !pEl || !cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let alive = true;

    const draw = () => {
      if (!alive) return;
      const p = parseFloat(pEl.style.getPropertyValue("--p") || "0");
      pRef.current = p;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const W = cv.clientWidth;
      const H = cv.clientHeight;
      if (cv.width !== W * dpr || cv.height !== H * dpr) {
        cv.width = W * dpr;
        cv.height = H * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      const dark = document.documentElement.classList.contains("dark");
      const ink = dark ? "250,244,235" : "34,27,22";
      const red = dark ? "#ff6642" : "#d94e28";
      const cx = W / 2;
      const cy = H / 2;
      const R = Math.min(W, H) * 0.42;
      const pts = lattice().map((q) => ({ x: cx + q.x * R, y: cy + q.y * R }));

      /* Sisi hairline antar node dekat */
      ctx.lineWidth = 1;
      ctx.strokeStyle = `rgba(${ink},0.16)`;
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const dx = pts[i].x - pts[j].x;
          const dy = pts[i].y - pts[j].y;
          if (Math.hypot(dx, dy) / R < LINK) {
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.stroke();
          }
        }
      }
      /* Node */
      ctx.fillStyle = `rgba(${ink},0.55)`;
      pts.forEach((q) => {
        ctx.beginPath();
        ctx.arc(q.x, q.y, 2, 0, Math.PI * 2);
        ctx.fill();
      });

      /* Rute merah: ditelusuri sejauh p, segmen akhir diinterpolasi */
      const routePts = ROUTE.map((i) => pts[i]);
      const segs = routePts.length - 1;
      const travelled = Math.min(0.9999, Math.max(0, p)) * segs;
      const full = Math.floor(travelled);
      const frac = travelled - full;

      ctx.strokeStyle = red;
      ctx.lineWidth = 2.6;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(routePts[0].x, routePts[0].y);
      for (let s = 0; s < full; s++) ctx.lineTo(routePts[s + 1].x, routePts[s + 1].y);
      const a = routePts[full];
      const b = routePts[Math.min(full + 1, segs)];
      const hx = a.x + (b.x - a.x) * frac;
      const hy = a.y + (b.y - a.y) * frac;
      ctx.lineTo(hx, hy);
      ctx.stroke();

      /* Kepala berdenyut + halo */
      const t = performance.now() / 1000;
      const pulse = 3 + Math.sin(t * 4) * 1.2;
      ctx.fillStyle = red;
      ctx.globalAlpha = 0.22;
      ctx.beginPath();
      ctx.arc(hx, hy, 12 + Math.sin(t * 4) * 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(hx, hy, pulse + 2.4, 0, Math.PI * 2);
      ctx.fill();

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    const unregister = registerStage(w, pEl);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      unregister();
    };
  }, []);

  return (
    <div ref={wrap} className="relative border-b border-ink-300 bg-bg" style={{ height: "300svh" }}>
      <div ref={pin} className="sticky top-0 flex h-[100svh] items-end overflow-hidden">
        <canvas
          ref={canvas}
          className="absolute inset-0 h-full w-full mix-blend-multiply dark:mix-blend-screen opacity-85"
          aria-hidden
        />
        <div className="relative mx-auto w-full max-w-[1240px] px-6 pb-16">
          <span className="micro-label text-sage">Jalur Respons Kota</span>
          <h2 className="font-display mt-3 max-w-[18ch] text-[clamp(2.4rem,5.5vw,4.5rem)] font-extrabold tracking-tight text-cream-hi">
            Setiap laporan <span className="text-tan">menemukan jalannya.</span>
          </h2>
        </div>
      </div>
    </div>
  );
}
