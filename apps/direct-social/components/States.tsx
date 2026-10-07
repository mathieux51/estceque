import Link from 'next/link'

export function Loading() {
  return (
    <div className='flex justify-center py-16' role='status' aria-label='Chargement'>
      <span className='h-6 w-6 animate-spin rounded-full border-2 border-grey/60 border-t-white' />
    </div>
  )
}

export function ErrorMessage({ message }: { message: string }) {
  return (
    <p role='alert' className='rounded-lg border border-danger/60 bg-danger/10 px-3 py-2 text-sm text-white'>
      {message}
    </p>
  )
}

export function SignInPrompt({ what }: { what: string }) {
  return (
    <div className='card text-center'>
      <p className='mb-3'>Connectez-vous pour {what}.</p>
      <Link href='/connexion' className='btn-primary'>
        Se connecter
      </Link>
    </div>
  )
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className='rounded-lg border border-dashed border-grey/40 px-4 py-6 text-center text-sm'>{children}</p>
}
