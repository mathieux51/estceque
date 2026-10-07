import type { Metadata } from 'next'
import Link from 'next/link'
import JsonLd from '@/components/JsonLd'
import ProjectCard from '@/components/ProjectCard'
import { CONTACT_EMAIL, SITE_URL, projectsWithEpisodes } from '@/lib/content'
import { AUDIENCES, type Audience } from '@/lib/projects'

const description =
  "Ateliers radio, webradio et podcast animés par Blandine Schmidt pour les écoles, collèges, lycées, universités et structures sociales du Sud-Ouest. Éducation aux médias et à l'information par le son, référencés Pass Culture (Adage)."

export const metadata: Metadata = {
  title: 'Ateliers radio et podcast avec Blandine Schmidt',
  description,
  alternates: { canonical: '/ateliers/' },
  openGraph: {
    title: 'Ateliers radio et podcast avec Blandine Schmidt',
    description,
    url: '/ateliers/',
  },
}

const steps = [
  [
    'Écrire',
    'Choisir un sujet, se documenter (parfois aux archives), écrire chroniques, interviews ou scénarios.',
  ],
  [
    'Enregistrer',
    'Prendre le micro : prise de son, interview, micro-trottoir, mise en voix.',
  ],
  [
    'Monter',
    'Monter et mixer avec des ambiances, des bruitages et des musiques libres de droits.',
  ],
  [
    'Diffuser',
    "Émission en direct ou podcast publié sur Ausha et les applications d'écoute.",
  ],
]

const faq = [
  {
    question:
      "Comment organiser un atelier radio ou podcast avec l'association ?",
    answer: `Écrivez à ${CONTACT_EMAIL} en présentant votre établissement ou votre structure, votre public et votre projet. L'association construit l'atelier avec vous.`,
  },
  {
    question: "L'association est-elle référencée Pass Culture ?",
    answer:
      "Oui. Est-ce que t'entends ce que je vois ? est référencée Pass Culture sur Adage, ce qui permet aux établissements scolaires de financer les ateliers avec la part collective du Pass Culture.",
  },
  {
    question: 'Pour quels publics sont les ateliers ?',
    answer:
      "Écoles primaires, collèges (y compris dispositifs ULIS et UPE2A), lycées professionnels, universités et formation doctorale, médiathèques, structures sociales et professionnels. Les productions sont publiées dans le podcast de l'association.",
  },
  {
    question: 'Que deviennent les productions des participants ?',
    answer:
      "Elles sont publiées dans le podcast « Est-ce que t'entends ce que je vois ? » sur Ausha et sur ce site, avec une page par épisode, pour être écoutées et partagées.",
  },
]

