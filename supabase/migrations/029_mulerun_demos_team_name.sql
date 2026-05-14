-- Add team_name to mulerun_demos so the lineup slide can headline the team
-- name (audience favorites) above the member list.
-- Run this in the Supabase SQL editor before tonight.

alter table public.mulerun_demos
  add column if not exists team_name text;

-- Sized like name; nullable so existing rows don't blow up.
alter table public.mulerun_demos
  drop constraint if exists mulerun_demos_team_name_length;

alter table public.mulerun_demos
  add constraint mulerun_demos_team_name_length
  check (team_name is null or length(trim(team_name)) between 1 and 80);
