# Direct Social: podcast social network (local / Docker)

## Objective

A podcast social network that runs entirely on a laptop with Docker Compose:

- Share podcasts: shows and episodes, uploaded by their creators
- Find podcasts with text (titles, descriptions, tags, and words spoken in
  episodes, with the time) and with audio: play a podcast near the microphone
  and the site finds the episode and the time it is at
- Comment on episodes, in text or with audio notes, at a moment of the episode
- The rest expected from a podcast social network: profiles, follows, a feed,
  likes, bookmarks, listening progress, notifications, share links at a time,
  RSS feeds, reports

## Architecture

```
browser ── web (Next.js, :3002) ── /api/* proxied ──> api (Go, :8080)
                                                         │
               ┌───────────────── Postgres (data, jobs, search, fingerprints)
               │                  MinIO (S3: audio, covers, notes)
               │                  Mailpit (magic-link emails, UI :8025)
worker (Go + FFmpeg + whisper.cpp): listening MP3 (loudness -16 LUFS),
               waveform, audio fingerprints, transcript
```

- `apps/direct-social`: Next.js web app, Direct Podcast's design system
- `services/social`: Go module, one binary with `api`, `worker`, `migrate`
- `compose.yaml` at the repository root (project `direct-social`)
- MinIO stands in for Cloudflare R2 (same S3 API), Mailpit for a mail service

## Progress

- [x] Docker Compose stack (Postgres, MinIO, Mailpit, migrate, api, worker, web)
- [x] Database schema and migrations (2026-10-07)
- [x] Magic-link sign-in (Mailpit), sessions, profiles
- [x] Shows and episodes: direct uploads to MinIO, processing jobs
- [x] Worker: FFmpeg listening copy, waveform, fingerprints, transcript
- [x] Audio search (fingerprints) and text search (Postgres full text, French)
- [x] Comments and audio notes at a time, replies
- [x] Follows, feed, likes, bookmarks, listening progress, notifications
- [x] Share links at a time, RSS feed per show, reports
- [x] Web app pages (2026-10-07)
- [x] Tests: Go unit tests (fingerprint, slugs, tags); browser run (Chrome, fake microphone)
  covering sign-up, text and audio search, comments and audio notes, publishing, notifications
- [x] README (`apps/direct-social/README.md`)
- [x] Audio search answers while listening: recording sent every 2 s, stops at the first
  match (about 4 s instead of 10), gives up after 15 s

## Decisions

- Magic-link sign-in: emails go to Mailpit locally (http://localhost:8025).
- Transcripts with whisper.cpp in the worker image (CPU, multilingual model),
  so search also finds spoken words, with the time.
- Audio search uses landmark fingerprints (pairs of spectrogram peaks), the
  technique Shazam made known, stored in Postgres.
- Background jobs live in a Postgres table (`SELECT ... FOR UPDATE SKIP
  LOCKED`), no separate queue service.
- The web app proxies `/api` to the Go API, so cookies stay first-party.

## Issues

- Port 5433 was taken on this machine by another project: Postgres is published on 5434.
- `array_to_string()` and `unaccent()` are not immutable, so generated search columns use an
  immutable `tags_text()` and accent-free text search configurations (`fr`, `simple_unaccent`).
- whisper.cpp base model makes mistakes on rare words ("torréfaction" heard as "tour réflexion");
  a bigger model (small, medium) is a build argument away when quality matters more than speed.

## Next steps

- Keep the browser test in the repository and run it in CI (it needs Docker and Chrome).
- Moderation screen for reports (they are stored, nobody reviews them yet).
- Rate limiting on the API (only sign-in requests are limited today).
- Hosting: one VPS + R2, as in `docs/hosting-vercel-vs-cloudflare.md`.
