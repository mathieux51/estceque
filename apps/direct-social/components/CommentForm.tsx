'use client'

import { useState } from 'react'
import { api, ApiError } from '@/lib/api'
import { formatTime } from '@/lib/format'
import { extensionFor, useRecorder } from '@/lib/recorder'
import type { Comment } from '@/lib/types'
import { MicIcon } from './Icons'
import { ErrorMessage } from './States'

const NOTE_SECONDS = 180

type Props = {
  episodeId: number
  // Current position in the episode, offered as the comment's moment.
  position: number | null
  parentId?: number
  onPosted: (comment: Comment) => void
  onCancel?: () => void
}

export default function CommentForm({ episodeId, position, parentId, onPosted, onCancel }: Props) {
  const [body, setBody] = useState('')
  const [atMoment, setAtMoment] = useState(!parentId)
  const [note, setNote] = useState<{ blob: Blob; url: string; seconds: number } | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const recorder = useRecorder({
    maxSeconds: NOTE_SECONDS,
    onDone: (blob, seconds) => setNote({ blob, url: URL.createObjectURL(blob), seconds }),
  })
  const moment = position !== null && atMoment ? position : null

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!body.trim() && !note) return
    setBusy(true)
    setError(null)
    const form = new FormData()
    form.append('body', body)
    if (moment !== null) form.append('atSeconds', moment.toFixed(1))
    if (parentId) form.append('parentId', String(parentId))
    if (note) form.append('audio', note.blob, `note.${extensionFor(note.blob)}`)
    try {
      const comment = await api<Comment>(`/episodes/${episodeId}/comments`, { method: 'POST', body: form })
      setBody('')
      setNote(null)
      onPosted(comment)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Une erreur est survenue.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className='space-y-2' data-testid={parentId ? 'reply-form' : 'comment-form'}>
      <textarea
        className='input min-h-20'
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={parentId ? 'Votre réponse…' : 'Votre commentaire…'}
        aria-label={parentId ? 'Réponse' : 'Commentaire'}
        maxLength={2000}
      />
      {note && (
        <div className='flex items-center gap-2 rounded-lg bg-deep p-2' data-testid='note-preview'>
          <audio src={note.url} controls className='h-9 flex-1' />
          <button type='button' className='btn' onClick={() => setNote(null)}>
            Supprimer la note
          </button>
        </div>
      )}
      {(recorder.error || error) && <ErrorMessage message={recorder.error ?? error!} />}
      <div className='flex flex-wrap items-center gap-2'>
        {recorder.recording ? (
          <button type='button' className='btn-danger' onClick={recorder.stop}>
            <span className='h-2 w-2 animate-pulse rounded-full bg-white' /> Arrêter · {formatTime(recorder.seconds)}
          </button>
        ) : (
          <button type='button' className='btn' onClick={recorder.start} disabled={busy}>
            <MicIcon /> {note ? 'Réenregistrer' : 'Note audio'}
          </button>
        )}
        {position !== null && !parentId && (
          <label className='flex items-center gap-1.5 text-sm'>
            <input type='checkbox' checked={atMoment} onChange={(e) => setAtMoment(e.target.checked)} className='accent-white' />
            à {formatTime(position)}
          </label>
        )}
        <span className='ml-auto' />
        {onCancel && (
          <button type='button' className='btn' onClick={onCancel}>
            Annuler
          </button>
        )}
        <button className='btn-primary' disabled={busy || recorder.recording || (!body.trim() && !note)}>
          {parentId ? 'Répondre' : 'Publier'}
        </button>
      </div>
    </form>
  )
}
