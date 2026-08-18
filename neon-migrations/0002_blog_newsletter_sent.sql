-- Track when a blog post tagged 'newsletter' has been emailed to subscribers,
-- so unpublishing and republishing a post cannot double-send it.
--
-- Ported from supabase/migrations/026_blog_newsletter_sent.sql, which was NEVER
-- APPLIED. `/api/newsletter/send` selects and writes this column, so the send
-- flow has been failing outright: PostgREST rejects a select naming a column that
-- does not exist, and the route reported the error as a failed send.
--
-- Found by auditing every committed `alter table ... add column` against the live
-- schema; ten columns across five migrations were missing. The others are
-- deliberately not applied here:
--
--   broadcast_ideas.{account_id,channels,post_media_type}  the table itself never
--                                                          existed and no code
--                                                          references it
--   profiles.{is_premium,stripe_customer_id,               the Stripe/premium
--             stripe_subscription_id}                      feature -- a product
--   profiles.{messages_used,message_limit_reset_at}        decision, see the
--                                                          migration notes
--
-- (`hackathon_submissions.is_round` was a false positive: the real column is
-- `is_round2` and it exists.)

ALTER TABLE makerslounge.blog_posts
  ADD COLUMN IF NOT EXISTS newsletter_sent_at TIMESTAMPTZ;
