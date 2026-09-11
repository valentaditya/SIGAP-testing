"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import Link from "next/link";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Flame, AlertTriangle, Leaf, MapPin, ArrowLeft,
  Search, ShieldAlert, Siren
} from "lucide-react";
import {
  LAPORAN, KATEGORI, WILAYAH, priorityColor, priorityLabel, getKategori,
  STATUS_LABEL, type Laporan, type KategoriId, type WilayahId
} from "@/lib/data";
import { useApp } from "@/lib/store";

function markerIcon(score: number) {
  const color = priorityColor(score);
  const glyph =
    score >= 9
      ? renderToStaticMarkup(<Flame size={13} color="#fff" strokeWidth={2.2} />)
      : score >= 7
      ? renderToStaticMarkup(<AlertTriangle size={13} color="#fff" strokeWidth={2.2} />)
      : renderToStaticMarkup(<Leaf size={13} color="#fff" strokeWidth={2.2} />);
  return L.divIcon({
    className: "",
    html: `<div class="sigap-marker" style="background:${color}">${glyph}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 30],
    popupAnchor: [0, -28],
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
        <div style="position:relative;width:34px;height:34px;border-radius:50%;background:#E02424;display:flex;align-items:center;justify-content:center;box-shadow:0 0 14px #E02424bb;border:2px solid #fff;">
          ${sirenHtml}
        </div>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -24],
  });
}

export default function PetaClient() {
  const { laporanWarga, sinyalDarurat } = useApp();
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [id: string]: L.Marker }>({});

  const [fKategori, setFKategori] = useState<KategoriId | "semua">("semua");
  const [fWilayah, setFWilayah] = useState<WilayahId | "semua">("semua");
  const [cari, setCari] = useState("");
  const [terpilihId, setTerpilihId] = useState<string | null>(null);

  // Filtered laporan
  const laporanFiltered = useMemo(() => {
    const listData = laporanWarga && laporanWarga.length > 0 ? laporanWarga : LAPORAN;
    return listData.filter((l) => {
      if (fKategori !== "semua" && l.kategori !== fKategori) return false;
      if (fWilayah !== "semua" && l.wilayah !== fWilayah) return false;
      if (cari.trim()) {
        const q = cari.toLowerCase();
        const cocokJudul = l.judul.toLowerCase().includes(q);
        const cocokLokasi = l.lokasi.alamat.toLowerCase().includes(q);
        if (!cocokJudul && !cocokLokasi) return false;
      }
      return true;
    });
  }, [laporanWarga, fKategori, fWilayah, cari]);

  // Total stat
  const totalAktif = laporanFiltered.filter((l) => l.status !== "resolved").length;
  const totalDarurat = laporanFiltered.filter((l) => l.ai.priorityScore >= 8).length;

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

      const map = L.map(ref.current, {
        scrollWheelZoom: true,
        zoomControl: false,
      }).setView([-7.7956, 110.3695], 11);

      L.control.zoom({ position: "bottomright" }).addTo(map);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;
    }

    const map = mapRef.current;

    // Bersihkan marker lama
    Object.values(markersRef.current).forEach((m) => map.removeLayer(m));
    markersRef.current = {};

    // Tambah marker laporan biasa
    laporanFiltered.forEach((l) => {
      const k = getKategori(l.kategori);
      const m = L.marker([l.lokasi.lat, l.lokasi.lng], {
        icon: markerIcon(l.ai.priorityScore),
      })
        .addTo(map)
        .bindPopup(
          `<div style="font-family:Inter,sans-serif;min-width:220px;padding:4px">
            <div style="font-weight:800;font-size:.95rem;color:#111;margin-bottom:4px">${l.judul}</div>
            <div style="font-size:.78rem;color:#6B7280;margin-bottom:8px">${l.lokasi.alamat}</div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;font-size:.72rem;margin-bottom:6px">
              <span style="background:${k.warna}1f;color:${k.warna};padding:3px 9px;border-radius:999px;font-weight:700">${k.nama}</span>
              <span style="background:${priorityColor(l.ai.priorityScore)}1f;color:${priorityColor(l.ai.priorityScore)};padding:3px 9px;border-radius:999px;font-weight:700">${priorityLabel(l.ai.priorityScore)} (${l.ai.priorityScore}/10)</span>
              <span style="background:#f1f4f2;color:#374151;padding:3px 9px;border-radius:999px;font-weight:700">${STATUS_LABEL[l.status]}</span>
            </div>
            <div style="font-size:.75rem;color:#4B5563;border-top:1px solid #E5E7EB;padding-top:6px;margin-top:6px">
              Disukai warga: <strong>${l.dukungan} dukungan</strong>
            </div>
          </div>`
        );

      markersRef.current[l.id] = m;
    });

    // Tambah marker SOS darurat (di atas laporan biasa)
    sinyalDarurat.forEach((s) => {
      const waktuStr = new Date(s.waktu).toLocaleString("id-ID", {
        hour: "2-digit", minute: "2-digit", day: "numeric", month: "short",
      });
      const m = L.marker([s.lat, s.lng], {
        icon: sosMarkerIcon(),
        zIndexOffset: 1000,
      })
        .addTo(map)
        .bindPopup(
          `<div style="font-family:Inter,sans-serif;min-width:220px;padding:4px">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">
              <span style="background:#E02424;color:#fff;font-size:.65rem;font-weight:800;padding:3px 8px;border-radius:999px">🚨 SINYAL DARURAT</span>
            </div>
            <div style="font-weight:800;font-size:.95rem;color:#E02424;margin-bottom:4px">${s.jenisLabel}</div>
            <div style="font-size:.75rem;color:#6B7280;margin-bottom:4px">Pelapor: <strong style="color:#111">${s.pelapor}</strong></div>
            <div style="font-size:.75rem;color:#6B7280;margin-bottom:4px">Waktu: ${waktuStr}</div>
            <div style="font-family:monospace;font-size:.7rem;color:#9CA3AF">${s.lat.toFixed(5)}, ${s.lng.toFixed(5)}</div>
          </div>`
        );
      markersRef.current[`SOS-${s.id}`] = m;
    });

    const t = setTimeout(() => map.invalidateSize(), 300);
    return () => clearTimeout(t);
  }, [laporanFiltered, sinyalDarurat]);

  function fokusLaporan(l: Laporan) {
    setTerpilihId(l.id);
    if (mapRef.current) {
      mapRef.current.flyTo([l.lokasi.lat, l.lokasi.lng], 15, { duration: 1.2 });
      const m = markersRef.current[l.id];
      if (m) setTimeout(() => m.openPopup(), 1200);
    }
  }

  function fokusSOSMarker(lat: number, lng: number, sosId: string) {
    if (mapRef.current) {
      mapRef.current.flyTo([lat, lng], 16, { duration: 1.2 });
      const m = markersRef.current[`SOS-${sosId}`];
      if (m) setTimeout(() => m.openPopup(), 1200);
    }
  }

  return (
    <div className="flex h-[calc(100vh-var(--nav-h))] w-full flex-col overflow-hidden bg-bg">
      {/* Header filter & statistik */}
      <header className="border-b border-ink-300 bg-surface/90 px-6 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-ink-300 bg-ground text-sage hover:text-cream"
              aria-label="Kembali ke beranda"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="font-display text-xl font-extrabold text-cream-hi sm:text-2xl">
                Peta Sebaran Laporan Warga
              </h1>
              <p className="text-xs text-sage">
                Yogyakarta &amp; Wilayah Sekitar · Real-time Open Data
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-2xl border border-ink-300 bg-ground px-3.5 py-1.5 text-xs font-semibold text-cream">
              <span className="h-2 w-2 rounded-full bg-tan animate-pulse" />
              <span>{totalAktif} Aktif</span>
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-danger/30 bg-danger/10 px-3.5 py-1.5 text-xs font-semibold text-danger">
              <ShieldAlert size={14} />
              <span>{totalDarurat} Urgensi Tinggi</span>
            </div>
            {sinyalDarurat.length > 0 && (
              <div className="flex animate-pulse items-center gap-2 rounded-2xl border border-danger bg-danger px-3.5 py-1.5 text-xs font-bold text-white shadow-lg shadow-danger/30">
                <Siren size={14} />
                <span>{sinyalDarurat.length} SOS Aktif</span>
              </div>
            )}
          </div>
        </div>

        {/* Baris Filter & Search */}
        <div className="mx-auto mt-4 flex max-w-[1400px] flex-wrap items-center gap-3">
          {/* Search box */}
          <div className="relative min-w-[200px] flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sage" />
            <input
              type="text"
              placeholder="Cari lokasi atau kata kunci..."
              value={cari}
              onChange={(e) => setCari(e.target.value)}
              className="h-10 w-full rounded-xl border border-ink-400 bg-ground pl-9 pr-3 text-xs text-cream focus:border-tan focus:outline-none"
            />
          </div>

          {/* Filter Kategori */}
          <select
            value={fKategori}
            onChange={(e) => setFKategori(e.target.value as any)}
            className="h-10 rounded-xl border border-ink-400 bg-ground px-3 text-xs text-cream focus:border-tan focus:outline-none"
          >
            <option value="semua">Semua Kategori</option>
            {KATEGORI.map((k) => (
              <option key={k.id} value={k.id}>
                {k.nama}
              </option>
            ))}
          </select>

          {/* Filter Wilayah */}
          <select
            value={fWilayah}
            onChange={(e) => setFWilayah(e.target.value as any)}
            className="h-10 rounded-xl border border-ink-400 bg-ground px-3 text-xs text-cream focus:border-tan focus:outline-none"
          >
            <option value="semua">Semua Wilayah</option>
            {WILAYAH.map((w) => (
              <option key={w.id} value={w.id}>
                {w.nama}
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* Konten Peta + Sidebar List */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Main Leaflet Map */}
        <div ref={ref} className="h-full flex-1" role="application" aria-label="Peta Interaktif Laporan" />

        {/* Sidebar Daftar Laporan */}
        <aside className="hidden w-[360px] flex-col border-l border-ink-300 bg-surface md:flex">
          <div className="border-b border-ink-300 p-4">
            <h2 className="font-display text-sm font-bold uppercase tracking-wider text-sage">
              Daftar Titik Laporan ({laporanFiltered.length})
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {/* Sinyal SOS di atas */}
            {sinyalDarurat.length > 0 && (
              <div className="space-y-2">
                <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-danger">
                  <Siren size={11} /> Sinyal SOS Aktif
                </p>
                {sinyalDarurat.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => fokusSOSMarker(s.lat, s.lng, s.id)}
                    className="group w-full animate-pulse rounded-2xl border border-danger bg-danger/10 p-4 text-left transition-all hover:animate-none hover:bg-danger/20"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="rounded-full bg-danger px-2 py-0.5 text-[10px] font-extrabold text-white">
                        🚨 DARURAT
                      </span>
                      <span className="text-[10px] font-semibold text-danger/80">
                        {new Date(s.waktu).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <h3 className="font-display text-sm font-bold text-danger">{s.jenisLabel}</h3>
                    <p className="mt-1 text-xs text-sage">
                      <MapPin size={11} className="inline-block mr-1" />
                      {s.pelapor} · {s.lat.toFixed(4)}, {s.lng.toFixed(4)}
                    </p>
                  </button>
                ))}
                <div className="border-t border-ink-300/40 pt-2" />
              </div>
            )}

            {laporanFiltered.length === 0 ? (
              <div className="py-12 text-center text-xs text-sage">
                Tidak ada laporan yang cocok dengan filter.
              </div>
            ) : (
              laporanFiltered.map((l) => {
                const k = getKategori(l.kategori);
                const dipilih = l.id === terpilihId;
                return (
                  <button
                    key={l.id}
                    onClick={() => fokusLaporan(l)}
                    className={`group w-full rounded-2xl border p-4 text-left transition-all ${
                      dipilih
                        ? "border-tan bg-tan/10 shadow-md"
                        : "border-ink-300 bg-ground hover:border-tan/40"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span
                        className="rounded-full px-2.5 py-0.5 text-[10px] font-bold"
                        style={{ backgroundColor: `${k.warna}20`, color: k.warna }}
                      >
                        {k.nama}
                      </span>
                      <span
                        className="rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold"
                        style={{
                          backgroundColor: `${priorityColor(l.ai.priorityScore)}20`,
                          color: priorityColor(l.ai.priorityScore),
                        }}
                      >
                        Skor {l.ai.priorityScore}/10
                      </span>
                    </div>

                    <h3 className="font-display text-sm font-bold text-cream group-hover:text-tan">
                      {l.judul}
                    </h3>
                    <p className="mt-1 line-clamp-1 text-xs text-sage-pale">
                      <MapPin size={12} className="inline-block mr-1 text-tan" />
                      {l.lokasi.alamat}
                    </p>

                    <div className="mt-3 flex items-center justify-between border-t border-ink-300/40 pt-2 text-[11px] text-sage">
                      <span>Status: <strong className="text-cream">{STATUS_LABEL[l.status]}</strong></span>
                      <span>{l.dukungan} Dukungan</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
