import React, { useState } from 'react'
import styled from 'styled-components'
import Header from '../components/Header'
import Footer from '../components/Footer'
import {
  getAllLocalRecordings,
  clearAllDatabases,
  LocalRecording,
} from '../lib/recordingDB'
import {
  getIncompleteSessions,
  reassembleRecording,
  getSessionChunks,
  RecordingSession,
} from '../lib/chunkedRecordingDB'

type RecordingSessionWithChunks = RecordingSession & { chunkCount: number }

const Container = styled.div`
  min-height: 100vh;
  background: ${(props) => props.theme.blue};
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 100vw;
  overflow-x: hidden;
  box-sizing: border-box;
`

const Main = styled.main`
  flex: 1;
  padding: 0.75rem;
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
  max-width: 100vw;
  box-sizing: border-box;
  overflow-x: hidden;

  @media (min-width: 768px) {
    padding: 2rem;
    max-width: 800px;
  }
`

const Title = styled.h1`
  color: ${(props) => props.theme.grey};
  margin-bottom: 1.5rem;
  font-size: 1.5rem;

  @media (min-width: 768px) {
    font-size: 2rem;
    margin-bottom: 2rem;
  }
`

const Section = styled.div`
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  border: 1px solid ${(props) => props.theme.grey};
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow-x: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;

  @media (min-width: 768px) {
    padding: 24px;
    margin-bottom: 24px;
  }
  
  &:hover {
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  }
`

const SectionTitle = styled.h2`
  margin-bottom: 1rem;
  color: ${(props) => props.theme.grey};
  font-size: 1.1rem;

  @media (min-width: 768px) {
    font-size: 1.5rem;
  }
`

const RecordingList = styled.ul`
  list-style: none;
  padding: 0;
`

const RecordingItem = styled.li`
  padding: 8px;
  border: 1px solid ${(props) => props.theme.grey};
  border-radius: 8px;
  margin-bottom: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(5px);
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow-wrap: break-word;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

  @media (min-width: 640px) {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    gap: 12px;
  }
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    background: rgba(255, 255, 255, 0.08);
  }

  strong {
    color: ${(props) => props.theme.grey};
    font-size: 0.9rem;
    word-break: break-word;

    @media (min-width: 768px) {
      font-size: 1rem;
    }
  }

  small {
    color: ${(props) => props.theme.grey};
    opacity: 0.8;
    font-size: 0.75rem;

    @media (min-width: 768px) {
      font-size: 0.875rem;
    }
  }

  > div {
    flex: 1;
    min-width: 0;
    max-width: 100%;
    overflow-wrap: break-word;
    word-wrap: break-word;
    hyphens: auto;
  }
`

const Button = styled.button`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  color: ${(props) => props.theme.grey};
  border: 2px solid ${(props) => props.theme.grey};
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.875rem;
  white-space: nowrap;
  width: 100%;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

  @media (min-width: 640px) {
    width: auto;
    padding: 12px 24px;
  }
  
  @media (max-width: 768px) {
    padding: 12px 20px;
    font-size: 1rem;
  }

  &:hover {
    transform: scale(1.05);
    background: rgba(255, 255, 255, 0.2);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    color: ${(props) => props.theme.white};
  }
  
  &:active {
    transform: scale(0.98);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`

const DangerButton = styled(Button)`
  background: ${(props) => props.theme.red};
  color: ${(props) => props.theme.white};
  border: 2px solid ${(props) => props.theme.red};

  &:hover {
    background: #a54550;
    border-color: #a54550;
    color: ${(props) => props.theme.white};
  }
`

const InfoText = styled.p`
  color: ${(props) => props.theme.grey};
  font-size: 0.875rem;
  margin-bottom: 1rem;
  line-height: 1.5;

  @media (min-width: 768px) {
    font-size: 14px;
  }
`

const HomeLink = styled.a`
  color: ${(props) => props.theme.grey};
  text-decoration: underline;
  font-size: 0.875rem;
  margin-bottom: 1rem;
  display: inline-block;

  @media (min-width: 768px) {
    font-size: 16px;
  }

  &:hover {
    opacity: 0.8;
  }
`

const ErrorMessage = styled.div`
  background: rgba(220, 53, 69, 0.1);
  color: #dc3545;
  padding: 0.75rem;
  border-radius: 4px;
  border: 1px solid rgba(220, 53, 69, 0.3);
  margin-bottom: 1rem;
  font-size: 0.875rem;
  word-wrap: break-word;

  @media (min-width: 768px) {
    padding: 1rem;
    font-size: 14px;
  }
`

