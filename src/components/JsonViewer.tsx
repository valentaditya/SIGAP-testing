"use client";
import { useState } from "react";
import { Check, Copy } from "lucide-react";

/* Tampilan output AI yang proper: header mac-style + syntax highlighting
   + tombol salin. Pakai warna palette SIGAP (tan = merah aksen). */
const JSON_TEXT = `{
  "id_laporan": "SGP-2026-0108",
  "kategori": "Banjir & Drainase",
  "confidence": 0.97,
  "skor_urgensi": 9.2,
  "prioritas": "darurat",
  "sla": "24 jam",
  "ditugaskan": "Unit 3 — Babarsari"
}`;

/* Tokenizer sederhana: key / string / number+boolean / punctuation */
const TOKEN =
  /("(?:[^"\\]|\\.)*")(\s*:\s*)(-?(?:\d+(?:\.\d+)?)|true|false|null)|("(?:[^"\\]|\\.)*")|(-?(?:\d+(?:\.\d+)?)|true|false|null)|([{}[\],])/g;

function renderJson(src: string) {
  const out: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  const push = (s: string) =>
    out.push(
      <span key={out.length} className="text-sage">
        {s}
      </span>
    );
  while ((m = TOKEN.exec(src)) !== null) {
    if (m.index > last) push(src.slice(last, m.index));
    const [, key, colon, num, str, num2, punct] = m;
    if (key) {
      out.push(
        <span key={out.length} className="text-tan">
          {key}
        </span>
      );
      out.push(
        <span key={out.length} className="text-sage">
          {colon}
        </span>
      );
      out.push(
        <span key={out.length} className="text-cream">
          {num ?? str}
        </span>
      );
    } else if (str) {
      out.push(
        <span key={out.length} className="text-cream">
          {str}
        </span>
      );
    } else if (num2) {
      out.push(
        <span key={out.length} className="text-tan">
          {num2}
        </span>
      );
    } else {
      push(punct);
    }
    last = m.index + m[0].length;
  }
  if (last < src.length) push(src.slice(last));
  return out;
}

export function JsonViewer() {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(JSON_TEXT);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard tidak tersedia — abaikan */
    }
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-ink-300 bg-surface shadow-sm">
      {/* Header bar */}
      <div className="flex items-center gap-3 border-b border-ink-300 bg-ground/50 px-5 py-3">
        <span className="flex gap-2" aria-hidden>
          <i className="h-3 w-3 rounded-full bg-tan/80" />
          <i className="h-3 w-3 rounded-full bg-warning/80" />
          <i className="h-3 w-3 rounded-full bg-success/80" />
        </span>
        <span className="font-mono text-xs font-semibold text-sage">output.json</span>
        <span className="font-mono text-xs font-medium ml-auto hidden text-sage md:block">AI Multi-Agent · 0.8s</span>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded-full border border-ink-300 bg-surface px-3 py-1 font-mono text-xs font-semibold text-cream transition-colors hover:border-tan hover:text-tan shadow-xs"
          aria-label="Salin JSON"
        >
          {copied ? <Check size={12} className="text-success" /> : <Copy size={12} />}
          {copied ? "Tersalin" : "Salin"}
        </button>
      </div>
      {/* Body JSON */}
      <pre className="overflow-x-auto p-6 font-mono text-[0.84rem] leading-[1.8]">{renderJson(JSON_TEXT)}</pre>
      {/* Status footer */}
      <div className="flex items-center justify-between border-t border-ink-300 bg-ground/30 px-5 py-2.5">
        <span className="font-mono text-xs font-medium text-sage">SGP-2026-0108 · skor_urgensi 9.2</span>
        <span className="flex items-center gap-1.5 rounded-full bg-danger/10 px-3 py-0.5 font-mono text-xs font-bold uppercase text-danger">
          <i className="h-1.5 w-1.5 rounded-full bg-danger" /> Darurat
        </span>
      </div>
    </div>
  );
}
