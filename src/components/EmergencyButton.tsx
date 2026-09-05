"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Siren, X, PhoneCall, ShieldAlert, Flame, HeartPulse } from "lucide-react";
import { useApp } from "@/lib/store";

const JENIS = [
  { icon: ShieldAlert, label: "Keamanan / Kriminal" },
  { icon: Flame, label: "Kebakaran" },
  { icon: HeartPulse, label: "Medis / Kecelakaan" },
];

// Halaman yang sudah punya jalur darurat sendiri di dalam konten.
// Menampilkan FAB di sini hanya menduplikasi aksi dan — pada layar
// kecil — menimpa tombol utama halaman.
const SEMBUNYIKAN_DI = ["/login"];

export function EmergencyButton() {
  const [open, setOpen] = useState(false);
  const [terkirim, setTerkirim] = useState(false);
  const [pilih, setPilih] = useState(0);
  const { tambahNotif, tambahPoin } = useApp();
  const pathname = usePathname();

  const panelRef = useRef<HTMLDivElement>(null);
  const pemicuRef = useRef<HTMLElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tutup = useCallback(() => {
    setOpen(false);
    setTerkirim(false);
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

  /* Bersihkan timer bila komponen dilepas sebelum hitungan selesai. */
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  function kirim() {
    setTerkirim(true);
    tambahPoin(10);
    tambahNotif({
      judul: "Sinyal Darurat Terkirim",
      pesan: `${JENIS[pilih].label} — tim terdekat telah diberitahu.`,
      waktu: "Baru saja",
      tone: "danger",
    });
    timerRef.current = setTimeout(tutup, 2600);
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
            className="anim-pop w-full max-w-[420px] rounded-3xl border border-ink-300 bg-surface p-7 shadow-2xl"
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
                    onClick={tutup}
                    aria-label="Tutup dialog darurat"
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

                <button
                  onClick={kirim}
                  className="btn-anim mt-6 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-tan-solid px-6 font-bold text-white shadow-lg shadow-tan/25 transition-colors hover:bg-brand-700"
                >
                  <PhoneCall size={18} aria-hidden="true" /> Kirim Sinyal Darurat
                </button>
                <p className="mt-3 text-center text-xs text-sage">
                  Lokasi GPS Anda akan dilampirkan otomatis.
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
                  Tim darurat terdekat telah diberitahu dan menuju lokasi Anda.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
