'use client'

import Link from 'next/link'
import EpisodeCard from '@/components/EpisodeCard'
import ShowCard from '@/components/ShowCard'
import { Empty, ErrorMessage, Loading } from '@/components/States'
import { MicIcon } from '@/components/Icons'
import { useApi } from '@/lib/api'
import { useSession } from '@/lib/session'
import type { Episode, Show } from '@/lib/types'

type Discover = { recent: Episode[]; popular: Episode[]; shows: Show[]; tags: string[] }
type Feed = { episodes: Episode[]; resume: Episode[] }

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className='space-y-3'>
      <h2 className='title text-2xl'>{title}</h2>
      {children}
    </section>
  )
}

export default function Home() {
  const { me, ready } = useSession()
  const discover = useApi<Discover>('/discover')
  const feed = useApi<Feed>(ready && me ? '/feed' : null)

  return (
    <div className='space-y-10'>
      {ready && !me && (
        <section className='card space-y-3 py-8 text-center'>
          <h1 className='title text-4xl'>Les podcasts, ensemble</h1>
          <p className='mx-auto max-w-xl'>
            Publiez vos épisodes, commentez au bon moment par écrit ou à voix haute, suivez vos créateurs préférés.
            Un podcast passe autour de vous ? Faites-le écouter au site pour le retrouver.
          </p>
          <div className='flex flex-wrap justify-center gap-2'>
            <Link href='/connexion' className='btn-primary'>
              Créer un compte
            </Link>
            <Link href='/recherche?ecoute=1' className='btn'>
              <MicIcon /> Reconnaître un podcast
            </Link>
          </div>
        </section>
      )}

      {me && feed.data && feed.data.resume.length > 0 && (
        <Section title='Reprendre'>
          <div className='grid gap-3 md:grid-cols-2'>
            {feed.data.resume.map((e) => (
              <EpisodeCard key={e.id} episode={e} />
            ))}
          </div>
        </Section>
      )}

      {me && (
        <Section title='Mes abonnements'>
          {feed.loading && !feed.data ? (
            <Loading />
          ) : feed.data?.episodes.length ? (
            <div className='grid gap-3 md:grid-cols-2'>
              {feed.data.episodes.map((e) => (
                <EpisodeCard key={e.id} episode={e} />
              ))}
            </div>
          ) : (
            <Empty>Abonnez-vous à des podcasts ou suivez des personnes : leurs nouveaux épisodes arriveront ici.</Empty>
          )}
        </Section>
      )}

      {discover.error && <ErrorMessage message={discover.error.message} />}
      {discover.loading && !discover.data && <Loading />}
      {discover.data && (
        <>
          {discover.data.tags.length > 0 && (
            <div className='flex flex-wrap gap-2'>
              {discover.data.tags.map((tag) => (
                <Link key={tag} href={`/recherche?tag=${encodeURIComponent(tag)}`} className='btn h-8 rounded-full'>
                  #{tag}
                </Link>
              ))}
            </div>
          )}
          <Section title='Nouveautés'>
            {discover.data.recent.length ? (
              <div className='grid gap-3 md:grid-cols-2'>
                {discover.data.recent.map((e) => (
                  <EpisodeCard key={e.id} episode={e} />
                ))}
              </div>
            ) : (
              <Empty>Aucun épisode pour l’instant. Soyez le premier à publier !</Empty>
            )}
          </Section>
          {discover.data.popular.length > 0 && (
            <Section title='Populaires'>
              <div className='grid gap-3 md:grid-cols-2'>
                {discover.data.popular.map((e) => (
                  <EpisodeCard key={e.id} episode={e} />
                ))}
              </div>
            </Section>
          )}
          {discover.data.shows.length > 0 && (
            <Section title='Podcasts'>
              <div className='grid gap-3 sm:grid-cols-2 md:grid-cols-3'>
                {discover.data.shows.map((s) => (
                  <ShowCard key={s.id} show={s} />
                ))}
              </div>
            </Section>
          )}
        </>
      )}
    </div>
  )
}
