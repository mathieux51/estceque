// Fetches the site's content and writes it to data/*.json:
// - the Ausha podcast feed (show and episodes, with their players)
// - the data layers of the "L'oreille voyageuse" Framacarte map
// The snapshot is committed, so the site builds without network access;
// CI runs this script before every deploy to pick up new episodes.
import { writeFile } from 'node:fs/promises'
import { XMLParser } from 'fast-xml-parser'

const FEED_URL = 'https://feed.ausha.co/bz3KNSqWZ7nP'
const MAP_ID = 239008
const MAP_URL = 'https://framacarte.org/fr/map/l-oreille-voyageuse_239008'
const HOSTING_NOTICE = /H[ée]berg[ée] par Ausha\.?.*$/s

const decodeEntities = (text) =>
  text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) =>
      String.fromCodePoint(parseInt(code, 16))
    )

/** Turns the feed's HTML into paragraphs of plain text. */
function toParagraphs(html) {
  const text = decodeEntities(
    String(html ?? '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|li|h\d)>/gi, '\n\n')
      .replace(/<li[^>]*>/gi, '• ')
      .replace(/<[^>]+>/g, '')
  )
    .replace(HOSTING_NOTICE, '')
    .replace(/[ \t]+/g, ' ')
  return text
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s*\n\s*/g, '\n').trim())
    .filter(Boolean)
}

/** "10:42" or "1:02:03" or "642" as seconds. */
function toSeconds(value) {
  if (value === undefined || value === null || value === '') return null
  const parts = String(value).split(':').map(Number)
  if (parts.some((p) => !Number.isFinite(p))) return null
  return parts.reduce((total, p) => total * 60 + p, 0)
}

const asArray = (value) =>
  value === undefined ? [] : Array.isArray(value) ? value : [value]

async function fetchText(url) {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'estceque.org site build' },
  })
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`)
  return response.text()
}

async function fetchPodcast() {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
    textNodeName: 'text',
  })
  const channel = parser.parse(await fetchText(FEED_URL)).rss.channel
  const value = (node) =>
    typeof node === 'object' && node !== null ? node.text : node
  const episodes = asArray(channel.item).map((item) => {
    const audioUrl = item.enclosure.url.split('?')[0]
    // The Ausha player identifies an episode by the name of its audio file.
    const playerId = audioUrl
      .split('/')
      .pop()
      .replace(/\.mp3$/, '')
    const link = value(item.link)
    return {
      id: playerId,
      slug: decodeURIComponent(link.split('/').pop()),
      title: value(item.title).trim(),
      paragraphs: toParagraphs(
        value(item['content:encoded']) ?? value(item.description)
      ),
      publishedAt: new Date(value(item.pubDate)).toISOString(),
      durationSeconds: toSeconds(value(item['itunes:duration'])),
      season: Number(value(asArray(item['itunes:season'])[0])) || null,
      image: asArray(item['itunes:image'])[0]?.href?.split('?')[0] ?? null,
      audioUrl,
      audioBytes: Number(item.enclosure.length) || null,
      ausha: link,
    }
  })
  const show = {
    title: value(channel.title),
    paragraphs: toParagraphs(value(channel.description)),
    image: asArray(channel['itunes:image'])[0]?.href?.split('?')[0] ?? null,
    feed: FEED_URL,
    ausha: 'https://podcast.ausha.co/estceque',
  }
  return { show, episodes }
}

async function fetchMap() {
  const page = await fetchText(MAP_URL)
  const match =
    page.match(/data-settings='([^']+)'/) ??
    page.match(/data-settings="([^"]+)"/)
  if (!match) throw new Error('map settings not found')
  const settings = JSON.parse(decodeEntities(match[1]))
  const layers = settings.properties.datalayers
  const places = []
  for (const layer of layers) {
    const data = JSON.parse(
      await fetchText(
        `https://framacarte.org/fr/datalayer/${MAP_ID}/${layer.id}/`
      )
    )
    for (const feature of data.features) {
      if (feature.geometry?.type !== 'Point') continue
      const description = String(feature.properties.description ?? '')
      // Tales link to their ArteRadio player as {{{url|size}}}.
      const embed = description.match(/\{\{\{(https:\/\/[^|}]+)/)?.[1] ?? null
      places.push({
        name: String(feature.properties.name ?? '').trim(),
        longitude: feature.geometry.coordinates[0],
        latitude: feature.geometry.coordinates[1],
        text: toParagraphs(
          description
            .replace(/\{\{\{[^}]+\}\}\}/g, '')
            .replace(/\{\{[^}]+\}\}/g, '')
            .replace(/\*\*([^*]+)\*\*/g, '$1')
            .replace(/\n/g, '<br>')
        ).join('\n'),
        player: embed,
      })
    }
  }
  const intro = toParagraphs(
    String(settings.properties.description ?? '')
      .replace(/\{\{[^}]+\}\}/g, '')
      .replace(/^#+\s*/gm, '')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\n/g, '\n\n')
  )
  return {
    title: "L'oreille voyageuse",
    url: MAP_URL,
    intro,
    places: places.filter((place) => place.name),
  }
}

const [podcast, map] = await Promise.all([fetchPodcast(), fetchMap()])
podcast.episodes.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
await writeFile('data/podcast.json', JSON.stringify(podcast, null, 1) + '\n')
await writeFile('data/map.json', JSON.stringify(map, null, 1) + '\n')
process.stdout.write(
  `${podcast.episodes.length} episodes, ${map.places.length} map places\n`
)
