import React, { useRef, useCallback } from 'react'
import styled from 'styled-components'

const HiddenIframe = styled.iframe`
  position: absolute;
  left: -9999px;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
`

interface IframeBridgeProps {
  onBridgeReady: (bridge: IframeBridge) => void
}

export interface IframeBridge {
  sendAudioData: (filename: string, fileType: string, arrayBuffer: ArrayBuffer) => Promise<void>
  navigateToMontage: () => void
}

const IframeBridge: React.FC<IframeBridgeProps> = ({ onBridgeReady }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const bridgeReadyRef = useRef(false)

  const sendAudioData = useCallback(async (filename: string, fileType: string, arrayBuffer: ArrayBuffer): Promise<void> => {
    return new Promise((resolve, reject) => {
      const iframe = iframeRef.current
      if (!iframe || !iframe.contentWindow) {
        reject(new Error('Bridge iframe not ready'))
        return
      }

      const messageId = `audio-data-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      const handleResponse = (event: MessageEvent) => {
        if (event.origin !== 'https://montage.directpodcast.fr') return
        if (event.data.type === 'AUDIO_DATA_SAVED' && event.data.messageId === messageId) {
          window.removeEventListener('message', handleResponse)
          resolve()
        } else if (event.data.type === 'AUDIO_DATA_ERROR' && event.data.messageId === messageId) {
          window.removeEventListener('message', handleResponse)
          reject(new Error(event.data.error))
        }
      }

      window.addEventListener('message', handleResponse)

      // Send audio data
      iframe.contentWindow.postMessage({
        type: 'SAVE_AUDIO_DATA',
        messageId,
        data: {
          filename,
          fileType,
          arrayBuffer
        }
      }, 'https://montage.directpodcast.fr')
    })
  }, [])

  const navigateToMontage = useCallback(() => {
    window.open('https://montage.directpodcast.fr?sharing=true', '_blank')
  }, [])

  const handleIframeLoad = useCallback(() => {
    if (bridgeReadyRef.current) return
    
    bridgeReadyRef.current = true
    const bridge: IframeBridge = {
      sendAudioData,
      navigateToMontage
    }
    onBridgeReady(bridge)
  }, [onBridgeReady, sendAudioData, navigateToMontage])

  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://montage.directpodcast.fr') return
      if (event.data.type === 'BRIDGE_READY') {
        handleIframeLoad()
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [handleIframeLoad])

  return (
    <HiddenIframe
      ref={iframeRef}
      src="https://montage.directpodcast.fr/bridge"
      onLoad={handleIframeLoad}
      title="IndexedDB Bridge"
    />
  )
}

export default IframeBridge