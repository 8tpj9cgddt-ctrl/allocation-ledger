-- Run this once in Supabase: Project > SQL Editor > New query > paste > Run

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  label text not null,
  note text default '',
  pct numeric not null default 0,
  color text not null default '#2F4550',
  sort_order int default 0,
  created_at timestamptz default now()
);

create table if not exists entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  amount numeric not null,
  source text default 'Unlabeled',
  split jsonb not null,
  created_at timestamptz default now()
);

-- Row Level Security: each person can only see their own rows
alter table categories enable row level security;
alter table entries enable row level security;

create policy "own categories" on categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own entries" on entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
