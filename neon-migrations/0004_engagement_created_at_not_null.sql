-- `likes.created_at` and `comments.created_at` both carry DEFAULT now() and are
-- never null in practice (verified: zero null rows), but were declared without
-- NOT NULL. The app treats them as required — `timeAgo(date: string)` has no null
-- branch — so the nullable declaration was the part that was wrong, and it forced
-- callers to invent a fallback for a value that cannot be missing.
--
-- Scoped to these two tables rather than every `created_at` in the schema: these
-- are the ones a query now reads into a typed, non-null field.

ALTER TABLE makerslounge.likes ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE makerslounge.comments ALTER COLUMN created_at SET NOT NULL;
