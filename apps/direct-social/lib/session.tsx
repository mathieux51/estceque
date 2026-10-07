'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api } from './api'
import type { Me } from './types'

type Session = {
  me: Me | null
  // False until the first answer from the API.
  ready: boolean
  reload: () => Promise<void>
}

const SessionContext = createContext<Session>({ me: null, ready: false, reload: async () => {} })

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<Me | null>(null)
  const [ready, setReady] = useState(false)
  const reload = useCallback(async () => {
    try {
      setMe(await api<Me | null>('/me'))
    } catch {
      setMe(null)
    } finally {
      setReady(true)
    }
  }, [])
  useEffect(() => {
    reload()
    // Keeps the notification count fresh.
    const timer = setInterval(reload, 60_000)
    return () => clearInterval(timer)
  }, [reload])
  return <SessionContext.Provider value={{ me, ready, reload }}>{children}</SessionContext.Provider>
}

export function useSession() {
  return useContext(SessionContext)
}
