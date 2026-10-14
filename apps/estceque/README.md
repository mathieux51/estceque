# estceque.org

Site of the association "Est-ce que t'entends ce que je vois ?", on
[estceque.org](https://estceque.org). Code in English, text for visitors in
French. Part of the [estceque monorepo](../../README.md).

## Pages

| Address | Page |
|---|---|
| `/` | Home: services, contact person, ecosystem, latest playlists, projects |
| `/espace-scolaire/` | Workshops in schools (was `/ateliers/`, which redirects) |
| `/studio/` | Espace pro & Recherche, le studio (`#pro`, `#recherche`, `#studio`) |
| `/espace-pedagogique/` | Free tools: Direct Podcast, Direct Montage |
| `/podcasts/`, `/podcasts/<episode>/` | Search over every episode, one page per episode |
| `/projets/`, `/projets/<project>/` | Episodes grouped by project (`lib/projects.ts`) |
| `/oreille-voyageuse/` | The Framacarte sound map and its tales |

## Content

`npm run fetch` downloads the content into `data/` (committed, so builds work
offline): the Ausha feed (episodes), the playlists from the show's Ausha
page, and the map's data from Framacarte. CI runs it before every deploy and
once a day.

## Develop

```bash
npm install
npm run dev        # http://localhost:3003
npm test           # Worker redirects (worker/index.test.ts)
npm run build && npx wrangler dev   # as in production, with the Worker
```

The Worker (`worker/index.ts`) sends http, www and old Blogger addresses to
their canonical address in one redirect and answers 410 for removed blog
posts. See [docs/task-estceque-site.md](../../docs/task-estceque-site.md) and
[docs/todo-estceque-modifications.md](../../docs/todo-estceque-modifications.md).
