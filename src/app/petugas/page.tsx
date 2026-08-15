"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RequireAuth } from "@/components/RequireAuth";
import { useApp } from "@/lib/store";
import { Chip } from "@/components/Chip";
import { STATUS_LABEL_ID as STATUS_LABEL, statusTone, priorityColor, getKategori, type StatusId } from "@/lib/data";
import {
  ClipboardList, MapPin, Navigation, Camera, CheckCircle2, Upload, PlayCircle, LogOut,
} from "lucide-react";

export default function PetugasDashboard() {
  const { laporanWarga, tambahNotif, logout } = useApp();
  const router = useRouter();
  const tugas = laporanWarga.filter((l) => ["assigned", "in_progress"].includes(l.status));
  const [statusMap, setStatusMap] = useState<Record<string, StatusId>>({});
  const [bukti, setBukti] = useState<Record<string, number>>({});

  function updateStatus(id: string, s: StatusId, judul: string) {
    setStatusMap((m) => ({ ...m, [id]: s }));
    tambahNotif({
      judul: s === "in_progress" ? "Penanganan Dimulai" : "Penanganan Selesai",
      pesan: `${id} — ${judul}`,
      waktu: "Baru saja",
      tone: s === "resolved" ? "success" : "warning",
    });
  }

  return (
    <RequireAuth role="petugas">
    <main className="mx-auto max-w-[1000px] px-6 pt-6 pb-12">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="anim-fade-up">
          <p className="micro-label text-sage">SIGAP · Menu Petugas</p>
          <h1 className="font-display text-2xl font-extrabold md:text-3xl">Dashboard <span className="text-brand-600">Petugas</span></h1>
          <p className="mt-1 text-sm text-ink-500">Daftar tugas penanganan yang ditugaskan kepadamu.</p>
        </div>
        <button
          onClick={() => { logout(); router.replace("/login"); }}
          className="btn-anim inline-flex items-center gap-2 rounded-xl border border-ink-300 px-4 py-2.5 text-sm font-semibold text-sage-pale transition-colors hover:border-danger hover:text-danger"
        >
          <LogOut size={15} /> Keluar
        </button>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-surface p-5 shadow-[var(--shadow-card)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Tugas Aktif</p>
          <p className="mt-1 font-display text-3xl font-extrabold">{tugas.length}</p>
        </div>
        <div className="rounded-2xl bg-surface p-5 shadow-[var(--shadow-card)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Dalam Proses</p>
          <p className="mt-1 font-display text-3xl font-extrabold text-amber-600">
            {Object.values(statusMap).filter((s) => s === "in_progress").length + tugas.filter((t) => t.status === "in_progress").length}
          </p>
        </div>
        <div className="rounded-2xl bg-surface p-5 shadow-[var(--shadow-card)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Selesai Hari Ini</p>
          <p className="mt-1 font-display text-3xl font-extrabold text-success">{Object.values(statusMap).filter((s) => s === "resolved").length}</p>
        </div>
      </div>

      <section className="anim-fade-up" style={{ animationDelay: "100ms" }}>
        <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-extrabold"><ClipboardList size={20} className="text-brand-600" /> Daftar Tugas</h2>
        {tugas.length === 0 && (
          <div className="rounded-2xl bg-surface p-10 text-center shadow-[var(--shadow-card)]">
            <CheckCircle2 size={40} className="mx-auto text-success" />
            <p className="mt-3 font-semibold">Tidak ada tugas aktif</p>
          </div>
        )}
        <div className="space-y-4">
          {tugas.map((l) => {
            const k = getKategori(l.kategori);
            const st = statusMap[l.id] ?? l.status;
            const fotoBukti = bukti[l.id] ?? 0;
            return (
              <div key={l.id} className="card-hover rounded-2xl bg-surface p-5 shadow-[var(--shadow-card)]">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs font-bold text-ink-500">{l.id}</p>
                    <h3 className="mt-1 font-display text-lg font-bold">{l.judul}</h3>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-500"><MapPin size={12} /> {l.lokasi.alamat}</p>
                  </div>
                  <Chip tone={statusTone(st)}>{STATUS_LABEL[st]}</Chip>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-brand-50/70 p-3">
                    <p className="text-[11px] font-bold uppercase text-ink-500">Kategori</p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold" style={{ color: k.warna }}>
                      <span className="h-2 w-2 rounded-full" style={{ background: k.warna }} /> {k.nama}
                    </p>
                  </div>
                  <div className="rounded-xl bg-brand-50/70 p-3">
                    <p className="text-[11px] font-bold uppercase text-ink-500">Skor Urgensi</p>
                    <p className="mt-0.5 text-sm font-extrabold" style={{ color: priorityColor(l.ai.priorityScore) }}>{l.ai.priorityScore} / 10</p>
                  </div>
                  <div className="rounded-xl bg-brand-50/70 p-3">
                    <p className="text-[11px] font-bold uppercase text-ink-500">SLA</p>
                    <p className="mt-0.5 text-sm font-extrabold">{l.sla}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button className="btn-anim inline-flex items-center gap-1.5 rounded-xl border border-ink-300 px-4 py-2.5 text-sm font-semibold text-ink-700 hover:border-brand-600 hover:text-brand-600">
                    <Navigation size={16} /> Menuju Lokasi
                  </button>
                  {st !== "in_progress" && st !== "resolved" && (
                    <button onClick={() => updateStatus(l.id, "in_progress", l.judul)} className="btn-anim inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-600">
                      <PlayCircle size={16} /> Mulai Penanganan
                    </button>
                  )}
                  {st === "in_progress" && (
                    <>
                      <button onClick={() => setBukti((b) => ({ ...b, [l.id]: Math.min(fotoBukti + 1, 5) }))} className="btn-anim inline-flex items-center gap-1.5 rounded-xl border border-ink-300 px-4 py-2.5 text-sm font-semibold text-ink-700 hover:border-brand-600">
                        <Camera size={16} /> Upload Bukti ({fotoBukti})
                      </button>
                      <button
                        onClick={() => updateStatus(l.id, "resolved", l.judul)}
                        disabled={fotoBukti === 0}
                        className="btn-anim inline-flex items-center gap-1.5 rounded-xl bg-success px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Upload size={16} /> Kirim Hasil ke Admin
                      </button>
                    </>
                  )}
                  {st === "resolved" && (
                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-success-bg px-4 py-2.5 text-sm font-semibold text-success">
                      <CheckCircle2 size={16} /> Terkirim ke Admin
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
    </RequireAuth>
  );
}
