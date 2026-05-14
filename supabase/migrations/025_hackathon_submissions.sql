-- Hackathon submissions for Toronto Tech Week #11 (May 19–26, 2026).
-- Anonymous public form accepts submissions; only the admin can read.

create table if not exists public.hackathon_submissions (
  id uuid primary key default gen_random_uuid(),
  project_link text not null,
  title text,
  description text,
  video_url text,
  file_urls text[] default '{}',
  team_name text,
  builder_emails text[] default '{}',
  challenge_track text,
  status text not null default 'new' check (status in ('new', 'reviewed', 'finalist', 'winner', 'spam')),
  user_agent text,
  ip_hash text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index if not exists hackathon_submissions_created_at_idx
  on public.hackathon_submissions (created_at desc);

create index if not exists hackathon_submissions_status_idx
  on public.hackathon_submissions (status);

alter table public.hackathon_submissions enable row level security;

-- Anyone (anon or authenticated) can insert a submission.
drop policy if exists "Anyone can submit" on public.hackathon_submissions;
create policy "Anyone can submit"
  on public.hackathon_submissions
  for insert
  to anon, authenticated
  with check (true);

-- Only the organizer can read submissions.
drop policy if exists "Admin can read submissions" on public.hackathon_submissions;
create policy "Admin can read submissions"
  on public.hackathon_submissions
  for select
  to authenticated
  using (auth.email() = 'bertmill19@gmail.com');

-- Only the organizer can update status.
drop policy if exists "Admin can update submissions" on public.hackathon_submissions;
create policy "Admin can update submissions"
  on public.hackathon_submissions
  for update
  to authenticated
  using (auth.email() = 'bertmill19@gmail.com')
  with check (auth.email() = 'bertmill19@gmail.com');

-- Storage bucket for files attached to a submission.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'hackathon-submissions',
  'hackathon-submissions',
  false,
  104857600, -- 100 MB per file
  null
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit;

-- Anyone can upload a file to the bucket (one path per submission).
drop policy if exists "Anyone can upload submission files" on storage.objects;
create policy "Anyone can upload submission files"
  on storage.objects
  for insert
  to anon, authenticated
  with check (bucket_id = 'hackathon-submissions');

-- Only the organizer can list / download files.
drop policy if exists "Admin can read submission files" on storage.objects;
create policy "Admin can read submission files"
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'hackathon-submissions' and auth.email() = 'bertmill19@gmail.com');
