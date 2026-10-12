// Serves the static build of estceque.org on Cloudflare, and answers the
// addresses of the old Blogger blog that used to live here.
//
// Every address gets its final answer in one step (search engines dislike
// chains of redirects):
// - http, www, Blogger's ?m=1 and pages without their final "/" are all
//   fixed by a single 301 to the canonical address;
// - old blog addresses with an equivalent here are redirected to it;
// - old posts and archives, which have no equivalent, answer 410 Gone with a
//   page explaining that the blog was replaced, so search engines drop them.

interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> }
}

const HOST = 'estceque.org'
const FEED = 'https://feed.ausha.co/bz3KNSqWZ7nP'

// Query parameters added by Blogger (mobile version, comments, paging).
const BLOGGER_PARAMS = [
  'm',
  'showComment',
  'updated-max',
  'updated-min',
  'max-results',
  'reverse-paginate',
  'by-date',
  'start',
  'zx',
  'widgetType',
  'action',
]

export type Answer =
  | { kind: 'redirect'; location: string }
  | { kind: 'gone' }
  | { kind: 'serve'; url: URL }

/** What an address of the old blog became: a new address, or nothing. */
export function legacyTarget(url: URL): string | 'gone' | null {
  const path = url.pathname
  // Old blog feeds: the podcast's feed replaces them.
  if (path.startsWith('/feeds/')) return FEED
  if (path === '/search' || path.startsWith('/search/')) {
    const query = url.searchParams.get('q')
    const label = path.match(/^\/search\/label\/([^/]+)/)?.[1]
    const words = query ?? (label ? decodeURIComponent(label) : null)
    return words ? `/podcasts/?q=${encodeURIComponent(words)}` : '/podcasts/'
  }
  if (path === '/p/contact.html') return '/#contact'
  if (path === '/p/recherche.html') return '/podcasts/'
  // Posts (/2010/02/titre.html), archives (/2010/, /2010/02/,
  // /2010_02_01_archive.html) and the other static pages (/p/page.html).
  if (/^\/\d{4}(\/\d{2})?(\/[^/]+\.html)?\/?$/.test(path)) return 'gone'
  if (/^\/\d{4}_\d{2}_\d{2}_archive\.html$/.test(path)) return 'gone'
  if (/^\/p\/[^/]+\.html$/.test(path)) return 'gone'
  return null
}

/** The answer to a request, decided once. */
export function route(requestUrl: string): Answer {
  const url = new URL(requestUrl)
  const local = url.hostname === 'localhost' || url.hostname === '127.0.0.1'
  // Canonical scheme and host (next.* and local previews keep theirs).
  const canonical = new URL(url)
  if (!local) canonical.protocol = 'https:'
  if (url.hostname === `www.${HOST}`) canonical.hostname = HOST

  const legacy = legacyTarget(url)
  if (legacy === 'gone') return { kind: 'gone' }
  if (legacy) {
    return {
      kind: 'redirect',
      location: new URL(legacy, canonical.origin).toString(),
    }
  }

  for (const name of BLOGGER_PARAMS) canonical.searchParams.delete(name)
  // Pages live at addresses ending with "/" (the assets handler would answer
  // with a temporary 307).
  const last = canonical.pathname.split('/').pop() ?? ''
  if (last && !last.includes('.')) canonical.pathname += '/'

  if (canonical.toString() !== url.toString()) {
    return { kind: 'redirect', location: canonical.toString() }
  }
  return { kind: 'serve', url }
}

const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const answer = route(request.url)
    if (answer.kind === 'redirect')
      return Response.redirect(answer.location, 301)
    if (answer.kind === 'gone') {
      const page = await env.ASSETS.fetch(
        new Request(new URL('/ancien-blog/', request.url))
      )
      return new Response(page.body, {
        status: 410,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'X-Robots-Tag': 'noindex',
        },
      })
    }
    const response = await env.ASSETS.fetch(request)
    // next.* shows the same site as production: keep it out of search results.
    if (answer.url.hostname.startsWith('next.')) {
      const copy = new Response(response.body, response)
      copy.headers.set('X-Robots-Tag', 'noindex')
      return copy
    }
    return response
  },
}

export default worker
