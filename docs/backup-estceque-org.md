# Backup of the old www.estceque.org (2026-10-07)

## Objective

Keep a complete copy of www.estceque.org before it is replaced with a new
project.

## What was running

- A Blogger blog, "Est ce que t'entends ce que je vois ?", on the custom domain
  `www.estceque.org` (Cloudflare DNS: `www` and `*` CNAME to `ghs.google.com`,
  apex A record to Gandi's web redirection, mail MX at Gandi).
- 58 posts (2007 to 2024), 3 pages, 114 comments.
- Audio and documents hosted on the association's old Free.fr site
  (`estceque.asso.free.fr`), linked from the posts.
- Since 2019, the podcast is hosted by Ausha and embedded in the blog. Ausha
  is not affected by replacing the site, but its feed links to
  `http://www.estceque.org/`.
- HTTPS was already broken (Cloudflare error 525: SSL mode "Full", and Blogger
  has no certificate for the domain behind the proxy). Plain HTTP worked.

## The backup

About 1.4 GB, 1,247 files:

| Part | Content |
|---|---|
| `site/` | Offline copy made with wget (342 pages, styles, images) |
| `feeds/` | Posts, pages and comments as JSON (full HTML) and RSS |
| `media/estceque.asso.free.fr/` | 47 MP3 (7.2 hours), 5 PDF, 4 images, 1 Word document |
| `media/blogger/` | 51 images uploaded to Blogger, full size |
| `ausha/` | Ausha feed and 117 episodes (12.1 hours, 2019 to 2026) |
| `dns/` | Cloudflare DNS records of `estceque.org` |
| `README.md`, `SHA256SUMS` | Description and checksums (`shasum -a 256 -c SHA256SUMS`) |

Where it is:

Cloudflare R2: bucket `estceque-backups` (EU jurisdiction, private), under
`estceque.org/2026-10-07/`. Objects are locked for a year (no delete or
overwrite). Bucket and lock are in `infra/cloudflare/backups.tf`; the upload
is `infra/cloudflare/upload-backup.sh`, which checks every file after copying.

R2 is the only copy: the local one on Mathieu's Mac was deleted on 2026-10-07
after a second rclone check by checksum (1,248 files, 0 differences). The
README inside the backup still mentions that local copy; it cannot be edited,
since the bucket is locked.

Cost: R2 gives 10 GB of storage free per month, and downloads are free, so
this costs nothing; above the free tier it would be about $0.02 per month.

The backup is not in this repository: it holds comments and third-party
content, and the repository is public.

To restore it, with rclone set up as in `upload-backup.sh`:
`rclone copy r2:estceque-backups/estceque.org/2026-10-07 ./restore`, then
`shasum -a 256 -c SHA256SUMS` inside `restore`. Single files can also be
downloaded from the R2 page of the Cloudflare dashboard.

R2 had just been enabled when the first upload ran, and the EU endpoint
(`<account>.eu.r2.cloudflarestorage.com`) did not resolve yet; the retry a few
minutes later worked.

## Not included

These need the owners' accounts:

- Blogger's own export (drafts, theme, settings): Blogger → Paramètres → Gérer
  le blog → Sauvegarder le contenu, or Google Takeout.
- Free.fr files that the blog does not link to (the site refuses directory
  listings; the Free account's FTP gives everything).
- Ausha statistics and settings.

## When replacing the site

- Keep the MX records (mail at Gandi) and the Google Search Console TXT record.
- Update the website link in Ausha if the new site moves.
- Redirect the old Blogger addresses (`/YYYY/MM/title.html`, `/p/page.html`)
  so old links and search results keep working.

## Progress

- [x] Feeds, offline copy, media, Ausha episodes and DNS saved locally
      (2026-10-07), files checked (audio decodes, no error pages), checksums
- [x] R2 bucket and lock described in `infra/cloudflare/backups.tf`
- [x] Bucket created (EU jurisdiction, location EEUR) with the one-year lock,
      backup uploaded and checked by rclone: 1,248 files, 0 differences
      (2026-10-07)
- [x] Local copy deleted after a second check against R2 (2026-10-07)
- [ ] Blogger's own export by the blog owner
