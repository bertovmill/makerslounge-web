-- Make blog likes and comments possible at all.
--
-- `likes` and `comments` were built for projects and later generalised with
-- `target_type` / `target_id` so blog posts could reuse them. The generalisation
-- was never finished: `project_id` stayed NOT NULL with a foreign key to
-- `projects`, and `BlogEngagement` inserts a blog like without one. Every such
-- insert has failed on a not-null violation, which is why the database holds 33
-- project likes and 2 project comments and exactly zero for blog posts. The
-- feature has never worked.
--
-- Three things are needed, not just the nullable column:
--
-- 1. `project_id` nullable, so a blog row can omit it.
-- 2. A CHECK to keep the original guarantee. Dropping NOT NULL on its own would
--    also allow a *project* like with no project, which nothing wants.
-- 3. A partial unique index for the non-project rows. `likes_user_id_project_id_key`
--    is UNIQUE (user_id, project_id), and once project_id is NULL for blog likes
--    that index stops constraining them — NULLs compare as distinct in a unique
--    index, so one user could like the same post repeatedly. `comments` needs no
--    equivalent: repeat comments are legitimate.

ALTER TABLE makerslounge.likes ALTER COLUMN project_id DROP NOT NULL;
ALTER TABLE makerslounge.comments ALTER COLUMN project_id DROP NOT NULL;

ALTER TABLE makerslounge.likes
  ADD CONSTRAINT likes_project_id_required_for_projects
  CHECK (target_type <> 'project' OR project_id IS NOT NULL);

ALTER TABLE makerslounge.comments
  ADD CONSTRAINT comments_project_id_required_for_projects
  CHECK (target_type <> 'project' OR project_id IS NOT NULL);

-- One like per user per non-project target.
CREATE UNIQUE INDEX IF NOT EXISTS likes_user_target_key
  ON makerslounge.likes (user_id, target_type, target_id)
  WHERE target_type <> 'project';
