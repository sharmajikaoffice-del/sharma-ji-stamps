-- Sharma Ji Stamps: PIN hashing and database access hardening
-- Run this in Supabase SQL Editor AFTER deploying the matching Vercel API code.
-- The server-side API uses the service-role key; browser clients must not access these tables directly.

alter table if exists public.users add column if not exists pin_hash text;
alter table if exists public.users add column if not exists pin_salt text;
alter table if exists public.users alter column pin drop not null;

create table if not exists public.sjs_login_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  ip_hash text not null,
  attempted_at timestamptz not null default now(),
  successful boolean not null default false
);
create index if not exists sjs_login_attempts_lookup
  on public.sjs_login_attempts (user_id, ip_hash, attempted_at desc)
  where successful = false;

do $
declare t text;
begin
  foreach t in array array['users','rubbers','purchases','stamp_entries','cash_manual','stamp_templates','customer_designs','sjs_login_attempts']
  loop
    if to_regclass('public.' || t) is not null then
      execute format('alter table public.%I enable row level security', t);
      execute format('revoke all on table public.%I from anon, authenticated', t);
    end if;
  end loop;
end $$;

-- Do not add anon/authenticated policies to these application tables.
-- The Vercel API accesses them with SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS.
