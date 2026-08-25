"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { renderToStaticMarkup } from "react-dom/server";
import { Flame, AlertTriangle, Leaf } from "lucide-react";
import { LAPORAN, priorityColor } from "@/lib/data";

function markerIcon(score: number) {
  const color = priorityColor(score);
  const glyph =
    score >= 9 ? renderToStaticMarkup(<Flame size={13} color="#fff" strokeWidth={2.2} />)
    : score >= 7 ? renderToStaticMarkup(<AlertTriangle size={13} color="#fff" strokeWidth={2.2} />)
    : renderToStaticMarkup(<Leaf size={13} color="#fff" strokeWidth={2.2} />);
  return L.divIcon({
    className: "",
    html: `<div class="sigap-marker" style="background:${color}">${glyph}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 28],
  });
}

// Visual hero: peta live mini dengan marker nyata (bukan placeholder)
export function HeroVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const map = L.map(ref.current, {
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
    }).setView([-7.7956, 110.3695], 12);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);
    const aktifLaporan = LAPORAN.filter((l) => l.status !== "resolved");
    aktifLaporan.forEach((l) => {
      L.marker([l.lokasi.lat, l.lokasi.lng], { icon: markerIcon(l.ai.priorityScore), interactive: false }).addTo(map);
    });
    mapRef.current = map;
    const t = setTimeout(() => map.invalidateSize(), 250);
    return () => { clearTimeout(t); map.remove(); mapRef.current = null; };
  }, []);

  const totalAktif = LAPORAN.filter((l) => l.status !== "resolved").length;

  return (
    <div className="card-hover anim-float relative overflow-hidden rounded-3xl ring-1 ring-white/10">
      <div ref={ref} className="aspect-[4/3] w-full" aria-label="Peta sebaran laporan real-time" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-900/70 to-transparent p-5">
        <p className="font-display text-lg font-bold text-white">Peta Sebaran Laporan Real-time</p>
        <p className="text-sm text-white/80">{totalAktif} laporan aktif di Kota Yogyakarta &amp; DIY</p>
      </div>
    </div>
  );
}
