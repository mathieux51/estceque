# services/social

Go backend of Direct Social: `social api` (JSON API), `social worker`
(FFmpeg, fingerprints, whisper.cpp transcripts) and `social migrate`.

| Package | Role |
|---|---|
| `cmd/social` | Entry point |
| `internal/api` | HTTP handlers |
| `internal/worker` | Episode processing jobs |
| `internal/fingerprint` | Audio fingerprints (landmarks) and matching |
| `internal/audio` | FFmpeg wrappers |
| `internal/transcribe` | whisper.cpp |
| `internal/jobs` | Job queue in Postgres |
| `internal/db` | Connection and SQL migrations |
| `internal/storage` | S3 storage (MinIO locally) |
| `internal/mail` | SMTP (Mailpit locally) |
| `internal/config` | Settings from environment variables |

See [apps/direct-social/README.md](../../apps/direct-social/README.md) for how
to run it and what it does.
