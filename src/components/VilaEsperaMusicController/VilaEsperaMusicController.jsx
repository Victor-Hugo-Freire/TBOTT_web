import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAudio } from '../../context/useAudio.js'
import {
  prepareVilaEsperaAudio,
  shouldPlayVilaEsperaForPathname,
  shouldStartVilaEspera,
  VILA_ESPERA_FADE_IN_MS,
  VILA_ESPERA_MUSIC_NAME,
} from '../../data/vilaEsperaMusic.js'
import { useMusicaDoJogo } from './useMusicaDoJogo.js'

// Fade de saída da música que estava tocando quando a Vila entra (a do jogo, ao voltar dele)
const VILA_ESPERA_CROSSFADE_MS = 800

// Música fora de /jogo ("A Vila Espera") e, pelo useMusicaDoJogo, a música do jogo.
//
// O navegador só deixa tocar som depois que o jogador interage com a página uma vez (tecla ou
// clique) depois de abri-la ou recarregá-la. Esse gesto é atendido pelo AudioProvider
// (installAudioUnlock), que destrava o áudio. Daí em diante (`state` 'ready') as músicas entram
// sozinhas: ao trocar de tela, ao voltar do jogo e ao começar uma run, sem pedir outro gesto.
export default function VilaEsperaMusicController() {
  const location = useLocation()
  const { state, playMusic, stopMusic, activeMusicName } = useAudio()

  // A faixa é preparada logo ao abrir o site (o worker não precisa de gesto): quando o jogador
  // apertar a primeira tecla, ela já está pronta para tocar
  useEffect(() => {
    if (!shouldPlayVilaEsperaForPathname(location.pathname)) return
    void prepareVilaEsperaAudio().catch(() => {})
  }, [location.pathname])

  useEffect(() => {
    if (!shouldPlayVilaEsperaForPathname(location.pathname)) {
      if (activeMusicName === VILA_ESPERA_MUSIC_NAME) stopMusic({ fadeMs: 180, name: VILA_ESPERA_MUSIC_NAME })
      return undefined
    }
    if (!shouldStartVilaEspera({ pathname: location.pathname, audioState: state, activeMusicName })) return undefined

    // Trocar de tela antes de a faixa ficar pronta só refaz este efeito; o início não se perde
    let cancelled = false
    void prepareVilaEsperaAudio()
      .then((ready) => {
        if (cancelled || ready === false) return
        playMusic(VILA_ESPERA_MUSIC_NAME, { fadeMs: VILA_ESPERA_CROSSFADE_MS, fadeInMs: VILA_ESPERA_FADE_IN_MS })
      })
      .catch(() => {
        // Falha transitória de áudio não impede a navegação.
      })

    return () => {
      cancelled = true
    }
  }, [location.pathname, state, activeMusicName, playMusic, stopMusic])

  // Música do jogo (/jogo): depois do efeito da Vila, para a Vila sair antes de ela entrar
  useMusicaDoJogo()

  return null
}
