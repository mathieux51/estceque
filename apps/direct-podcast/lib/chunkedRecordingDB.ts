// Chunked recording storage for crash recovery
const CHUNKED_DB_NAME = 'DirectPodcastChunkedDB'
const CHUNKED_DB_VERSION = 1
const SESSIONS_STORE_NAME = 'recordingSessions'
const CHUNKS_STORE_NAME = 'recordingChunks'

export interface RecordingSession {
  id: string
  startTime: number
  lastChunkTime: number
  mimeType: string
  isComplete: boolean
  filename?: string
}

export interface RecordingChunk {
  id: string
  sessionId: string
  chunkIndex: number
  arrayBuffer: ArrayBuffer
  timestamp: number
}

export const openChunkedDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(CHUNKED_DB_NAME, CHUNKED_DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // Create sessions store
      if (!db.objectStoreNames.contains(SESSIONS_STORE_NAME)) {
        const sessionsStore = db.createObjectStore(SESSIONS_STORE_NAME, {
          keyPath: 'id',
        })
        sessionsStore.createIndex('startTime', 'startTime', { unique: false })
        sessionsStore.createIndex('isComplete', 'isComplete', { unique: false })
      }

      // Create chunks store
      if (!db.objectStoreNames.contains(CHUNKS_STORE_NAME)) {
        const chunksStore = db.createObjectStore(CHUNKS_STORE_NAME, {
          keyPath: 'id',
        })
        chunksStore.createIndex('sessionId', 'sessionId', { unique: false })
        chunksStore.createIndex('chunkIndex', ['sessionId', 'chunkIndex'], {
          unique: true,
        })
        chunksStore.createIndex('timestamp', 'timestamp', { unique: false })
      }
    }
  })
}

export const createRecordingSession = async (
  mimeType: string
): Promise<string> => {
  const db = await openChunkedDB()
  const sessionId = `session_${Date.now()}_${Math.random()
    .toString(36)
    .substr(2, 9)}`

  const session: RecordingSession = {
    id: sessionId,
    startTime: Date.now(),
    lastChunkTime: Date.now(),
    mimeType,
    isComplete: false,
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SESSIONS_STORE_NAME], 'readwrite')
    const store = transaction.objectStore(SESSIONS_STORE_NAME)
    const request = store.put(session)

    request.onsuccess = () => resolve(sessionId)
    request.onerror = () => reject(request.error)
  })
}

export const saveRecordingChunk = async (
  sessionId: string,
  chunkIndex: number,
  arrayBuffer: ArrayBuffer
): Promise<void> => {
  const db = await openChunkedDB()
  const chunkId = `${sessionId}_chunk_${chunkIndex}`

  const chunk: RecordingChunk = {
    id: chunkId,
    sessionId,
    chunkIndex,
    arrayBuffer,
    timestamp: Date.now(),
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      [CHUNKS_STORE_NAME, SESSIONS_STORE_NAME],
      'readwrite'
    )

    // Save chunk
    const chunksStore = transaction.objectStore(CHUNKS_STORE_NAME)
    chunksStore.put(chunk)

    // Update session last chunk time
    const sessionsStore = transaction.objectStore(SESSIONS_STORE_NAME)
    const getRequest = sessionsStore.get(sessionId)

    getRequest.onsuccess = () => {
      const session = getRequest.result as RecordingSession
      if (session) {
        session.lastChunkTime = Date.now()
        sessionsStore.put(session)
      }
    }

    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
}

export const markSessionComplete = async (
  sessionId: string,
  filename: string
): Promise<void> => {
  const db = await openChunkedDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SESSIONS_STORE_NAME], 'readwrite')
    const store = transaction.objectStore(SESSIONS_STORE_NAME)
    const request = store.get(sessionId)

    request.onsuccess = () => {
      const session = request.result as RecordingSession
      if (session) {
        session.isComplete = true
        session.filename = filename
        store.put(session)
      }
    }

    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
}

