import React from 'react'
import * as Sentry from '@sentry/browser'
import adapter from 'webrtc-adapter'
import Head from 'next/head'
import Main from '../components/Main'
import isServer from '../helpers/isServer'
import packageJSON from '../package.json'

if (!isServer) {
  if (process.env.NODE_ENV !== 'development') {
    Sentry.init({
      release: packageJSON.version,
      dsn: 'https://d1fd979948f14a358a8b2695c5df3abe@o381364.ingest.sentry.io/5208585',
    })
  }

  Sentry.configureScope((scope) => {
    scope.setExtra(
      'adapter.browserDetails.browser',
      adapter.browserDetails.browser
    )
    scope.setExtra(
      'adapter.browserDetails.version',
      adapter.browserDetails.version
    )
  })
}

function Index() {
  return (
    <React.StrictMode>
      <Head>
        <link rel='canonical' href='https://directpodcast.fr/' />
        <meta property='og:url' content='https://directpodcast.fr/' />
      </Head>
      <Main />
    </React.StrictMode>
  )
}

export default Index
