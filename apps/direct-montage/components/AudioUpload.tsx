'use client'

import { useState } from 'react'
import { isAudioFile } from '@/lib/files'
import { AudioFileIcon } from './icons'

interface AudioUploadProps {
  onFilesSelect: (files: File[]) => void
}

export default function AudioUpload({ onFilesSelect }: AudioUploadProps) {
  const [error, setError] = useState<string | null>(null)

  const handleFiles = (files: File[]) => {
    const audio = files.filter(isAudioFile)
    const rejected = files.filter((file) => !isAudioFile(file))
    setError(
      rejected.length > 0
        ? `Format non supporté : ${rejected.map((file) => file.name).join(', ')}. Veuillez sélectionner des fichiers audio.`
        : null
    )
    if (audio.length > 0) onFilesSelect(audio)
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(Array.from(event.target.files ?? []))
    event.target.value = '' // Allow choosing the same file again
  }

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    handleFiles(Array.from(event.dataTransfer.files))
  }

  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
  }

  return (
    <label
      className='block relative border-2 border-dashed border-grey/60 rounded-lg p-8 text-center cursor-pointer hover:border-grey transition-colors bg-white/5'
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <input
        type='file'
        multiple
        onChange={handleFileChange}
        className='absolute inset-0 w-full h-full opacity-0 cursor-pointer'
        aria-label='Sélectionner des fichiers audio'
      />
      <AudioFileIcon
        size={48}
        className='mx-auto text-grey pointer-events-none'
      />
      <p className='mt-2 text-sm text-grey pointer-events-none'>
        Cliquez pour charger ou glissez-déposez
      </p>
      <p className='text-xs text-grey/70 pointer-events-none'>
        Fichiers audio uniquement. Plusieurs fichiers = plusieurs pistes.
      </p>
      {error && (
        <p className='mt-2 text-sm text-danger pointer-events-none'>{error}</p>
      )}
    </label>
  )
}
