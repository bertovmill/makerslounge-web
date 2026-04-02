-- Meetups table for the Meetup Matcher feature
create table if not exists public.meetups (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_by  uuid references auth.users(id) on delete cascade not null,
  -- Full participant snapshot stored as JSONB so we preserve edited data
  participants jsonb not null default '[]',
  created_at  timestamptz default now() not null,
  updated_at  timestamptz default now() not null
);

-- Only the creator can read/write their meetups
alter table public.meetups enable row level security;

create policy "Owner can select meetups"
  on public.meetups for select
  using (auth.uid() = created_by);

create policy "Owner can insert meetups"
  on public.meetups for insert
  with check (auth.uid() = created_by);

create policy "Owner can update meetups"
  on public.meetups for update
  using (auth.uid() = created_by);

create policy "Owner can delete meetups"
  on public.meetups for delete
  using (auth.uid() = created_by);

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger meetups_updated_at
  before update on public.meetups
  for each row execute function public.set_updated_at();
