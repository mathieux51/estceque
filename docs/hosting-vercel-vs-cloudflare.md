# Hosting: Vercel vs Cloudflare (and what comes next)

Summary of the discussion of 5 to 7 October 2026 about where to host Direct
Podcast and Direct Montage, and how to grow them later. Prices were checked
on the providers' sites at that time; check them again before big decisions.

## Decision

Move both apps from Vercel to Cloudflare (Workers with static assets),
deployed from GitHub Actions, with domains and DNS managed with Terraform
(OpenTofu). Direct Podcast lives on `directpodcast.fr`, Direct Montage on
`directmontage.fr`.

## Why Cloudflare for these two apps

- **Neither app needs a server.** Recording, editing and export all run in the
  browser. Built as static sites (Next.js `output: 'export'`), Next.js only
  runs at build time, which also takes most Next.js security advisories off the
  table (Vercel blocked a deploy on 2026-10-05 for a vulnerable Next.js
  version). Vercel's main strength, running Next.js server features, was unused.
- **DNS was already on Cloudflare** for both domains, so DNS, certificates, CDN
  and hosting are in one place.
- **Fewer platform surprises.** Building in GitHub Actions means we choose the
  Node.js version; Vercel stopped building on Node 18 and rejected a deploy.
- **Cost and terms.** Cloudflare's free static hosting has no bandwidth charges
  and allows commercial use. Vercel's free Hobby plan is non-commercial only
  and has usage limits.

Vercel would be the better choice if the apps start using server features
(server rendering, API routes, middleware, image optimization) and want them
with zero setup, or need automatic preview deployments per branch.

The bug that started this: Direct Podcast proxied `/montage` to an
auto-generated Vercel URL that stayed frozen on an August 2025 build, while CI
only ever made preview deployments.

## Free plan storage limits

| | GitHub Free | Vercel Hobby | Cloudflare Free |
|---|---|---|---|
| Code / site | Repo ideally under 1 GB (under 5 GB strongly recommended); warning above 50 MiB per file, blocked above 100 MiB | Up to 100 MB of source files and 15,000 files per CLI deployment | Up to 20,000 files per deployment, 25 MiB per file |
| File storage | Git LFS: 10 GiB storage + 10 GiB downloads/month; Packages + Actions artifacts: 500 MB shared | Blob: 1 GB storage, 10 GB downloads, 2,000 uploads, 10,000 reads/month; locked 30 days when exceeded | R2: 10 GB storage, 1M writes, 10M reads/month, downloads free |
| Traffic | n/a | 100 GB/month | Static files: free and unlimited |
| Commercial use | Allowed | Not allowed | Allowed |

Recording sizes: WAV 48 kHz mono is about 5.8 MB/min (345 MB/h); MP3 128
kbit/s about 1 MB/min (58 MB/h). R2's free 10 GB holds about 29 hours of WAV
or 170 hours of MP3. Today the apps store nothing on a server: audio stays in
each user's browser (IndexedDB).

## If a backend comes (podcast social network)

For an audio platform, storage costs are similar everywhere; downloads
(listening) are what get expensive. R2 charges nothing for downloads.

| Monthly plays (30 min, 128 kbit/s MP3) | Data | Cloudflare R2 | Google Cloud Storage |
|---|---|---|---|
| 1 million | about 29 TB | $0 | about $2,600 |
| 10 million | about 290 TB | $0 | about $23,500 |

Suggested shape:

- **Files:** an EU-only R2 bucket served from a media subdomain; browsers
  upload directly with pre-signed URLs; R2 is S3-compatible.
- **Processing:** a queue + FFmpeg workers (listening formats, loudness at
  -16 LUFS, waveform peaks, transcripts).
- **Data:** managed Postgres for users, episodes, follows, comments.
- **API:** containers (Go is fine).

### Can it all run on Cloudflare?

- Go runs in **Cloudflare Containers** (any Docker image, paid Workers plan,
  up to 4 vCPU / 12 GiB). In October 2026 they had **no automatic scaling or
  load balancing** yet. Workers themselves only run Go through WebAssembly.
- **D1** (SQLite) is capped at 10 GB per database. **Postgres/MySQL** come from
  PlanetScale, created and billed through Cloudflare (from $5/month), reached
  through **Hyperdrive**.

