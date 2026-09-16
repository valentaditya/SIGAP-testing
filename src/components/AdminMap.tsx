"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { LAPORAN, priorityColor, priorityLabel, getKategori, STATUS_LABEL, getFotoUrls, type WilayahId, type Laporan } from "@/lib/data";
import { useApp } from "@/lib/store";
import { renderToStaticMarkup } from "react-dom/server";
import { AlertTriangle, Flame, Leaf, Siren } from "lucide-react";

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

/** Marker khusus sinyal darurat SOS — merah besar dengan animasi pulse */
function sosMarkerIcon() {
  const sirenHtml = renderToStaticMarkup(<Siren size={16} color="#fff" strokeWidth={2.5} />);
  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;width:44px;height:44px;display:flex;align-items:center;justify-content:center;">
        <span style="position:absolute;inset:0;border-radius:50%;background:#E02424;opacity:0.35;animation:sos-ring 1.4s ease-out infinite;"></span>
        <span style="position:absolute;inset:4px;border-radius:50%;background:#E02424;opacity:0.25;animation:sos-ring 1.4s ease-out 0.4s infinite;"></span>
        <div style="position:relative;width:34px;height:34px;border-radius:50%;background:#E02424;display:flex;align-items:center;justify-content:center;box-shadow:0 0 12px #E02424aa;border:2px solid #fff;">
          ${sirenHtml}
        </div>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -24],
  });
}

