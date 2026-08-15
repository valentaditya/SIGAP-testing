"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { registerStage } from "@/lib/scroll-choreo";

/* Stage tersemat: wrapper setinggi `svh`, inner sticky 100svh overflow hidden.
   Progress 0..1 ditulis sebagai --p oleh SATU rAF scroll handler global. */
export function Stage({
  svh = 300, className = "", pinClassName = "", children,
}: {
  svh?: number;
  className?: string;
  pinClassName?: string;
  children: ReactNode;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const pin = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (wrap.current && pin.current) return registerStage(wrap.current, pin.current);
  }, []);
  return (
    <div ref={wrap} className={`relative ${className}`} style={{ height: `${svh}svh` }}>
      <div ref={pin} className={`sticky top-0 h-[100svh] overflow-hidden ${pinClassName}`}>
        {children}
      </div>
    </div>
  );
}