Estimated all-Cloudflare cost for 1,000 monthly users (100 publishers x 4
episodes of 40 min, 20 plays per user):

| Item | Starter | Production |
|---|---|---|
| Workers paid plan | $5 | $5 |
| Go API in Containers | about $4.50 | about $14 (2 instances, always on) |
| FFmpeg processing | about $2 | about $2 |
| Transcripts (Workers AI Whisper, $0.0005/min) | not used | $8 |
| R2 storage | about $2 | about $15 (after a year) |
| R2 downloads | $0 | $0 |
| Postgres (PlanetScale) | $5 (single node) | $30 (3 nodes, failover) |
| **Total** | **about $19/month** | **about $74/month** |

Writing the API in TypeScript as a Worker and using D1 instead would cost
about $9/month at this size.

### Cheaper: one server + Cloudflare

| | Monthly (excl. VAT) |
|---|---|
| OVH VPS-1 (2 vCores, 4 GB, France) | €3.81 |
| OVH VPS-2 (4 vCores, 8 GB, France) | €7.21 |
| Hetzner CX23 / CAX11 (after the 2026 price rises) | €5.49 / €5.99 (+€0.50 IPv4) |
| Hetzner bare metal (AX41/EX44 limited, AX42) | €57.30, €97.30 |
| Hetzner Storage Box BX11 (1 TB, backups) | €3.20 |

## Recommended plan

1. **Now:** both apps as static sites on Cloudflare (this repository).
2. **When the backend starts (about €12/month at 1,000 users):** one OVH VPS-2
   in France running the Go API, Postgres and the FFmpeg worker (Docker
   Compose, jobs in Postgres with River), behind Cloudflare (DNS, CDN, Tunnel,
   no open ports); audio in an EU-only R2 bucket.
3. **Backups:** pgBackRest with continuous WAL archiving (about 1 minute of data
   at risk), weekly full + daily differential, encrypted, to two places outside
   OVH: an R2 bucket with a bucket lock and a Hetzner Storage Box. Weekly
   automatic restore test, freshness alerts, rebuild with OpenTofu +
   cloud-init. (OVH's Strasbourg datacenter burned down in 2021: backups must
   not live with the server.)
4. **Later, on signals:** a standby server with streaming replication when
   downtime starts to hurt (+€3.81), VPS-3 when the server is busy, bare metal
   or managed Postgres when the database outgrows it, Cloudflare Containers
   once they scale automatically. Audio stays on R2 at every stage.

## Sources

- [Cloudflare R2 pricing](https://developers.cloudflare.com/r2/pricing/)
- [Cloudflare Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/) and [limits](https://developers.cloudflare.com/workers/platform/limits/)
- [Cloudflare Containers pricing](https://developers.cloudflare.com/containers/pricing/), [limits](https://developers.cloudflare.com/containers/platform-details/limits/), [scaling](https://developers.cloudflare.com/containers/platform-details/scaling-and-routing/)
- [D1 limits](https://developers.cloudflare.com/d1/platform/limits/), [Hyperdrive](https://developers.cloudflare.com/hyperdrive/), [PlanetScale via Cloudflare billing](https://developers.cloudflare.com/changelog/post/2026-06-18-planetscale-databases-cloudflare-billing/), [PlanetScale pricing](https://planetscale.com/pricing)
- [R2 bucket locks](https://developers.cloudflare.com/r2/buckets/bucket-locks/), [R2 data location](https://developers.cloudflare.com/r2/reference/data-location/)
- [Vercel limits](https://vercel.com/docs/limits), [fair use](https://vercel.com/docs/limits/fair-use-guidelines), [Blob pricing](https://vercel.com/docs/vercel-blob/usage-and-pricing)
- [GitHub large files](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github), [Git LFS billing](https://docs.github.com/en/billing/concepts/product-billing/git-lfs), [Packages billing](https://docs.github.com/en/billing/concepts/product-billing/github-packages)
- [OVHcloud VPS](https://www.ovhcloud.com/fr/vps/), [Hetzner price adjustment](https://docs.hetzner.com/general/infrastructure-and-availability/price-adjustment/)
- [pgBackRest](https://pgbackrest.org/)
