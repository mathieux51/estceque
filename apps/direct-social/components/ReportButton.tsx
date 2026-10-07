'use client'

import { api } from '@/lib/api'
import { useSession } from '@/lib/session'
import { FlagIcon } from './Icons'

export default function ReportButton({ type, id, small }: { type: string; id: number; small?: boolean }) {
  const { me } = useSession()
  if (!me) return null
  const report = async () => {
    const reason = window.prompt('Pourquoi signalez-vous ce contenu ?')
    if (!reason?.trim()) return
    try {
      await api('/reports', { method: 'POST', json: { targetType: type, targetId: id, reason } })
      window.alert('Merci, votre signalement a été envoyé.')
    } catch {
      window.alert("Le signalement n'a pas pu être envoyé.")
    }
  }
  return (
    <button className={small ? 'text-xs hover:text-white' : 'btn'} onClick={report} aria-label='Signaler'>
      {small ? 'Signaler' : <FlagIcon />}
    </button>
  )
}
