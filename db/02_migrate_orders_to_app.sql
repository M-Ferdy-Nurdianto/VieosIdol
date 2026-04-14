-- ==========================================
-- Migrasi: orders dari skema lama → kolom yang dipakai Express (orderController)
-- Jalankan di Supabase SQL Editor jika insert order gagal (kolom tidak ada / nama salah).
-- Aman dijalankan berulang: cek nama kolom dulu.
-- ==========================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'customer_name'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'nickname'
  ) THEN
    ALTER TABLE public.orders RENAME COLUMN customer_name TO nickname;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'whatsapp_number'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'contact'
  ) THEN
    ALTER TABLE public.orders RENAME COLUMN whatsapp_number TO contact;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'total_amount'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'total_price'
  ) THEN
    ALTER TABLE public.orders RENAME COLUMN total_amount TO total_price;
  END IF;
END $$;

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS member_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS qty INTEGER DEFAULT 1;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS mode VARCHAR(20) DEFAULT 'online';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'transfer';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS note TEXT;

-- Isi default jika kolom baru kosong (data lama)
UPDATE public.orders SET items = '[]'::jsonb WHERE items IS NULL;
UPDATE public.orders SET qty = 1 WHERE qty IS NULL;
UPDATE public.orders SET mode = 'online' WHERE mode IS NULL;
UPDATE public.orders SET payment_method = COALESCE(payment_method, 'transfer');

ALTER TABLE public.orders ALTER COLUMN items SET DEFAULT '[]'::jsonb;

UPDATE public.orders SET cheki_type = 'solo'::public.cheki_type WHERE cheki_type IS NULL;
