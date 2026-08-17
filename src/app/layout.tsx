import type { Metadata, Viewport } from "next";
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

// Warna bilah browser mengikuti tema; interactiveWidget menjaga layout
// tetap benar saat keyboard virtual muncul di Android.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f3ec" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0908" },
  ],
  colorScheme: "light dark",
  interactiveWidget: "resizes-content",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning wajib di sini: skrip di bawah sengaja
    // mengubah className <html> sebelum React hidrasi, sehingga markup
    // server dan klien memang berbeda. Tanpa ini React membanjiri konsol
    // dengan peringatan mismatch pada setiap muat halaman.
    <html
      lang="id"
      className={`${display.variable} ${body.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Terapkan tema tersimpan sebelum paint agar tidak berkedip putih */}
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem("sigap_theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}` }} />
      </head>
      <body>
        <AppProvider>
          {/* Lompat langsung ke konten — wajib bagi pengguna keyboard
              agar tidak menyusuri seluruh navigasi tiap pindah halaman. */}
          <a href="#konten" className="sr-only sr-only-focusable">
            Lewati ke konten
          </a>
          <Navbar />
          <div id="konten">{children}</div>
          <EmergencyButton />
        </AppProvider>
      </body>
    </html>
  );
}
