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
    return env.ASSETS.fetch(request)
  },
}

export default worker
