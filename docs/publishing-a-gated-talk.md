# Publishing a gated talk

How a recorded talk gets from a raw meeting recording to a page on
`makerslounge.ca/talks/<slug>` that requires an account to watch.

## How the gate works

Two tables, split along the line the gate draws:

- **`talks`** — title, slug, description, speaker, thumbnail, duration.
  World-readable. This is the teaser a signed-out visitor sees, and it's
  deliberately shareable: it's what sells the signup.
- **`talk_content`** — the YouTube video id and the transcript. Only handed to a
  signed-in viewer, enforced in `src/lib/talks.ts`.

The page never decides what to hide. It asks for `talk_content` and renders the
sign-up prompt when the row comes back empty.

**Where the gate lives now.** It used to be RLS: `talk_content` was readable only
by the `authenticated` role, so a signed-out request came back empty at the
database. Neon has no equivalent, so the gate moved into `fetchTalkContent()`,
which takes the viewer's id and returns `null` without one. The id is a required
parameter rather than an optional one on purpose — an optional argument that
defaults to "allowed" is exactly the mistake that leaks the video id, and a
missing argument should be a type error, not an open door. There is no longer a
second line of defence in the database behind that check, so don't add a code
path that reads `talk_content` directly.

**What this does and doesn't guarantee.** An unlisted YouTube video is public to
anyone holding its URL. The gate stops the id from reaching signed-out
visitors, but a member who is already watching can copy the embed URL out of
DevTools and pass it on. That is a strong speed bump, not a wall. If a speaker
ever needs a real guarantee, the upgrade is Mux with signed playback tokens,
which expire and can be revoked — only `talk_content` and `TalkPlayer` would
change.

## 1. Get the recording

Meet recordings land in Drive under **Meet Recordings**; Zoom cloud recordings
download from the web portal. They're large — the Aug 10 workshop is 1.6 GB.

Optional trims, if you want to cut dead air off the front or shrink the upload:

```bash
# Lossless cut — no re-encode, near-instant, keyframe-accurate to ~1s
ffmpeg -ss 00:02:10 -to 00:41:00 -i recording.mp4 -c copy talk.mp4

# Re-encode smaller (YouTube re-encodes anyway, so only worth it for upload speed)
ffmpeg -i recording.mp4 -c:v libx264 -crf 26 -preset medium -c:a aac -b:a 128k talk.mp4
```

Uploading the original is the better-quality choice if you can wait out the
upload.

## 2. Upload to YouTube as unlisted

YouTube Studio → Create → Upload video. Set visibility to **Unlisted**, not
Private — private videos can't be embedded for other viewers.

Grab the video id from the URL: `youtube.com/watch?v=VIDEO_ID`.

### Getting a transcript

YouTube's auto-captions are the free option — copy them out of YouTube Studio
into `talk_content.transcript`.

Local Whisper is better, and it works before the upload finishes:

```bash
brew install whisper-cpp
curl -L -o ggml-medium.en.bin \
  https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium.en.bin

ffmpeg -i talk.mp4 -vn -ac 1 -ar 16000 -c:a pcm_s16le talk.wav
whisper-cli -m ggml-medium.en.bin -f talk.wav -osrt -otxt -of talk \
  --prompt "Domain terms that appear in this talk, comma separated."
```

Budget time for a cleanup pass either way. Whisper mangles product names badly —
the Eve talk came back with "the if framework", "evils" for evals, "guns
compaction" for context compaction, "Vercel Sams" for Vercel Sandbox, and
"Chrome schedule" for cron schedule. The `--prompt` flag biases the vocabulary
and helps, but does not fix it. Cleaned transcripts live in
`content/talks/<slug>.transcript.txt`.

## 3. Insert the rows

The tables are already in the database — `neon-migrations/0001_talks.sql`. (The
older `supabase-migration-talks.sql` was written but never applied, which is why
`/talks` rendered "No talks yet" in production for months.)

Per talk, prefer a script over hand-written SQL — see
`scripts/create-eve-talk.ts`, which is re-runnable, validates the YouTube id, and
reads the transcript off disk:

```bash
npx tsx scripts/create-eve-talk.ts <YOUTUBE_ID>
```

The equivalent SQL, if you'd rather do it by hand:

```sql
WITH new_talk AS (
  INSERT INTO talks (
    title, slug, description,
    speaker_name, speaker_title, speaker_company,
    thumbnail_url, duration_seconds, recorded_at,
    is_published, published_at
  ) VALUES (
    'Talk title here',
    'talk-slug-here',
    'One or two sentences that make someone want to sign up.',
    'Speaker Name', 'Their Title', 'Vercel',
    'https://img.youtube.com/vi/VIDEO_ID/maxresdefault.jpg',
    3600,                     -- duration in seconds
    '2026-08-10T18:18:00-04:00',
    true, now()
  )
  RETURNING id
)
INSERT INTO talk_content (talk_id, provider, video_id, transcript)
SELECT id, 'youtube', 'VIDEO_ID', NULL FROM new_talk;
```

**Do not use `img.youtube.com/vi/<id>/maxresdefault.jpg` as the thumbnail.** It
is free and needs no API key, which is why this doc recommended it for months —
but the URL *contains the video id*, and `thumbnail_url` lives in `talks`, the
world-readable half of the schema. Pointing at it publishes the id to exactly
the signed-out visitors the gate exists to stop, and they can watch the whole
talk on YouTube without ever making an account. The gate holds perfectly and the
thumbnail walks the id out the front door.

This is easy to miss when you check the gate: the page has no iframe, no
transcript, and no `youtube-nocookie` in the HTML, so it looks sealed. Grep the
signed-out HTML for the id itself, not for the player.

Download the image once and self-host it instead:

```bash
curl -o public/talks/<slug>.jpg https://img.youtube.com/vi/<id>/maxresdefault.jpg
```

then set `thumbnail_url` to `/talks/<slug>.jpg`. YouTube's auto-pick is usually a
decent slide; swap in a branded image if you'd rather.

To unpublish a talk, set `is_published = false` — that hides the teaser *and*
closes the gate, since `fetchTalkContent` checks it too.

## 4. Check it

Open `/talks/<slug>` in a private window. You should see the teaser and the
sign-up button, and the player should replace the gate once you sign in.

Then check for the leak explicitly, because "no player in the HTML" is not the
same as "no video id in the HTML":

```bash
curl -s https://www.makerslounge.ca/talks/<slug> | grep -o '[^"]*<VIDEO_ID>[^"]*'
```

Anything it prints is a URL handing the id to signed-out visitors. It should
print nothing. Check `/talks` and any OG image tags the same way — the listing
page and the social card both render `thumbnail_url`.
