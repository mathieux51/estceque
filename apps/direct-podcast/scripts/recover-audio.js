// Script to manually recover audio from IndexedDB
// Run this in the browser console at directpodcast.fr

async function recoverAllAudio() {
  // Helper to save blob as file
  const saveBlob = (blob, filename) => {
    const a = document.createElement('a')
    const url = URL.createObjectURL(blob)
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // 1. Recover from Local Storage (completed recordings)
  const recoverLocalRecordings = async () => {
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('DirectPodcastLocalDB', 1)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })

    const transaction = db.transaction(['recordings'], 'readonly')
    const store = transaction.objectStore('recordings')
    const request = store.getAll()

    return new Promise((resolve) => {
      request.onsuccess = () => {
        const recordings = request.result
        
        recordings.forEach((recording, index) => {
          const blob = new Blob([recording.arrayBuffer], {
            type: recording.fileType || 'audio/wav'
          })
          const filename = recording.filename || `recovered_${index + 1}.wav`
          saveBlob(blob, filename)
        })
        
        resolve(recordings.length)
      }
    })
  }

  // 2. Recover from Chunked Storage (incomplete recordings)
  const recoverChunkedRecordings = async () => {
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('DirectPodcastChunkedDB', 1)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })

    // Get all sessions
    const sessionsTransaction = db.transaction(['recordingSessions'], 'readonly')
    const sessionsStore = sessionsTransaction.objectStore('recordingSessions')
    const sessionsRequest = sessionsStore.getAll()

    const sessions = await new Promise((resolve) => {
      sessionsRequest.onsuccess = () => resolve(sessionsRequest.result)
    })


    // For each session, get and combine chunks
    for (const session of sessions) {
      const chunksTransaction = db.transaction(['recordingChunks'], 'readonly')
      const chunksStore = chunksTransaction.objectStore('recordingChunks')
      const index = chunksStore.index('sessionId')
      const chunksRequest = index.getAll(session.id)

      const chunks = await new Promise((resolve) => {
        chunksRequest.onsuccess = () => {
          const chunks = chunksRequest.result
          // Sort by chunk index
          chunks.sort((a, b) => a.chunkIndex - b.chunkIndex)
          resolve(chunks)
        }
      })

      if (chunks.length > 0) {
        // Combine chunks into single blob
        const arrayBuffers = chunks.map(chunk => chunk.arrayBuffer)
        const blob = new Blob(arrayBuffers, { type: session.mimeType || 'audio/webm' })
        
        const date = new Date(session.startTime).toISOString().split('T')[0]
        const mimeType = session.mimeType || 'audio/webm'
        
        // Always save as WebM for manual recovery (conversion would require FFmpeg in console)
        const extension = mimeType.includes('wav') ? 'wav' : mimeType.includes('webm') ? 'webm' : 'mp4'
        const filename = session.filename || `session_${date}_${session.id.substr(-6)}.${extension}`
        
        saveBlob(blob, filename)
      }
    }

    return sessions.length
  }

  // 3. Recover from Shared Storage (files shared with Direct Montage)
  const recoverSharedFiles = async () => {
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('DirectPodcastSharedDB', 1)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })

    const transaction = db.transaction(['sharedAudioFiles'], 'readonly')
    const store = transaction.objectStore('sharedAudioFiles')
    const request = store.getAll()

    return new Promise((resolve) => {
      request.onsuccess = () => {
        const files = request.result
        
        files.forEach((file, index) => {
          const blob = new Blob([file.arrayBuffer], {
            type: file.fileType || 'audio/wav'
          })
          const filename = file.filename || `shared_${index + 1}.wav`
          saveBlob(blob, filename)
        })
        
        resolve(files.length)
      }
    })
  }

  // Run all recovery methods
  try {
    const localCount = await recoverLocalRecordings()
    const chunkedCount = await recoverChunkedRecordings()
    const sharedCount = await recoverSharedFiles()
  } catch (error) {
    // Recovery error - continue silently
  }
}

// Run the recovery
recoverAllAudio()