export default function Workshops() {
  const groups = projectsWithEpisodes()
  const byAudience = new Map<Audience, typeof groups>()
  for (const group of groups) {
    const list = byAudience.get(group.project.audience) ?? []
    list.push(group)
    byAudience.set(group.project.audience, list)
  }
  const audiences = (Object.keys(AUDIENCES) as Audience[]).filter((a) =>
    byAudience.has(a)
  )

  return (
    <div className='space-y-14'>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'Person',
              '@id': `${SITE_URL}/ateliers/#blandine-schmidt`,
              name: 'Blandine Schmidt',
              jobTitle: 'Chargée de projet, ateliers radio et podcast',
              description:
                "Docteure en Sciences de l'Information et de la Communication, chargée de projet de l'association et formatrice au CLEMI de l'académie de Bordeaux.",
              hasCredential: {
                '@type': 'EducationalOccupationalCredential',
                credentialCategory: 'degree',
                name: "Doctorat en Sciences de l'Information et de la Communication",
              },
              worksFor: { '@id': `${SITE_URL}/#association` },
              knowsAbout: [
                'Radio',
                'Podcast',
                'Éducation aux médias et à l’information',
                'Création sonore',
              ],
            },
            {
              '@type': 'Service',
              name: 'Ateliers radio et podcast',
              serviceType: "Éducation aux médias et à l'information par le son",
              provider: { '@id': `${SITE_URL}/#association` },
              areaServed: 'Nouvelle-Aquitaine, France',
              audience: audiences.map((a) => ({
                '@type': 'Audience',
                audienceType: AUDIENCES[a],
              })),
              description,
            },
            {
              '@type': 'FAQPage',
              mainEntity: faq.map((item) => ({
                '@type': 'Question',
                name: item.question,
                acceptedAnswer: { '@type': 'Answer', text: item.answer },
              })),
            },
          ],
        }}
      />

      <section className='space-y-4'>
        <h1 className='title text-4xl'>
          Ateliers radio et podcast avec Blandine Schmidt
        </h1>
        <p className='max-w-3xl text-lg'>
          Faire de la radio pour comprendre les médias : l&apos;association
          propose des ateliers d&apos;Éducation aux Médias et à
          l&apos;Information par le son, la radio et le podcast, dans le
          Sud-Ouest de la France.
        </p>
        <p className='max-w-3xl'>
          Ils sont animés par Blandine Schmidt, docteure en Sciences de
          l&apos;Information et de la Communication, chargée de projet de
          l&apos;association et formatrice au CLEMI de l&apos;académie de
          Bordeaux. Elle accompagne les groupes de l&apos;idée à la diffusion,
          et assure avec eux la mise en ondes et le montage. L&apos;association
          est référencée Pass Culture (Adage).
        </p>
        <a
          className='btn-primary'
          href={`mailto:${CONTACT_EMAIL}?subject=Atelier%20radio%20et%20podcast`}
        >
          Proposer un atelier
        </a>
      </section>

      <section aria-labelledby='etapes' className='space-y-4'>
        <h2 id='etapes' className='title text-3xl'>
          Comment se déroule un atelier
        </h2>
        <ol className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          {steps.map(([title, text], i) => (
            <li key={title} className='card space-y-2'>
              <span className='font-display text-3xl text-warning'>
                {i + 1}
              </span>
              <h3 className='text-lg text-white'>{title}</h3>
              <p className='text-sm'>{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby='publics' className='space-y-8'>
        <h2 id='publics' className='title text-3xl'>
          Pour qui ? Des exemples à écouter
        </h2>
        {audiences.map((audience) => (
          <div key={audience} className='space-y-3'>
            <h3 className='font-display text-2xl text-white'>
              {AUDIENCES[audience]}
            </h3>
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
              {byAudience.get(audience)!.map(({ project, episodes }) => (
                <ProjectCard
                  key={project.slug}
                  project={project}
                  count={episodes.length}
                />
              ))}
            </div>
          </div>
        ))}
      </section>

      <section aria-labelledby='outils' className='card space-y-3'>
        <h2 id='outils' className='title text-3xl'>
          Des outils libres pour continuer en classe
        </h2>
        <p>
          L&apos;association a imaginé deux outils gratuits, sans inscription,
          qui fonctionnent dans le navigateur :{' '}
          <a className='link' href='https://directpodcast.fr'>
            Direct Podcast
          </a>{' '}
          pour enregistrer en un clic, et{' '}
          <a className='link' href='https://directmontage.fr'>
            Direct Montage
          </a>{' '}
          pour monter à plusieurs pistes.
        </p>
      </section>

      <section aria-labelledby='questions' className='space-y-4'>
        <h2 id='questions' className='title text-3xl'>
          Questions fréquentes
        </h2>
        <div className='space-y-3'>
          {faq.map((item) => (
            <details key={item.question} className='card group'>
              <summary className='cursor-pointer text-white'>
                {item.question}
              </summary>
              <p className='mt-2'>{item.answer}</p>
            </details>
          ))}
        </div>
        <p>
          Envie d&apos;écouter d&apos;abord ?{' '}
          <Link className='link' href='/podcasts/'>
            Tous les podcasts
          </Link>
        </p>
      </section>
    </div>
  )
}