export function AdminMap({
  height = 420,
  fill = false,
  wilayahFilter = "semua",
  statusFilter,
  onSelectLaporan,
}: {
  height?: number;
  fill?: boolean;
  wilayahFilter?: WilayahId | "semua";
  statusFilter?: (l: Laporan) => boolean;
  onSelectLaporan?: (l: Laporan) => void;
}) {
  const { laporanWarga, sinyalDarurat } = useApp();
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  // Track sos markers separately to update independently
  const sosMarkersRef = useRef<L.Marker[]>([]);
  // Track SOS count untuk deteksi sinyal baru
  const prevSosCountRef = useRef<number>(sinyalDarurat.length);
  const [showFlash, setShowFlash] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    
    if (!mapRef.current) {
      // Inject CSS animasi SOS pulse ke head (sekali saja)
      if (!document.getElementById("sos-ring-style")) {
        const style = document.createElement("style");
        style.id = "sos-ring-style";
        style.textContent = `
          @keyframes sos-ring {
            0% { transform: scale(0.8); opacity: 0.5; }
            70% { transform: scale(1.6); opacity: 0; }
            100% { transform: scale(1.6); opacity: 0; }
          }
        `;
        document.head.appendChild(style);
      }

      const map = L.map(ref.current, { scrollWheelZoom: true, zoomControl: false }).setView([-7.7956, 110.3695], 12);
      L.control.zoom({ position: "bottomright" }).addTo(map);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);
      mapRef.current = map;
    }

    const map = mapRef.current;
    
    // Clear existing non-SOS markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });
    sosMarkersRef.current = [];

    const dataList = laporanWarga && laporanWarga.length > 0 ? laporanWarga : LAPORAN;
    const activeReports = dataList.filter((l) => (statusFilter ? statusFilter(l) : l.status !== "resolved"));
    const filtered = wilayahFilter === "semua" ? activeReports : activeReports.filter((l) => l.wilayah === wilayahFilter);

    // Render laporan normal
    filtered.forEach((l) => {
      const k = getKategori(l.kategori);
      const fotoUrls = getFotoUrls(l);
      const thumbHtml = fotoUrls.length > 0
        ? `<div style="margin-bottom:6px;overflow:hidden;border-radius:8px;height:100px"><img src="${fotoUrls[0]}" style="width:100%;height:100%;object-fit:cover" /></div>`
        : "";

      const marker = L.marker([l.lokasi.lat, l.lokasi.lng], { icon: markerIcon(l.ai.priorityScore) }).addTo(map);

      const popupDiv = document.createElement("div");
      popupDiv.style.fontFamily = "Inter, sans-serif";
      popupDiv.style.minWidth = "220px";
      popupDiv.innerHTML = `
        ${thumbHtml}
        <div style="font-weight:700;font-size:.9rem;margin-bottom:4px;color:#111827">${l.judul}</div>
        <div style="font-size:.75rem;color:#6B7280;margin-bottom:6px">${l.lokasi.alamat}</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;font-size:.7rem;margin-bottom:8px">
          <span style="background:${k.warna}1a;color:${k.warna};padding:2px 8px;border-radius:999px;font-weight:600">${k.nama}</span>
          <span style="background:${priorityColor(l.ai.priorityScore)}1a;color:${priorityColor(l.ai.priorityScore)};padding:2px 8px;border-radius:999px;font-weight:600">${priorityLabel(l.ai.priorityScore)} · ${l.ai.priorityScore}</span>
          <span style="background:#f1f4f2;color:#374151;padding:2px 8px;border-radius:999px;font-weight:600">${STATUS_LABEL[l.status]}</span>
        </div>
      `;

      if (onSelectLaporan) {
        const btn = document.createElement("button");
        btn.innerHTML = "🔍 Buka &amp; Tangani Tugas Ini &rarr;";
        btn.style.width = "100%";
        btn.style.padding = "7px 12px";
        btn.style.backgroundColor = "#0E9F6E";
        btn.style.color = "#ffffff";
        btn.style.borderRadius = "8px";
        btn.style.fontSize = "12px";
        btn.style.fontWeight = "bold";
        btn.style.border = "none";
        btn.style.cursor = "pointer";
        btn.style.marginTop = "4px";
        btn.onclick = (e) => {
          e.stopPropagation();
          onSelectLaporan(l);
        };
        popupDiv.appendChild(btn);
      }

      marker.bindPopup(popupDiv);

      marker.on("click", () => {
        if (onSelectLaporan) {
          onSelectLaporan(l);
        }
      });
    });

    // Render sinyal darurat SOS (di atas marker biasa via zIndexOffset)
    const filteredSOS = wilayahFilter === "semua"
      ? sinyalDarurat
      : sinyalDarurat.filter((s) => s.wilayah === wilayahFilter);

    filteredSOS.forEach((s) => {
      const waktuStr = new Date(s.waktu).toLocaleString("id-ID", {
        hour: "2-digit", minute: "2-digit", day: "numeric", month: "short",
      });
      const marker = L.marker([s.lat, s.lng], {
        icon: sosMarkerIcon(),
        zIndexOffset: 1000, // tampil di atas marker laporan biasa
      })
        .addTo(map)
        .bindPopup(
          `<div style="font-family:Inter;min-width:220px;padding:4px">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">
              <span style="background:#E02424;color:#fff;font-size:.65rem;font-weight:800;padding:3px 8px;border-radius:999px;letter-spacing:.05em">🚨 SINYAL DARURAT</span>
            </div>
            <div style="font-weight:800;font-size:.95rem;color:#E02424;margin-bottom:4px">${s.jenisLabel}</div>
            <div style="font-size:.75rem;color:#6B7280;margin-bottom:4px">Pelapor: <strong style="color:#111">${s.pelapor}</strong></div>
            <div style="font-size:.75rem;color:#6B7280;margin-bottom:4px">Waktu: ${waktuStr}</div>
            <div style="font-family:monospace;font-size:.7rem;color:#9CA3AF">${s.lat.toFixed(5)}, ${s.lng.toFixed(5)}</div>
          </div>`
        );
      sosMarkersRef.current.push(marker);
    });

    const t = setTimeout(() => map.invalidateSize(), 300);

    // Auto-fly ke SOS baru jika ada sinyal yang baru masuk
    const currentCount = filteredSOS.length;
    const prevCount = prevSosCountRef.current;
    if (currentCount > prevCount && filteredSOS.length > 0) {
      const newest = filteredSOS[0];
      setTimeout(() => {
        map.flyTo([newest.lat, newest.lng], 16, { duration: 1.5 });
        // Buka popup marker SOS terbaru setelah fly selesai
        const sosMarker = sosMarkersRef.current[0];
        if (sosMarker) setTimeout(() => sosMarker.openPopup(), 1600);
      }, 350);
      // Flash merah overlay
      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 1800);
    }
    prevSosCountRef.current = currentCount;

    return () => clearTimeout(t);
  }, [wilayahFilter, statusFilter, onSelectLaporan, laporanWarga, sinyalDarurat]);

  return (
    <div
      style={fill ? undefined : { height }}
      className={`relative w-full ${fill ? "h-full" : ""}`}
    >
      {/* Flash overlay merah saat SOS baru masuk */}
      {showFlash && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 999,
            background: "rgba(224,36,36,0.25)",
            pointerEvents: "none",
            animation: "sos-map-flash 1.8s ease-out forwards",
          }}
        />
      )}
      <style>{`
        @keyframes sos-map-flash {
          0%   { opacity: 1; }
          60%  { opacity: 0.6; }
          100% { opacity: 0; }
        }
      `}</style>
      <div
        ref={ref}
        style={{ width: "100%", height: "100%" }}
        role="application"
        aria-label="Peta sebaran laporan admin"
      />
    </div>
  );
}
