-- Mulerun hack night demo submissions — for the live lineup slide
-- Run this in the Supabase SQL editor before May 14, 2026

create table if not exists public.mulerun_demos (
  id uuid default gen_random_uuid() primary key,
  name text not null check (length(trim(name)) between 1 and 120),
  project text not null check (length(trim(project)) between 1 and 200),
  created_at timestamptz default now() not null
);

create index if not exists mulerun_demos_created_at_idx
  on public.mulerun_demos (created_at desc);

alter table public.mulerun_demos enable row level security;

-- Anyone can submit (no auth needed)
drop policy if exists "mulerun_demos_anon_insert" on public.mulerun_demos;
create policy "mulerun_demos_anon_insert" on public.mulerun_demos
  for insert to anon, authenticated with check (true);

-- Anyone can read (needed for the lineup slide)
drop policy if exists "mulerun_demos_anon_select" on public.mulerun_demos;
create policy "mulerun_demos_anon_select" on public.mulerun_demos
  for select to anon, authenticated using (true);
