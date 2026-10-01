-- Evals for May, the meetup matcher (src/lib/meetup-matcher.ts).
--
-- One row per eval run: which dataset, which model, the scores, whether it
-- cleared the thresholds in evals/matcher/thresholds.json, and every match May
-- made with the judge's verdict on it. `npm run eval:matcher` writes these.
--
-- Labels are Berto's own thumbs up/down on individual matches, graded at
-- /admin/matcher-evals. They're the ground truth the LLM judge is checked
-- against: if the judge and Berto disagree a lot, the judge's scores mean little.
--
-- Datasets are synthetic or anonymized (evals/matcher/data/); no real attendee
-- names, emails or phone numbers are stored here.

CREATE TABLE makerslounge.matcher_eval_runs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset     text NOT NULL,
  model       text NOT NULL,
  judge_model text NOT NULL,
  git_sha     text,
  passed      boolean NOT NULL,
  metrics     jsonb NOT NULL,
  thresholds  jsonb NOT NULL,
  results     jsonb NOT NULL,
  usage       jsonb,
  duration_ms integer,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX matcher_eval_runs_created_at_idx ON makerslounge.matcher_eval_runs (created_at DESC);

CREATE TABLE makerslounge.matcher_eval_labels (
  run_id     uuid NOT NULL REFERENCES makerslounge.matcher_eval_runs(id) ON DELETE CASCADE,
  person_id  text NOT NULL,
  matched_id text NOT NULL,
  good       boolean NOT NULL,
  note       text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (run_id, person_id, matched_id),
  CONSTRAINT matcher_eval_labels_note_max CHECK (note IS NULL OR char_length(note) <= 1000)
);
