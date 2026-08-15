"use client";

import { useEffect, useRef } from "react";
import {
  Chart, CategoryScale, LinearScale, BarElement, BarController,
  LineElement, LineController, PointElement, ArcElement, DoughnutController,
  RadialLinearScale, RadarController, Filler, Tooltip, Legend,
} from "chart.js";

Chart.register(
  CategoryScale, LinearScale, BarElement, BarController, LineElement,
  LineController, PointElement, ArcElement, DoughnutController,
  RadialLinearScale, RadarController, Filler, Tooltip, Legend
);

const FONT = { family: "Inter", size: 11 };
const GRID = "rgba(17,25,40,.06)";

export type ChartDef =
  | { kind: "barKatPrio" }
  | { kind: "gauge"; value: number }
  | { kind: "tren" }
  | { kind: "radar" }
  | { kind: "doughnut"; labels: string[]; data: number[]; colors: string[] };

import { TREN_BULANAN, KATEGORI, LAPORAN } from "@/lib/data";

export function ChartBox({ def, height = 280 }: { def: ChartDef; height?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    chartRef.current?.destroy();

    let cfg: any = null;
    const aktif = LAPORAN.filter((x) => x.status !== "resolved");

    if (def.kind === "barKatPrio") {
      const labels = KATEGORI.map((k) => k.nama);
      const darurat = KATEGORI.map((k) => aktif.filter((l) => l.kategori === k.id && l.ai.priorityScore >= 9).length);
      const tinggi = KATEGORI.map((k) => aktif.filter((l) => l.kategori === k.id && l.ai.priorityScore >= 7 && l.ai.priorityScore < 9).length);
      const sedang = KATEGORI.map((k) => aktif.filter((l) => l.kategori === k.id && l.ai.priorityScore < 7).length);
      cfg = {
        type: "bar",
        data: {
          labels,
          datasets: [
            { label: "Darurat", data: darurat, backgroundColor: "#dc201e", stack: "s", borderRadius: 4, barThickness: 22 },
            { label: "Tinggi", data: tinggi, backgroundColor: "#d97706", stack: "s", borderRadius: 4, barThickness: 22 },
            { label: "Sedang/Rendah", data: sedang, backgroundColor: "#1c7a4d", stack: "s", borderRadius: 4, barThickness: 22 },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          animation: { duration: 850, easing: "easeOutQuart", delay: (ctx: any) => (ctx.type === "bar" ? ctx.datasetIndex * 140 + ctx.dataIndex * 45 : 0) },
          plugins: { legend: { position: "bottom", labels: { font: FONT, boxWidth: 12, usePointStyle: true } }, tooltip: { enabled: true } },
          scales: {
            x: { stacked: true, grid: { display: false }, ticks: { font: FONT, maxRotation: 40 } },
            y: { stacked: true, beginAtZero: true, ticks: { stepSize: 1, font: FONT }, grid: { color: GRID } },
          },
        },
      };
    }

    if (def.kind === "gauge") {
      const v = def.value; // skala 0–10 sesuai proposal
      const color = v >= 9 ? "#dc201e" : v >= 7 ? "#d97706" : "#1c7a4d";
      cfg = {
        type: "doughnut",
        data: { datasets: [{ data: [v, 10 - v], backgroundColor: [color, "#EEF1F0"], borderWidth: 0, circumference: 180, rotation: 270, cutout: "78%" }] },
        options: { responsive: true, maintainAspectRatio: false, animation: { animateRotate: true, duration: 1000, easing: "easeOutCubic" }, plugins: { legend: { display: false }, tooltip: { enabled: false } } },
      };
    }

    if (def.kind === "tren") {
      cfg = {
        type: "line",
        data: {
          labels: TREN_BULANAN.labels,
          datasets: [
            { label: "Masuk", data: TREN_BULANAN.masuk, borderColor: "#1c7a4d", backgroundColor: "rgba(14,159,110,.12)", fill: true, tension: .35, pointRadius: 3, pointBackgroundColor: "#1c7a4d" },
            { label: "Selesai", data: TREN_BULANAN.selesai, borderColor: "#111928", borderDash: [5, 4], backgroundColor: "transparent", fill: false, tension: .35, pointRadius: 3, pointBackgroundColor: "#111928" },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          animation: { duration: 950, easing: "easeOutQuart", delay: (ctx: any) => (ctx.type === "line" ? ctx.dataIndex * 65 : 0) },
          plugins: { legend: { position: "bottom", labels: { font: FONT, boxWidth: 12, usePointStyle: true } } },
          scales: { x: { grid: { display: false }, ticks: { font: FONT } }, y: { beginAtZero: true, ticks: { font: FONT }, grid: { color: GRID } } },
        },
      };
    }

    if (def.kind === "radar") {
      cfg = {
        type: "radar",
        data: {
          labels: ["Jenis Masalah", "Dampak Sosial", "Dampak Lokasi", "Dukungan Warga", "Kelengkapan Laporan"],
          datasets: [{ label: "Skor rata-rata", data: [8.1, 7.2, 6.4, 7.8, 6.9], borderColor: "#1c7a4d", backgroundColor: "rgba(14,159,110,.18)", pointBackgroundColor: "#1c7a4d", borderWidth: 2 }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          animation: { duration: 850, easing: "easeOutQuart" },
          plugins: { legend: { display: false } },
          scales: { r: { beginAtZero: true, max: 10, ticks: { display: false }, grid: { color: GRID }, angleLines: { color: GRID }, pointLabels: { font: { ...FONT, size: 10 }, color: "#6B7280" } } },
        },
      };
    }

    if (def.kind === "doughnut") {
      cfg = {
        type: "doughnut",
        data: { labels: def.labels, datasets: [{ data: def.data, backgroundColor: def.colors, borderWidth: 2, borderColor: "#fff" }] },
        options: { responsive: true, maintainAspectRatio: false, cutout: "62%", animation: { duration: 750, easing: "easeOutQuart" }, plugins: { legend: { position: "bottom", labels: { font: FONT, boxWidth: 12, usePointStyle: true } } } },
      };
    }

    if (cfg) {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) cfg.animation = false;
      chartRef.current = new Chart(ref.current, cfg);
    }
    return () => { chartRef.current?.destroy(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(def)]);

  return (
    <div className="relative" style={{ height }}>
      <canvas ref={ref} />
    </div>
  );
}
