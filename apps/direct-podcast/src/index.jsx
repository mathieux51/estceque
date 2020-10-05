import './polyfills'
import React from 'react'
import ReactDOM from 'react-dom'
import * as Sentry from '@sentry/browser'
import adapter from 'webrtc-adapter'
import App from './App'
import * as serviceWorker from './serviceWorker'

if (process.env.NODE_ENV !== 'development') {
  Sentry.init({
    release: 'v1.0.18',
    dsn:
      'https://d1fd979948f14a358a8b2695c5df3abe@o381364.ingest.sentry.io/5208585',
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

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
)

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.register()
