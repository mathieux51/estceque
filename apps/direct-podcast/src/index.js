import React from "react"
import ReactDOM from "react-dom"
import * as Sentry from "@sentry/browser"
import App from "./App"
import adapter from "webrtc-adapter"
import * as serviceWorker from "./serviceWorker"

if (process.env.NODE_ENV !== "development") {
  Sentry.init({
    dsn:
      "https://578d13ac84a044adb9a24df5edf72615@o379746.ingest.sentry.io/5204959",
  })
}

Sentry.configureScope(function(scope) {
  scope.setExtra("adapter.browserDetails.browser", adapter.browserDetails.browser);
  scope.setExtra("adapter.browserDetails.version", adapter.browserDetails.version);
});


ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById("root")
)

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.register()
