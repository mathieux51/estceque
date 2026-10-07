import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import { Roboto } from 'next/font/google'
import './globals.css'
import ErrorBoundary from '@/components/ErrorBoundary'

const antipasto = localFont({
  src: [
    {
      path: '../public/fonts/antipasto_extralight-webfont.woff2',
      weight: '200',
      style: 'normal',
    },
    {
      path: '../public/fonts/antipasto_regular-webfont.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/antipasto_extrabold-webfont.woff2',
      weight: '800',
      style: 'normal',
    },
  ],
  variable: '--font-antipasto',
  fallback: ['system-ui', 'sans-serif'],
})

// Body text, like Direct Podcast; Antipasto is kept for titles and the timer.
const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-roboto',
})

const siteURL = 'https://directmontage.fr'
const title = 'Direct Montage : montage audio en ligne, gratuit'
const description =
  'Montez vos podcasts dans le navigateur : plusieurs pistes, couper, copier, coller, fondus, volume, vumètre, export WAV et MP3. Gratuit, sans inscription, vos sons restent sur votre appareil.'

export const metadata: Metadata = {
  metadataBase: new URL(siteURL),
  title,
  description,
  applicationName: 'Direct Montage',
  alternates: { canonical: '/' },
  robots: { index: true, follow: true },
  openGraph: {
    title,
    description,
    url: '/',
    siteName: 'Direct Montage',
    locale: 'fr_FR',
    type: 'website',
    images: [
      { url: '/og-image.png', width: 1200, height: 630, alt: 'Direct Montage' },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: ['/og-image.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
}

export const viewport: Viewport = {
  themeColor: '#005064',
}

// Structured data for search engines, like Direct Podcast's.
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Direct Montage',
  url: siteURL,
  description,
  inLanguage: 'fr',
  applicationCategory: 'MultimediaApplication',
  operatingSystem: 'Tous (navigateur web)',
  isAccessibleForFree: true,
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
  license: 'https://creativecommons.org/licenses/by-nc-nd/4.0/',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='fr'>
      <body className={`${antipasto.variable} ${roboto.variable} antialiased`}>
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ErrorBoundary>{children}</ErrorBoundary>
      </body>
    </html>
  )
}
