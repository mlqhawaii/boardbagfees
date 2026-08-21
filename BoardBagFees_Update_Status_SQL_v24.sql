-- BoardBagFees v24: authoritative successful-updater timestamp.
-- Run once in Supabase SQL Editor.

create table if not exists public.site_update_status (
  status_key text primary key,
  last_success_at timestamptz not null
);

alter table public.site_update_status enable row level security;

drop policy if exists "Public can read updater status" on public.site_update_status;
create policy "Public can read updater status"
on public.site_update_status
for select
to anon, authenticated
using (true);

grant select on public.site_update_status to anon, authenticated;
grant select, insert, update on public.site_update_status to service_role;

-- Seed with the last successful BoardBagFees n8n execution visible on Aug 17, 2026.
insert into public.site_update_status(status_key, last_success_at)
values ('policy_updater', '2026-08-17T00:00:00-10:00')
on conflict (status_key) do update set last_success_at = excluded.last_success_at;
