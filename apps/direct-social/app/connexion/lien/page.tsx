'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ErrorMessage, Loading } from '@/components/States'
import { api, ApiError } from '@/lib/api'
import { useSession } from '@/lib/session'

function Verify() {
  const params = useSearchParams()
  const router = useRouter()
  const { reload } = useSession()
  const [error, setError] = useState<string | null>(null)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    const token = params.get('token') ?? ''
    api<{ isNew: boolean }>('/auth/verify', { method: 'POST', json: { token } })
      .then(async ({ isNew }) => {
        await reload()
        let next = '/'
        try {
          next = sessionStorage.getItem('ds-after-login') ?? '/'
          sessionStorage.removeItem('ds-after-login')
        } catch {}
        router.replace(isNew ? '/moi?bienvenue=1' : next.startsWith('/') ? next : '/')
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Une erreur est survenue.'))
  }, [params, reload, router])

  if (!error) return <Loading />
  return (
    <div className='mx-auto max-w-md space-y-3'>
      <ErrorMessage message={error} />
      <Link href='/connexion' className='btn-primary'>
        Recevoir un nouveau lien
      </Link>
    </div>
  )
}

export default function Page() {
  return (
    <Suspense>
      <Verify />
    </Suspense>
  )
}
