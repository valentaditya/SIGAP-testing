"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Bell, CheckCheck, Info, CheckCircle2, AlertTriangle,
  XCircle, X, ArrowRight, Clock,
} from "lucide-react";
import { useApp } from "@/lib/store";
import type { Notif } from "@/lib/store";

const ICON = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: XCircle,
};

const COLOR = {
  info: "text-info bg-info-bg",
  success: "text-success bg-success-bg",
  warning: "text-warning bg-warning-bg",
  danger: "text-danger bg-danger-bg",
};

const BORDER = {
  info: "border-info/30",
  success: "border-success/30",
  warning: "border-warning/30",
  danger: "border-danger/40",
};

export function NotifBell() {
  const { notifs, tandaiBaca, tandaiSemuaBaca, user } = useApp();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<Notif | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const belumBaca = notifs.filter((n) => !n.baca).length;

  // Notifikasi hanya untuk dinas dan admin
  if (!user || (user.role !== "dinas" && user.role !== "admin")) return null;

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // Tutup modal detail dengan Escape
  useEffect(() => {
    if (!detail) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDetail(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [detail]);

  function bukaDetail(n: Notif) {
    tandaiBaca(n.id);
    setDetail(n);
    setOpen(false);
  }

  return (
    <>
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen(!open)}
          aria-label={`Notifikasi Dinas, ${belumBaca} belum dibaca`}
          className="relative grid h-[42px] w-[42px] place-items-center rounded-[10px] text-ink-700 transition-colors hover:bg-ground"
        >
          <Bell size={20} />
          {belumBaca > 0 && (
            <span className="absolute right-1.5 top-1.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-danger px-1 text-[10px] font-bold text-white animate-pulse">
              {belumBaca}
            </span>
          )}
        </button>

        {open && (
          <div className="anim-pop absolute right-0 top-[calc(100%+8px)] w-[360px] overflow-hidden rounded-2xl bg-surface shadow-[var(--shadow-pop)] ring-1 ring-white/10 z-[200]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/[.08] px-4 py-3">
              <div className="flex items-center gap-2">
                <p className="font-display text-sm font-bold">Notifikasi Dinas</p>
                {belumBaca > 0 && (
                  <span className="rounded-full bg-danger px-2 py-0.5 text-[10px] font-bold text-white">
                    {belumBaca} baru
                  </span>
                )}
              </div>
              <button
                onClick={tandaiSemuaBaca}
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-500 hover:text-brand-600"
              >
                <CheckCheck size={14} /> Tandai semua dibaca
              </button>
            </div>

            {/* List notif */}
            <ul className="max-h-[400px] overflow-y-auto divide-y divide-white/[.05]">
              {notifs.length === 0 ? (
                <li className="flex flex-col items-center gap-2 py-10 text-center">
                  <Bell size={28} className="text-ink-400 opacity-40" />
                  <p className="text-xs text-ink-400">Belum ada notifikasi baru</p>
                  <p className="text-[11px] text-ink-300">Notifikasi muncul saat ada laporan warga / sinyal darurat masuk</p>
                </li>
              ) : (
                notifs.map((n) => {
                  const Ic = ICON[n.tone];
                  return (
                    <li key={n.id}>
                      <button
                        onClick={() => bukaDetail(n)}
                        className={`group flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-brand-50/10 ${
                          !n.baca ? "bg-brand-50/20" : ""
                        }`}
                      >
                        <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg ${COLOR[n.tone]}`}>
                          <Ic size={15} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="truncate text-sm font-semibold">{n.judul}</span>
                            {!n.baca && <span className="h-2 w-2 shrink-0 rounded-full bg-brand-600" />}
                          </span>
                          <span className="mt-0.5 block line-clamp-2 text-xs text-ink-500">{n.pesan}</span>
                          <span className="mt-1 flex items-center gap-1 text-[11px] text-ink-300">
                            <Clock size={10} />
                            {n.waktu}
                          </span>
                        </span>
                        <ArrowRight size={14} className="mt-1 shrink-0 text-ink-300 opacity-0 transition-opacity group-hover:opacity-100" />
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        )}
      </div>

      {/* MODAL DETAIL NOTIFIKASI */}
      {detail && (
        <div
          className="fixed inset-0 z-[300] grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setDetail(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="notif-detail-judul"
            className="anim-pop w-full max-w-[420px] rounded-3xl bg-surface shadow-2xl ring-1 ring-white/10 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`border-b ${BORDER[detail.tone]} px-6 pt-6 pb-5`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${COLOR[detail.tone]}`}>
                    {(() => { const Ic = ICON[detail.tone]; return <Ic size={20} />; })()}
                  </span>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-sage">
                      {detail.tone === "danger" ? "DARURAT" :
                       detail.tone === "warning" ? "PERINGATAN" :
                       detail.tone === "success" ? "SUKSES" : "INFO"}
                    </p>
                    <h3 id="notif-detail-judul" className="font-display text-base font-bold text-cream-hi leading-tight">
                      {detail.judul}
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => setDetail(null)}
                  aria-label="Tutup detail notifikasi"
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-sage hover:bg-ground transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Isi pesan */}
            <div className="px-6 py-5">
              <p className="text-sm leading-relaxed text-cream">{detail.pesan}</p>
              <div className="mt-3 flex items-center gap-1.5 text-xs text-sage">
                <Clock size={12} />
                <span>{detail.waktu}</span>
              </div>
            </div>

            {/* Tombol Aksi Tangani untuk Dinas */}
            <div className="px-6 pb-6 flex flex-wrap gap-2.5">
              <button
                onClick={() => {
                  setDetail(null);
                  router.push(detail.link ?? "/dinas");
                }}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:opacity-90 active:scale-95 ${
                  detail.tone === "danger" ? "bg-red-600 hover:bg-red-500" :
                  detail.tone === "warning" ? "bg-amber-600 hover:bg-amber-500" : "bg-sky-600 hover:bg-sky-500"
                }`}
              >
                <CheckCircle2 size={16} /> Tangani Sekarang
              </button>

              <button
                onClick={() => setDetail(null)}
                className="flex items-center justify-center gap-2 rounded-xl border border-ink-300 px-4 py-2.5 text-xs font-semibold text-cream hover:bg-ground transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
