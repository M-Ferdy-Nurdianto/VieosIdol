-- ==========================================
-- 05_update_members_schema.sql
-- VIEOS Database Update
-- Adds missing columns for Talent Management
-- (Gelar, Full Name, Tanggal Lahir, IG, Jiko)
-- ==========================================

ALTER TABLE public.members ADD COLUMN IF NOT EXISTS role VARCHAR(100);
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS fullname VARCHAR(255);
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS birth_date VARCHAR(100);
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS instagram VARCHAR(100);
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS jiko TEXT;
