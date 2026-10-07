# estceque

Monorepo of the Est-ce que association's audio tools:

- [`apps/direct-podcast`](apps/direct-podcast): record a podcast in the
  browser, on [directpodcast.fr](https://directpodcast.fr)
- [`apps/direct-montage`](apps/direct-montage): edit it (multitrack editor),
  on [directmontage.fr](https://directmontage.fr)
- [`apps/estceque`](apps/estceque): the association's site, on
  [estceque.org](https://estceque.org) (podcasts, ateliers, sound map)
- [`apps/direct-social`](apps/direct-social) + [`services/social`](services/social):
  Direct Social, a podcast social network (local / Docker only for now)

Direct Podcast and Direct Montage are static Next.js sites served by Cloudflare
Workers. Everything runs in the visitor's browser; they have no backend. The two apps were imported from
their own repositories with their git history (those repositories are now
archived).

## Layout

```
apps/direct-podcast/   Next.js app + worker/ + wrangler.jsonc
apps/direct-montage/   Next.js app + worker/ + wrangler.jsonc
apps/direct-social/    Next.js app of Direct Social
services/social/       Go API and worker of Direct Social (FFmpeg, whisper.cpp)
compose.yaml           Direct Social on localhost (Docker Compose)
infra/cloudflare/      Terraform (run with OpenTofu): domains and DNS
docs/                  Hosting decision and migration notes
.github/workflows/     One deploy workflow per app
```

## Local development

```bash
cd apps/direct-podcast && npm install && npm run dev   # http://localhost:3000
cd apps/direct-montage && npm install && npm run dev   # http://localhost:3001
```

Run both to try "Partager vers Direct Montage": Direct Podcast opens Direct
Montage on port 3001 in a new tab and sends it the recording (see "Sharing").

Direct Social runs with Docker Compose; see
[its README](apps/direct-social/README.md):

```bash
docker compose up --build   # http://localhost:3002
```

To run an app exactly as in production (static build + its Worker):

```bash
npm run build && npx wrangler dev
```

## Deployment

Pushing to `main` deploys the app whose folder changed: GitHub Actions builds
it with Node 24 and runs `wrangler deploy`. A workflow can also be started by
hand ("Run workflow"). The repository secrets `CLOUDFLARE_API_TOKEN` and
`CLOUDFLARE_ACCOUNT_ID` must be set.

Each app's Worker serves its static build and handles the old addresses:

| Address | Goes to |
|---|---|
| `www.directpodcast.fr` | `directpodcast.fr` (301) |
| `directpodcast.fr/montage...` | `directmontage.fr/...` (301) |
| `montage.directpodcast.fr` | `directmontage.fr` (301) |
| `www.directmontage.fr` | `directmontage.fr` (301) |

`next.directpodcast.fr` and `next.directmontage.fr` were the staging addresses
during the migration. They still point to the same Workers, so they show
production, not a separate environment. Their pages are
sent with `X-Robots-Tag: noindex`.

## Infrastructure

Domains and DNS are managed in [`infra/cloudflare`](infra/cloudflare/main.tf)
(Terraform, run with OpenTofu); the Workers' code is deployed by CI.

```bash
cd infra/cloudflare
tofu init
tofu plan    # uses CLOUDFLARE_API_TOKEN from the environment
```

The Terraform state is kept locally (gitignored) for now. Mail records
(Cloudflare Email Routing for directpodcast.fr, Gandi for directmontage.fr)
are not managed here.

The same configuration holds the private R2 bucket `estceque-backups` (EU,
objects locked for a year) in `backups.tf`. `upload-backup.sh` copies a backup
folder into it and checks every file (needs rclone and an API token with
"Workers R2 Storage: Edit"). See
[the backup of the old www.estceque.org](docs/backup-estceque-org.md).

## Sharing a recording from Direct Podcast to Direct Montage

The apps are on different domains, and browsers keep each site's storage
separate, so the recording travels between tabs with `postMessage`:

1. Clicking "Partager vers Direct Montage" opens Direct Montage with
   `?sharing=true` in a new tab.
2. Direct Montage sends `{ type: 'direct-montage:ready' }` to the tab that
   opened it.
3. Direct Podcast checks the sender's origin and replies with
   `{ type: 'direct-podcast:file', filename, fileType, buffer }`.
4. Direct Montage only accepts that message from its opener and from a Direct
   Podcast origin, then adds the recording as a track.

Each app works out its partner's address at runtime (production, `next.`, or
localhost). Code: `apps/direct-podcast/lib/shareToMontage.ts` and
`apps/direct-montage/lib/shareReceiver.ts`.

## Design

Both apps follow Direct Podcast's design system (see
[directpodcast.fr/design-system](https://directpodcast.fr/design-system)):

| Name | Color | Use |
|---|---|---|
| Blue | `#005064` | Page background |
| Grey | `#abb1aa` | Text, icons, borders |
| White | `#ffffff` | Emphasis, secondary buttons |
| Red | `#bf616a` | Errors, danger, saturation |
| Green | `#a3be8c` | Success |
| Yellow | `#ebcb8b` | Warnings, playhead, -12 dB marks |

Body text is Roboto; titles and timers use Antipasto. Direct Podcast keeps
these in `styles/theme.ts` (styled-components), Direct Montage in
`app/globals.css` (Tailwind tokens `brand`, `deep`, `grey`, `danger`,
`success`, `warning`).

## SEO

Both sites are set up the same way for search engines and link previews:

| | Direct Podcast | Direct Montage |
|---|---|---|
| Title, description, canonical URL | `pages/_app.tsx`, `pages/_document.tsx`, `pages/index.tsx` | `metadata` in `app/layout.tsx` |
| Open Graph + Twitter card, 1200x630 image | `public/og-image.png` | `public/og-image.png` |
| Structured data (schema.org `WebApplication`) | `pages/_document.tsx` | `app/layout.tsx` |
| `robots.txt` + `sitemap.xml` | `public/` | `public/` |
| Web manifest, icons, theme colour `#005064` | `public/site.webmanifest` | `public/site.webmanifest` |

- Utility pages (`/recovery`, `/recuperation`, `/design-system`) are marked
  `noindex`.
- The Workers send `X-Robots-Tag: noindex` on the `next.` addresses, which show
  the same site as production, so search engines don't index duplicates.
- Change the sitemaps' `lastmod` when a page changes meaningfully.
- The share images were made from an HTML card in the design system's
  colours and fonts; regenerate them if the tagline changes.

## Docs

- [Hosting: Vercel vs Cloudflare](docs/hosting-vercel-vs-cloudflare.md): why
  Cloudflare, free plan limits, and options for a future backend
- [Migration from Vercel to Cloudflare](docs/migration-vercel-to-cloudflare.md):
  what was done, and what is left
- [Direct Social](docs/task-direct-social.md): goals, architecture, progress
- [estceque.org site](docs/task-estceque-site.md): goals, architecture, progress
- [Backup of the old www.estceque.org](docs/backup-estceque-org.md): what
  was saved before replacing the site, where it is, what is missing
