"use client";

import dynamic from "next/dynamic";

const HeroVisual = dynamic(() => import("@/components/HeroVisual").then((m) => m.HeroVisual), {
  ssr: false,
  loading: () => (
    <div className="grid aspect-[4/3] w-full place-items-center rounded-3xl bg-surface ring-1 ring-white/10">
      <span className="text-sm text-ink-500">Memuat peta…</span>
    </div>
  ),
});

export function HeroMap() {
  return <HeroVisual />;
}
