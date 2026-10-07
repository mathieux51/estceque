'use client'

import { useState } from 'react'
import { api, ApiError } from '@/lib/api'
import type { Show } from '@/lib/types'
import { ErrorMessage } from './States'

// ShowForm creates a show, or edits one when `show` is given.
export default function ShowForm({ show, onSaved, onCancel }: { show?: Show; onSaved: (s: Show) => void; onCancel?: () => void }) {
  const [title, setTitle] = useState(show?.title ?? '')
  const [description, setDescription] = useState(show?.description ?? '')
  const [tags, setTags] = useState(show?.tags.join(', ') ?? '')
  const [cover, setCover] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const json = { title, description, tags: tags.split(',') }
      let saved = show
        ? await api<Show>(`/shows/${show.id}`, { method: 'PATCH', json })
        : await api<Show>('/shows', { method: 'POST', json })
      if (cover) {
        const form = new FormData()
        form.append('image', cover)
        saved = await api<Show>(`/shows/${saved.id}/cover`, { method: 'POST', body: form })
      }
      onSaved(saved)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Une erreur est survenue.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={save} className='card space-y-3'>
      <div>
        <label className='label' htmlFor='show-title'>Nom du podcast</label>
        <input id='show-title' className='input' value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={120} />
      </div>
      <div>
        <label className='label' htmlFor='show-description'>Description</label>
        <textarea id='show-description' className='input min-h-28' value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div>
        <label className='label' htmlFor='show-tags'>Mots-clés, séparés par des virgules</label>
        <input id='show-tags' className='input' value={tags} onChange={(e) => setTags(e.target.value)} placeholder='société, culture, sport' />
      </div>
      <div>
        <label className='label' htmlFor='show-cover'>Pochette (JPEG, PNG ou WebP, carrée de préférence)</label>
        <input id='show-cover' type='file' accept='image/jpeg,image/png,image/webp' onChange={(e) => setCover(e.target.files?.[0] ?? null)} />
      </div>
      {error && <ErrorMessage message={error} />}
      <div className='flex justify-end gap-2'>
        {onCancel && <button type='button' className='btn' onClick={onCancel}>Annuler</button>}
        <button className='btn-primary' disabled={busy}>{show ? 'Enregistrer' : 'Créer le podcast'}</button>
      </div>
    </form>
  )
}
