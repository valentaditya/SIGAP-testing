"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, CheckCheck, Info, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { useApp } from "@/lib/store";

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

export function NotifBell() {
  const { notifs, tandaiBaca, tandaiSemuaBaca } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const belumBaca = notifs.filter((n) => !n.baca).length;

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-label={`Notifikasi, ${belumBaca} belum dibaca`}
        className="relative grid h-[42px] w-[42px] place-items-center rounded-[10px] text-ink-700 transition-colors hover:bg-ground"
      >
        <Bell size={20} />
        {belumBaca > 0 && (
          <span className="absolute right-1.5 top-1.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
            {belumBaca}
          </span>
        )}
      </button>

      {open && (
        <div className="anim-pop absolute right-0 top-[calc(100%+8px)] w-[340px] overflow-hidden rounded-2xl bg-surface shadow-[var(--shadow-pop)] ring-1 ring-white/10">
          <div className="flex items-center justify-between border-b border-white/[.08] px-4 py-3">
            <p className="font-display text-sm font-bold">Notifikasi</p>
            <button
              onClick={tandaiSemuaBaca}
              className="inline-flex items-center gap-1 text-xs font-semibold text-brand-500 hover:text-brand-600"
            >
              <CheckCheck size={14} /> Tandai semua dibaca
            </button>
          </div>
          <ul className="max-h-[360px] overflow-y-auto">
            {notifs.map((n) => {
              const Ic = ICON[n.tone];
              return (
                <li key={n.id}>
                  <button
                    onClick={() => tandaiBaca(n.id)}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-brand-50 ${!n.baca ? "bg-brand-50/50" : ""}`}
                  >
                    <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg ${COLOR[n.tone]}`}>
                      <Ic size={15} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold">{n.judul}</span>
                        {!n.baca && <span className="h-2 w-2 shrink-0 rounded-full bg-brand-600" />}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-ink-500">{n.pesan}</span>
                      <span className="mt-0.5 block text-[11px] text-ink-300">{n.waktu}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
