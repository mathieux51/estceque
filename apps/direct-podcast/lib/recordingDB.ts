// Local IndexedDB for storing recordings to prevent data loss
const LOCAL_DB_NAME = 'DirectPodcastLocalDB'
const LOCAL_DB_VERSION = 1
const RECORDINGS_STORE_NAME = 'recordings'

export interface LocalRecording {
  id: string
  filename: string
  fileType: string
  arrayBuffer: ArrayBuffer
  timestamp: number
  isConverted?: boolean // true if converted to MP3
}

export const openLocalDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(LOCAL_DB_NAME, LOCAL_DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(RECORDINGS_STORE_NAME)) {
        const store = db.createObjectStore(RECORDINGS_STORE_NAME, {
          keyPath: 'id',
        })
        store.createIndex('timestamp', 'timestamp', { unique: false })
      }
    }
  })
}

export const saveLocalRecording = async (
  filename: string,
  fileType: string,
  arrayBuffer: ArrayBuffer,
  isConverted?: boolean
): Promise<string> => {
  const db = await openLocalDB()
  const id = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const recording: LocalRecording = {
    id,
    filename,
    fileType,
    arrayBuffer,
    timestamp: Date.now(),
    isConverted,
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([RECORDINGS_STORE_NAME], 'readwrite')
    const store = transaction.objectStore(RECORDINGS_STORE_NAME)
    const request = store.put(recording)

    request.onsuccess = () => resolve(id)
    request.onerror = () => reject(request.error)
  })
}

export const getLatestLocalRecording =
  async (): Promise<LocalRecording | null> => {
    const db = await openLocalDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([RECORDINGS_STORE_NAME], 'readonly')
      const store = transaction.objectStore(RECORDINGS_STORE_NAME)
      const index = store.index('timestamp')
      const request = index.openCursor(null, 'prev') // Get latest first

      request.onsuccess = () => {
        const cursor = request.result
        if (cursor) {
          resolve(cursor.value as LocalRecording)
        } else {
          resolve(null)
        }
      }

      request.onerror = () => reject(request.error)
    })
  }

export const getAllLocalRecordings = async (): Promise<LocalRecording[]> => {
  const db = await openLocalDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([RECORDINGS_STORE_NAME], 'readonly')
    const store = transaction.objectStore(RECORDINGS_STORE_NAME)
    const request = store.getAll()

    request.onsuccess = () => {
      const recordings = request.result as LocalRecording[]
      // Sort by timestamp, newest first
      recordings.sort((a, b) => b.timestamp - a.timestamp)
      resolve(recordings)
    }

    request.onerror = () => reject(request.error)
  })
}

export const deleteLocalRecording = async (id: string): Promise<void> => {
  const db = await openLocalDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([RECORDINGS_STORE_NAME], 'readwrite')
    const store = transaction.objectStore(RECORDINGS_STORE_NAME)
    const request = store.delete(id)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export const clearAllLocalRecordings = async (): Promise<void> => {
  const db = await openLocalDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([RECORDINGS_STORE_NAME], 'readwrite')
    const store = transaction.objectStore(RECORDINGS_STORE_NAME)
    const request = store.clear()

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export const cleanupOldLocalRecordings = async (
  maxAgeMs: number = 7 * 24 * 60 * 60 * 1000 // 7 days default
): Promise<void> => {
  const db = await openLocalDB()
  const cutoffTime = Date.now() - maxAgeMs

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([RECORDINGS_STORE_NAME], 'readwrite')
    const store = transaction.objectStore(RECORDINGS_STORE_NAME)
    const index = store.index('timestamp')
    const request = index.openCursor(IDBKeyRange.upperBound(cutoffTime))

    const deleteOldFiles = () => {
      const cursor = request.result
      if (cursor) {
        cursor.delete()
        cursor.continue()
      } else {
        resolve()
      }
    }

    request.onsuccess = deleteOldFiles
    request.onerror = () => reject(request.error)
  })
}

export const clearAllDatabases = async (): Promise<void> => {
  const databases = [
    'DirectPodcastLocalDB',
    'DirectPodcastChunkedDB',
    'DirectPodcastSharedDB',
  ]

  for (const dbName of databases) {
    try {
      await new Promise<void>((resolve, reject) => {
        const deleteReq = indexedDB.deleteDatabase(dbName)
        deleteReq.onsuccess = () => resolve()
        deleteReq.onerror = () => reject(deleteReq.error)
        deleteReq.onblocked = () => {
          setTimeout(() => {
            const deleteReq2 = indexedDB.deleteDatabase(dbName)
            deleteReq2.onsuccess = () => resolve()
            deleteReq2.onerror = () => reject(deleteReq2.error)
          }, 100)
        }
      })
    } catch (error) {
      // Continue with other databases even if one fails
    }
  }
}
