import Link from 'next/link'
import { CONTACT_EMAIL, FACEBOOK_URL, INSTAGRAM_URL, show } from '@/lib/content'

export default function Footer() {
  return (
    <footer className='mt-16 border-t border-grey/30 bg-deep/60'>
      <div className='mx-auto grid max-w-6xl gap-8 px-4 py-10 text-sm sm:grid-cols-3'>
        <div className='space-y-2'>
          <p className='font-display text-lg text-white'>
            Est-ce que t&apos;entends ce que je vois ?
          </p>
          <p>
            Média associatif d&apos;Éducation aux Médias et à l&apos;Information
            par le son, la radio et le podcast, dans le Sud-Ouest de la France.
          </p>
        </div>
        <div className='space-y-2'>
          <p className='text-white'>Contact</p>
          <p>
            <a className='link' href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>
          </p>
          <ul className='space-y-1'>
            <li>
              <a className='hover:text-white' href={INSTAGRAM_URL} rel='me'>
                Instagram
              </a>
            </li>
            <li>
              <a className='hover:text-white' href={FACEBOOK_URL} rel='me'>
                Facebook
              </a>
            </li>
            <li>
              <a className='hover:text-white' href={show.ausha} rel='me'>
                Le podcast sur Ausha
              </a>
            </li>
          </ul>
        </div>
        <div className='space-y-2'>
          <p className='text-white'>Outils libres de l&apos;association</p>
          <ul className='space-y-1'>
            <li>
              <a className='hover:text-white' href='https://directpodcast.fr'>
                Direct Podcast : enregistrer en un clic
              </a>
            </li>
            <li>
              <a className='hover:text-white' href='https://directmontage.fr'>
                Direct Montage : monter en ligne
              </a>
            </li>
          </ul>
          <p className='pt-2'>
            <Link className='hover:text-white' href='/mentions-legales/'>
              Mentions légales
            </Link>
          </p>
        </div>
      </div>
    </footer>
  )
}
