import {
  Road, Trash2, Droplets, Lightbulb, Shield, Trees,
  LayoutGrid, FileText, Map as MapIcon, BarChart3,
  MapPin, AlertTriangle, TrendingUp, Clock, CheckCircle2,
  Camera, ThumbsUp, ArrowRight, Menu, X, LogOut, Sparkles,
  type LucideIcon,
} from "lucide-react";

// Mapper string -> komponen ikon (dipakai data kategori & sidebar)
const MAP: Record<string, LucideIcon> = {
  road: Road, trash: Trash2, water: Droplets, bulb: Lightbulb,
  shield: Shield, park: Trees,
  overview: LayoutGrid, laporan: FileText, peta: MapIcon, analitik: BarChart3,
  pin: MapPin, alert: AlertTriangle, tren: TrendingUp, clock: Clock,
  check: CheckCircle2, camera: Camera, dukung: ThumbsUp, arrow: ArrowRight,
  sparkles: Sparkles,
};

export function Icon({
  name, size = 18, className, strokeWidth = 1.8,
}: {
  name: keyof typeof MAP | string;
  size?: number;
  className?: string;
  strokeWidth?: number;
}) {
  const Cmp = MAP[name as string] ?? MapPin;
  return <Cmp size={size} className={className} strokeWidth={strokeWidth} aria-hidden="true" />;
}

export {
  Road, Trash2, Droplets, Lightbulb, Shield, Trees,
  LayoutGrid, FileText, MapIcon, BarChart3, MapPin, Menu, X, LogOut,
};
