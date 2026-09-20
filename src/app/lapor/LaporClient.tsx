"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { KATEGORI, priorityLabel, priorityColor, deteksiWilayah, getWilayah, type KategoriId } from "@/lib/data";
import { Icon } from "@/components/Icon";
import { Chip } from "@/components/Chip";
import {
  MapPin, Camera, FileText, CheckCircle2, ArrowRight, ArrowLeft,
  Bot, Network, Gauge, Ticket, Building2,
  X, AlertTriangle, Loader2, Crosshair, EyeOff, UserRound, Sparkles, Upload
} from "lucide-react";
import { useApp } from "@/lib/store";
import { bisa, berandaPeran } from "@/lib/roles";
import { useSearchParams } from "next/navigation";
import type { AIAnalysisResult } from "@/app/api/analyze-priority/route";
import { CameraCaptureModal } from "@/components/CameraCaptureModal";

const MiniMap = dynamic(() => import("@/components/MiniMap").then((m) => m.MiniMap), {
  ssr: false,
  loading: () => <div className="grid h-[280px] place-items-center text-sm text-ink-500">Memuat peta…</div>,
});

type Step = 1 | 2 | 3;
type Phase = "form" | "running" | "done";

const AGENT_STEPS = [
  { icon: Bot, nama: "Memeriksa data laporan", desc: "Mengecek kelengkapan informasi…" },
  { icon: Network, nama: "Menganalisis urgensi", desc: "Menghitung tingkat keparahan & dampak…" },
  { icon: Gauge, nama: "Meneruskan ke dinas terkait", desc: "Menetapkan estimasi waktu penanganan…" },
];

function buatNomorTiket() {
  return `SGP-2026-0${113 + Math.floor(Math.random() * 40)}`;
}

