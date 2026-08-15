# SIGAP — Smart Community Platform

> **Sistem Informasi & Gerak Aktif Pelaporan** — platform pelaporan warga dengan **AI Multi-Agent** untuk kota yang lebih responsif, transparan, dan partisipatif.

Dibangun untuk **INFINITERA 2.0 Web Development Competition** oleh **Tim Susah Senang Bareng** — Universitas Atma Jaya Yogyakarta.

## ✨ Fitur (12 sesuai proposal)

1. **Citizen Reporting** — lapor dengan kategori, deskripsi, foto, lokasi
2. **Geotagging & Interactive Map** — peta sebaran laporan (Leaflet)
3. **AI Multi-Agent Analysis** — klasifikasi, severity, dampak, prioritas
4. **Priority Score** — skor urgensi 0–100 + estimasi SLA
5. **Admin Dashboard** — KPI, chart, tabel sortable, peta
6. **Issue Tracking** — Reported → Verified → Assigned → In Progress → Resolved
7. **Real-Time Notification** — lonceng notifikasi status
8. **Community Engagement** — upvote, poin, level, lencana, leaderboard
9. **Community Safety & Early Warning** — peringatan area rawan
10. **Emergency Button** — sinyal darurat cepat (FAB)
11. **Anonymous Reporting** — lapor tanpa identitas
12. **City Impact Dashboard** — statistik dampak kota

## 🛠️ Tech Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** (design token SIGAP)
- **Lucide Icons** (ikon SVG, bukan emoji)
- **Chart.js** + **Leaflet** (visualisasi & peta)
- State global: React Context + `localStorage`

## 🚀 Menjalankan Lokal

```bash
npm install
npm run dev        # http://localhost:3000
```

Build produksi:

```bash
npm run build
npm start
```

## ☁️ Deploy ke Vercel

1. Push repo ini ke GitHub.
2. Di [Vercel](https://vercel.com) → **Add New Project** → import repo.
3. Framework terdeteksi otomatis **Next.js** (lihat `vercel.json`).
4. Klik **Deploy** — selesai.

Atau via CLI:

```bash
npm i -g vercel
vercel        # preview
vercel --prod # produksi
```

## 👥 Peran & Halaman

| Peran | Login → Redirect | Halaman |
|---|---|---|
| Warga | `/warga` | Dashboard poin, laporan saya, upvote |
| Admin | `/dashboard` | Verifikasi & kelola laporan |
| Petugas | `/petugas` | Daftar tugas & update penanganan |

Halaman publik: `/` (landing), `/lapor`, `/dampak`, `/login`.

## 👨‍💻 Tim

- Valent Aditya Hermanus — 241712920
- Christian Vieri Santosa — 241712892
- Made Kresna Praba Wistara — 241712921

Universitas Atma Jaya Yogyakarta · Sistem Informasi · 2026
