-- Sharma Ji Stamps: PIN hashing and database access hardening
-- Run this in Supabase SQL Editor AFTER deploying the matching Vercel API code.
-- The server-side API uses the service-role key; browser clients must not access these tables directly.

alter table if exists public.users add column if not exists pin_hash text;
alter table if exists public.users add column if not exists pin_salt text;
alter table if exists public.users alter column pin drop not null;

do $$
declare t text;
begin
  foreach t in array array['users','rubbers','purchases','stamp_entries','cash_manual','stamp_templates','customer_designs']
  loop
    if to_regclass('public.' || t) is not null then
      execute format('alter table public.%I enable row level security', t);
      execute format('revoke all on table public.%I from anon, authenticated', t);
    end if;
  end loop;
end $$;

-- Do not add anon/authenticated policies to these application tables.
-- The Vercel API accesses them with SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS.
