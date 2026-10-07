// Serves the static build of estceque.org on Cloudflare, and redirects the
// addresses of the old Blogger blog that used to live here.

interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> }
}

const FEED = 'https://feed.ausha.co/bz3KNSqWZ7nP'

/** Where an address of the old blog should go now, if it was one. */
export function legacyRedirect(url: URL): string | null {
  const path = url.pathname
  // Old blog feeds: the podcast's feed replaces them.
  if (path.startsWith('/feeds/')) return FEED
  // Posts (/2010/02/titre.html), archives (/2010/, /2010_02_01_archive.html)
  // and static pages (/p/page.html) of the blog.
  if (/^\/\d{4}(\/\d{2})?(\/[^/]+\.html)?\/?$/.test(path)) return '/'
  if (/^\/\d{4}_\d{2}_\d{2}_archive\.html$/.test(path)) return '/'
  if (/^\/p\/[^/]+\.html$/.test(path)) return '/'
  if (path === '/search' || path.startsWith('/search/')) {
    const query = url.searchParams.get('q')
    const label = path.match(/^\/search\/label\/([^/]+)/)?.[1]
    const words = query ?? (label ? decodeURIComponent(label) : null)
    return words ? `/podcasts/?q=${encodeURIComponent(words)}` : '/podcasts/'
  }
  return null
}

const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    if (url.hostname === 'www.estceque.org') {
      url.hostname = 'estceque.org'
      return Response.redirect(url.toString(), 301)
    }
    const target = legacyRedirect(url)
    if (target) return Response.redirect(new URL(target, url).toString(), 301)
    const response = await env.ASSETS.fetch(request)
    // next.* shows the same site as production: keep it out of search results.
    if (url.hostname.startsWith('next.')) {
      const copy = new Response(response.body, response)
      copy.headers.set('X-Robots-Tag', 'noindex')
      return copy
    }
    return response
  },
}

export default worker
