/* eslint @typescript-eslint/no-var-requires: 0 */
// const withPreact = require('next-plugin-preact')
// const withBundleAnalyzer = require('@next/bundle-analyzer')({
//   enabled: process.env.ANALYZE === 'true',
// })

// module.exports = withPreact(
// withBundleAnalyzer({
//   publicRuntimeConfig: {
//     // Will be available on both server and client
//   },
// })
// )
// Built as a static site (served by Cloudflare). "/recuperation" is a page
// that re-exports "/recovery", since rewrites don't exist in a static export.
module.exports = {
  output: 'export',
}
