-- Run this once in Supabase SQL Editor for the Item Master categories/sizes.
ALTER TABLE public.rubbers
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'rubber';

ALTER TABLE public.rubbers
  ADD COLUMN IF NOT EXISTS size text;

UPDATE public.rubbers
SET category = 'rubber'
WHERE category IS NULL OR trim(category) = '';

ALTER TABLE public.rubbers
  DROP CONSTRAINT IF EXISTS rubbers_category_check;

ALTER TABLE public.rubbers
  ADD CONSTRAINT rubbers_category_check
  CHECK (category IN ('machine', 'raw', 'rubber'));
