-- Mulerun hack night audience votes — ranked top 3 per voter
-- Run this in the Supabase SQL editor before the voting slide goes live

create table if not exists public.mulerun_votes (
  id uuid default gen_random_uuid() primary key,
  voter_id text not null check (length(voter_id) between 1 and 64),
  first_id uuid not null references public.mulerun_demos(id) on delete cascade,
  second_id uuid not null references public.mulerun_demos(id) on delete cascade,
  third_id uuid not null references public.mulerun_demos(id) on delete cascade,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique (voter_id),
  check (first_id <> second_id and first_id <> third_id and second_id <> third_id)
);

create index if not exists mulerun_votes_created_at_idx
  on public.mulerun_votes (created_at desc);

alter table public.mulerun_votes enable row level security;

-- Anyone can vote (no auth — this is a live audience)
drop policy if exists "mulerun_votes_anon_insert" on public.mulerun_votes;
create policy "mulerun_votes_anon_insert" on public.mulerun_votes
  for insert to anon, authenticated with check (true);

-- A voter can update their own row (re-rank)
drop policy if exists "mulerun_votes_anon_update" on public.mulerun_votes;
create policy "mulerun_votes_anon_update" on public.mulerun_votes
  for update to anon, authenticated using (true) with check (true);

-- Anyone can read (needed for tally + live count on the present slides)
drop policy if exists "mulerun_votes_anon_select" on public.mulerun_votes;
create policy "mulerun_votes_anon_select" on public.mulerun_votes
  for select to anon, authenticated using (true);
