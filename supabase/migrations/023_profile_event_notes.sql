-- Per-profile event notes (admin only)
-- When a meetup participant is a registered profile user and has notes,
-- those notes are synced here so they appear on the person's profile.

create table if not exists public.profile_event_notes (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid references auth.users(id) on delete cascade not null,
  meetup_id   uuid references public.meetups(id) on delete set null,
  meetup_name text not null,
  notes       text,
  created_by  uuid references auth.users(id) not null,
  created_at  timestamptz default now() not null,
  unique (profile_id, meetup_id)
);

alter table public.profile_event_notes enable row level security;

-- Only the admin (creator) can read/write
create policy "Creator can select profile_event_notes"
  on public.profile_event_notes for select
  using (auth.uid() = created_by);

create policy "Creator can insert profile_event_notes"
  on public.profile_event_notes for insert
  with check (auth.uid() = created_by);

create policy "Creator can update profile_event_notes"
  on public.profile_event_notes for update
  using (auth.uid() = created_by);

create policy "Creator can delete profile_event_notes"
  on public.profile_event_notes for delete
  using (auth.uid() = created_by);
