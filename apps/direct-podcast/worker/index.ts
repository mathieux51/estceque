// Serves the static build of Direct Podcast on Cloudflare, with two redirects
// that Vercel used to handle.

interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> }
}

const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    if (url.hostname === 'www.directpodcast.fr') {
      url.hostname = 'directpodcast.fr'
      return Response.redirect(url.toString(), 301)
    }
    // Direct Montage used to live under /montage; it now has its own domain.
    if (url.pathname === '/montage' || url.pathname.startsWith('/montage/')) {
      const montage = url.hostname.startsWith('next.')
        ? 'https://next.directmontage.fr'
        : 'https://directmontage.fr'
      const path = url.pathname.slice('/montage'.length) || '/'
      return Response.redirect(`${montage}${path}${url.search}`, 301)
    }
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
