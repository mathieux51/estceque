// Hands a recording to Direct Montage, which lives on another domain: the
// browsers keep each site's storage separate, so the file goes through
// postMessage between the two tabs.

const READY = 'direct-montage:ready'
const FILE = 'direct-podcast:file'
const TIMEOUT_MS = 60000

// Direct Montage's address for this environment (production, staging or local).
export function montageOrigin(): string {
  const { hostname } = window.location
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return process.env.NEXT_PUBLIC_MONTAGE_ORIGIN || 'http://localhost:3001'
  }
  return hostname.startsWith('next.')
    ? 'https://next.directmontage.fr'
    : 'https://directmontage.fr'
}

// Opens Direct Montage in a new tab and sends it the recording once it says
// it is ready. Call it straight from a click, or the tab may be blocked.
export function shareToMontage(recording: {
  blob: Blob
  filename: string
}): Promise<void> {
  const origin = montageOrigin()
  const target = window.open(`${origin}/?sharing=true`, '_blank')
  if (!target) return Promise.reject(new Error('blocked'))

  return new Promise((resolve, reject) => {
    const cleanup = () => {
      clearTimeout(timer)
      window.removeEventListener('message', onMessage)
    }
    const onMessage = async (event: MessageEvent) => {
      if (event.origin !== origin || event.source !== target) return
      if (event.data?.type !== READY) return
      cleanup()
      try {
        const buffer = await recording.blob.arrayBuffer()
        target.postMessage(
          {
            type: FILE,
            filename: recording.filename,
            fileType: recording.blob.type,
            buffer,
          },
          origin,
          [buffer]
        )
        resolve()
      } catch (error) {
        reject(error)
      }
    }
    const timer = setTimeout(() => {
      cleanup()
      reject(new Error('timeout'))
    }, TIMEOUT_MS)
    window.addEventListener('message', onMessage)
  })
}
