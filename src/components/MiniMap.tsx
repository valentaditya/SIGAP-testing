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
    const map = L.map(ref.current).setView(CENTER, 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    map.on("click", (e: L.LeafletMouseEvent) => {
      const p = { lat: e.latlng.lat, lng: e.latlng.lng };
      const icon = L.divIcon({
        className: "",
        html: `<div class="sigap-marker" style="background:#0E9F6E">${renderToStaticMarkup(<MapPin size={13} color="#fff" strokeWidth={2.2} />)}</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 28],
      });
      if (markerRef.current) markerRef.current.setLatLng(e.latlng);
      else markerRef.current = L.marker(e.latlng, { icon }).addTo(map);
      onPickRef.current(p);
    });

    mapRef.current = map;
    const t = setTimeout(() => map.invalidateSize(), 250);
    return () => { clearTimeout(t); map.remove(); mapRef.current = null; markerRef.current = null; };
  }, []);

  return (
    <div>
      <div ref={ref} className="h-[280px] w-full cursor-crosshair rounded-2xl" aria-label="Peta untuk menandai lokasi" />
      <p className="mt-2 text-xs text-ink-500">
        {value ? `📍 Terpilih: ${value.lat.toFixed(4)}, ${value.lng.toFixed(4)}` : "Klik di peta untuk menandai lokasi kejadian."}
      </p>
    </div>
  );
}
