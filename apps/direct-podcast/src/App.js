import React from "react"
import { createGlobalStyle, ThemeProvider } from "styled-components"
import { normalize } from "polished"
import theme from "./theme"
import Main from "./components/Main"
import ErrorBoundary from "./components/ErrorBoundary"

const GlobalStyle = createGlobalStyle`
  ${normalize()}
    * {
      font-family: 'Open sans', sans-serif;
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
        <Main />
      </ErrorBoundary>
    </ThemeProvider>
  )
}

export default App
