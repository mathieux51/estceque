import ContactPerson from '@/components/ContactPerson'
import Examples from '@/components/Examples'
import JsonLd from '@/components/JsonLd'
import { CONTACT_EMAIL, SITE_URL } from '@/lib/content'
import { pageMetadata } from '@/lib/seo'

const description =
  "Le studio de l'association Est-ce que t'entends ce que je vois ? : accompagnement et production de podcasts pour les professionnels, les institutions et la recherche, identité sonore, habillage sonore et jingles, plateau radio live."

export const metadata = pageMetadata({
  title: 'Espace pro & Recherche : le studio',
  description,
  path: '/studio/',
})

// Sections of this page, also linked from the home page's "Notre écosystème".
const sections = [
  {
    id: 'pro',
    title: 'Espace pro',
    lead: 'Accompagnement & production de podcasts pour les professionnels et les institutions.',
    examples: [
      { label: 'Vignes & Vérités', href: '/projets/vignes-et-verites/' },
    ],
  },
  {
    id: 'recherche',
    title: 'Espace recherche',
    lead: 'Accompagnement & production de podcasts scientifiques et de vulgarisation scientifique.',
    examples: [
      { label: 'Les podcasts du savoir', href: '/projets/podcasts-du-savoir/' },
      { label: 'Traversées', href: '/projets/traversees/' },
      { label: "L'oreille voyageuse", href: '/oreille-voyageuse/' },
    ],
  },
]

const services = [
  {
    title: 'Production de podcasts',
    text: "De l'écriture à la diffusion : enregistrement, montage, mixage et publication.",
    examples: [] as { label: string; href: string }[],
  },
  {
    title: 'Identité sonore, habillage sonore, jingles',
    text: 'Une signature sonore pour votre podcast, votre émission ou votre structure.',
    examples: [
      {
        label: 'Jingle de Fréquences migrantes',
        href: '/podcasts/jingle-podcast-frequences-migrantes/',
      },
      {
        label: 'Jingle de Traversées',
        href: '/podcasts/jingle-podcast-traversees-universite-bordeaux-montaigne/',
      },
    ],
  },
  {
    title: 'Studio de radio mobile, plateau radio live',
    text: 'Une émission en conditions de direct, dans vos murs.',
    examples: [
      {
        label: 'Radio Nautilus en direct',
        href: '/podcasts/radio-nautilus-emission-live-du-24-06-2024-ecole-elementaire-jules-verne-villenave-d-ornon/',
      },
      {
        label: 'Radio Aliénor en direct',
        href: '/podcasts/radio-alienor-emission-live-du-25-06-2024/',
      },
    ],
  },
  {
    title: 'Accompagnement de projets numériques et diffusion',
    text: "Publication sur les plateformes d'écoute, cartographie sonore, mise en ligne.",
    examples: [{ label: "L'oreille voyageuse", href: '/oreille-voyageuse/' }],
  },
]

export default function Studio() {
  return (
    <div className='space-y-14'>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Service',
          name: 'Studio de production sonore et de podcasts',
          serviceType: 'Production de podcasts, identité sonore',
          provider: { '@id': `${SITE_URL}/#association` },
          areaServed: 'France',
          description,
          url: `${SITE_URL}/studio/`,
        }}
      />
      <section className='space-y-4'>
        <h1 className='title text-4xl leading-tight'>
          Espace pro & Recherche
          <span className='block text-2xl sm:text-3xl'>Le studio</span>
        </h1>
        <p className='max-w-3xl text-lg'>
          Le studio de l&apos;association accompagne les professionnels, les
          institutions et les équipes de recherche dans la production de leurs
          podcasts, de l&apos;idée à la diffusion.
        </p>
        <a
          className='btn-primary'
          href={`mailto:${CONTACT_EMAIL}?subject=Production%20de%20podcast`}
        >
          Parler de votre projet
        </a>
      </section>

      {sections.map((section) => (
        <section
          key={section.id}
          id={section.id}
          aria-labelledby={`${section.id}-titre`}
          className='scroll-mt-6 space-y-3'
        >
          <h2 id={`${section.id}-titre`} className='section-title'>
            {section.title}
          </h2>
          <p className='max-w-3xl text-lg'>{section.lead}</p>
          <Examples items={section.examples} />
        </section>
      ))}

      <section
        id='studio'
        aria-labelledby='studio-titre'
        className='scroll-mt-6 space-y-4'
      >
        <h2 id='studio-titre' className='section-title'>
          Le studio
        </h2>
        <p className='max-w-3xl text-lg'>
          Production de podcasts, accompagnement de projets numériques, création
          d&apos;identité sonore, diffusion.
        </p>
        <div className='grid gap-4 sm:grid-cols-2'>
          {services.map((service) => (
            <div key={service.title} className='card space-y-2'>
              <h3 className='font-display text-xl text-white'>
                {service.title}
              </h3>
              <p>{service.text}</p>
              {service.examples.length > 0 && (
                <Examples items={service.examples} />
              )}
            </div>
          ))}
        </div>
      </section>

      <ContactPerson />
    </div>
  )
}
