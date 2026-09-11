"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Siren, X, PhoneCall, ShieldAlert, Flame, HeartPulse, MapPin, RotateCcw, Loader2 } from "lucide-react";
import { useApp } from "@/lib/store";
import { deteksiWilayah } from "@/lib/data";



const JENIS = [
  { icon: ShieldAlert, label: "Keamanan / Kriminal" },
  { icon: Flame, label: "Kebakaran" },
  { icon: HeartPulse, label: "Medis / Kecelakaan" },
];

// Halaman yang sudah punya jalur darurat sendiri di dalam konten.
// Menampilkan FAB di sini hanya menduplikasi aksi dan — pada layar
// kecil — menimpa tombol utama halaman.
const SEMBUNYIKAN_DI = ["/login"];

type GpsStatus = "idle" | "loading" | "denied" | "ok";

export function EmergencyButton() {
  const [open, setOpen] = useState(false);
  const [terkirim, setTerkirim] = useState(false);
  const [pilih, setPilih] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>("idle");
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const { tambahNotif, tambahPoin, user, tambahSinyalDarurat } = useApp();
  const pathname = usePathname();

  const panelRef = useRef<HTMLDivElement>(null);
  const pemicuRef = useRef<HTMLElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tutup = useCallback(() => {
    setOpen(false);
    setTerkirim(false);
    setGpsStatus("idle");
    setGpsCoords(null);
    setCountdown(null);
  }, []);

  /* Escape untuk menutup + kunci scroll latar selama dialog terbuka. */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); tutup(); }
    };
    document.addEventListener("keydown", onKey);
    const scrollY = window.scrollY;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      window.scrollTo(0, scrollY);
    };
  }, [open, tutup]);

  /* Fokus masuk ke dialog saat dibuka, dan kembali ke pemicu saat ditutup.
     Tanpa ini pengguna keyboard "terjebak" di belakang overlay. */
  useEffect(() => {
    if (open) {
      pemicuRef.current = document.activeElement as HTMLElement;
      panelRef.current?.querySelector<HTMLElement>("button")?.focus();
    } else {
      pemicuRef.current?.focus();
    }
  }, [open]);

  /* Jerat Tab di dalam dialog (WCAG 2.1.2 No Keyboard Trap terbalik:
     fokus tidak boleh bocor ke konten yang tersembunyi di belakang). */
  function jeratTab(e: React.KeyboardEvent) {
    if (e.key !== "Tab" || !panelRef.current) return;
    const f = panelRef.current.querySelectorAll<HTMLElement>(
      'button:not([disabled]),a[href],input,[tabindex]:not([tabindex="-1"])',
    );
    if (!f.length) return;
    const pertama = f[0], terakhir = f[f.length - 1];
    if (e.shiftKey && document.activeElement === pertama) { e.preventDefault(); terakhir.focus(); }
    else if (!e.shiftKey && document.activeElement === terakhir) { e.preventDefault(); pertama.focus(); }
  }

  useEffect(() => {
    if (countdown === null) return;

    if (countdown === 0) {
      setCountdown(null);
      kirim();
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  /** Minta izin GPS. Wajib — jika ditolak tampil pesan error + tombol retry. */
  function mintaGps() {
    setGpsStatus("loading");
    if (!navigator.geolocation) {
      setGpsStatus("denied");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsStatus("ok");
      },
      () => {
        // Ditolak / error → wajib aktifkan, tidak ada fallback
        setGpsStatus("denied");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }

  function mulaiCountdown() {
    if (gpsStatus !== "ok") {
      // GPS belum aktif, minta dulu
      mintaGps();
      return;
    }
    setCountdown(10);
  }

  function batalCountdown() {
    setCountdown(null);
  }

  function kirim() {
    if (!gpsCoords) {
      // Seharusnya tidak terjadi, tapi safeguard
      setGpsStatus("denied");
      return;
    }

    const alamatApprox = `GPS ${gpsCoords.lat.toFixed(5)}, ${gpsCoords.lng.toFixed(5)}`;
    const wilayah = deteksiWilayah(alamatApprox);
    const namaPerlapor = user?.nama ?? "Warga Anonim";
    const idSinyal = `SOS-${Date.now()}`;

    tambahSinyalDarurat({
      id: idSinyal,
      jenisLabel: JENIS[pilih].label,
      lat: gpsCoords.lat,
      lng: gpsCoords.lng,
      pelapor: namaPerlapor,
      wilayah,
      waktu: new Date().toISOString(),
    });

    tambahPoin(10);
    tambahNotif({
      judul: "🚨 Sinyal Darurat Terkirim",
      pesan: `${JENIS[pilih].label} — lokasi GPS dilampirkan. Tim terdekat diberitahu.`,
      waktu: "Baru saja",
      tone: "danger",
    });

    setTerkirim(true);
    timerRef.current = setTimeout(tutup, 2800);
  }

  if (SEMBUNYIKAN_DI.includes(pathname)) return null;

  return (
    <>
      {/* FAB — diberi jarak aman iOS (home indicator) lewat env(safe-area-inset). */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Kirim sinyal darurat"
        aria-haspopup="dialog"
        className="sos-pulse btn-anim fixed right-4 z-[90] grid h-14 w-14 place-items-center rounded-full bg-danger text-white shadow-[var(--shadow-pop)] sm:right-6 sm:h-16 sm:w-16"
        style={{ bottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}
      >
        <Siren size={26} aria-hidden="true" />
      </button>

      {open && (
        <div
          className="anim-fade-in fixed inset-0 z-[100] grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={tutup}
        >
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="sos-judul"
            onKeyDown={jeratTab}
            className="anim-pop w-full max-w-[440px] rounded-3xl border border-ink-300 bg-surface p-7 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {!terkirim ? (
              <>
                <div className="mb-5 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-danger-bg text-danger">
                      <Siren size={24} aria-hidden="true" />
                    </span>
                    <div>
                      <h2 id="sos-judul" className="font-display text-xl font-bold text-cream-hi">
                        Sinyal Darurat
                      </h2>
                      <p className="text-xs text-sage">Untuk situasi yang butuh respons segera</p>
                    </div>
                  </div>
                  <button
                    onClick={countdown !== null ? batalCountdown : tutup}
                    aria-label={
                      countdown !== null
                        ? "Batalkan pengiriman darurat"
                        : "Tutup dialog darurat"
                    }
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-sage transition-colors hover:bg-ground"
                  >
                    <X size={18} aria-hidden="true" />
                  </button>
                </div>

                {/* Pilihan jenis: radiogroup sungguhan, bukan tombol berwarna saja. */}
                <div role="radiogroup" aria-label="Jenis keadaan darurat" className="space-y-2.5">
                  {JENIS.map((j, i) => {
                    const Ic = j.icon;
                    const dipilih = pilih === i;
                    return (
                      <button
                        key={j.label}
                        type="button"
                        role="radio"
                        aria-checked={dipilih}
                        disabled={countdown !== null}
                        onClick={() => setPilih(i)}
                        className={`flex min-h-[52px] w-full items-center gap-3 rounded-2xl border p-4 text-left text-sm font-semibold transition-all ${
                          dipilih
                            ? "border-danger bg-danger-bg text-danger ring-1 ring-danger/30"
                            : "border-ink-300 text-cream hover:border-danger/50"
                        }`}
                      >
                        <Ic size={18} aria-hidden="true" /> {j.label}
                        {/* Penanda non-warna agar tetap jelas bagi buta warna */}
                        {dipilih && <span aria-hidden="true" className="ml-auto text-xs font-bold">✓</span>}
                      </button>
                    );
                  })}
                </div>

                {/* Pesan error GPS — wajib aktifkan lokasi */}
                {gpsStatus === "denied" && (
                  <div className="mt-4 flex items-start gap-3 rounded-2xl border border-danger/40 bg-danger-bg p-4">
                    <MapPin size={18} className="mt-0.5 shrink-0 text-danger" aria-hidden="true" />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-danger">Wajib mengaktifkan lokasi GPS!</p>
                      <p className="mt-0.5 text-xs text-danger/80">
                        Izin lokasi diperlukan agar tim darurat tahu posisi Anda. Aktifkan di pengaturan browser, lalu coba lagi.
                      </p>
                    </div>
                  </div>
                )}

                {/* GPS loading */}
                {gpsStatus === "loading" && (
                  <div className="mt-4 flex items-center gap-3 rounded-2xl border border-tan/30 bg-tan/10 p-4">
                    <Loader2 size={18} className="shrink-0 animate-spin text-tan" aria-hidden="true" />
                    <p className="text-sm font-semibold text-cream">Mengambil lokasi GPS Anda…</p>
                  </div>
                )}

                {/* GPS berhasil */}
                {gpsStatus === "ok" && gpsCoords && (
                  <div className="mt-4 flex items-center gap-3 rounded-2xl border border-success/30 bg-success-bg/30 p-4">
                    <MapPin size={18} className="shrink-0 text-success" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-bold text-success">Lokasi GPS terkunci ✓</p>
                      <p className="mt-0.5 font-mono text-[11px] text-sage">
                        {gpsCoords.lat.toFixed(5)}, {gpsCoords.lng.toFixed(5)}
                      </p>
                    </div>
                  </div>
                )}

                {countdown === null ? (
                  <div className="mt-5 space-y-2">
                    {gpsStatus === "denied" ? (
                      /* Tombol Coba Lagi GPS */
                      <button
                        onClick={mintaGps}
                        className="btn-anim flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full border border-danger bg-danger/10 px-6 font-bold text-danger transition-colors hover:bg-danger/20"
                      >
                        <RotateCcw size={18} aria-hidden="true" />
                        Coba Aktifkan Lokasi Lagi
                      </button>
                    ) : (
                      <button
                        onClick={mulaiCountdown}
                        disabled={gpsStatus === "loading"}
                        className="btn-anim flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-tan-solid px-6 font-bold text-white shadow-lg shadow-tan/25 transition-colors hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {gpsStatus === "loading" ? (
                          <Loader2 size={18} className="animate-spin" aria-hidden="true" />
                        ) : (
                          <PhoneCall size={18} aria-hidden="true" />
                        )}
                        {gpsStatus === "idle" ? "Aktifkan Lokasi & Kirim Sinyal" : gpsStatus === "loading" ? "Mengambil GPS…" : "Kirim Sinyal Darurat"}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="mt-6 space-y-3">
                    <div className="rounded-2xl border border-danger/30 bg-danger-bg p-5 text-center">
                      <p className="text-xs font-semibold uppercase tracking-wider text-danger">
                        Sinyal akan dikirim dalam
                      </p>
                
                      <div
                        className="my-2 text-5xl font-black text-danger"
                        aria-live="assertive"
                        aria-atomic="true"
                      >
                        {countdown}
                      </div>
                    </div>
                
                    <button
                      type="button"
                      onClick={batalCountdown}
                      className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full border border-ink-300 font-bold text-cream transition-colors hover:bg-ground"
                    >
                      <X size={18} aria-hidden="true" />
                      Batalkan Pengiriman
                    </button>
                  </div>
                )}
                <p className="mt-3 text-center text-xs text-sage">
                  {gpsStatus === "ok"
                    ? "Lokasi GPS Anda akan dilampirkan otomatis."
                    : "Lokasi GPS wajib untuk mengirim sinyal darurat."}
                </p>
              </>
            ) : (
              /* role=status agar pembaca layar mengumumkan hasil tanpa memindah fokus */
              <div role="status" className="py-6 text-center">
                <span className="anim-pop mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-success-bg text-success">
                  <PhoneCall size={30} aria-hidden="true" />
                </span>
                <h2 className="font-display text-2xl font-bold text-success">Sinyal Terkirim!</h2>
                <p className="mt-2 text-sm text-sage">
                  Lokasi GPS dilampirkan. Tim darurat terdekat telah diberitahu dan menuju lokasi Anda.
                </p>
                {gpsCoords && (
                  <p className="mt-2 font-mono text-xs text-sage">
                    📍 {gpsCoords.lat.toFixed(5)}, {gpsCoords.lng.toFixed(5)}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
