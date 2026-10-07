# Migration from Vercel to Cloudflare

## Objective

Serve Direct Podcast on `directpodcast.fr` and Direct Montage on
`directmontage.fr` from Cloudflare Workers (static assets), deployed by GitHub
Actions from this monorepo, with Cloudflare domains and DNS in Terraform.
Sharing a recording from Direct Podcast to Direct Montage must keep working.

## Progress

- [x] 2026-10-07: Monorepo created; both repositories imported under `apps/`
      with their full git history (git-filter-repo)
- [x] Both apps build as static sites (`output: 'export'`); Vercel files removed
- [x] Direct Podcast: `/recuperation` is now a page re-exporting `/recovery`
- [x] Sharing rewritten for two domains (postMessage between tabs) and tested
      end to end locally (record, share, receive) on two origins
- [x] A Worker per app (`apps/*/worker`, `apps/*/wrangler.jsonc`) with the old
      redirects: `www` to apex, `directpodcast.fr/montage` and
      `montage.directpodcast.fr` to `directmontage.fr`
- [x] CI: one workflow per app, triggered by changes in its folder
- [x] Terraform (`infra/cloudflare`): staging domains, `cutover` flag for the
      production domains; `tofu plan` checked: 5 records to import unchanged,
      2 staging domains to add, nothing destroyed
- [x] 2026-10-07: Token permissions extended (Workers Scripts edit); first
      deploy of both Workers with `npx wrangler deploy`
- [x] `tofu apply`: staging domains `next.directpodcast.fr` and
      `next.directmontage.fr` live (5 records imported, 2 domains added)
- [x] Tested on staging: both sites, `/recuperation`, the `/montage` redirect,
      and sharing a real recording from next.directpodcast.fr to
      next.directmontage.fr
- [x] Cutover (2026-10-07)

## Decisions

- **Two domains, so sharing goes through postMessage.** Browsers keep each
  site's storage separate (and partition storage inside iframes), so the old
  shared IndexedDB cannot work across `directpodcast.fr` and
  `directmontage.fr`. Direct Podcast opens Direct Montage in a new tab during
  the click, waits for its `direct-montage:ready` message, then transfers the
  file. Both sides check the other's exact origin; Direct Montage only accepts
  the tab that opened it. Each app picks its partner's address at runtime
  (production, `next.` staging, or localhost), so one build works everywhere.
- **Workers with static assets** rather than Pages: Cloudflare recommends
  Workers for new projects. The Workers run first on every request
  (`run_worker_first`) to handle redirects; fine for this traffic, revisit if
  it grows past the free 100,000 requests/day.
- **Wrangler deploys code, Terraform owns domains and DNS.** Terraform state is
  local for now (`infra/cloudflare`, gitignored); move it to a remote backend
  (GCS or R2) before several people run it.
- **OpenTofu** is used to run the Terraform configuration.
- **Staging first:** the production domains only move with `cutover = true`.
  Mail records (Cloudflare Email Routing for directpodcast.fr, Gandi for
  directmontage.fr) are never touched.

## Issues

- The token (`CLOUDFLARE_API_TOKEN` in `~/.zshenv`, also a repository secret)
  deploys Workers, attaches domains and could delete the old DNS records,
  even though "DNS: Edit" was not offered when it was updated.
- Direct Podcast is on Next.js 14.0.3, which has critical advisories for
  server-side features. Static export removes the server, but the dependency
  should still be upgraded.

## Next steps

- [x] 2026-10-07: Deploy workflows run with the updated secrets
      (direct-podcast passed)
- [x] 2026-10-07: Cutover done. Old web records removed, production domains
      attached; checked `directpodcast.fr`, `/recuperation`, `directmontage.fr`,
      the redirects (`www`, `/montage`, `montage.directpodcast.fr`), the mail
      records, and sharing a real recording between the two domains.
      `cutover` now defaults to `true`.
- [x] Old repositories archived on GitHub (read-only, reversible)
- [ ] Delete the Vercel projects `direct-podcast` and `direct-montage` once
      nothing points to them (irreversible, so left for a manual decision)
- [ ] Move the Terraform state to a remote backend
- [ ] Upgrade Direct Podcast's dependencies (Next.js 14.0.3)
