'use client'

import { useCallback, useEffect, useState } from 'react'

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message)
  }
}

// api calls the Go API through this app's /api proxy.
export async function api<T = void>(
  path: string,
  init: RequestInit & { json?: unknown } = {},
): Promise<T> {
  const { json, ...rest } = init
  const response = await fetch(`/api${path}`, {
    ...rest,
    headers: json === undefined ? rest.headers : { 'Content-Type': 'application/json', ...rest.headers },
    body: json === undefined ? rest.body : JSON.stringify(json),
    credentials: 'same-origin',
  })
  if (!response.ok) {
    let message = 'Une erreur est survenue.'
    try {
      message = (await response.json()).error ?? message
    } catch {}
    throw new ApiError(message, response.status)
  }
  if (response.status === 204) return undefined as T
  return response.json()
}

// useApi loads a path and reloads it on demand. A null path loads nothing.
export function useApi<T>(path: string | null) {
  const [data, setData] = useState<T | undefined>()
  const [error, setError] = useState<ApiError | undefined>()
  const [loading, setLoading] = useState(path !== null)

  const reload = useCallback(async () => {
    if (path === null) return
    setLoading(true)
    try {
      setData(await api<T>(path))
      setError(undefined)
    } catch (e) {
      setError(e instanceof ApiError ? e : new ApiError(String(e), 0))
    } finally {
      setLoading(false)
    }
  }, [path])

  useEffect(() => {
    reload()
  }, [reload])

  return { data, error, loading, reload, setData }
}
