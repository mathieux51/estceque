'use client'

import { useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { formatAgo, formatTime } from '@/lib/format'
import { useSession } from '@/lib/session'
import type { Comment } from '@/lib/types'
import Avatar from './Avatar'
import CommentForm from './CommentForm'
import ReportButton from './ReportButton'

type Props = {
  episodeId: number
  comments: Comment[]
  onSeek: (seconds: number) => void
  onChange: (comments: Comment[]) => void
}

function CommentItem({
  comment,
  onSeek,
  onReply,
  onDelete,
}: {
  comment: Comment
  onSeek: (s: number) => void
  onReply?: () => void
  onDelete: () => void
}) {
  return (
    <div className='flex gap-3' id={`commentaire-${comment.id}`} data-testid='comment'>
      <Link href={`/u/${comment.user.handle}`}>
        <Avatar user={comment.user} size='sm' />
      </Link>
      <div className='min-w-0 flex-1 space-y-1'>
        <p className='text-sm'>
          <Link href={`/u/${comment.user.handle}`} className='font-medium text-white hover:underline'>
            {comment.user.displayName}
          </Link>{' '}
          <span className='text-xs'>{formatAgo(comment.createdAt)}</span>
          {comment.atSeconds !== null && (
            <button
              className='ml-2 rounded bg-white/10 px-1.5 text-xs text-warning tabular-nums hover:bg-white/20'
              onClick={() => onSeek(comment.atSeconds!)}
              aria-label={`Écouter à ${formatTime(comment.atSeconds)}`}
            >
              {formatTime(comment.atSeconds)}
            </button>
          )}
        </p>
        {comment.body && <p className='whitespace-pre-wrap text-white/90'>{comment.body}</p>}
        {comment.audioUrl && (
          <audio src={comment.audioUrl} controls preload='metadata' className='h-9 w-full max-w-sm' data-testid='comment-audio' />
        )}
        <div className='flex gap-3 text-xs'>
          {onReply && (
            <button className='hover:text-white' onClick={onReply}>
              Répondre
            </button>
          )}
          {comment.canDelete && (
            <button
              className='hover:text-danger'
              onClick={() => window.confirm('Supprimer ce commentaire ?') && onDelete()}
            >
              Supprimer
            </button>
          )}
          {!comment.canDelete && <ReportButton type='comment' id={comment.id} small />}
        </div>
      </div>
    </div>
  )
}

export default function CommentList({ episodeId, comments, onSeek, onChange }: Props) {
  const { me } = useSession()
  const [replyTo, setReplyTo] = useState<number | null>(null)
  const threads = comments.filter((c) => c.parentId === null).reverse()
  const replies = (id: number) => comments.filter((c) => c.parentId === id)
  const remove = async (id: number) => {
    await api(`/comments/${id}`, { method: 'DELETE' })
    onChange(comments.filter((c) => c.id !== id && c.parentId !== id))
  }

  if (!threads.length) return <p className='text-sm'>Pas encore de commentaire. Lancez la discussion !</p>
  return (
    <ul className='space-y-5'>
      {threads.map((c) => (
        <li key={c.id} className='space-y-3'>
          <CommentItem
            comment={c}
            onSeek={onSeek}
            onReply={me ? () => setReplyTo(replyTo === c.id ? null : c.id) : undefined}
            onDelete={() => remove(c.id)}
          />
          {(replies(c.id).length > 0 || replyTo === c.id) && (
            <div className='ml-11 space-y-3 border-l border-grey/30 pl-4'>
              {replies(c.id).map((r) => (
                <CommentItem key={r.id} comment={r} onSeek={onSeek} onDelete={() => remove(r.id)} />
              ))}
              {replyTo === c.id && (
                <CommentForm
                  episodeId={episodeId}
                  position={null}
                  parentId={c.id}
                  onCancel={() => setReplyTo(null)}
                  onPosted={(reply) => {
                    onChange([...comments, reply])
                    setReplyTo(null)
                  }}
                />
              )}
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}
