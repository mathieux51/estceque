import React from 'react'
import Document, {
  Html,
  Main,
  Head,
  NextScript,
  DocumentContext,
} from 'next/document'

import { ServerStyleSheet } from 'styled-components'

const siteURL = 'https://directpodcast.fr'
const title = 'Direct Podcast : enregistrer un podcast en ligne, gratuit'
const description =
  "Je clique, j'autorise l'accès à mon micro, je parle et lorsque j’ai terminé, je clique une seconde fois pour arrêter mon enregistrement. Le fichier sonore se télécharge automatiquement."

// Structured data for search engines (same shape as Direct Montage's).
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Direct Podcast',
  url: siteURL,
  description,
  inLanguage: 'fr',
  applicationCategory: 'MultimediaApplication',
  operatingSystem: 'Tous (navigateur web)',
  isAccessibleForFree: true,
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
}

class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const sheet = new ServerStyleSheet()
    const originalRenderPage = ctx.renderPage

    try {
      ctx.renderPage = () =>
        originalRenderPage({
          enhanceApp: (App) => (props) => {
            return sheet.collectStyles(<App {...props} />)
          },
        })

      const initialProps = await Document.getInitialProps(ctx)
      return {
        ...initialProps,
        styles: (
          <>
            {initialProps.styles}
            {sheet.getStyleElement()}
          </>
        ),
      }
    } finally {
      sheet.seal()
    }
  }
  render() {
    return (
      <Html lang='fr'>
        <Head>
          <link
            href='https://fonts.googleapis.com/css?family=Roboto&display=swap'
            rel='stylesheet'
          />
          <meta charSet='utf-8' />
          <style>{`
            @font-face {
              font-family: 'Antipasto';
              src:
                url('antipasto_extrabold-webfont.woff2') format('woff2'),
                url('antipasto_extrabold-webfont.woff') format('woff');
              font-weight: bold;
              font-style: normal;
              font-display: swap;
            }

            @font-face {
              font-family: 'Antipasto';
              src:
                url('antipasto_extralight-webfont.woff2') format('woff2'),
                url('antipasto_extralight-webfont.woff') format('woff');
              font-weight: lighter;
              font-style: normal;
              font-display: swap;
            }

            @font-face {
              font-family: 'Antipasto';
              src:
                url('antipasto_regular-webfont.woff2') format('woff2'),
                url('antipasto_regular-webfont.woff') format('woff');
              font-weight: normal;
              font-style: normal;
              font-display: swap;
            }
          `}</style>
          <noscript>
            <link
              rel='stylesheet'
              href='https://fonts.googleapis.com/css?family=Roboto&display=swap'
            />
          </noscript>
          <link
            rel='apple-touch-icon'
            sizes='180x180'
            href='/apple-touch-icon.png'
          />
          <link
            rel='icon'
            type='image/png'
            sizes='32x32'
            href='/favicon-32x32.png'
          />
          <link
            rel='icon'
            type='image/png'
            sizes='16x16'
            href='/favicon-16x16.png'
          />
          <link rel='manifest' href='/site.webmanifest' />
          <link rel='mask-icon' href='/safari-pinned-tab.svg' color='#005064' />
          <meta name='msapplication-TileColor' content='#005064' />
          <meta name='theme-color' content='#005064' />
          <meta name='description' content={description} />
          <meta property='og:type' content='website' />
          <meta property='og:site_name' content='Direct Podcast' />
          <meta property='og:locale' content='fr_FR' />
          <meta property='og:title' content={title} />
          <meta property='og:description' content={description} />
          <meta property='og:image' content={`${siteURL}/og-image.png`} />
          <meta property='og:image:width' content='1200' />
          <meta property='og:image:height' content='630' />
          <meta name='twitter:card' content='summary_large_image' />
          <meta name='twitter:title' content={title} />
          <meta name='twitter:description' content={description} />
          <meta name='twitter:image' content={`${siteURL}/og-image.png`} />
          <script
            type='application/ld+json'
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default MyDocument
