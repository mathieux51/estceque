'use client'

import { useRouter } from 'next/navigation'
import ShowForm from '@/components/ShowForm'
import { Loading, SignInPrompt } from '@/components/States'
import { useSession } from '@/lib/session'

export default function NewShow() {
  const { me, ready } = useSession()
  const router = useRouter()
  if (!ready) return <Loading />
  if (!me) return <SignInPrompt what='créer un podcast' />
  return (
    <div className='mx-auto max-w-xl space-y-4'>
      <h1 className='title text-3xl'>Nouveau podcast</h1>
      <ShowForm onSaved={(show) => router.push(`/publier?podcast=${show.id}`)} />
    </div>
  )
}
