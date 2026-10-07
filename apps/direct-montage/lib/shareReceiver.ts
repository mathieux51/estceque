// Receives a recording from Direct Podcast, which lives on another domain:
// the Direct Podcast tab opens this one, waits for "ready", then sends the
// file with postMessage. Only that tab and known origins are accepted.

const READY = 'direct-montage:ready'
const FILE = 'direct-podcast:file'
const TIMEOUT_MS = 30000

const PODCAST_ORIGINS = [
  'https://directpodcast.fr',
  'https://www.directpodcast.fr',
  'https://next.directpodcast.fr',
]

export interface SharedFile {
  filename: string
  fileType: string
  arrayBuffer: ArrayBuffer
}

function isPodcastOrigin(origin: string): boolean {
  if (PODCAST_ORIGINS.includes(origin)) return true
  // Local development: both apps run on localhost with different ports.
  const local = ['localhost', '127.0.0.1'].includes(window.location.hostname)
  return local && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
}

/** Waits for the recording sent by the Direct Podcast tab that opened this one. */
export function receiveSharedFile(): Promise<SharedFile | null> {
  const opener = window.opener as Window | null
  if (!opener) return Promise.resolve(null)

  return new Promise((resolve) => {
    const finish = (file: SharedFile | null) => {
      clearTimeout(timer)
      clearInterval(ping)
      window.removeEventListener('message', onMessage)
      resolve(file)
    }
    const onMessage = (event: MessageEvent) => {
      if (event.source !== opener || !isPodcastOrigin(event.origin)) return
      const data = event.data
      if (data?.type !== FILE || !(data.buffer instanceof ArrayBuffer)) return
      finish({
        filename: String(data.filename || 'enregistrement'),
        fileType: String(data.fileType || ''),
        arrayBuffer: data.buffer,
      })
    }
    window.addEventListener('message', onMessage)
    // "ready" carries no data, so it can go to any origin; repeat it in case
    // the first one arrives before the other tab listens.
    const announce = () => opener.postMessage({ type: READY }, '*')
    announce()
    const ping = setInterval(announce, 1000)
    const timer = setTimeout(() => finish(null), TIMEOUT_MS)
  })
}
