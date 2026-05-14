-- Store structured LinkedIn enrichment data on profiles.
-- Populated by the admin "Enrich profile" action, which parses pasted
-- LinkedIn copy with an LLM and writes the structured payload here.

alter table public.profiles
  add column if not exists linkedin_data jsonb,
  add column if not exists linkedin_data_updated_at timestamptz;
