"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Camera, RefreshCw, X, Check, AlertTriangle, SwitchCamera, Sparkles } from "lucide-react";

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File, previewUrl: string) => void;
  title?: string;
}

export function CameraCaptureModal({
  isOpen,
  onClose,
  onCapture,
  title = "Ambil Foto",
}: CameraCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileFallbackRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
        track.enabled = false;
      });
      streamRef.current = null;
    }
    setStream(null);
  }, []);

  const startCamera = useCallback(async () => {
    stopStream();
    setErrorMsg(null);

    await new Promise((res) => setTimeout(res, 150));

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMsg("Kamera tidak didukung pada browser ini.");
      return;
    }

    let mediaStream: MediaStream | null = null;

    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
    } catch {
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch {
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        } catch (err3: unknown) {
          const errName = (err3 as { name?: string })?.name || "";
          let msg = "Tidak dapat mengakses kamera.";
          if (errName === "NotReadableError") {
            msg = "Kamera sedang digunakan aplikasi lain. Tutup aplikasi tersebut atau gunakan kamera HP.";
          } else if (
            errName === "NotAllowedError" ||
            errName === "PermissionDeniedError"
          ) {
            msg = "Izin kamera belum diberikan. Aktifkan izin kamera di browser Anda.";
          } else if (errName === "NotFoundError" || errName === "DevicesNotFoundError") {
            msg = "Kamera tidak ditemukan pada perangkat ini.";
          }
          setErrorMsg(msg);
          return;
        }
      }
    }

    if (mediaStream) {
      streamRef.current = mediaStream;
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(() => {});
      }
    }
  }, [facingMode, stopStream]);

  useEffect(() => {
    if (isOpen && !capturedPreview) {
      startCamera();
    } else {
      stopStream();
    }

    return () => {
      stopStream();
    };
  }, [isOpen, facingMode, capturedPreview, startCamera, stopStream]);

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  const takeSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsCapturing(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    const width = video.videoWidth || 1920;
    const height = video.videoHeight || 1080;
    canvas.width = width;
    canvas.height = height;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    ctx.save();
    if (facingMode === "user") {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, width, height);
    ctx.restore();

    const now = new Date();
    const timeStr =
      now.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }) +
      " " +
      now.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }) +
      " WIB";

    const barHeight = Math.max(50, Math.floor(height * 0.08));
    ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
    ctx.fillRect(0, height - barHeight, width, barHeight);

    ctx.fillStyle = "#0EA5E9";
    ctx.fillRect(0, height - barHeight, width, 3);

    const fontSize = Math.max(16, Math.floor(height * 0.035));
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.fillStyle = "#38BDF8";
    ctx.fillText("SIGAP", 20, height - barHeight / 2 + fontSize / 3);

    ctx.fillStyle = "#FFFFFF";
    const textWidth = ctx.measureText("SIGAP").width;
    ctx.fillText(` |  ${timeStr}`, 24 + textWidth, height - barHeight / 2 + fontSize / 3);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
    setCapturedPreview(dataUrl);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `sigap_foto_${Date.now()}.jpg`, {
            type: "image/jpeg",
          });
          setCapturedFile(file);
        }
        setIsCapturing(false);
      },
      "image/jpeg",
      0.95
    );

    stopStream();
  };

  const handleRetake = () => {
    setCapturedPreview(null);
    setCapturedFile(null);
    startCamera();
  };

  const handleConfirm = () => {
    if (capturedPreview && capturedFile) {
      onCapture(capturedFile, capturedPreview);
      onClose();
      setCapturedPreview(null);
      setCapturedFile(null);
    }
  };

  const handleNativeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          const previewUrl = ev.target.result as string;
          onCapture(file, previewUrl);
          onClose();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-sky-500/40 bg-surface shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ink-300/20 bg-surface px-5 py-4">
          <div className="flex items-center gap-2 font-display text-base font-bold text-cream">
            <Camera className="text-sky-400" size={20} />
            {title}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-300/10 hover:text-cream transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Camera Display View */}
        <div className="relative aspect-[16/9] w-full bg-black">
          {capturedPreview ? (
            /* Snapshot Preview Mode */
            <div className="relative h-full w-full">
              {/* eslint-disable-next-html-loader */}
              <img
                src={capturedPreview}
                alt="Foto Laporan"
                className="h-full w-full object-cover"
              />
              <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-sky-600/90 px-3 py-1 text-xs font-bold text-white shadow-md backdrop-blur-md">
                <Sparkles size={14} /> Foto Siap Digunakan
              </div>
            </div>
          ) : errorMsg ? (
            /* Error / Permission Fallback View */
            <div className="flex h-full flex-col items-center justify-center p-6 text-center">
              <AlertTriangle className="mb-3 text-amber-500" size={42} />
              <p className="text-sm font-semibold text-cream mb-1">Kamera Tidak Bisa Dibuka</p>
              <p className="text-xs text-ink-500 mb-6 max-w-xs">{errorMsg}</p>
              <div className="flex flex-col gap-2.5 w-full max-w-xs">
                <button
                  type="button"
                  onClick={startCamera}
                  className="flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-brand-500"
                >
                  <RefreshCw size={15} /> Coba Lagi
                </button>
                <button
                  type="button"
                  onClick={() => fileFallbackRef.current?.click()}
                  className="flex items-center justify-center gap-2 rounded-xl border border-sky-500/50 bg-sky-600/20 px-4 py-2.5 text-xs font-bold text-cream hover:bg-sky-600/40"
                >
                  <Camera size={15} /> Buka Kamera HP
                </button>
              </div>
            </div>
          ) : (
            /* Live Stream Video Feed */
            <div className="relative h-full w-full overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`h-full w-full object-cover ${
                  facingMode === "user" ? "-scale-x-100" : ""
                }`}
              />

              {/* Live Overlay Badge */}
              <div className="absolute top-3 left-3 flex items-center gap-2 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md border border-white/10">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span>Kamera Aktif</span>
              </div>

              {/* Camera Switcher Button */}
              <button
                type="button"
                onClick={toggleFacingMode}
                className="absolute top-3 right-3 grid h-10 w-10 place-items-center rounded-full bg-black/60 text-white backdrop-blur-md hover:bg-black/80 transition-transform active:scale-95"
                title="Ganti Kamera"
              >
                <SwitchCamera size={18} />
              </button>
            </div>
          )}

          {/* Hidden Canvas for Frame Capture */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Direct Native Camera Input Fallback */}
          <input
            ref={fileFallbackRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleNativeFileChange}
            className="hidden"
          />
        </div>

        {/* Action Controls Footer */}
        <div className="bg-surface px-5 py-4 border-t border-ink-300/20">
          {capturedPreview ? (
            <div className="flex flex-col sm:flex-row w-full items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleRetake}
                className="flex w-full sm:flex-1 items-center justify-center gap-2 rounded-xl border border-ink-300/40 bg-surface px-4 py-3 text-xs font-bold text-cream hover:bg-ink-300/10 transition-colors"
              >
                <RefreshCw size={16} /> Foto Ulang
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex w-full sm:flex-1 items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-3 text-xs font-bold text-white hover:bg-sky-500 transition-colors shadow-lg shadow-sky-600/20"
              >
                <Check size={16} /> Gunakan Foto
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row w-full items-center justify-between gap-3">
              <button
                type="button"
                onClick={takeSnapshot}
                disabled={!stream || isCapturing}
                className="order-1 sm:order-2 flex w-full sm:w-auto items-center justify-center gap-2.5 rounded-full bg-sky-600 px-7 py-3 text-sm font-bold text-white hover:bg-sky-500 active:scale-95 transition-all shadow-lg shadow-sky-600/30 disabled:opacity-50"
              >
                <div className="h-4 w-4 shrink-0 rounded-full border-2 border-white bg-red-500" />
                <span className="whitespace-nowrap">{isCapturing ? "Mengambil foto..." : "Ambil Foto"}</span>
              </button>

              <div className="order-2 sm:order-1 flex w-full sm:w-auto items-center justify-between sm:justify-start gap-4">
                <button
                  type="button"
                  onClick={() => fileFallbackRef.current?.click()}
                  className="flex items-center gap-1.5 rounded-xl px-2 py-1.5 text-xs font-semibold text-ink-400 hover:text-cream transition-colors"
                  title="Buka Kamera HP"
                >
                  <Camera size={14} /> Kamera HP
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="sm:hidden rounded-xl px-2 py-1.5 text-xs font-semibold text-ink-500 hover:text-cream transition-colors"
                >
                  Batal
                </button>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="order-3 hidden sm:block rounded-xl px-3 py-2 text-xs font-semibold text-ink-500 hover:text-cream transition-colors"
              >
                Batal
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
