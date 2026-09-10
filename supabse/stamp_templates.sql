-- Run this in Supabase → SQL Editor.
-- Matches the id/created_at style already used by your other tables
-- (rubbers, purchases, stamp_entries, etc — text id generated in the app).

create table if not exists stamp_templates (
  id text primary key,
  name text not null,
  config jsonb not null,
  created_at timestamptz not null default now()
);

-- Your app currently calls Supabase with the public anon key directly from
-- the browser (see SUPABASE_KEY in App.jsx), same as your other tables.
-- Enable RLS with an open policy so it works the same way out of the box.
alter table stamp_templates enable row level security;

create policy "Allow all access to stamp_templates"
  on stamp_templates
  for all
  using (true)
  with check (true);

-- Stamp Entry payment mode (run once in Supabase SQL Editor)
alter table if exists stamp_entries
  add column if not exists payment_mode text not null default 'Cash';

alter table if exists stamp_entries
  drop constraint if exists stamp_entries_payment_mode_check;

alter table if exists stamp_entries
  add constraint stamp_entries_payment_mode_check
  check (payment_mode in ('Cash', 'Bank'));

-- Purchase payment mode (run once in Supabase SQL Editor)
alter table if exists purchases
  add column if not exists payment_mode text not null default 'Cash';

alter table if exists purchases
  drop constraint if exists purchases_payment_mode_check;

alter table if exists purchases
  add constraint purchases_payment_mode_check
  check (payment_mode in ('Cash', 'Bank'));
