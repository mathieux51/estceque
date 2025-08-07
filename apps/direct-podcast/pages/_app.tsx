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
    box-sizing: border-box;
  }
  
  html {
    font-size: 16px;
    
    @media (max-width: 768px) {
      font-size: 14px;
    }
    
    @media (min-width: 1440px) {
      font-size: 18px;
    }
  }
  
  body {
    line-height: 1.5;
  }

  button {
    background-color: transparent;
    border: none;
    cursor: pointer;
    text-decoration: underline;
    display: inline;
    margin: 0;
    padding: 0;
    transition: all 0.2s ease;
  }

  button:hover,
  button:focus {
    text-decoration: none;
  }
  
  button:focus-visible {
    outline: 2px solid ${(props) => props.theme.grey};
    outline-offset: 2px;
  }
  
  a:focus-visible {
    outline: 2px solid ${(props) => props.theme.grey};
    outline-offset: 2px;
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
