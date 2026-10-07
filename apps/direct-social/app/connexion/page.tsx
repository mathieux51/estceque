'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ErrorMessage } from '@/components/States'
import { api, ApiError } from '@/lib/api'

function SignIn() {
  const params = useSearchParams()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await api('/auth/request', { method: 'POST', json: { email } })
      try {
        sessionStorage.setItem('ds-after-login', params.get('suite') ?? '/')
      } catch {}
      setSent(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Une erreur est survenue.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className='mx-auto max-w-md space-y-4'>
      <h1 className='title text-3xl'>Connexion</h1>
      {sent ? (
        <div className='card space-y-2' role='status'>
          <p className='text-white'>Regardez vos e-mails !</p>
          <p>
            Nous avons envoyé un lien de connexion à <strong className='text-white'>{email}</strong>. Il est valable
            15 minutes.
          </p>
          <p className='text-sm'>
            En local, les e-mails arrivent dans{' '}
            <a className='link' href='http://localhost:8025' target='_blank' rel='noreferrer'>
              Mailpit
            </a>
            .
          </p>
        </div>
      ) : (
        <form onSubmit={submit} className='card space-y-3'>
          <p>Pas de mot de passe : recevez un lien de connexion par e-mail. Le compte est créé à la première connexion.</p>
          <label className='label' htmlFor='email'>
            Adresse e-mail
          </label>
          <input
            id='email'
            type='email'
            required
            autoComplete='email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className='input'
            placeholder='vous@exemple.fr'
          />
          {error && <ErrorMessage message={error} />}
          <button className='btn-primary w-full' disabled={busy}>
            Recevoir le lien
          </button>
        </form>
      )}
    </div>
  )
}

export default function Page() {
  return (
    <Suspense>
      <SignIn />
    </Suspense>
  )
}
