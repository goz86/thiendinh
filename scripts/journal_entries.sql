create table if not exists public.journal_entries (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  mood text not null check (mood in ('peaceful', 'calm', 'neutral', 'tired', 'anxious', 'sad')),
  note text not null default '',
  session_id text null,
  created_at timestamptz not null default now()
);

create index if not exists journal_entries_user_id_idx on public.journal_entries (user_id);
create index if not exists journal_entries_created_at_idx on public.journal_entries (created_at desc);

alter table public.journal_entries enable row level security;

drop policy if exists "users manage own journal entries" on public.journal_entries;
create policy "users manage own journal entries"
on public.journal_entries
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
