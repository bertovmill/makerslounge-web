-- Add video_url to mulerun_demos so teams who can't (or don't want to) demo
-- live can paste a Loom/YouTube/Drive link instead.
-- Run this in the Supabase SQL editor before the next hack night.

alter table public.mulerun_demos
  add column if not exists video_url text;

alter table public.mulerun_demos
  drop constraint if exists mulerun_demos_video_url_length;

alter table public.mulerun_demos
  add constraint mulerun_demos_video_url_length
  check (video_url is null or length(trim(video_url)) between 1 and 500);
