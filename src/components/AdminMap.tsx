"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { LAPORAN, priorityColor, priorityLabel, getKategori, STATUS_LABEL, type WilayahId } from "@/lib/data";
import { useApp } from "@/lib/store";
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

export function AdminMap({ height = 420, fill = false, wilayahFilter = "semua" }: { height?: number; fill?: boolean; wilayahFilter?: WilayahId | "semua" }) {
  const { laporanWarga } = useApp();
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    
    if (!mapRef.current) {
      const map = L.map(ref.current, { scrollWheelZoom: true, zoomControl: false }).setView([-7.7956, 110.3695], 12);
      L.control.zoom({ position: "bottomright" }).addTo(map);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);
      mapRef.current = map;
    }

    const map = mapRef.current;
    
    // Clear existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    const dataList = laporanWarga && laporanWarga.length > 0 ? laporanWarga : LAPORAN;
    const filtered = wilayahFilter === "semua" ? dataList : dataList.filter((l) => l.wilayah === wilayahFilter);

    filtered.forEach((l) => {
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

    const t = setTimeout(() => map.invalidateSize(), 300);
    return () => clearTimeout(t);
  }, [wilayahFilter, laporanWarga]);

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
