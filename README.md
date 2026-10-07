# estceque

Monorepo of the Est-ce que association's audio tools:

- [`apps/direct-podcast`](apps/direct-podcast): record a podcast in the
  browser, served on [directpodcast.fr](https://directpodcast.fr)
- [`apps/direct-montage`](apps/direct-montage): edit it (multitrack editor),
  served on [directmontage.fr](https://directmontage.fr)

Both are static sites hosted on Cloudflare Workers. Their git history was kept
when they were imported.

## Layout

```
apps/direct-podcast/   Next.js app + worker/ + wrangler.jsonc
apps/direct-montage/   Next.js app + worker/ + wrangler.jsonc
infra/cloudflare/      Terraform (OpenTofu): domains and DNS
docs/                  Hosting decision and migration notes
.github/workflows/     One deploy workflow per app
```

## Local development

```bash
cd apps/direct-podcast && npm install && npm run dev   # http://localhost:3000
cd apps/direct-montage && npm install && npm run dev   # http://localhost:3001
```

"Partager vers Direct Montage" opens Direct Montage on port 3001 in a new tab
and sends it the recording (see "Sharing" below). To try the production
Workers locally: `npm run build && npx wrangler dev` in an app.

## Deployment

Pushing to `main` deploys the app whose folder changed: GitHub Actions builds
it with Node 24 and runs `wrangler deploy`. The repository needs the secrets
`CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.

Domains are attached with Terraform:

```bash
cd infra/cloudflare
tofu init
tofu apply   # uses CLOUDFLARE_API_TOKEN from the environment
```

See [docs/migration-vercel-to-cloudflare.md](docs/migration-vercel-to-cloudflare.md)
for the staging domains and the switch of the production domains.

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

Code: `apps/direct-podcast/lib/shareToMontage.ts` and
`apps/direct-montage/lib/shareReceiver.ts`.

## Docs

- [Hosting: Vercel vs Cloudflare](docs/hosting-vercel-vs-cloudflare.md)
- [Migration notes](docs/migration-vercel-to-cloudflare.md)
