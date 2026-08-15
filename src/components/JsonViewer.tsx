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
    <div className="overflow-hidden border-2 border-cream bg-bg">
      {/* Header bar */}
      <div className="flex items-center gap-3 border-b-2 border-cream px-4 py-2.5">
        <span className="flex gap-1.5" aria-hidden>
          <i className="h-3 w-3 rounded-full border border-cream bg-tan" />
          <i className="h-3 w-3 rounded-full border border-cream" />
          <i className="h-3 w-3 rounded-full border border-cream" />
        </span>
        <span className="micro-label text-sage">output.json</span>
        <span className="micro-label ml-auto hidden text-sage md:block">AI Multi-Agent · 0.8s</span>
        <button
          type="button"
          onClick={copy}
          className="micro-label inline-flex items-center gap-1.5 border border-cream px-2 py-1 text-cream transition-colors hover:bg-cream hover:text-bg"
          aria-label="Salin JSON"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? "tersalin" : "salin"}
        </button>
      </div>
      {/* Body JSON */}
      <pre className="overflow-x-auto p-5 font-mono text-[.8rem] leading-[1.7]">{renderJson(JSON_TEXT)}</pre>
      {/* Status footer */}
      <div className="flex items-center justify-between border-t-2 border-cream px-4 py-2">
        <span className="micro-label text-sage">SGP-2026-0108 · skor_urgensi 9.2 ≥ 9</span>
        <span className="micro-label flex items-center gap-1.5 text-tan">
          <i className="h-1.5 w-1.5 rounded-full bg-tan" /> darurat
        </span>
      </div>
    </div>
  );
}
