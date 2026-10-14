import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import { Roboto } from 'next/font/google'
import './globals.css'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import JsonLd from '@/components/JsonLd'
import {
  BLANDINE,
  CONTACT_EMAIL,
  FACEBOOK_URL,
  INSTAGRAM_URL,
  SITE_NAME,
  SITE_URL,
  show,
} from '@/lib/content'

const antipasto = localFont({
  src: [
    {
      path: '../public/fonts/antipasto_extralight-webfont.woff2',
      weight: '200',
    },
    { path: '../public/fonts/antipasto_regular-webfont.woff2', weight: '400' },
    {
      path: '../public/fonts/antipasto_extrabold-webfont.woff2',
      weight: '800',
    },
  ],
  variable: '--font-antipasto',
  fallback: ['system-ui', 'sans-serif'],
})

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-roboto',
})

const description =
  "Média associatif d'expression par le son, la radio et le podcast dans le Sud-Ouest depuis 2007 : studio de production sonore, podcasts, ateliers d'éducation aux médias avec Blandine Schmidt."

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | Ateliers radio et podcast, éducation aux médias`,
    template: "%s | Est-ce que t'entends",
  },
  description,
  applicationName: SITE_NAME,
  alternates: {
    canonical: '/',
    types: { 'application/rss+xml': [{ url: show.feed, title: SITE_NAME }] },
  },
  openGraph: {
    siteName: SITE_NAME,
    locale: 'fr_FR',
    type: 'website',
    images: [
      { url: '/mascotte.jpeg', width: 1400, height: 1400, alt: SITE_NAME },
    ],
  },
  twitter: { card: 'summary' },
  icons: {
    icon: [{ url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' }],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
}

export const viewport: Viewport = { themeColor: '#005064' }

// The association and its contact person, for search engines.
const organization = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'NGO',
      '@id': `${SITE_URL}/#association`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/mascotte.jpeg`,
      description,
      email: CONTACT_EMAIL,
      foundingDate: '2007',
      areaServed: 'Nouvelle-Aquitaine, France',
      knowsAbout: [
        'Éducation aux médias et à l’information',
        'Radio',
        'Podcast',
        'Webradio scolaire',
        'Création sonore',
        'Identité sonore',
      ],
      employee: { '@id': `${SITE_URL}/#blandine-schmidt` },
      sameAs: [INSTAGRAM_URL, FACEBOOK_URL, show.ausha],
    },
    {
      '@type': 'Person',
      '@id': `${SITE_URL}/#blandine-schmidt`,
      name: BLANDINE.name,
      jobTitle: 'Chargée de projets',
      description: BLANDINE.credentials.join('. ') + '.',
      hasCredential: {
        '@type': 'EducationalOccupationalCredential',
        credentialCategory: 'degree',
        name: "Doctorat en Sciences de l'Information et de la Communication",
      },
      affiliation: [
        { '@type': 'ResearchOrganization', name: 'Laboratoire MICA (UR4426)' },
      ],
      worksFor: { '@id': `${SITE_URL}/#association` },
      knowsAbout: [
        'Radio',
        'Podcast',
        'Éducation aux médias et à l’information',
        'Création sonore',
      ],
      sameAs: [BLANDINE.linkedin, BLANDINE.facebook, BLANDINE.instagram],
    },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang='fr'>
      <body className={`${antipasto.variable} ${roboto.variable} antialiased`}>
        <a
          href='#contenu'
          className='sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:text-brand'
        >
          Aller au contenu
        </a>
        <JsonLd data={organization} />
        <Header />
        <main id='contenu' className='mx-auto max-w-6xl px-4 py-8'>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
