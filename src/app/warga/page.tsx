"use client";

import Link from "next/link";
import { RequireAuth } from "@/components/RequireAuth";
import { useApp } from "@/lib/store";
import { Chip } from "@/components/Chip";
import { STATUS_LABEL_ID as STATUS_LABEL, statusTone, priorityColor, getKategori } from "@/lib/data";
import {
  FileText, Award, Star, TrendingUp, Plus, ThumbsUp, MapPin, Camera,
  Trophy, Medal, Crown, ChevronRight,
} from "lucide-react";

const LEVEL_NAMA = ["", "Warga Baru", "Warga Aktif", "Warga Peduli", "Pahlawan Lingkungan", "Guardian Kota"];
const NEXT_LEVEL = [100, 250, 500, 900, 1400];

const LEADERBOARD = [
  { nama: "Mas Gilang", poin: 640, lencana: "Guardian Kota" },
  { nama: "Bu Ratna S.", poin: 480, lencana: "Pahlawan Lingkungan" },
  { nama: "Pak Darmadi", poin: 320, lencana: "Warga Aktif" },
  { nama: "Bu Lestari", poin: 240, lencana: "Warga Aktif" },
  { nama: "Mas Fajar", poin: 150, lencana: "Warga Aktif" },
];

const RANK_ICON = [Crown, Medal, Award];

