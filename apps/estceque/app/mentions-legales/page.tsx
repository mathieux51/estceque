import type { Metadata } from 'next'
import { CONTACT_EMAIL, SITE_NAME } from '@/lib/content'

export const metadata: Metadata = {
  title: 'Mentions légales',
  description:
    "Mentions légales du site de l'association Est-ce que t'entends ce que je vois ? : éditeur, hébergement, données personnelles et droits.",
  alternates: { canonical: '/mentions-legales/' },
  robots: { index: false, follow: true },
}

export default function Legal() {
  return (
    <div className='max-w-3xl space-y-6'>
      <h1 className='title text-4xl'>Mentions légales</h1>
      <section className='space-y-2'>
        <h2 className='text-xl text-white'>Éditeur</h2>
        <p>
          Association {SITE_NAME}. Contact :{' '}
          <a className='link' href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </section>
      <section className='space-y-2'>
        <h2 className='text-xl text-white'>Hébergement</h2>
        <p>
          Site hébergé par Cloudflare, Inc., 101 Townsend St, San Francisco, CA
          94107, États-Unis.
        </p>
        <p>
          Podcasts hébergés par Ausha. Carte sonore réalisée sur Framacarte
          (Framasoft), contes hébergés par ARTE Radio.
        </p>
      </section>
      <section className='space-y-2'>
        <h2 className='text-xl text-white'>Données personnelles et cookies</h2>
        <p>
          Ce site ne dépose aucun cookie et ne mesure pas l&apos;audience. Les
          lecteurs Ausha et ARTE Radio ne sont chargés que lorsque vous cliquez
          sur « Écouter » ; la carte Framacarte est chargée avec la page. Ces
          services appliquent alors leurs propres conditions.
        </p>
      </section>
      <section className='space-y-2'>
        <h2 className='text-xl text-white'>Droits</h2>
        <p>
          Les créations sonores appartiennent à leurs autrices et auteurs. Sauf
          mention contraire dans leur description, elles ne peuvent pas être
          réutilisées sans autorisation.
        </p>
      </section>
    </div>
  )
}
