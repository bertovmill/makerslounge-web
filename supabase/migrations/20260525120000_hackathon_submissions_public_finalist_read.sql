-- Allow anyone (anon judges) to read finalist submissions for the scoring page.
drop policy if exists "Anyone can read finalist submissions" on public.hackathon_submissions;
create policy "Anyone can read finalist submissions"
  on public.hackathon_submissions
  for select
  to anon, authenticated
  using (is_finalist = true);
