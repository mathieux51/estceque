# Direct Social

A podcast social network, in French: publish shows and episodes, listen,
comment at a moment of an episode in writing or with an audio note, follow
people and shows, and find podcasts by text or by sound.

For now it only runs on a laptop, with Docker Compose.

## Run it

```bash
docker compose up --build        # from the repository root
```

| Address | What |
|---|---|
| http://localhost:3002 | The site |
| http://localhost:8025 | Mailpit: sign-in emails land here |
| http://localhost:9001 | MinIO console (user `social`, password `social-secret`) |
| http://localhost:8080/api/health | The Go API, directly |
| `localhost:5434` | Postgres (`social` / `social`) |

The first build takes a few minutes: it compiles whisper.cpp and downloads its
model. `docker compose down -v` deletes all data.

Sign in with any email address: the link arrives in Mailpit. The account is
created on first sign-in.

## Features

- **Sign-in by magic link** (no password), profiles with avatar and bio
- **Shows and episodes**: cover, description, tags; audio goes from the
  browser straight to storage (signed URL, up to 1 GB); RSS feed per show
  that podcast apps can read
- **Processing** in the background: listening MP3 at the podcast loudness norm
  (-16 LUFS), waveform, audio fingerprints, transcript (whisper.cpp)
- **Listening**: a player that keeps playing while browsing, speed, -15 s /
  +30 s, waveform with comment marks, resume where you stopped, share link
  at the current time (`/episodes/12?t=83`)
- **Comments** at a moment of the episode, in writing or as an audio note
  (recorded in the browser, up to 3 minutes), replies, deletion by the author
  or the show's creator, reports
- **Social**: follow shows and people, a feed of their new episodes, likes,
  "listen later", listening history, notifications (comments, replies, likes,
  follows, new episodes)
- **Text search** over shows, episodes, people and what is said in episodes,
  with the time: "Colombie" finds the moment it is spoken. Accents do not
  matter ("velo" finds "vélo")
- **Audio search**: "Reconnaître un podcast" listens to the microphone, finds
  the episode playing nearby and where it is (usually after 4 seconds), and
  can carry on playing from there

## How audio search works

Like Shazam: the worker turns each episode into a spectrogram, keeps its
loudest peaks, and stores hashes of pairs of nearby peaks with their time
("landmarks", `services/social/internal/fingerprint`). A recording from the
microphone gets the same treatment; its hashes are looked up in Postgres, and
the episode where many hashes agree on the same time offset wins. The offset
plus the recording's length is where the episode is now.

While listening, the browser sends the recording so far every 2 seconds
(from 3 seconds on) and stops at the first match; it gives up after 15
seconds. The whole recording is sent each time, because later pieces of a
WebM file cannot be decoded without its header.

The recording is made without echo cancellation or noise suppression, which
would remove the sound we want to hear.

## Architecture

```
browser ── web (Next.js, :3002) ── /api/* ──> api (Go, :8080) ── Postgres
   │                                                 └───────── MinIO (S3)
   └── uploads and downloads audio directly with signed MinIO URLs
worker (Go + FFmpeg + whisper.cpp) ── jobs table in Postgres
```

- `apps/direct-social`: this Next.js app. It proxies `/api` to the Go API so
  the session cookie stays first-party. Same design system as Direct Podcast
  and Direct Montage.
- `services/social`: one Go binary with three commands, `api`, `worker` and
  `migrate`. Jobs are rows in Postgres (`FOR UPDATE SKIP LOCKED`), retried up
  to 3 times.
- MinIO stands in for Cloudflare R2 (same S3 API), Mailpit for an email
  service. See `docs/hosting-vercel-vs-cloudflare.md` for the production plan.

## Develop without rebuilding images

```bash
docker compose up -d postgres minio mailpit migrate api worker
cd apps/direct-social && npm install && npm run dev   # http://localhost:3002
```

For the Go code (needs FFmpeg; transcripts need `whisper-cli` and a model):

```bash
cd services/social
go test ./...
go run ./cmd/social api      # defaults point at the Compose services
```

Better transcripts: build with a bigger Whisper model, for example
`docker compose build --build-arg WHISPER_MODEL=small` (slower).

## API

JSON over HTTP under `/api`; errors are `{"error": "message in French"}`.

| Area | Routes |
|---|---|
| Sign-in | `POST /auth/request`, `POST /auth/verify`, `POST /auth/logout` |
| Me | `GET/PATCH /me`, `POST /me/avatar`, `GET /me/shows`, `/me/bookmarks`, `/me/history` |
| Shows | `POST /shows`, `GET /shows/{slug}`, `PATCH/DELETE /shows/{id}`, `POST /shows/{id}/cover`, `POST/DELETE /shows/{id}/follow`, `GET /shows/{slug}/rss` |
| Episodes | `POST /uploads/episode`, `POST /shows/{id}/episodes`, `GET/PATCH/DELETE /episodes/{id}`, `GET /episodes/{id}/transcript`, `POST/DELETE /episodes/{id}/like`, `/bookmark`, `PUT /episodes/{id}/progress`, `POST /episodes/{id}/play` |
| Comments | `GET/POST /episodes/{id}/comments` (multipart, optional `audio`), `DELETE /comments/{id}` |
| People | `GET /users/{handle}`, `POST/DELETE /users/{id}/follow` |
| Discovery | `GET /feed`, `GET /discover`, `GET /search?q=` or `?tag=`, `POST /search/audio` (multipart `audio`) |
| Other | `GET /notifications`, `POST /notifications/read`, `POST /reports`, `GET /media/{key}` (redirects to a signed URL) |
