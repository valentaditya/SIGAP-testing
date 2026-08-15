import type { Metadata } from "next";
import { Anton, Archivo, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/lib/store";
import { Navbar } from "@/components/Navbar";
import { EmergencyButton } from "@/components/EmergencyButton";

const display = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
});
const body = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-grotesk",
});

export const metadata: Metadata = {
  title: {
    default: "SIGAP — Smart Community Platform",
    template: "%s — SIGAP",
  },
  description:
    "Sistem Informasi & Gerak Aktif Pelaporan — platform pelaporan warga dengan AI Multi-Agent untuk kota yang lebih responsif.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <head>
        {/* Terapkan tema tersimpan sebelum paint agar tidak flash */}
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem("sigap_theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}` }} />
      </head>
      <body>
        <AppProvider>
          <Navbar />
          {children}
          <EmergencyButton />
        </AppProvider>
      </body>
    </html>
  );
}
