"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { LAPORAN, priorityColor, priorityLabel, getKategori, STATUS_LABEL } from "@/lib/data";
import { renderToStaticMarkup } from "react-dom/server";
import { AlertTriangle, Flame, Leaf } from "lucide-react";

function markerIcon(score: number) {
  const color = priorityColor(score);
  const glyph = score >= 9
    ? renderToStaticMarkup(<Flame size={13} color="#fff" strokeWidth={2.2} />)
    : score >= 7
    ? renderToStaticMarkup(<AlertTriangle size={13} color="#fff" strokeWidth={2.2} />)
    : renderToStaticMarkup(<Leaf size={13} color="#fff" strokeWidth={2.2} />);
  return L.divIcon({
    className: "",
    html: `<div class="sigap-marker" style="background:${color}">${glyph}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 28],
    popupAnchor: [0, -26],
  });
}

export function AdminMap({ height = 420, fill = false }: { height?: number; fill?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const map = L.map(ref.current, { scrollWheelZoom: true, zoomControl: false }).setView([-7.7956, 110.3695], 12);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    LAPORAN.forEach((l) => {
      const k = getKategori(l.kategori);
      L.marker([l.lokasi.lat, l.lokasi.lng], { icon: markerIcon(l.ai.priorityScore) })
        .addTo(map)
        .bindPopup(
          `<div style="font-family:Inter;min-width:200px">
            <div style="font-weight:700;font-size:.9rem;margin-bottom:4px">${l.judul}</div>
            <div style="font-size:.75rem;color:#6B7280;margin-bottom:6px">${l.lokasi.alamat}</div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;font-size:.7rem">
              <span style="background:${k.warna}1a;color:${k.warna};padding:2px 8px;border-radius:999px;font-weight:600">${k.nama}</span>
              <span style="background:${priorityColor(l.ai.priorityScore)}1a;color:${priorityColor(l.ai.priorityScore)};padding:2px 8px;border-radius:999px;font-weight:600">${priorityLabel(l.ai.priorityScore)} · ${l.ai.priorityScore}</span>
              <span style="background:#f1f4f2;color:#374151;padding:2px 8px;border-radius:999px;font-weight:600">${STATUS_LABEL[l.status]}</span>
            </div>
          </div>`
        );
    });

    mapRef.current = map;
    const t = setTimeout(() => map.invalidateSize(), 300);
    // Pantau perubahan ukuran container (flex/kolom) agar tile selalu pas
    const ro = new ResizeObserver(() => map.invalidateSize());
    if (ref.current) ro.observe(ref.current);
    return () => { clearTimeout(t); ro.disconnect(); map.remove(); mapRef.current = null; };
  }, []);

  return (
    <div
      ref={ref}
      style={fill ? undefined : { height }}
      className={`w-full ${fill ? "h-full" : ""}`}
      role="application"
      aria-label="Peta sebaran laporan admin"
    />
  );
}
