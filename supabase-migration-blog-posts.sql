-- Migration: Create blog_posts table
-- Purpose: Store blog posts with draft/publish workflow
-- Related: comments and likes tables already support blog_posts via target_type/target_id

-- Create blog_posts table
CREATE TABLE IF NOT EXISTS blog_posts (
  -- Identity & Content
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,  -- Markdown content

  -- Metadata
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  cover_image TEXT,
  read_time_minutes INTEGER DEFAULT 5,
  is_published BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,

  -- Flexible data
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- Timestamps
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_featured ON blog_posts(is_featured, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_author_id ON blog_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_tags ON blog_posts USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_blog_posts_created_at ON blog_posts(created_at DESC);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_blog_posts_search
ON blog_posts USING GIN(
  to_tsvector('english', title || ' ' || excerpt || ' ' || content)
);

-- Auto-update trigger for updated_at
CREATE OR REPLACE FUNCTION update_blog_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_blog_posts_timestamp
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_blog_posts_updated_at();

-- Enable Row Level Security
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone can read published posts
CREATE POLICY "Anyone can read published posts"
  ON blog_posts
  FOR SELECT
  USING (is_published = true);

-- RLS Policy: Authenticated users can read all posts (including drafts)
-- This allows authors to see their drafts
CREATE POLICY "Authenticated users can read all posts"
  ON blog_posts
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- RLS Policy: Authenticated users can create posts
CREATE POLICY "Authenticated users can create posts"
  ON blog_posts
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policy: Authors can update their own posts
CREATE POLICY "Authors can update their own posts"
  ON blog_posts
  FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- RLS Policy: Authors can delete their own posts
CREATE POLICY "Authors can delete their own posts"
  ON blog_posts
  FOR DELETE
  USING (auth.uid() = author_id);

-- Comments: Add index for blog_posts if not exists
-- (comments and likes tables already support blog_posts via polymorphic design)
CREATE INDEX IF NOT EXISTS idx_comments_blog_posts
ON comments(target_type, target_id)
WHERE target_type = 'blog_post';

CREATE INDEX IF NOT EXISTS idx_likes_blog_posts
ON likes(target_type, target_id)
WHERE target_type = 'blog_post';