export default function LaporClient() {
  const { user, tambahLaporan, tambahPoin, tambahNotif } = useApp();
  const params = useSearchParams();
  const [step, setStep] = useState<Step>(1);
  const [phase, setPhase] = useState<Phase>("form");
  const [runIdx, setRunIdx] = useState(0);

  const [anonim, setAnonim] = useState(params.get("anonim") === "1");
  const [kategori, setKategori] = useState<KategoriId>(
    params.get("darurat") === "1" ? "keamanan" : "jalan",
  );
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [alamat, setAlamat] = useState("");
  const [judul, setJudul] = useState("");
  const [deskripsi, setDeskripsi] = useState("");

  const [isLocating, setIsLocating] = useState(false);
  const [locatingError, setLocatingError] = useState<string | null>(null);

  const [fotoPreviews, setFotoPreviews] = useState<string[]>([]);
  const [fotoFiles, setFotoFiles] = useState<File[]>([]);
  const [fotoStorageUrls, setFotoStorageUrls] = useState<string[]>([]);
  const [isUploadingFoto, setIsUploadingFoto] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);

  function handleCameraCapture(file: File, previewUrl: string) {
    setFotoFiles((prev) => {
      if (prev.length >= 5) return prev;
      return [...prev, file];
    });
    setFotoPreviews((prev) => {
      if (prev.length >= 5) return prev;
      return [...prev, previewUrl];
    });
  }

  const [tiket, setTiket] = useState("");
  const pelaporNama = anonim ? "Anonim" : (user?.nama ?? "Warga");

  // Reverse Geocoding helper using OpenStreetMap
  async function fetchAddressFromCoords(lat: number, lng: number) {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      if (!res.ok) throw new Error("Reverse geocoding error");
      const data = await res.json();
      if (data && data.display_name) {
        return data.display_name;
      }
    } catch (e) {
      console.warn("Reverse geocode failed:", e);
    }
    return `Lat ${lat.toFixed(5)}, Lng ${lng.toFixed(5)}`;
  }

  // GPS Auto Detection
  function deteksiLokasiGPS() {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setLocatingError("Browser tidak mendukung deteksi lokasi.");
      return;
    }

    setIsLocating(true);
    setLocatingError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setPos({ lat, lng });

        const address = await fetchAddressFromCoords(lat, lng);
        setAlamat(address);
        setIsLocating(false);
      },
      (error) => {
        console.warn("Geolocation error:", error);
        setIsLocating(false);
        setPos({ lat: -7.7956, lng: 110.3695 });
        setAlamat("Jl. Malioboro, Kota Yogyakarta (Default)");
        setLocatingError("Lokasi tidak dapat dideteksi. Silakan pilih titik langsung di peta.");
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  }

  function removePhoto(index: number) {
    setFotoPreviews((prev) => prev.filter((_, i) => i !== index));
    setFotoFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function submit() {
    const nomor = buatNomorTiket();
    setTiket(nomor);
    setPhase("running");
    setRunIdx(0);

    const kData = KATEGORI.find((x) => x.id === kategori)!;

    let storageUrls: string[] = [];
    if (fotoFiles.length > 0) {
      setIsUploadingFoto(true);
      try {
        const fd = new FormData();
        fd.append("laporanId", nomor);
        fotoFiles.forEach((f) => fd.append("files", f));

        const uploadRes = await fetch("/api/upload-foto", { method: "POST", body: fd });
        const uploadData = await uploadRes.json();

        if (uploadData.success && uploadData.urls?.length > 0) {
          storageUrls = uploadData.urls;
          setFotoStorageUrls(storageUrls);
        }
      } catch (uploadErr) {
        console.warn("Upload foto error:", uploadErr);
      } finally {
        setIsUploadingFoto(false);
      }
    }

    const aiPromise = fetch("/api/analyze-priority", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: kData.nama,
        description: deskripsi,
        judul: judul,
        alamat: alamat,
        imageBase64: fotoPreviews[0] || undefined,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        return data.data as AIAnalysisResult;
      })
      .catch((err) => {
        console.warn("Fetch error, fallback:", err);
        return {
          modelUsed: "Sistem SIGAP",
          priorityScore: 7.5,
          severity: 7.5,
          confidence: 0.85,
          dampak: "Kondisi memerlukan penanganan di lapangan.",
          reasoning: "Tingkat penanganan dihitung berdasarkan kategori dan detail laporan.",
          sla: "24 jam",
          isDarurat: false,
        };
      });

    let i = 0;
    const t = setInterval(async () => {
      i++;
      setRunIdx(i);
      if (i >= AGENT_STEPS.length) {
        clearInterval(t);
        const resultAI = await aiPromise;
        setAiResult(resultAI);
        setTimeout(() => {
          selesaiAnalisis(nomor, resultAI, storageUrls);
          setPhase("done");
        }, 400);
      }
    }, 900);
  }

  function selesaiAnalisis(nomor: string, aiRes: AIAnalysisResult, storageUrls: string[]) {
    const k = KATEGORI.find((x) => x.id === kategori)!;
    const finalFotoUrls = storageUrls.length > 0 ? storageUrls : [];

    tambahLaporan({
      id: nomor,
      judul,
      kategori,
      lokasi: { lat: pos?.lat ?? -7.7956, lng: pos?.lng ?? 110.3695, alamat },
      pelapor: pelaporNama,
      waktu: new Date().toISOString(),
      status: "reported",
      foto: Math.max(fotoFiles.length, 1),
      fotoUrls: finalFotoUrls,
      dukungan: 0,
      ai: {
        kategori: k.nama,
        confidence: aiRes.confidence,
        severity: aiRes.severity,
        dampak: aiRes.dampak,
        priorityScore: aiRes.priorityScore,
        modelUsed: aiRes.modelUsed,
      },
      sla: aiRes.sla,
      wilayah: deteksiWilayah(alamat),
    });

    const dapatPoin = bisa(user?.role, "gamifikasi") && !anonim;
    if (dapatPoin) tambahPoin(25);
    tambahNotif({
      judul: "Laporan Terkirim",
      pesan: `${nomor} — ${judul}.${dapatPoin ? " +25 poin" : ""}`,
      waktu: "Baru saja",
      tone: "success",
    });
  }

  const input =
    "w-full rounded-xl border border-ink-300 bg-surface px-4 py-3 text-sm text-cream outline-none transition-colors placeholder:text-ink-500 focus:border-brand-600 focus:ring-2 focus:ring-brand-100";

  const kat = KATEGORI.find((x) => x.id === kategori)!;

  return (
    <main className="mx-auto max-w-[860px] px-3.5 sm:px-6 py-6 sm:py-12">
      {/* Tombol Kembali ke Beranda / Dashboard seperti di Login */}
      <div className="mb-2 sm:mb-4">
        <Link
          href={user ? berandaPeran(user.role) : "/"}
          className="group relative -ml-1 inline-flex min-h-[44px] w-fit items-center gap-2 self-start px-1 no-underline"
        >
          <ArrowLeft size={15} className="text-sage transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
          <span className="micro-label text-sage transition-colors group-hover:text-cream-hi">
            Kembali ke Beranda
          </span>
        </Link>
      </div>

      <div className="mb-6 sm:mb-8 text-center">
        <Chip tone="brand" className="mb-4"><FileText size={13} /> Buat Laporan</Chip>
        <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold">Laporkan Masalah Lingkungan</h1>
        <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-ink-500">Ambil foto, tentukan lokasi, dan jelaskan kondisi kerusakan di lapangan.</p>
      </div>

      {phase === "form" && (
        <div className="rounded-2xl bg-surface p-4 sm:p-6 md:p-8 shadow-[var(--shadow-card)]">
          {/* Stepper */}
          <ol className="mb-8 flex items-center gap-2">
            {[1, 2, 3].map((n) => (
              <li key={n} className="flex flex-1 items-center gap-2">
                <span
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-full font-display text-sm font-bold ${
                    step >= n ? "bg-brand-600 text-white" : "border border-ink-300 text-ink-500"
                  }`}
                >
                  {n}
                </span>
                <span className={`hidden text-sm font-semibold sm:block ${step >= n ? "text-ink-900" : "text-ink-500"}`}>
                  {n === 1 ? "Kategori & Foto" : n === 2 ? "Lokasi & Detail" : "Tinjau"}
                </span>
                {n < 3 && <span className={`h-0.5 flex-1 rounded ${step > n ? "bg-brand-600" : "bg-ink-300"}`} />}
              </li>
            ))}
          </ol>

          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-semibold">Kategori Masalah</label>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {KATEGORI.map((k) => (
                    <button
                      key={k.id}
                      type="button"
                      onClick={() => setKategori(k.id)}
                      className={`flex items-center gap-2.5 rounded-xl border p-3.5 text-left text-sm font-semibold transition-all ${
                        kategori === k.id
                          ? "border-brand-600 bg-brand-50 text-brand-700 ring-2 ring-brand-100"
                          : "border-ink-300 text-ink-700 hover:border-brand-600 hover:text-cream"
                      }`}
                    >
                      <span
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-white"
                        style={{ background: k.warna }}
                      >
                        <Icon name={k.ikon} size={18} />
                      </span>
                      {k.nama}
                    </button>
                  ))}
                </div>
              </div>

              {/* Camera Capture */}
              <div>
                <label className="mb-2 flex items-center justify-between text-sm font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Camera size={16} className="text-brand-600" /> Foto Kejadian
                  </span>
                  <span className="text-xs text-ink-500">{fotoPreviews.length} / 5 foto</span>
                </label>

                {/* Main Camera Live Trigger Button */}
                {fotoPreviews.length < 5 && (
                  <div className="mb-4">
                    <button
                      type="button"
                      onClick={() => setIsCameraOpen(true)}
                      className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl border-2 border-brand-500/50 bg-gradient-to-r from-brand-600/15 via-brand-600/10 to-brand-500/15 p-5 text-center transition-all hover:border-brand-500 hover:bg-brand-600/25 hover:shadow-lg hover:shadow-brand-500/10 active:scale-[0.99]"
                    >
                      <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white shadow-md group-hover:scale-105 transition-transform">
                        <Camera size={24} />
                      </div>
                      <div className="text-left">
                        <p className="font-display text-base font-bold text-cream group-hover:text-brand-400 transition-colors">
                          Ambil Foto
                        </p>
                        <p className="text-xs text-ink-400 mt-0.5">
                          Ambil foto langsung di lokasi kejadian.
                        </p>
                      </div>
                    </button>
                  </div>
                )}

                {/* Previews Grid */}
                {fotoPreviews.length > 0 && (
                  <div className="mb-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
                    {fotoPreviews.map((src, idx) => (
                      <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border border-ink-300 bg-black/5">
                        {/* eslint-disable-next-html-loader */}
                        <img src={src} alt={`Foto ${idx + 1}`} className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removePhoto(idx)}
                          className="absolute top-1 right-1 rounded-full bg-red-600 p-1 text-white opacity-90 transition-opacity hover:opacity-100"
                          title="Hapus foto"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {formError && step === 1 && (
                <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3.5 text-xs font-bold text-red-600 animate-fade-in flex items-center gap-2">
                  <span className="shrink-0 text-base">⚠️</span>
                  <span>{formError}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <Link
                  href={user ? berandaPeran(user.role) : "/"}
                  className="inline-flex items-center gap-2 rounded-xl border border-ink-300 px-5 py-2.5 text-sm font-semibold text-ink-700 hover:border-brand-600 hover:text-cream no-underline transition-colors"
                >
                  <ArrowLeft size={16} /> Kembali
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    if (fotoPreviews.length === 0) {
                      setFormError("Ambil minimal 1 foto kejadian.");
                      return;
                    }
                    setFormError(null);
                    setStep(2);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-700"
                >
                  Lanjut <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-semibold">Judul Laporan <span className="text-red-500">*</span></label>
                <input
                  className={input}
                  placeholder="cth: Jalan berlubang di dekat simpang empat"
                  value={judul}
                  onChange={(e) => { setJudul(e.target.value); if (formError) setFormError(null); }}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold">Deskripsi <span className="text-red-500">*</span></label>
                <textarea
                  className={`${input} min-h-[120px] resize-y`}
                  placeholder="Jelaskan kondisi kerusakan dan dampaknya bagi warga sekitar..."
                  value={deskripsi}
                  onChange={(e) => { setDeskripsi(e.target.value); if (formError) setFormError(null); }}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                  <label className="flex items-center gap-1.5 text-sm font-semibold">
                    <MapPin size={15} className="text-brand-600" /> Lokasi Kejadian <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={deteksiLokasiGPS}
                    disabled={isLocating}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-brand-600/40 bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-700 transition-colors hover:bg-brand-100 disabled:opacity-50"
                  >
                    {isLocating ? (
                      <>
                        <Loader2 size={13} className="animate-spin text-brand-600" /> Mencari lokasi...
                      </>
                    ) : (
                      <>
                        <Crosshair size={13} className="text-brand-600" /> Gunakan Lokasi Saat Ini
                      </>
                    )}
                  </button>
                </div>

                {locatingError && (
                  <p className="mb-2 text-xs text-red-600 font-medium">{locatingError}</p>
                )}

                <MiniMap
                  value={pos}
                  onPick={async (p) => {
                    setPos(p);
                    const address = await fetchAddressFromCoords(p.lat, p.lng);
                    setAlamat(address);
                  }}
                />
                <input
                  className={`${input} mt-3`}
                  placeholder="Ketik alamat lengkap atau patokan lokasi..."
                  value={alamat}
                  onChange={(e) => { setAlamat(e.target.value); if (formError) setFormError(null); }}
                />
              </div>

              {formError && step === 2 && (
                <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3.5 text-xs font-bold text-red-600 animate-fade-in flex items-center gap-2">
                  <span className="shrink-0 text-base">⚠️</span>
                  <span>{formError}</span>
                </div>
              )}

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => { setFormError(null); setStep(1); }}
                  className="inline-flex items-center gap-2 rounded-xl border border-ink-300 px-5 py-3 font-semibold text-ink-700 hover:border-brand-600 hover:text-cream"
                >
                  <ArrowLeft size={18} /> Kembali
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!judul.trim() || judul.trim().length < 5) {
                      setFormError("Judul minimal 5 karakter.");
                      return;
                    }
                    if (!deskripsi.trim() || deskripsi.trim().length < 10) {
                      setFormError("Deskripsi minimal 10 karakter.");
                      return;
                    }
                    if (!alamat.trim()) {
                      setFormError("Tentukan lokasi kejadian.");
                      return;
                    }
                    setFormError(null);
                    setStep(3);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-700"
                >
                  Lanjut <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="rounded-xl bg-brand-50 p-5 border border-brand-600/20">
                <h3 className="mb-3 font-display font-bold text-brand-900">Ringkasan Laporan</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex gap-2"><dt className="w-28 shrink-0 text-ink-500">Kategori</dt><dd className="font-semibold">{kat.nama}</dd></div>
                  <div className="flex gap-2"><dt className="w-28 shrink-0 text-ink-500">Lokasi</dt><dd className="font-semibold">{alamat}</dd></div>
                  <div className="flex gap-2"><dt className="w-28 shrink-0 text-ink-500">Judul</dt><dd className="font-semibold">{judul}</dd></div>
                  <div className="flex gap-2"><dt className="w-28 shrink-0 text-ink-500">Deskripsi</dt><dd className="text-ink-700">{deskripsi}</dd></div>
                  <div className="flex gap-2">
                    <dt className="w-28 shrink-0 text-ink-500">Foto</dt>
                    <dd className="font-semibold flex items-center gap-2">
                      {fotoPreviews.length} foto
                      {fotoPreviews.length > 0 && (
                        <div className="flex gap-1">
                          {fotoPreviews.map((src, i) => (
                            /* eslint-disable-next-html-loader */
                            <img key={i} src={src} alt="thumb" className="h-6 w-6 rounded object-cover border border-ink-300" />
                          ))}
                        </div>
                      )}
                    </dd>
                  </div>
                  <div className="flex gap-2"><dt className="w-28 shrink-0 text-ink-500">Pelapor</dt><dd className="font-semibold">{pelaporNama}</dd></div>
                </dl>
              </div>

              {/* Toggle Anonim */}
              <button
                type="button"
                onClick={() => setAnonim(!anonim)}
                className={`flex w-full items-center justify-between rounded-xl border p-4 transition-all ${
                  anonim ? "border-brand-600 bg-brand-50 ring-2 ring-brand-100" : "border-ink-300 hover:border-brand-600/60"
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className={`grid h-10 w-10 place-items-center rounded-lg ${anonim ? "bg-brand-600 text-white" : "bg-ground text-ink-700"}`}>
                    {anonim ? <EyeOff size={18} /> : <UserRound size={18} />}
                  </span>
                  <span className="text-left">
                    <span className="block text-sm font-bold text-cream">Kirim sebagai anonim</span>
                    <span className="block text-xs text-ink-500">Nama Anda tidak akan ditampilkan ke publik.</span>
                  </span>
                </span>
                <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${anonim ? "bg-brand-600" : "bg-ink-300"}`}>
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${anonim ? "left-[22px]" : "left-0.5"}`} />
                </span>
              </button>

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-2 rounded-xl border border-ink-300 px-5 py-3 font-semibold text-ink-700 hover:border-brand-600 hover:text-cream"
                >
                  <ArrowLeft size={18} /> Kembali
                </button>
                <button
                  type="button"
                  onClick={submit}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-700 shadow-md"
                >
                  <Sparkles size={18} /> Kirim Laporan
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PROCESSING PHASE */}
      {phase === "running" && (
        <div className="rounded-2xl bg-surface p-6 shadow-[var(--shadow-card)] md:p-8">
          <h2 className="mb-1 text-center font-display text-2xl font-extrabold">Memproses Laporan…</h2>
          <p className="mb-8 text-center text-sm text-ink-500">Laporan dan foto sedang diverifikasi dan diteruskan ke dinas terkait.</p>
          <div className="mx-auto max-w-[520px] space-y-3">
            {/* Upload foto indicator */}
            {fotoFiles.length > 0 && (
              <div className={`flex items-center gap-4 rounded-xl border p-4 transition-all ${
                isUploadingFoto
                  ? "border-purple-400 bg-purple-50"
                  : fotoStorageUrls.length > 0
                  ? "border-success bg-success-bg/50"
                  : "border-ink-300/60 opacity-60"
              }`}>
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${
                  fotoStorageUrls.length > 0 ? "bg-success text-white" : "bg-purple-600 text-white"
                }`}>
                  {fotoStorageUrls.length > 0 ? <CheckCircle2 size={20} /> : <Upload size={20} className={isUploadingFoto ? "animate-bounce" : ""} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-cream">Menyimpan Foto</p>
                  <p className="text-xs text-ink-500">
                    {isUploadingFoto
                      ? `Mengunggah ${fotoFiles.length} foto…`
                      : fotoStorageUrls.length > 0
                      ? `${fotoStorageUrls.length} foto berhasil disimpan ✓`
                      : "Menunggu…"}
                  </p>
                </div>
              </div>
            )}
            {AGENT_STEPS.map((a, i) => {
              const Ic = a.icon;
              const state = i < runIdx ? "done" : i === runIdx ? "run" : "wait";
              return (
                <div
                  key={a.nama}
                  className={`flex items-center gap-4 rounded-xl border p-4 transition-all ${
                    state === "done"
                      ? "border-success bg-success-bg/50"
                      : state === "run"
                      ? "border-brand-600 bg-brand-50"
                      : "border-ink-300/60 opacity-50"
                  }`}
                >
                  <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${state === "done" ? "bg-success text-white" : "bg-brand-600 text-white"}`}>
                    {state === "done" ? <CheckCircle2 size={20} /> : <Ic size={20} className={state === "run" ? "animate-pulse" : ""} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-cream">{a.nama}</p>
                    <p className="text-xs text-ink-500">{state === "done" ? "Selesai ✓" : a.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DONE PHASE */}
      {phase === "done" && aiResult && (
        <div className="rounded-2xl bg-surface p-6 shadow-[var(--shadow-card)] md:p-8">
          <div className="mb-6 text-center">
            <span className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-success-bg text-success"><CheckCircle2 size={34} /></span>
            <h2 className="font-display text-2xl font-extrabold">Laporan Berhasil Dikirim</h2>
            <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-ink-500">
              <Ticket size={15} /> Nomor tiket: <span className="font-mono font-bold text-ink-900">{tiket}</span>
            </p>
          </div>

          {/* AI SUMMARY NOTE */}
          <div className="mb-6 rounded-xl border border-brand-600/30 bg-brand-50/60 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-brand-700 mb-1">
              Catatan Penanganan
            </p>
            <p className="text-sm text-ink-700 leading-relaxed font-medium">
              &quot;{aiResult.reasoning}&quot;
            </p>
          </div>

          {/* ROUTING TO DINAS BANNER */}
          {(() => {
            const wTarget = getWilayah(deteksiWilayah(alamat));
            return (
              <div className="mb-6 flex items-center gap-4 rounded-2xl border border-brand-600/30 bg-brand-50/50 p-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-600 text-white">
                  <Building2 size={22} />
                </span>
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-xs font-bold uppercase tracking-wide text-brand-700">Diteruskan ke Dinas</p>
                  <p className="font-display text-base font-extrabold text-cream">{wTarget.nama}</p>
                  <p className="text-xs text-ink-500 font-mono mt-0.5">{wTarget.dinasEmail}</p>
                </div>
                <span className="rounded-full bg-success-bg px-3 py-1 text-xs font-bold text-success shrink-0">
                  Terkirim ✓
                </span>
              </div>
            );
          })()}

          {/* SCORES GRID */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-ink-300/60 p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-ink-500">Kategori</p>
              <p className="mt-1 flex items-center gap-2 font-display text-lg font-bold">
                <span className="grid h-8 w-8 place-items-center rounded-lg text-white" style={{ background: kat.warna }}>
                  <Icon name={kat.ikon} size={16} />
                </span>
                {kat.nama}
              </p>
            </div>

            <div className="rounded-xl border border-ink-300/60 p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-ink-500">Tingkat Kerusakan</p>
              <p className="mt-1 font-display text-lg font-bold">{aiResult.severity} / 10</p>
              <p className="mt-1 text-xs text-ink-500">{aiResult.dampak}</p>
            </div>

            <div className="rounded-xl border border-ink-300/60 p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-ink-500">Prioritas Penanganan</p>
              <p className="mt-1 font-display text-lg font-bold" style={{ color: priorityColor(aiResult.priorityScore) }}>
                {aiResult.priorityScore} / 10 <span className="text-sm font-semibold text-ink-500">· {priorityLabel(aiResult.priorityScore)}</span>
              </p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#EEF1F0]">
                <div className="h-full rounded-full" style={{ width: `${aiResult.priorityScore * 10}%`, background: priorityColor(aiResult.priorityScore) }} />
              </div>
              {aiResult.isDarurat && (
                <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-600">
                  <AlertTriangle size={13} /> Prioritas Darurat — Segera ditindaklanjuti
                </p>
              )}
            </div>

            <div className="rounded-xl border border-ink-300/60 p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-ink-500">Estimasi Waktu Penanganan</p>
              <p className="mt-1 font-display text-lg font-bold">{aiResult.sla}</p>
              <p className="mt-1 text-xs text-ink-500">Target penyelesaian oleh petugas</p>
            </div>
          </div>

          {/* Foto terlampir */}
          {fotoStorageUrls.length > 0 && (
            <div className="mt-4 rounded-xl border border-ink-300/60 p-4">
              <p className="mb-3 text-xs font-bold uppercase tracking-wide text-ink-500">Foto Terlampir ({fotoStorageUrls.length})</p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {fotoStorageUrls.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" title="Buka foto">
                    {/* eslint-disable-next-html-loader */}
                    <img src={url} alt={`Foto laporan ${i + 1}`} className="aspect-square w-full rounded-lg object-cover border border-ink-300 hover:opacity-80 transition-opacity" />
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a href="/warga" className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white no-underline hover:bg-brand-700 shadow-md">
              Lihat Laporan Saya <ArrowRight size={18} />
            </a>
            <button
              type="button"
              onClick={() => {
                setPhase("form");
                setStep(1);
                setJudul("");
                setDeskripsi("");
                setFotoPreviews([]);
                setFotoFiles([]);
                setFotoStorageUrls([]);
                setAlamat("");
                setPos(null);
                setAiResult(null);
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-ink-300 px-6 py-3 font-semibold text-ink-700 hover:border-brand-600 hover:text-cream"
            >
              Buat Laporan Baru
            </button>
          </div>
        </div>
      )}

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
        title="Ambil Foto"
      />
    </main>
  );
}