export const getSessionChunks = async (
  sessionId: string
): Promise<RecordingChunk[]> => {
  const db = await openChunkedDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([CHUNKS_STORE_NAME], 'readonly')
    const store = transaction.objectStore(CHUNKS_STORE_NAME)
    const index = store.index('sessionId')
    const request = index.getAll(sessionId)

    request.onsuccess = () => {
      const chunks = request.result as RecordingChunk[]
      // Sort by chunk index
      chunks.sort((a, b) => a.chunkIndex - b.chunkIndex)
      resolve(chunks)
    }

    request.onerror = () => reject(request.error)
  })
}

export const getIncompleteSessions = async (): Promise<RecordingSession[]> => {
  const db = await openChunkedDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SESSIONS_STORE_NAME], 'readonly')
    const store = transaction.objectStore(SESSIONS_STORE_NAME)

    // Get all sessions and filter manually to avoid index issues
    const request = store.getAll()

    request.onsuccess = () => {
      const sessions = request.result as RecordingSession[]
      // Filter for incomplete sessions
      const incompleteSessions = sessions.filter(
        (session) => !session.isComplete
      )
      // Sort by start time, newest first
      incompleteSessions.sort((a, b) => b.startTime - a.startTime)
      resolve(incompleteSessions)
    }

    request.onerror = () => reject(request.error)
  })
}

export const reassembleRecording = async (
  sessionId: string
): Promise<{ blob: Blob; mimeType: string } | null> => {
  const db = await openChunkedDB()

  // Get session info
  const session = await new Promise<RecordingSession | null>(
    (resolve, reject) => {
      const transaction = db.transaction([SESSIONS_STORE_NAME], 'readonly')
      const store = transaction.objectStore(SESSIONS_STORE_NAME)
      const request = store.get(sessionId)

      request.onsuccess = () =>
        resolve(request.result as RecordingSession | null)
      request.onerror = () => reject(request.error)
    }
  )

  if (!session) return null

  // Get all chunks for this session
  const chunks = await getSessionChunks(sessionId)
  if (chunks.length === 0) return null

  // Combine all chunks into a single blob
  const arrayBuffers = chunks.map((chunk) => chunk.arrayBuffer)
  // Use webm for chunks
  const blob = new Blob(arrayBuffers, {
    type: session.mimeType || 'audio/webm',
  })

  return { blob, mimeType: session.mimeType || 'audio/webm' }
}

export const deleteSession = async (sessionId: string): Promise<void> => {
  const db = await openChunkedDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      [SESSIONS_STORE_NAME, CHUNKS_STORE_NAME],
      'readwrite'
    )

    // Delete session
    const sessionsStore = transaction.objectStore(SESSIONS_STORE_NAME)
    sessionsStore.delete(sessionId)

    // Delete all chunks for this session
    const chunksStore = transaction.objectStore(CHUNKS_STORE_NAME)
    const index = chunksStore.index('sessionId')
    const request = index.openCursor(sessionId)

    request.onsuccess = () => {
      const cursor = request.result
      if (cursor) {
        cursor.delete()
        cursor.continue()
      }
    }

    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
}

export const cleanupOldSessions = async (
  maxAgeMs: number = 24 * 60 * 60 * 1000 // 24 hours default
): Promise<void> => {
  const db = await openChunkedDB()
  const cutoffTime = Date.now() - maxAgeMs

  // Get old sessions
  const oldSessions = await new Promise<RecordingSession[]>(
    (resolve, reject) => {
      const transaction = db.transaction([SESSIONS_STORE_NAME], 'readonly')
      const store = transaction.objectStore(SESSIONS_STORE_NAME)
      const index = store.index('startTime')
      const request = index.getAll(IDBKeyRange.upperBound(cutoffTime))

      request.onsuccess = () => resolve(request.result as RecordingSession[])
      request.onerror = () => reject(request.error)
    }
  )

  // Delete each old session and its chunks
  for (const session of oldSessions) {
    await deleteSession(session.id)
  }
}
