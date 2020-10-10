const SentryCli = require('@sentry/cli')
const packageJSON = require('../package.json')

const cli = new SentryCli()
async function main() {
  try {
    const release = packageJSON.version
    console.log(`Creating sentry release ${release}`)
    await cli.releases.new(release)
    console.log('Uploading source maps')
    await cli.releases.uploadSourceMaps(release, {
      include: ['build/static/js'],
      urlPrefix: '~/static/js',
      rewrite: false,
    })
    console.log('Finalizing release')
    await cli.releases.finalize(release)
  } catch (error) {
    console.error('Source maps uploading failed:', error)
  }
}

main()
