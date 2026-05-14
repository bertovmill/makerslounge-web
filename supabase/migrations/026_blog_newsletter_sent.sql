-- Track when a blog post tagged 'newsletter' has been emailed to subscribers.
-- Used to prevent double-sends when a post is unpublished/republished.

alter table public.blog_posts
  add column if not exists newsletter_sent_at timestamptz;
