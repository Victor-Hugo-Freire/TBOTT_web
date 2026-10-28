import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { BackgroundMusicContext } from './backgroundMusic.js'
import { ROUTES } from '../routes/paths.js'

function getMusicStatusFromError(error) {
  return error.name === 'NotAllowedError' ? 'blocked' : 'error'
}

export function BackgroundMusicProvider({ children }) {
  const { pathname } = useLocation()
  const audioRef = useRef(null)
  const [enabled, setEnabled] = useState(true)
  const [status, setStatus] = useState('idle')

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return undefined

    if (pathname !== ROUTES.novaPartida || !enabled) {
      audio.pause()
      return undefined
    }

    let active = true
    audio.volume = 0.35
    audio.play()
      .then(() => {
        if (active) setStatus('playing')
      })
      .catch((error) => {
        if (active) setStatus(getMusicStatusFromError(error))
      })

    return () => {
      active = false
      audio.pause()
    }
  }, [enabled, pathname])

  return (
    <BackgroundMusicContext.Provider value={{ enabled, setEnabled, status }}>
      <audio ref={audioRef} src="/audio/sala-inicial.mp3" loop preload="auto" />
      {children}
    </BackgroundMusicContext.Provider>
  )
}
