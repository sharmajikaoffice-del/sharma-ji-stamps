-- Sharma Ji Stamps: user profile photos
-- Run this in the Supabase SQL Editor before using the DP upload feature.
alter table if exists public.users
  add column if not exists avatar_url text;
