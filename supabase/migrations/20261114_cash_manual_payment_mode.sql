-- Run in Supabase Dashboard → SQL Editor.
-- Cash Register manual entries need to persist whether the transaction used Cash or Bank.
-- Existing rows are treated as Cash so old balances remain unchanged.

alter table if exists public.cash_manual
  add column if not exists payment_mode text not null default 'Cash';

update public.cash_manual
set payment_mode = 'Cash'
where payment_mode is null or payment_mode not in ('Cash', 'Bank');

alter table if exists public.cash_manual
  drop constraint if exists cash_manual_payment_mode_check;

alter table if exists public.cash_manual
  add constraint cash_manual_payment_mode_check
  check (payment_mode in ('Cash', 'Bank'));

notify pgrst, 'reload schema';
