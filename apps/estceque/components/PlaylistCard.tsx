import type { Playlist } from '@/lib/content'
import { aushaImage } from '@/lib/images'
import AushaPlayer from './AushaPlayer'

export default function PlaylistCard({ playlist }: { playlist: Playlist }) {
  const image = aushaImage(playlist.image)
  return (
    <article className='card flex flex-col gap-3'>
      <div className='flex gap-3'>
        {image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt=''
            width={80}
            height={80}
            loading='lazy'
            className='h-20 w-20 shrink-0 rounded-md object-cover'
          />
        )}
        <div className='min-w-0'>
          <h3 className='leading-snug text-white'>
            <a href={playlist.ausha} className='hover:underline'>
              {playlist.name}
            </a>
          </h3>
          <p className='mt-1 text-xs'>
            {playlist.episodeCount} épisode
            {playlist.episodeCount > 1 ? 's' : ''}
          </p>
          <p className='mt-1 line-clamp-2 text-sm'>{playlist.description}</p>
        </div>
      </div>
      <div className='mt-auto'>
        <AushaPlayer
          kind='playlist'
          slug={playlist.slug}
          title={playlist.name}
        />
      </div>
    </article>
  )
}
