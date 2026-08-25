"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { LAPORAN, priorityColor, priorityLabel, getKategori, STATUS_LABEL, type WilayahId, type Laporan } from "@/lib/data";
import { renderToStaticMarkup } from "react-dom/server";
import { AlertTriangle, Flame, Leaf } from "lucide-react";
import { useApp } from "@/lib/store";

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

export function AdminMap({
  height = 420,
  fill = false,
  wilayahFilter = "semua",
  customLaporan,
}: {
  height?: number;
  fill?: boolean;
  wilayahFilter?: WilayahId | "semua";
  customLaporan?: Laporan[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.FeatureGroup | null>(null);

  // Ambil laporanWarga jika ada di AppContext (bisa fallback ke LAPORAN data static)
  let storeLaporan: Laporan[] = [];
  try {
    const ctx = useApp();
    if (ctx && ctx.laporanWarga) {
      storeLaporan = ctx.laporanWarga;
    }
  } catch {}

  const sourceLaporan = customLaporan ?? (storeLaporan.length > 0 ? storeLaporan : LAPORAN);

  // Inisialisasi peta Leaflet sekali
  useEffect(() => {
    if (!ref.current || mapRef.current) return;

    const map = L.map(ref.current, { scrollWheelZoom: true, zoomControl: false }).setView([-7.7956, 110.3695], 12);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    const fg = L.featureGroup().addTo(map);
    layerGroupRef.current = fg;
    mapRef.current = map;

    const t = setTimeout(() => map.invalidateSize(), 300);
    const ro = new ResizeObserver(() => map.invalidateSize());
    if (ref.current) ro.observe(ref.current);

    return () => {
      clearTimeout(t);
      ro.disconnect();
      map.remove();
      mapRef.current = null;
      layerGroupRef.current = null;
    };
  }, []);

  // Update penanda (markers) & bounds saat wilayahFilter atau sourceLaporan berubah
  useEffect(() => {
    if (!mapRef.current || !layerGroupRef.current) return;

    const fg = layerGroupRef.current;
    fg.clearLayers();

    const filtered = sourceLaporan.filter(
      (l) =>
        (wilayahFilter === "semua" ? true : l.wilayah === wilayahFilter) &&
        l.status !== "resolved"
    );

    const markers: L.Marker[] = [];

    filtered.forEach((l) => {
      const k = getKategori(l.kategori);
      const m = L.marker([l.lokasi.lat, l.lokasi.lng], { icon: markerIcon(l.ai.priorityScore) })
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
      fg.addLayer(m);
      markers.push(m);
    });

    if (markers.length > 0) {
      try {
        const bounds = fg.getBounds();
        mapRef.current.fitBounds(bounds.pad(0.2));
      } catch {}
    } else {
      mapRef.current.setView([-7.7956, 110.3695], 12);
    }
  }, [wilayahFilter, sourceLaporan]);

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
