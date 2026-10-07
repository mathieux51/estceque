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
- [ ] **Blocked:** the Cloudflare API token lacks write permissions (see Issues)
- [ ] First deploy of both Workers (CI or `npx wrangler deploy`)
- [ ] `tofu apply` (staging domains `next.directpodcast.fr`,
      `next.directmontage.fr`)
- [ ] Test on staging, including sharing between the two staging domains
- [ ] Cutover (see below), then archive the old repositories and Vercel projects

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

- The token in `~/.zshenv` (`CLOUDFLARE_API_TOKEN`) can read the zones, DNS and
  Worker scripts, but `wrangler deploy` fails with "No access to the specified
  resource", and R2 and Worker routes are refused. It needs, for account
  `9a229e2731ac55032b7668065e27deb0`:
  - Account: **Workers Scripts: Edit**, **Account Settings: Read**
  - Zones directpodcast.fr and directmontage.fr: **DNS: Edit**, **Workers
    Routes: Edit**, **Zone: Read**
- Direct Podcast is on Next.js 14.0.3, which has critical advisories for
  server-side features. Static export removes the server, but the dependency
  should still be upgraded.

## Next steps

1. Give the token the permissions above (same token, so CI keeps working).
2. Deploy: push to `main`, or run the workflows by hand ("Run workflow").
3. `cd infra/cloudflare && tofu init && tofu apply` for the staging domains.
4. Test `https://next.directpodcast.fr` and `https://next.directmontage.fr`,
   including "Partager vers Direct Montage".
5. Cutover (a few seconds of downtime between the two commands):
   ```bash
   tofu apply -var cutover=true -target=cloudflare_dns_record.replaced
   tofu apply -var cutover=true
   ```
   Then set `default = true` for `cutover` in `main.tf` and commit.
6. Once production is verified: disable the Vercel deploy workflows, archive
   `mathieux51/direct-podcast` and `mathieux51/direct-montage`, delete the
   Vercel projects.
