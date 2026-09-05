-- ============================================================
-- SIGAP — Supabase Schema & Seed Script for Table 'laporan' (With Photo URLs Column)
-- ============================================================

-- 1. Buat Tabel 'laporan' dengan Kolom 'foto_urls' & Foreign Key ke 'users'
CREATE TABLE IF NOT EXISTS public.laporan (
    id TEXT PRIMARY KEY,                             -- Contoh: 'SGP-2026-0112'
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL, -- Relasi ke tabel users!
    pelapor TEXT NOT NULL,                           -- Nama pelapor
    judul TEXT NOT NULL,
    kategori TEXT NOT NULL,                          -- 'jalan', 'sampah', 'banjir', 'lampu', 'keamanan', 'fasum'
    status TEXT NOT NULL DEFAULT 'reported',         -- 'reported', 'verified', 'assigned', 'in_progress', 'resolved'
    waktu TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Koordinat & Lokasi
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    alamat TEXT NOT NULL,
    wilayah TEXT NOT NULL,                           -- 'sleman', 'bantul', 'kota_yogya', 'gunungkidul', 'kulonprogo'
    
    -- Foto Bukti & Engagement
    foto INTEGER DEFAULT 1,                          -- Jumlah foto
    foto_urls TEXT[] DEFAULT '{}',                   -- Array URL Foto / Base64 Image Strings!
    dukungan INTEGER DEFAULT 0,
    sla TEXT NOT NULL DEFAULT '48 jam',
    
    -- Hasil Analisis AI Agent
    ai_kategori TEXT,
    ai_confidence DOUBLE PRECISION DEFAULT 0.90,
    ai_severity DOUBLE PRECISION DEFAULT 7.0,
    ai_dampak TEXT,
    ai_priority_score DOUBLE PRECISION DEFAULT 7.0,
    ai_model_used TEXT DEFAULT 'Google Gemini 1.5 Flash',
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tambahkan kolom foto_urls jika tabel laporan sudah terlanjur dibuat sebelumnya
ALTER TABLE public.laporan ADD COLUMN IF NOT EXISTS foto_urls TEXT[] DEFAULT '{}';

-- 2. Index untuk Performa Query
CREATE INDEX IF NOT EXISTS idx_laporan_user_id ON public.laporan(user_id);
CREATE INDEX IF NOT EXISTS idx_laporan_kategori ON public.laporan(kategori);
CREATE INDEX IF NOT EXISTS idx_laporan_status ON public.laporan(status);
CREATE INDEX IF NOT EXISTS idx_laporan_wilayah ON public.laporan(wilayah);
CREATE INDEX IF NOT EXISTS idx_laporan_waktu ON public.laporan(waktu DESC);

-- 3. Kebijakan Keamanan (Row Level Security / RLS)
ALTER TABLE public.laporan ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public select on laporan" ON public.laporan;
CREATE POLICY "Allow public select on laporan" ON public.laporan FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert on laporan" ON public.laporan;
CREATE POLICY "Allow public insert on laporan" ON public.laporan FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update on laporan" ON public.laporan;
CREATE POLICY "Allow public update on laporan" ON public.laporan FOR UPDATE USING (true);

-- 4. Seed Data Laporan (Dihubungkan dengan ID User Asli & Memuat URL Foto Bukti)
INSERT INTO public.laporan (
  id, user_id, pelapor, judul, kategori, status, waktu, lat, lng, alamat, wilayah, foto, foto_urls, dukungan, sla, ai_kategori, ai_confidence, ai_severity, ai_dampak, ai_priority_score
) VALUES 
('SGP-2026-0112', '16faa447-4a4e-4a6d-94c8-b73dde7eb5fa', 'Budi Santoso', 'Lubang besar di Jl. Kaliurang KM 5,2', 'jalan', 'in_progress', '2026-01-12T06:45:00+07:00', -7.7603, 110.3778, 'Jl. Kaliurang KM 5,2, Sinduadi, Mlati', 'sleman', 3, ARRAY['https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600'], 47, '48 jam', 'Jalan & Infrastruktur', 0.96, 8.5, 'Tinggi — jalur padat kendaraan & dekat sekolah', 8.7),
('SGP-2026-0109', '4122dc36-ac53-409b-8aa6-5e543a988107', 'Siti Aminah', 'TPS liar meluap ke bahu jalan', 'sampah', 'verified', '2026-01-11T17:20:00+07:00', -7.8031, 110.3625, 'Jl. Bantul No. 88, Gedongkiwo, Mantrijeron', 'kota_yogya', 2, ARRAY['https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600'], 31, '72 jam', 'Sampah & Kebersihan', 0.93, 6.0, 'Sedang — bau & potensi penyakit, dekat pasar', 6.8),
('SGP-2026-0108', '9e94e8db-d3bc-4a31-adf4-7540ff322ec4', 'Agus Prasetyo', 'Drainase tersumbat, air menggenang 30 cm', 'banjir', 'assigned', '2026-01-11T15:05:00+07:00', -7.7831, 110.3889, 'Jl. C. Simanjuntak, Terban, Gondokusuman', 'kota_yogya', 4, ARRAY['https://images.unsplash.com/photo-1547683905-f686c993aae5?w=600'], 58, '24 jam', 'Banjir & Drainase', 0.97, 9.0, 'Tinggi — genangan masuk rumah warga saat hujan', 9.2),
('SGP-2026-0105', '4122dc36-ac53-409b-8aa6-5e543a988107', 'Siti Aminah', 'Lampu PJU mati beruntun 6 titik', 'lampu', 'resolved', '2026-01-10T20:12:00+07:00', -7.8275, 110.3967, 'Jl. Imogiri Timur, Giwangan, Umbulharjo', 'kota_yogya', 1, ARRAY['https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=600'], 22, '72 jam', 'Lampu Jalan', 0.91, 5.5, 'Sedang — rawan kecelakaan & tindak kriminal malam', 6.1),
('SGP-2026-0103', '16faa447-4a4e-4a6d-94c8-b73dde7eb5fa', 'Budi Santoso', 'Portal parkir liar meresahkan pengguna jalan', 'keamanan', 'resolved', '2026-01-10T11:40:00+07:00', -7.7926, 110.3658, 'Jl. Malioboro, Sosromenduran, Gedongtengen', 'kota_yogya', 2, ARRAY['https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600'], 39, '48 jam', 'Keamanan & Ketertiban', 0.88, 6.5, 'Sedang — mengganggu kenyamanan wisatawan', 7.0),
('SGP-2026-0101', '4122dc36-ac53-409b-8aa6-5e543a988107', 'Siti Aminah', 'Ayunan taman rusak & berkarat', 'fasum', 'resolved', '2026-01-09T09:30:00+07:00', -7.8165, 110.3856, 'Taman Pintar, Panembahan, Kraton', 'kota_yogya', 2, ARRAY['https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=600'], 18, '7 hari', 'Fasilitas Umum', 0.94, 4.0, 'Rendah — risiko cedera ringan anak', 4.5),
('SGP-2026-0098', '16faa447-4a4e-4a6d-94c8-b73dde7eb5fa', 'Budi Santoso', 'Pohon tumbang menutup separuh jalan', 'jalan', 'in_progress', '2026-01-08T16:55:00+07:00', -7.7708, 110.4022, 'Jl. Affandi, Caturtunggal, Depok', 'sleman', 5, ARRAY['https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600'], 64, '24 jam', 'Jalan & Infrastruktur', 0.98, 8.0, 'Tinggi — arus lalu lintas lumpuh satu arah', 8.4),
('SGP-2026-0095', '4122dc36-ac53-409b-8aa6-5e543a988107', 'Siti Aminah', 'Sampah menyumbat aliran Kali Code', 'banjir', 'verified', '2026-01-08T10:15:00+07:00', -7.7994, 110.3589, 'Bantaran Kali Code, Ngampilan', 'kota_yogya', 3, ARRAY['https://images.unsplash.com/photo-1621451537084-482c73073a0f?w=600'], 41, '48 jam', 'Banjir & Drainase', 0.90, 7.5, 'Tinggi — risiko luapan saat hujan deras', 7.6),
('SGP-2026-0092', '9e94e8db-d3bc-4a31-adf4-7540ff322ec4', 'Agus Prasetyo', 'Lampu taman padam total sepekan', 'lampu', 'assigned', '2026-01-07T19:40:00+07:00', -7.8219, 110.3731, 'Alun-Alun Kidul, Kraton', 'kota_yogya', 2, ARRAY['https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=600'], 28, '72 jam', 'Lampu Jalan', 0.89, 5.0, 'Sedang — area gelap rawan tindak kriminal', 5.8),
('SGP-2026-0089', '4122dc36-ac53-409b-8aa6-5e543a988107', 'Siti Aminah', 'Gang sempit jadi tempat pembuangan akhir liar', 'sampah', 'reported', '2026-01-07T08:20:00+07:00', -7.8356, 110.3812, 'Gang Kemenangan, Prawirodirjan, Gondomanan', 'kota_yogya', 2, ARRAY['https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600'], 15, '72 jam', 'Sampah & Kebersihan', 0.87, 5.5, 'Sedang — bau menyengat & sarang penyakit', 5.5),
('SGP-2026-0085', '9e94e8db-d3bc-4a31-adf4-7540ff322ec4', 'Agus Prasetyo', 'Begal beraksi di underpass, minim penerangan', 'keamanan', 'reported', '2026-01-06T22:05:00+07:00', -7.7489, 110.3891, 'Underpass Janti, Banguntapan', 'bantul', 1, ARRAY['https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600'], 52, '24 jam', 'Keamanan & Ketertiban', 0.85, 8.0, 'Tinggi — ancaman keselamatan pengendara malam', 9.3),
('SGP-2026-0082', '16faa447-4a4e-4a6d-94c8-b73dde7eb5fa', 'Budi Santoso', 'Halte bus rusak, atap bocor & kursi patah', 'fasum', 'resolved', '2026-01-05T14:30:00+07:00', -7.7825, 110.4145, 'Jl. Solo KM 9, Kalasan', 'sleman', 2, ARRAY['https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=600'], 12, '7 hari', 'Fasilitas Umum', 0.92, 3.5, 'Rendah — ketidaknyamanan penumpang', 3.8)
ON CONFLICT (id) DO NOTHING;
