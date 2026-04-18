-- ==========================================
-- 06_create_settings_table.sql
-- Create global configuration table for pricing
-- ==========================================

-- 1. Create Settings Table
CREATE TABLE IF NOT EXISTS public.settings (
    id BIGINT PRIMARY KEY,
    prices JSONB NOT NULL DEFAULT '{
        "regular_cheki_solo": 30000, 
        "regular_cheki_group": 35000
    }'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Insert Default Record (ID 1)
-- This record will hold the global configurations
INSERT INTO public.settings (id, prices)
VALUES (1, '{
    "regular_cheki_solo": 30000, 
    "regular_cheki_group": 35000
}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 3. Enable RLS
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- 4. Policies
-- Allow anyone to read settings
CREATE POLICY "Public Read Settings" ON public.settings FOR SELECT USING (true);

-- Admin update policy (Only for those who have access via Service role or specific roles)
-- If using Service Role Key from Backend, we dont need specific policy here.
