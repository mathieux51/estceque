import React from 'react'
import { AppProps } from 'next/app'
import theme from '../styles/theme'
import { createGlobalStyle, ThemeProvider } from 'styled-components'
import { normalize } from 'polished'
import ErrorBoundary from '../components/ErrorBoundary'
import Head from 'next/head'

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

function App(props: AppProps) {
  const { Component, pageProps } = props
  return (
    <>
      <Head>
        <meta name='viewport' content='width=device-width, initial-scale=1' />
        <title>Direct podcast</title>
      </Head>
      <ThemeProvider theme={theme}>
        <GlobalStyle />
        <ErrorBoundary>
          <Component {...pageProps} />
        </ErrorBoundary>
      </ThemeProvider>
    </>
  )
}

export default App
