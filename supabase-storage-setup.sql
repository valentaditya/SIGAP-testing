-- ============================================================
-- SIGAP: Setup Supabase Storage + Migrasi Tabel Laporan
-- Jalankan di Supabase Dashboard > SQL Editor
-- ============================================================

-- ============================================================
-- BAGIAN 1: Tambahkan kolom yang belum ada di tabel laporan
-- ============================================================

-- Tambah kolom foto_urls (array URL foto dari Supabase Storage)
ALTER TABLE laporan
  ADD COLUMN IF NOT EXISTS foto_urls text[] DEFAULT '{}';

-- Kolom ai_model_used sudah ada, pastikan type-nya text
ALTER TABLE laporan
  ADD COLUMN IF NOT EXISTS ai_model_used text DEFAULT 'v1.0-standard';


-- ============================================================
-- BAGIAN 2: Buat Storage Bucket "laporan-foto"
-- ============================================================

-- Buat bucket public untuk foto laporan (max 5 MB per file)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'laporan-foto',
  'laporan-foto',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/heic']
)
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- BAGIAN 3: Storage Policies (RLS)
-- ============================================================

-- Policy: Siapapun bisa UPLOAD foto (authenticated & anonymous)
CREATE POLICY IF NOT EXISTS "laporan_foto_upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'laporan-foto');

-- Policy: Siapapun bisa BACA/DOWNLOAD foto (public)
CREATE POLICY IF NOT EXISTS "laporan_foto_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'laporan-foto');

-- Policy: Hanya pemilik yang bisa HAPUS foto
CREATE POLICY IF NOT EXISTS "laporan_foto_delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'laporan-foto');


-- ============================================================
-- VERIFIKASI: Cek hasil setup
-- ============================================================

-- Cek kolom tabel laporan
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'laporan'
ORDER BY ordinal_position;

-- Cek bucket storage
SELECT id, name, public, file_size_limit
FROM storage.buckets
WHERE id = 'laporan-foto';


-- ============================================================
-- SETELAH MENJALANKAN SCRIPT INI:
-- 
-- 1. Isi SUPABASE_SERVICE_ROLE_KEY di .env.local:
--    Supabase Dashboard > Project Settings > API > service_role
--
-- 2. Restart dev server: npm run dev
-- ============================================================
