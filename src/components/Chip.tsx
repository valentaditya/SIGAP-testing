import type { ReactNode } from "react";

type Tone = "neutral" | "info" | "warning" | "success" | "danger" | "brand";

const TONE: Record<Tone, string> = {
  neutral: "bg-info-bg text-ink-700",
  info: "bg-info-bg text-info",
  warning: "bg-warning-bg text-warning",
  success: "bg-success-bg text-success",
  danger: "bg-danger-bg text-danger",
  brand: "bg-brand-100 text-brand-500",
};

export function Chip({
  children, tone = "neutral", dot = true, className = "",
}: {
  children: ReactNode; tone?: Tone; dot?: boolean; className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap ${TONE[tone]} ${className}`}
    >
      {dot && <span className="h-[7px] w-[7px] rounded-full bg-current" />}
      {children}
    </span>
  );
}
