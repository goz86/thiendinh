alter table public.meditation_sessions
  add column if not exists visitor_id text;

alter table public.meditation_sessions
  alter column user_id drop not null;

create index if not exists meditation_sessions_visitor_id_idx
  on public.meditation_sessions (visitor_id);

drop policy if exists "Anonymous users can insert visitor sessions" on public.meditation_sessions;
create policy "Anonymous users can insert visitor sessions"
on public.meditation_sessions
for insert
to anon
with check (
  user_id is null
  and visitor_id is not null
);

do $$
begin
  begin
    alter publication supabase_realtime add table public.meditation_sessions;
  exception
    when duplicate_object then null;
    when undefined_object then null;
  end;
end $$;
