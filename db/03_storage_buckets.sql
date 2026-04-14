-- ==========================================
-- 03_storage_buckets.sql
-- VIEOS Supabase Storage Bucket Setup
-- ==========================================
-- Jalankan script ini di Supabase SQL Editor
-- (Dashboard → SQL Editor → New query → Paste → Run)
-- ==========================================

-- =============================================
-- BUCKET 1: payment-proofs
-- Untuk menyimpan bukti pembayaran dari checkout
-- =============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', true)
ON CONFLICT (id) DO NOTHING;

-- Siapa saja bisa UPLOAD bukti pembayaran (dari checkout page)
CREATE POLICY "Allow public upload payment proofs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'payment-proofs');

-- Siapa saja bisa MELIHAT file bukti pembayaran (untuk admin review)
CREATE POLICY "Allow public read payment proofs"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment-proofs');

-- Admin (via service_role) bisa HAPUS bukti pembayaran lama
CREATE POLICY "Allow service role delete payment proofs"
ON storage.objects FOR DELETE
USING (bucket_id = 'payment-proofs');

-- =============================================
-- BUCKET 2: member-photos
-- Untuk menyimpan foto-foto member (profil)
-- =============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('member-photos', 'member-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Siapa saja bisa MELIHAT foto member (ditampilkan di website publik)
CREATE POLICY "Allow public read member photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'member-photos');

-- Upload & Delete hanya dari backend (service_role key bypass RLS),
-- tapi kita tambahkan policy INSERT untuk keamanan tambahan
CREATE POLICY "Allow authenticated upload member photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'member-photos');

CREATE POLICY "Allow service role delete member photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'member-photos');
