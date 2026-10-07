'use client'

import { api, ApiError } from './api'

// uploadAudio sends a file straight to storage with a signed URL and returns
// its key, reporting progress from 0 to 1.
export async function uploadAudio(file: File, onProgress: (ratio: number) => void): Promise<string> {
  const { key, url } = await api<{ key: string; url: string }>('/uploads/episode', {
    method: 'POST',
    json: { filename: file.name },
  })
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', url)
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total)
    xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new ApiError("L'envoi du fichier a échoué.", xhr.status)))
    xhr.onerror = () => reject(new ApiError("L'envoi du fichier a échoué.", 0))
    xhr.send(file)
  })
  return key
}
