// Serves the static build of Direct Montage on Cloudflare.

interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> }
}

const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    // Old address and www both go to the main domain.
    if (
      url.hostname === 'montage.directpodcast.fr' ||
      url.hostname === 'www.directmontage.fr'
    ) {
      url.hostname = 'directmontage.fr'
      return Response.redirect(url.toString(), 301)
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
