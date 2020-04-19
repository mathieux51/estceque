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
    <>
      <GlobalStyle />
      <ErrorBoundary>
        <Main />
      </ErrorBoundary>
    </>
  )
}

export default App
