"use client";

import { useState } from "react";
import { Siren, X, PhoneCall, ShieldAlert, Flame, HeartPulse } from "lucide-react";
import { useApp } from "@/lib/store";

const JENIS = [
  { icon: ShieldAlert, label: "Keamanan / Kriminal" },
  { icon: Flame, label: "Kebakaran" },
  { icon: HeartPulse, label: "Medis / Kecelakaan" },
];

export function EmergencyButton() {
  const [open, setOpen] = useState(false);
  const [terkirim, setTerkirim] = useState(false);
  const [pilih, setPilih] = useState(0);
  const { tambahNotif, tambahPoin } = useApp();

  function kirim() {
    setTerkirim(true);
    tambahPoin(10);
    tambahNotif({
      judul: "Sinyal Darurat Terkirim",
      pesan: `${JENIS[pilih].label} — tim terdekat telah diberitahu.`,
      waktu: "Baru saja",
      tone: "danger",
    });
    setTimeout(() => { setOpen(false); setTerkirim(false); }, 2600);
  }

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Tombol darurat"
        className="sos-pulse btn-anim fixed bottom-6 right-6 z-[90] grid h-16 w-16 place-items-center rounded-full bg-danger text-white shadow-[var(--shadow-pop)]"
      >
        <Siren size={28} />
      </button>

      {open && (
        <div className="anim-fade-in fixed inset-0 z-[100] grid place-items-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="anim-pop w-full max-w-[420px] rounded-3xl bg-surface p-6 shadow-[var(--shadow-pop)] ring-1 ring-white/10" onClick={(e) => e.stopPropagation()}>
            {!terkirim ? (
              <>
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-danger-bg text-danger"><Siren size={24} /></span>
                    <div>
                      <h3 className="font-display text-lg font-extrabold">Sinyal Darurat</h3>
                      <p className="text-xs text-ink-500">Untuk situasi yang butuh respons segera</p>
                    </div>
                  </div>
                  <button onClick={() => setOpen(false)} aria-label="Tutup" className="grid h-9 w-9 place-items-center rounded-lg text-ink-500 hover:bg-ground"><X size={18} /></button>
                </div>

                <div className="space-y-2">
                  {JENIS.map((j, i) => {
                    const Ic = j.icon;
                    return (
                      <button
                        key={j.label}
                        onClick={() => setPilih(i)}
                        className={`flex w-full items-center gap-3 rounded-xl border p-3.5 text-left text-sm font-semibold transition-all ${
                          pilih === i ? "border-danger bg-danger-bg/60 text-danger ring-2 ring-danger/20" : "border-ink-300 text-ink-700 hover:border-danger/70"
                        }`}
                      >
                        <Ic size={18} /> {j.label}
                      </button>
                    );
                  })}
                </div>

                <button onClick={kirim} className="btn-anim mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-danger px-6 py-3.5 font-bold text-white">
                  <PhoneCall size={18} /> Kirim Sinyal Darurat
                </button>
                <p className="mt-3 text-center text-[11px] text-ink-500">Lokasi GPS Anda akan dilampirkan otomatis.</p>
              </>
            ) : (
              <div className="py-6 text-center">
                <span className="anim-pop mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-success-bg text-success"><PhoneCall size={30} /></span>
                <h3 className="font-display text-xl font-extrabold text-success">Sinyal Terkirim!</h3>
                <p className="mt-2 text-sm text-ink-500">Tim darurat terdekat telah diberitahu dan menuju lokasi Anda.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
