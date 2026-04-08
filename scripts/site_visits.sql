create table if not exists public.site_visits (
  id uuid primary key default gen_random_uuid(),
  visitor_id text not null,
  user_id uuid null references auth.users(id) on delete set null,
  page_path text not null default '/',
  created_at timestamptz not null default now()
);

create index if not exists site_visits_created_at_idx on public.site_visits (created_at desc);
create index if not exists site_visits_visitor_id_idx on public.site_visits (visitor_id);

alter table public.site_visits enable row level security;

drop policy if exists "allow anonymous insert site visits" on public.site_visits;
create policy "allow anonymous insert site visits"
on public.site_visits
for insert
to anon, authenticated
with check (true);

drop policy if exists "allow authenticated read site visits" on public.site_visits;
create policy "allow authenticated read site visits"
on public.site_visits
for select
to authenticated
using (true);
