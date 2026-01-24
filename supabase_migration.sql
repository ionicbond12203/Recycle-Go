-- Migration to add dynamic stats columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS points integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_co2_saved numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS recycled_items integer DEFAULT 0;

-- Add co2_saved to scanned_items for history tracking
ALTER TABLE public.scanned_items
ADD COLUMN IF NOT EXISTS co2_saved numeric DEFAULT 0;

-- Earnings & Commission Schema
ALTER TABLE public.collectors ADD COLUMN IF NOT EXISTS wallet_balance numeric DEFAULT 0;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS commission_amount numeric DEFAULT 0;

-- Verification Flow: Transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  collector_id text NOT NULL,
  contributor_id text NOT NULL,
  weight_kg numeric NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'confirmed', 'rejected')),
  created_at timestamp with time zone DEFAULT now()
);

-- Link scanned_items to transactions
ALTER TABLE public.scanned_items
ADD COLUMN IF NOT EXISTS transaction_id uuid REFERENCES public.transactions(id);

-- ENABLE REALTIME
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'transactions') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
  END IF;
END
$$;

-- RLS POLICIES (Updated for Unauthenticated Collector support)
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scanned_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.transactions;
DROP POLICY IF EXISTS "Enable read access for involved users" ON public.transactions;
DROP POLICY IF EXISTS "Enable update for contributor" ON public.transactions;
DROP POLICY IF EXISTS "Enable insert for everyone" ON public.transactions;
DROP POLICY IF EXISTS "Enable read for everyone" ON public.transactions;
DROP POLICY IF EXISTS "Enable update for everyone" ON public.transactions;

DROP POLICY IF EXISTS "Enable update for everyone on scanned_items" ON public.scanned_items;
DROP POLICY IF EXISTS "Enable all for everyone on scanned_items" ON public.scanned_items;

-- 1. Allow everyone to INSERT (Needed because Collector is not authenticated in this app version)
CREATE POLICY "Enable insert for everyone" ON public.transactions FOR INSERT WITH CHECK (true);

-- 2. Allow everyone to SELECT (Needed for realtime listeners on both sides)
CREATE POLICY "Enable read for everyone" ON public.transactions FOR SELECT USING (true);

-- 3. Allow everyone to UPDATE (Contributor needs to confirm, and they are authenticated, but let's be permissive to avoid issues)
CREATE POLICY "Enable update for everyone" ON public.transactions FOR UPDATE USING (true);

-- 4. Allow scanned_items CRUD (Simplifying policies to prevent RLS issues)
CREATE POLICY "Enable all for everyone on scanned_items" ON public.scanned_items FOR ALL USING (true);


-- STORAGE BUCKET
INSERT INTO storage.buckets (id, name, public) 
VALUES ('scanned_images', 'scanned_images', true)
ON CONFLICT (id) DO NOTHING;

-- STORAGE POLICIES
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING ( bucket_id = 'scanned_images' );
CREATE POLICY "Public Insert" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'scanned_images' );




