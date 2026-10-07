import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Built as a static site, served by a Cloudflare Worker on estceque.org.
  output: 'export',
  // Every page is a folder with an index.html: /podcasts/titre/.
  trailingSlash: true,
  images: { unoptimized: true },
}

export default nextConfig
