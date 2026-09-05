"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { renderToStaticMarkup } from "react-dom/server";
import { MapPin } from "lucide-react";

const CENTER: [number, number] = [-7.7956, 110.3695];

export function MiniMap({
  value,
  onPick,
}: {
  value: { lat: number; lng: number } | null;
  onPick: (p: { lat: number; lng: number }) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const map = L.map(ref.current).setView(value ? [value.lat, value.lng] : CENTER, 14);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    map.on("click", (e: L.LeafletMouseEvent) => {
      const p = { lat: e.latlng.lat, lng: e.latlng.lng };
      onPickRef.current(p);
    });

    mapRef.current = map;
    const t = setTimeout(() => map.invalidateSize(), 250);
    return () => {
      clearTimeout(t);
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Update map view and marker position whenever value prop changes externally (e.g. via GPS auto-detect)
  useEffect(() => {
    if (!mapRef.current || !value) return;
    const latlng = L.latLng(value.lat, value.lng);
    mapRef.current.setView(latlng, 16, { animate: true });

    const icon = L.divIcon({
      className: "",
      html: `<div class="sigap-marker" style="background:#0E9F6E">${renderToStaticMarkup(<MapPin size={13} color="#fff" strokeWidth={2.2} />)}</div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 28],
    });

    if (markerRef.current) {
      markerRef.current.setLatLng(latlng);
    } else {
      markerRef.current = L.marker(latlng, { icon }).addTo(mapRef.current);
    }
  }, [value]);

  return (
    <div>
      <div ref={ref} className="h-[280px] w-full cursor-crosshair rounded-2xl border border-ink-300" aria-label="Peta untuk menandai lokasi" />
      <p className="mt-2 text-xs text-ink-500 flex items-center justify-between">
        <span>{value ? `📍 Terpilih: ${value.lat.toFixed(5)}, ${value.lng.toFixed(5)}` : "Klik di peta untuk menandai lokasi kejadian."}</span>
      </p>
    </div>
  );
}
