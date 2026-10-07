import Link from 'next/link'
import { plural } from '@/lib/format'
import type { Show } from '@/lib/types'
import Cover from './Cover'

export default function ShowCard({ show }: { show: Show }) {
  return (
    <Link href={`/podcasts/${show.slug}`} className='card flex items-center gap-3 hover:bg-white/10'>
      <Cover url={show.coverUrl} title={show.title} />
      <div className='min-w-0'>
        <p className='truncate font-medium text-white'>{show.title}</p>
        <p className='truncate text-sm'>{show.owner.displayName}</p>
        <p className='text-xs'>
          {plural(show.episodeCount, 'épisode', 'épisodes')} · {plural(show.followerCount, 'abonné', 'abonnés')}
        </p>
      </div>
    </Link>
  )
}
