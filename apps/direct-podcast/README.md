# Direct Podcast

Record a podcast in the browser, on [directpodcast.fr](https://directpodcast.fr).
Recordings are saved as WAV or MP3, kept in the browser (IndexedDB) for
recovery, and can be sent to [Direct Montage](../direct-montage) to edit.

Part of the [estceque monorepo](../../README.md).

## Getting started

```bash
npm install
npm run dev     # http://localhost:3000
```

Run Direct Montage on port 3001 at the same time to try "Partager vers Direct
Montage" locally.

## Build and deploy

```bash
npm run build       # static site in out/ (Node 24)
npx wrangler dev    # serve it with its Worker, as in production
```

Pushing to `main` deploys it to Cloudflare (`.github/workflows/direct-podcast.yml`
at the root of the monorepo). The Worker (`worker/index.ts`) redirects
`www.directpodcast.fr` and the old `/montage` addresses.

Pages:

- `/`: recorder
- `/recovery` (also `/recuperation`): recover recordings that were interrupted
  (`noindex`)
- `/design-system`: colors, typography and components shared with Direct Montage
  (`noindex`)

SEO: the title is in `pages/_app.tsx`; description, Open Graph / Twitter tags
and structured data in `pages/_document.tsx`; the canonical URL in
`pages/index.tsx`; the share image, `robots.txt`, `sitemap.xml` and web
manifest in `public/`. See the SEO section of the
[monorepo README](../../README.md#seo).

## dev sub domain

A Cloudflare Tunnel exposes the local dev server on `dev.directpodcast.fr`
(useful to test the microphone on a phone over HTTPS):

```sh
cloudflared login
cloudflared tunnel create directpodcast
cloudflared tunnel route dns directpodcast dev
cloudflared tunnel --config=.cloudflared/config.yml run directpodcast
```

## Related

- [Guide to Safari webrtc](https://webrtchacks.com/guide-to-safari-webrtc/)
- [webrtc samples](https://webrtc.github.io/samples/)
- [getusermedia](https://github.com/webrtc/samples/blob/gh-pages/src/content/getusermedia/audio/js/main.js)
- [webrtc tutorial](https://codelabs.developers.google.com/codelabs/webrtc-web/#2)
