import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimasi produksi
  reactStrictMode: true,
  // Gambar eksternal (jika nanti pakai remote). Untuk sekarang lokal saja.
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
