// Tells search engines that use IndexNow (Bing, which ChatGPT search and
// Copilot rely on, Yandex, Seznam...) which pages changed. The key file in
// public/ proves the site is ours.
//   node scripts/indexnow.mjs            every page in the sitemap
//   node scripts/indexnow.mjs --days 2   pages changed in the last 2 days
import { readFile } from 'node:fs/promises'

const KEY = 'f6333978cea98d8cbb536001980d90bd'
const HOST = 'estceque.org'

const days = process.argv.includes('--days')
  ? Number(process.argv[process.argv.indexOf('--days') + 1])
  : null
const since = days ? Date.now() - days * 24 * 3600 * 1000 : 0
const sitemap = await readFile('out/sitemap.xml', 'utf8')
const urls = [...sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g)]
  .map(([, entry]) => ({
    loc: entry.match(/<loc>(.*?)<\/loc>/)?.[1],
    lastmod: entry.match(/<lastmod>(.*?)<\/lastmod>/)?.[1],
  }))
  .filter(
    ({ loc, lastmod }) =>
      loc && (!days || (lastmod && Date.parse(lastmod) >= since))
  )
  .map(({ loc }) => loc)

if (urls.length === 0) {
  process.stdout.write('IndexNow: nothing changed\n')
} else {
  const response = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host: HOST,
      key: KEY,
      keyLocation: `https://${HOST}/${KEY}.txt`,
      urlList: urls,
    }),
  })
  process.stdout.write(
    `IndexNow: ${urls.length} URLs, HTTP ${response.status}\n`
  )
}