const ButtonContainer = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-direction: column;
  width: 100%;

  @media (min-width: 640px) {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 1rem;
  }
`

const RecoveryPage = () => {
  const [loading, setLoading] = useState(false)
  const [recordings, setRecordings] = useState<LocalRecording[]>([])
  const [sessions, setSessions] = useState<RecordingSessionWithChunks[]>([])
  const [convertingSessionId, setConvertingSessionId] = useState<string | null>(
    null
  )
  const [error, setError] = useState<string | null>(null)

  const loadRecordings = async () => {
    setLoading(true)
    try {
      // Load completed recordings
      try {
        const localRecordings = await getAllLocalRecordings()
        setRecordings(localRecordings)
      } catch (error) {
        // No local recordings database or empty - that's fine
        setRecordings([])
      }

      // Load incomplete sessions
      try {
        const incompleteSessions = await getIncompleteSessions()
        const sessionsWithInfo = await Promise.all(
          incompleteSessions.map(async (session) => {
            const chunks = await getSessionChunks(session.id)
            return {
              ...session,
              chunkCount: chunks.length,
            }
          })
        )
        setSessions(sessionsWithInfo)
      } catch (error) {
        // No chunked recordings database or schema mismatch - that's fine
        setSessions([])
      }
    } catch (error) {
      // Only show error for unexpected issues
    } finally {
      setLoading(false)
    }
  }

  const downloadRecording = (recording: LocalRecording) => {
    // Use the actual stored file type, not forced WAV
    const blob = new Blob([recording.arrayBuffer], {
      type: recording.fileType,
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url

    // Determine correct extension from actual file type
    let extension = 'wav'
    if (recording.fileType?.includes('webm')) {
      extension = 'webm'
    } else if (recording.fileType?.includes('mp4')) {
      extension = 'mp4'
    } else if (recording.fileType?.includes('mpeg')) {
      extension = 'mp3'
    }

    // Replace extension in filename if needed
    const baseFilename = recording.filename.replace(/\.\w+$/, '')
    a.download = `${baseFilename}.${extension}`

    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const downloadSession = async (session: RecordingSessionWithChunks) => {
    try {
      setConvertingSessionId(session.id)
      setError(null)
      const recovered = await reassembleRecording(session.id)
      if (recovered) {
        // Convert WebM chunks to WAV using FFmpeg
        if (recovered.mimeType.includes('webm')) {
          try {
            // Import FFmpeg dynamically
            const { FFmpeg } = await import('@ffmpeg/ffmpeg')
            const { toBlobURL } = await import('@ffmpeg/util')

            const ffmpeg = new FFmpeg()

            // Load FFmpeg with the correct version
            // Note: Using a fixed version since we don't have access to packageJSON here
            const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'

            await ffmpeg.load({
              coreURL: await toBlobURL(
                `${baseURL}/ffmpeg-core.js`,
                'text/javascript'
              ),
              wasmURL: await toBlobURL(
                `${baseURL}/ffmpeg-core.wasm`,
                'application/wasm'
              ),
            })

            const inputFile = 'recovered.webm'
            const outputFile = 'recovered.wav'

            // Write WebM data to FFmpeg
            const arrayBuffer = await recovered.blob.arrayBuffer()
            const uint8Array = new Uint8Array(arrayBuffer)
            await ffmpeg.writeFile(inputFile, uint8Array)

            // Convert to WAV
            await ffmpeg.exec(['-i', inputFile, outputFile])

            // Read the converted WAV file
            const wavData = await ffmpeg.readFile(outputFile)
            const wavBlob = new Blob([wavData], { type: 'audio/wav' })

            // Download the WAV file
            const url = URL.createObjectURL(wavBlob)
            const a = document.createElement('a')
            a.href = url
            a.download = `recovered_${
              new Date(session.startTime).toISOString().split('T')[0]
            }.wav`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)

            // Cleanup
            try {
              await ffmpeg.deleteFile(inputFile)
              await ffmpeg.deleteFile(outputFile)
            } catch (cleanupError) {
              // Ignore cleanup errors
            }
          } catch (conversionError) {
            // If FFmpeg conversion fails, fall back to downloading the original WebM
            setError(
              'Conversion en WAV échouée, téléchargement du fichier WebM original'
            )
            const url = URL.createObjectURL(recovered.blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `recovered_${
              new Date(session.startTime).toISOString().split('T')[0]
            }.webm`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
          }
        } else {
          // Already WAV or other format, download as-is
          const url = URL.createObjectURL(recovered.blob)
          const a = document.createElement('a')
          a.href = url
          const extension = recovered.mimeType.includes('wav')
            ? 'wav'
            : recovered.mimeType.includes('mp4')
              ? 'mp4'
              : 'webm'
          a.download = `recovered_${
            new Date(session.startTime).toISOString().split('T')[0]
          }.${extension}`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
        }
      }
    } catch (error) {
      setError('Erreur lors du téléchargement de la session')
    } finally {
      setConvertingSessionId(null)
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('fr-FR')
  }

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(2)} MB`
  }

  const handleClearAll = async () => {
    if (
      confirm(
        'Êtes-vous sûr de vouloir supprimer tous les enregistrements stockés localement ? Cette action est irréversible.'
      )
    ) {
      setLoading(true)
      setError(null)
      try {
        await clearAllDatabases()
        setRecordings([])
        setSessions([])
        setError('Tous les enregistrements ont été supprimés.')
      } catch (error) {
        setError('Erreur lors de la suppression des enregistrements.')
      } finally {
        setLoading(false)
      }
    }
  }

  React.useEffect(() => {
    loadRecordings()
  }, [])

  return (
    <Container>
      <Header showMp3Toggle={false} />
      <Main>
        <HomeLink href='/'>← Retour à l&apos;enregistrement</HomeLink>

        <Title>Récupération des Enregistrements</Title>

        {error && (
          <ErrorMessage>
            {error}
            <button
              onClick={() => setError(null)}
              style={{
                background: 'none',
                border: 'none',
                color: '#dc3545',
                cursor: 'pointer',
                float: 'right',
                fontSize: '16px',
                padding: '0',
                marginLeft: '1rem',
              }}
            >
              ×
            </button>
          </ErrorMessage>
        )}

        <InfoText>
          Les enregistrements sont stockés localement dans votre navigateur en
          utilisant IndexedDB. Ils ne quittent jamais votre appareil sauf si
          vous les partagez explicitement. Les enregistrements complétés sont
          automatiquement supprimés après 7 jours, et les sessions incomplètes
          après 24 heures.
        </InfoText>

        <Section>
          <SectionTitle>
            Enregistrements Complétés ({recordings.length})
          </SectionTitle>
          {recordings.length > 0 ? (
            <>
              <InfoText style={{ color: '#999', fontSize: '12px' }}>
                Certains fichiers peuvent être des récupérations automatiques
                incorrectes. Utilisez le bouton &quot;Supprimer tous les
                enregistrements&quot; pour nettoyer et recommencer.
              </InfoText>
              <RecordingList>
                {recordings.map((recording) => (
                  <RecordingItem key={recording.id}>
                    <div>
                      <strong>{recording.filename}</strong>
                      <br />
                      <small>
                        {formatDate(recording.timestamp)} •{' '}
                        {formatFileSize(recording.arrayBuffer.byteLength)} •{' '}
                        {recording.fileType || 'audio/wav'}
                      </small>
                    </div>
                    <Button onClick={() => downloadRecording(recording)}>
                      Télécharger
                    </Button>
                  </RecordingItem>
                ))}
              </RecordingList>
            </>
          ) : (
            <p style={{ color: '#999' }}>
              Aucun enregistrement complété trouvé
            </p>
          )}
        </Section>

        <Section>
          <SectionTitle>Sessions Incomplètes ({sessions.length})</SectionTitle>
          {sessions.length > 0 ? (
            <>
              <p style={{ marginBottom: '1rem', color: '#999' }}>
                Ces sessions peuvent être des enregistrements interrompus par un
                crash
              </p>
              <RecordingList>
                {sessions.map((session) => (
                  <RecordingItem key={session.id}>
                    <div>
                      <strong>
                        Session du {formatDate(session.startTime)}
                      </strong>
                      <br />
                      <small>{session.chunkCount} segments sauvegardés</small>
                    </div>
                    <Button
                      onClick={() => downloadSession(session)}
                      disabled={convertingSessionId === session.id}
                    >
                      {convertingSessionId === session.id
                        ? 'Conversion...'
                        : 'Récupérer'}
                    </Button>
                  </RecordingItem>
                ))}
              </RecordingList>
            </>
          ) : (
            <p style={{ color: '#999' }}>Aucune session incomplète trouvée</p>
          )}
        </Section>

        <Section>
          <ButtonContainer>
            <Button onClick={loadRecordings} disabled={loading}>
              {loading ? 'Chargement...' : 'Actualiser'}
            </Button>
            <DangerButton onClick={handleClearAll} disabled={loading}>
              Supprimer tous les enregistrements
            </DangerButton>
          </ButtonContainer>
        </Section>
      </Main>
      <Footer />
    </Container>
  )
}

export default RecoveryPage
