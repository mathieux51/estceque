'use client'

import { useState } from 'react'
import { api, ApiError } from '@/lib/api'
import type { Episode } from '@/lib/types'
import { uploadAudio } from '@/lib/upload'
import { ErrorMessage } from './States'

export default function EditEpisode({
  episode,
  onSaved,
  onCancel,
}: {
  episode: Episode
  onSaved: (e: Episode) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState(episode.title)
  const [description, setDescription] = useState(episode.description)
  const [tags, setTags] = useState(episode.tags.join(', '))
  const [file, setFile] = useState<File | null>(null)
  const [progress, setProgress] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      const uploadKey = file ? await uploadAudio(file, setProgress) : undefined
      const saved = await api<Episode>(`/episodes/${episode.id}`, {
        method: 'PATCH',
        json: { title, description, tags: tags.split(','), uploadKey },
      })
      onSaved(saved)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Une erreur est survenue.')
    } finally {
      setProgress(null)
    }
  }

  return (
    <form onSubmit={save} className='card space-y-3'>
      <div>
        <label className='label' htmlFor='edit-title'>Titre</label>
        <input id='edit-title' className='input' value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={120} />
      </div>
      <div>
        <label className='label' htmlFor='edit-description'>Description</label>
        <textarea id='edit-description' className='input min-h-28' value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div>
        <label className='label' htmlFor='edit-tags'>Mots-clés, séparés par des virgules</label>
        <input id='edit-tags' className='input' value={tags} onChange={(e) => setTags(e.target.value)} />
      </div>
      <div>
        <label className='label' htmlFor='edit-file'>Remplacer le son (facultatif)</label>
        <input id='edit-file' type='file' accept='audio/*' onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      </div>
      {progress !== null && <progress className='w-full' value={progress} max={1} />}
      {error && <ErrorMessage message={error} />}
      <div className='flex justify-end gap-2'>
        <button type='button' className='btn' onClick={onCancel}>Annuler</button>
        <button className='btn-primary' disabled={progress !== null}>Enregistrer</button>
      </div>
    </form>
  )
}
