import type { NextConfig } from 'next'

// The Go API, reached through this app so cookies stay first-party.
const apiURL = process.env.API_URL ?? 'http://localhost:8080'

const nextConfig: NextConfig = {
  output: 'standalone',
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${apiURL}/api/:path*` }]
  },
}

export default nextConfig
