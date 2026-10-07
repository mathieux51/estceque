# estceque.org: new landing site

## Objective

Replace the old Blogger blog on www.estceque.org (backed up, see
[backup-estceque-org.md](backup-estceque-org.md)) with a new site for the
association "Est-ce que t'entends ce que je vois ?":

- `estceque.org` is the address; `www.estceque.org` redirects to it
- SEO friendly, with a strong emphasis on radio and podcast teaching by
  Blandine Schmidt (workshops in schools, universities and social structures)
- Content based on the Ausha show description
  (https://podcast.ausha.co/estceque)
- The Ausha podcast integrated, with search to find any episode's player
- The "L'oreille voyageuse" Framacarte map integrated
- Code in English, user-facing text in French

## Architecture

- `apps/estceque`: Next.js static site (`output: 'export'`), served by a
  Cloudflare Worker with static assets, like Direct Podcast and Direct Montage
- Content is fetched at build time (`npm run fetch`): the Ausha RSS feed
  (episodes, players) and the map's data layers. The JSON snapshot is committed
  so builds work offline; CI refreshes it before each deploy and once a day, so
  new Ausha episodes appear without a code change
- One page per episode and per project (Radio Alternante, Fréquences
  migrantes...) for search engines, with schema.org data
- Episode players are Ausha iframes loaded on click (fast pages, no third-party
  requests until someone listens)
- The Worker redirects `www` and the old Blogger addresses
- Domains: `infra/cloudflare/estceque.tf` (staging `next.estceque.org`, then
  cutover of `estceque.org` and `www.estceque.org`), keeping the mail records

## Progress

- [x] Content fetch script (Ausha feed: 117 episodes; map: 9 places) (2026-10-07)
- [x] Projects (15 groups, every episode matched), audiences and search
- [x] Pages: home, podcasts + search, 117 episode pages, 15 project pages,
      ateliers, map, legal, 404
- [x] SEO: metadata, canonical, Open Graph, JSON-LD (NGO, Person, Service,
      FAQPage, PodcastSeries, PodcastEpisode, BreadcrumbList), sitemap (137
      URLs), robots
- [x] Worker (www and old Blogger redirects), wrangler config, CI workflow
      with daily rebuild
- [x] Browser checks (desktop, mobile): search, filters, players, map
- [x] Staging: Worker deployed, `next.estceque.org` attached (noindex)
- [ ] Cutover: `tofu apply -var estceque_cutover=true` (removes the Blogger
      and Gandi web records, attaches estceque.org and www.estceque.org)
- [ ] After cutover: Search Console (new sitemap), Ausha website link

## Decisions

- Projects are defined in code (`lib/projects.ts`), matched on episode titles:
  Ausha's season numbers do not follow the projects.
- Descriptions from Ausha are turned into plain text paragraphs with links,
  not injected as HTML.

## Issues

- Blandine Schmidt is credited on a project page only when its episodes credit
  her (Radio Aliénor and Radio Nautilus only name the association).
- Her doctorate and CLEMI role come from the episode credits (18 and 6
  episodes).
- The legal page lacks the association's registered address and the name of
  the publication director: to add when known.

## Next Steps

- Build the items above, deploy to `next.estceque.org`, then switch the
  domains.
