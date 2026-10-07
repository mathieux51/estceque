import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { Roboto } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'
import PlayerBar from '@/components/PlayerBar'
import { SessionProvider } from '@/lib/session'
import { PlayerProvider } from '@/lib/player'

const antipasto = localFont({
  src: [
    { path: '../public/fonts/antipasto_extralight-webfont.woff2', weight: '200', style: 'normal' },
    { path: '../public/fonts/antipasto_regular-webfont.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/antipasto_extrabold-webfont.woff2', weight: '800', style: 'normal' },
  ],
  variable: '--font-antipasto',
  fallback: ['system-ui', 'sans-serif'],
})

const roboto = Roboto({ subsets: ['latin'], weight: ['400', '500', '700'], variable: '--font-roboto' })

export const metadata: Metadata = {
  title: { default: 'Direct Social', template: '%s · Direct Social' },
  description: 'Partagez, écoutez et commentez des podcasts. Retrouvez un épisode en le faisant écouter.',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang='fr'>
      <body className={`${antipasto.variable} ${roboto.variable} min-h-screen antialiased`}>
        <SessionProvider>
          <PlayerProvider>
            <Header />
            <main className='mx-auto w-full max-w-5xl px-4 pt-6 pb-36'>{children}</main>
            <footer className='mx-auto max-w-5xl px-4 pb-32 text-center text-xs text-grey/70'>
              D’après une idée originale de Blandine Schmidt
            </footer>
            <PlayerBar />
          </PlayerProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
