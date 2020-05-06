import React from "react"
import { createGlobalStyle, ThemeProvider } from "styled-components"
import { normalize } from "polished"
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3"
import theme from "./theme"
import Main from "./components/Main"
import ErrorBoundary from "./components/ErrorBoundary"

const GlobalStyle = createGlobalStyle`
  ${normalize()}
    * {
      font-family: 'Roboto', sans-serif;
    }

  button {
    background-color: transparent;
    border: none;
    cursor: pointer;
    text-decoration: underline;
    display: inline;
    margin: 0;
    padding: 0;
  }

  button:hover,
  button:focus {
    text-decoration: none;
  }
`

function App() {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <ErrorBoundary>
        <GoogleReCaptchaProvider
          reCaptchaKey={process.env.REACT_APP_RECAPTCHA_CLIENT_SIDE}
          language="fr"
        ></GoogleReCaptchaProvider>
        <Main />
      </ErrorBoundary>
    </ThemeProvider>
  )
}

export default App
