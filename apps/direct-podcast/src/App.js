import React from "react"
import { createGlobalStyle } from "styled-components"
import { normalize } from "polished"
import Main from "./components/Main"
import ErrorBoundary from "./components/ErrorBoundary"

const GlobalStyle = createGlobalStyle`
  ${normalize()}
  * {
    font-family: 'Open Sans', sans-serif;
  }
`

function App() {
  return (
    <>
      <GlobalStyle />
      <ErrorBoundary>
        <Main />
      </ErrorBoundary>
    </>
  )
}

export default App
