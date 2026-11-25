import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAudio } from '../../context/useAudio.js'
import {
  prepareVilaEsperaAudio,
  shouldPlayVilaEsperaForPathname,
  VILA_ESPERA_MUSIC_NAME,
} from '../../data/vilaEsperaMusic.js'
import { useMusicaDoJogo } from './useMusicaDoJogo.js'

export default function VilaEsperaMusicController() {
  const location = useLocation()
  const { unlock, playMusic, stopMusic, activeMusicName } = useAudio()

  useEffect(() => {
    let interactionPending = false
    let installed = true

    function removeInteractionListeners() {
      window.removeEventListener('keydown', handleInteraction)
      window.removeEventListener('pointerdown', handleInteraction)
    }

    async function startOnInteraction() {
      if (interactionPending) return
      interactionPending = true

      try {
        await prepareVilaEsperaAudio()
        if (!installed) return

        await unlock()
        if (!installed) return

        const result = playMusic(VILA_ESPERA_MUSIC_NAME, { fadeMs: 180 })
        if (result.played || result.reason === 'already-playing') {
          removeInteractionListeners()
        }
      } catch {
        // Falha transitória de áudio não impede a navegação.
      } finally {
        interactionPending = false
      }
    }

    function handleInteraction(event) {
      if (event.type === 'keydown' && event.repeat) return
      void startOnInteraction()
    }

    if (!shouldPlayVilaEsperaForPathname(location.pathname)) {
      if (activeMusicName === VILA_ESPERA_MUSIC_NAME) {
        stopMusic({ fadeMs: 180 })
      }
      return () => {
        installed = false
        removeInteractionListeners()
      }
    }

    if (activeMusicName === VILA_ESPERA_MUSIC_NAME) {
      return () => {
        installed = false
      }
    }

    window.addEventListener('keydown', handleInteraction)
    window.addEventListener('pointerdown', handleInteraction)

    return () => {
      installed = false
      removeInteractionListeners()
    }
  }, [location.pathname, activeMusicName, unlock, playMusic, stopMusic])

  // Música do jogo (/jogo): depois do efeito da Vila, para a Vila sair antes de ela entrar
  useMusicaDoJogo()

  return null
}
