#!/usr/bin/env python3
"""Turn a Supabase `public` schema dump into a Neon `makerslounge` schema.

Drops everything that only made sense inside Supabase (112 RLS policies, the
RLS helper, the auth.users signup trigger) and rewrites the schema name. Splits
on statements dollar-quote-aware so function bodies survive intact.
"""
import re, sys

src, dst = sys.argv[1], sys.argv[2]
raw = open(src).read()

# --- split into statements, respecting $$ / $tag$ quoting -------------------
stmts, buf, i, n = [], [], 0, len(raw)
dollar = None
lines = raw.split("\n")
for line in lines:
    if dollar is None:
        for m in re.finditer(r"\$[A-Za-z_]*\$", line):
            tag = m.group(0)
            if dollar is None:
                dollar = tag
            elif dollar == tag:
                dollar = None
    else:
        for m in re.finditer(re.escape(dollar), line):
            dollar = None
            break
    buf.append(line)
    if dollar is None and line.rstrip().endswith(";"):
        stmts.append("\n".join(buf)); buf = []
if buf:
    stmts.append("\n".join(buf))

DROP_PATTERNS = [
    r"^\s*CREATE POLICY\b",
    r"ENABLE ROW LEVEL SECURITY",
    r"^\s*CREATE FUNCTION public\.current_profile_id\b",
    r"^\s*COMMENT ON FUNCTION public\.current_profile_id\b",
    r"^\s*CREATE FUNCTION public\.handle_new_user\b",
    r"^\s*COMMENT ON SCHEMA public\b",
    r"^\s*CREATE SCHEMA public;",
    r"^\s*SET (statement_timeout|lock_timeout|idle_in_transaction\w*|transaction_timeout|client_encoding|standard_conforming\w*|check_function_bodies|xmloption|client_min_messages|row_security|default_tablespace|default_table_access_method)\b",
    r"^\s*SELECT pg_catalog\.set_config\b",
    # psql meta-commands new in pg_dump 18; they are not SQL and the pair must
    # go together or psql errors with "not currently in restricted mode".
    r"^\\(un)?restrict\b",
]
dropped = {p: 0 for p in DROP_PATTERNS}

kept = []
for s in stmts:
    code = "\n".join(l for l in s.split("\n") if not l.lstrip().startswith("--")).strip()
    if not code:
        continue
    hit = None
    for p in DROP_PATTERNS:
        if re.search(p, code, re.M | re.I):
            hit = p; break
    if hit:
        dropped[hit] += 1
        continue
    kept.append(code)

body = "\n\n".join(kept)

# --- rewrite the schema name ------------------------------------------------
body = body.replace("public.", "makerslounge.")
body = re.sub(r"search_path\s+TO\s+'public'", "search_path TO 'makerslounge'", body, flags=re.I)
body = re.sub(r"SET\s+search_path\s*=\s*public", "SET search_path = makerslounge", body, flags=re.I)

# match_community_contact is SECURITY DEFINER, references `community_contacts`
# unqualified, and pins no search_path -- so it resolved against whatever the
# caller happened to have set. Inherited from Supabase; pin it here.
body = body.replace(
    "CREATE FUNCTION makerslounge.match_community_contact(p_user_id uuid, p_user_email text) RETURNS void\n    LANGUAGE plpgsql SECURITY DEFINER",
    "CREATE FUNCTION makerslounge.match_community_contact(p_user_id uuid, p_user_email text) RETURNS void\n    LANGUAGE plpgsql SECURITY DEFINER\n    SET search_path TO 'makerslounge', 'pg_temp'")

header = """-- Site schema for Neon, generated from a live Supabase `public` dump.
--
-- Transformed by tmp/transform.py: schema renamed to `makerslounge`, and every
-- Supabase-only construct removed -- 112 RLS policies, `current_profile_id()`
-- (the RLS helper that read auth.jwt()), and `handle_new_user()` (a trigger on
-- auth.users, made redundant when Clerk took over signup).
--
-- Authorization now lives in application code, per-route. RLS is deliberately
-- NOT recreated here: Neon has no JWT-aware policy layer, so a policy left in
-- SQL would simply never be enforced.

CREATE SCHEMA IF NOT EXISTS makerslounge;
SET search_path = makerslounge, public;

-- Required, not cosmetic: pg_dump emits functions before the tables they query,
-- and `innovation_signups_count()` is LANGUAGE sql, whose body Postgres
-- validates at CREATE time unless this is off.
SET check_function_bodies = false;
"""
open(dst, "w").write(header + "\n" + body + "\n")

print(f"statements parsed: {len(stmts)}")
for p, c in dropped.items():
    if c: print(f"  dropped {c:>3}  {p}")
print(f"statements kept: {len(kept)}")
print("remaining auth./storage. refs:", len(re.findall(r"\bauth\.|\bstorage\.", body)))
print("remaining 'public.' refs:", len(re.findall(r"\bpublic\.", body)))
