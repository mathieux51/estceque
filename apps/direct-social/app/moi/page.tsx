'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import Avatar from '@/components/Avatar'
import EpisodeCard from '@/components/EpisodeCard'
import ShowCard from '@/components/ShowCard'
import { Empty, ErrorMessage, Loading, SignInPrompt } from '@/components/States'
import { api, ApiError, useApi } from '@/lib/api'
import { useSession } from '@/lib/session'
import type { Episode, Me, Show } from '@/lib/types'

const tabs = { podcasts: 'Mes podcasts', favoris: 'À écouter', historique: 'Historique', profil: 'Profil' } as const
type Tab = keyof typeof tabs

function ProfileForm({ me, onSaved }: { me: Me; onSaved: () => void }) {
  const [displayName, setDisplayName] = useState(me.displayName)
  const [handle, setHandle] = useState(me.handle)
  const [bio, setBio] = useState(me.bio)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api('/me', { method: 'PATCH', json: { displayName, handle, bio } })
      setMessage({ ok: true, text: 'Profil enregistré.' })
      onSaved()
    } catch (err) {
      setMessage({ ok: false, text: err instanceof ApiError ? err.message : 'Une erreur est survenue.' })
    }
  }
  const upload = async (file: File | undefined) => {
    if (!file) return
    const form = new FormData()
    form.append('image', file)
    try {
      await api('/me/avatar', { method: 'POST', body: form })
      onSaved()
    } catch (err) {
      setMessage({ ok: false, text: err instanceof ApiError ? err.message : 'Une erreur est survenue.' })
    }
  }

  return (
    <form onSubmit={save} className='card max-w-xl space-y-3'>
      <div className='flex items-center gap-3'>
        <Avatar user={me} size='lg' />
        <label className='btn cursor-pointer'>
          Changer la photo
          <input type='file' accept='image/jpeg,image/png,image/webp' className='hidden' onChange={(e) => upload(e.target.files?.[0])} />
        </label>
      </div>
      <div>
        <label className='label' htmlFor='name'>Nom affiché</label>
        <input id='name' className='input' value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={60} required />
      </div>
      <div>
        <label className='label' htmlFor='handle'>Pseudo</label>
        <input id='handle' className='input' value={handle} onChange={(e) => setHandle(e.target.value.toLowerCase())} pattern='[a-z0-9_]{3,30}' required />
      </div>
      <div>
        <label className='label' htmlFor='bio'>Bio</label>
        <textarea id='bio' className='input min-h-24' value={bio} onChange={(e) => setBio(e.target.value)} maxLength={500} />
      </div>
      <p className='text-sm'>E-mail : {me.email}</p>
      {message && (message.ok ? <p role='status' className='text-success'>{message.text}</p> : <ErrorMessage message={message.text} />)}
      <button className='btn-primary'>Enregistrer</button>
    </form>
  )
}

function Account() {
  const { me, ready, reload } = useSession()
  const router = useRouter()
  const params = useSearchParams()
  const welcome = params.get('bienvenue') === '1'
  const [tab, setTab] = useState<Tab>(welcome ? 'profil' : 'podcasts')
  const shows = useApi<Show[]>(me && tab === 'podcasts' ? '/me/shows' : null)
  const bookmarks = useApi<Episode[]>(me && tab === 'favoris' ? '/me/bookmarks' : null)
  const history = useApi<Episode[]>(me && tab === 'historique' ? '/me/history' : null)
  useEffect(() => {
    if (welcome) setTab('profil')
  }, [welcome])

  if (!ready) return <Loading />
  if (!me) return <SignInPrompt what='voir votre compte' />

  const logout = async () => {
    await api('/auth/logout', { method: 'POST' })
    await reload()
    router.replace('/')
  }
  const episodes = (list: { data?: Episode[] }, empty: string) =>
    !list.data ? <Loading /> : list.data.length ? (
      <div className='grid gap-3 md:grid-cols-2'>{list.data.map((e) => <EpisodeCard key={e.id} episode={e} />)}</div>
    ) : (
      <Empty>{empty}</Empty>
    )

  return (
    <div className='space-y-6'>
      <div className='flex flex-wrap items-center gap-3'>
        <h1 className='title mr-auto text-3xl'>{welcome ? `Bienvenue, ${me.displayName} !` : 'Mon compte'}</h1>
        <Link href={`/u/${me.handle}`} className='btn'>Voir mon profil</Link>
        <button className='btn' onClick={logout}>Se déconnecter</button>
      </div>
      {welcome && <p className='card'>Votre compte est créé. Choisissez votre nom et votre pseudo, ils sont visibles de tous.</p>}
      <nav className='flex flex-wrap gap-2' role='tablist'>
        {(Object.keys(tabs) as Tab[]).map((t) => (
          <button key={t} role='tab' aria-selected={tab === t} className={tab === t ? 'btn-primary' : 'btn'} onClick={() => setTab(t)}>
            {tabs[t]}
          </button>
        ))}
      </nav>
      {tab === 'podcasts' && (
        <div className='space-y-3'>
          <div className='flex gap-2'>
            <Link href='/podcasts/nouveau' className='btn-primary'>Créer un podcast</Link>
            <Link href='/publier' className='btn'>Publier un épisode</Link>
          </div>
          {!shows.data ? <Loading /> : shows.data.length ? (
            <div className='grid gap-3 sm:grid-cols-2 md:grid-cols-3'>{shows.data.map((s) => <ShowCard key={s.id} show={s} />)}</div>
          ) : (
            <Empty>Vous n’avez pas encore de podcast.</Empty>
          )}
        </div>
      )}
      {tab === 'favoris' && episodes(bookmarks, 'Ajoutez des épisodes à écouter plus tard avec le marque-page.')}
      {tab === 'historique' && episodes(history, 'Les épisodes que vous écoutez apparaîtront ici.')}
      {tab === 'profil' && <ProfileForm me={me} onSaved={reload} />}
    </div>
  )
}

export default function Page() {
  return (
    <Suspense>
      <Account />
    </Suspense>
  )
}
