-- Blog Engagement Migration
-- This migration extends the comments and likes tables to support blog posts
-- in addition to projects by adding target_type and target_id columns

-- Add columns to comments table
ALTER TABLE comments
  ADD COLUMN IF NOT EXISTS target_type TEXT DEFAULT 'project',
  ADD COLUMN IF NOT EXISTS target_id TEXT;

-- Backfill target_id with project_id for existing records
UPDATE comments
SET target_id = project_id
WHERE target_id IS NULL;

-- Add columns to likes table
ALTER TABLE likes
  ADD COLUMN IF NOT EXISTS target_type TEXT DEFAULT 'project',
  ADD COLUMN IF NOT EXISTS target_id TEXT;

-- Backfill target_id with project_id for existing records
UPDATE likes
SET target_id = project_id
WHERE target_id IS NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_comments_target
ON comments(target_type, target_id);

CREATE INDEX IF NOT EXISTS idx_likes_target
ON likes(target_type, target_id);

-- Note: To apply this migration, run it in the Supabase SQL editor
-- The migration allows both projects and blog posts to have comments and likes
-- by using target_type ('project' | 'blog_post') and target_id (project.id or blog.slug)