export default function WargaDashboard() {
  const { user, laporanWarga, upvote, upvoted, tambahPoin } = useApp();
  const nama = user?.nama ?? "Warga";
  const poin = user?.poin ?? 40;
  const level = user?.level ?? 1;
  const lencana = user?.lencana ?? ["Pelapor Pertama"];
  const milikSaya = laporanWarga.filter((l) => l.pelapor === nama || l.pelapor.includes(nama.split(" ")[0]));
  const target = NEXT_LEVEL[Math.min(level - 1, NEXT_LEVEL.length - 1)];
  const progres = Math.min((poin / target) * 100, 100);

  return (
    <RequireAuth role="warga">
    <main className="mx-auto max-w-[1160px] px-6 py-10">
      {/* Sapaan + poin */}
      <div className="anim-fade-up mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold md:text-3xl">Halo, <span className="text-brand-600">{nama}</span></h1>
          <p className="mt-1 text-sm text-ink-500">Pantau laporanmu dan kumpulkan poin dengan berkontribusi.</p>
        </div>
        <Link href="/lapor" className="btn-anim inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 font-semibold text-ink-900 no-underline hover:bg-brand-700">
          <Plus size={18} /> Buat Laporan
        </Link>
      </div>

      {/* Kartu poin & level */}
      <div className="mb-8 grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
        <div className="card-hover anim-fade-up rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-ground-2 p-6 text-cream ring-1 ring-white/10 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-brand-100">Total Poin</p>
              <p className="mt-1 font-display text-4xl font-extrabold text-cream-hi">{poin.toLocaleString("id-ID")}</p>
            </div>
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/10"><Star size={28} /></span>
          </div>
          <div className="mt-5">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="font-semibold">Level {level} · {LEVEL_NAMA[level]}</span>
              <span className="text-brand-100">{Math.round(progres)}% ke level {Math.min(level + 1, 5)}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-white/20">
              <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-100 transition-all duration-700" style={{ width: `${progres}%` }} />
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {lencana.map((b) => (
              <span key={b} className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold">
                <Award size={13} /> {b}
              </span>
            ))}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="card-hover anim-fade-up rounded-2xl bg-surface p-6 shadow-[var(--shadow-card)]" style={{ animationDelay: "80ms" }}>
          <h3 className="mb-4 flex items-center gap-2 font-display font-bold"><Trophy size={18} className="text-amber-500" /> Papan Peringkat Warga</h3>
          <ul className="space-y-2.5">
            {LEADERBOARD.map((l, i) => {
              const RankIc = RANK_ICON[i];
              return (
                <li key={l.nama} className="flex items-center gap-3 rounded-xl bg-brand-50/60 px-3 py-2.5">
                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${i === 0 ? "bg-warning-bg text-warning" : i === 1 ? "bg-info-bg text-info" : i === 2 ? "bg-brand-100 text-brand-600" : "bg-brand-50 text-brand-600"}`}>
                    {RankIc ? <RankIc size={15} /> : <span className="text-xs font-bold">{i + 1}</span>}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{l.nama}</p>
                    <p className="text-[11px] text-ink-500">{l.lencana}</p>
                  </div>
                  <span className="text-sm font-bold text-brand-600">{l.poin}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Laporan saya */}
      <section className="anim-fade-up mb-8" style={{ animationDelay: "140ms" }}>
        <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-extrabold"><FileText size={20} className="text-brand-600" /> Laporan Saya</h2>
        {milikSaya.length === 0 ? (
          <div className="rounded-2xl bg-surface p-10 text-center shadow-[var(--shadow-card)]">
            <FileText size={40} className="mx-auto text-ink-300" />
            <p className="mt-3 font-semibold text-ink-700">Belum ada laporan</p>
            <p className="mt-1 text-sm text-ink-500">Mulai laporkan masalah di lingkunganmu.</p>
            <Link href="/lapor" className="btn-anim mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 font-semibold text-white no-underline hover:bg-brand-700">
              <Plus size={16} /> Buat Laporan Pertama
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {milikSaya.map((l) => {
              const k = getKategori(l.kategori);
              return (
                <div key={l.id} className="card-hover rounded-2xl bg-surface p-5 shadow-[var(--shadow-card)]">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-mono text-xs font-bold text-ink-500">{l.id}</p>
                    <Chip tone={statusTone(l.status)}>{STATUS_LABEL[l.status]}</Chip>
                  </div>
                  <h3 className="mt-2 font-display font-bold">{l.judul}</h3>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-500"><MapPin size={12} /> {l.lokasi.alamat}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: `${k.warna}1a`, color: k.warna }}>
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: k.warna }} /> {k.nama}
                    </span>
                    <span className="text-sm font-extrabold" style={{ color: priorityColor(l.ai.priorityScore) }}>{l.ai.priorityScore}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Laporan sekitar + upvote */}
      <section className="anim-fade-up" style={{ animationDelay: "200ms" }}>
        <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-extrabold"><TrendingUp size={20} className="text-brand-600" /> Laporan di Sekitarmu</h2>
        <div className="space-y-3">
          {laporanWarga.slice(0, 5).map((l) => {
            const k = getKategori(l.kategori);
            const sudah = upvoted.has(l.id);
            return (
              <div key={l.id} className="card-hover flex flex-wrap items-center gap-4 rounded-2xl bg-surface p-4 shadow-[var(--shadow-card)]">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl text-white" style={{ background: k.warna }}>
                  <MapPin size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{l.judul}</p>
                  <p className="mt-0.5 flex items-center gap-2 text-xs text-ink-500">
                    <span className="flex items-center gap-1"><Camera size={11} /> {l.foto}</span>
                    · {l.lokasi.alamat}
                  </p>
                </div>
                <Chip tone={statusTone(l.status)}>{STATUS_LABEL[l.status]}</Chip>
                <button
                  onClick={() => upvote(l.id)}
                  disabled={sudah}
                  className={`btn-anim inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition-all ${
                    sudah ? "cursor-default bg-brand-100 text-brand-700" : "bg-brand-600 text-white hover:bg-brand-700"
                  }`}
                >
                  <ThumbsUp size={15} className={sudah ? "fill-brand-700" : ""} /> {l.dukungan}
                </button>
                <ChevronRight size={18} className="text-ink-300" />
              </div>
            );
          })}
        </div>
      </section>
    </main>
    </RequireAuth>
  );
}
