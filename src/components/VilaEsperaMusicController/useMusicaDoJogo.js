import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAudio } from '../../context/useAudio.js'
import { ROUTES } from '../../routes/paths.js'
import { CACHE_DAS_FAIXAS } from '../../audio/music/cacheDeFaixas.js'
import { clearGameMusicContext, subscribeGameMusic } from '../../audio/music/contextoDoJogo.js'
import { criarMesaDoJogo, FADES, MUSICA_DO_JOGO } from '../../audio/music/mesaDoJogo.js'
import { FAIXA_INICIAL } from '../../audio/music/trackSelection.js'

// Telas de onde o jogador vai para /jogo: a Cantina já fica pronta antes de a run começar
// (o menu tem o Continue; a seleção de personagem, a partida nova)
const ROTAS_QUE_PREPARAM_A_RUN = Object.freeze([ROUTES.menuPrincipal, ROUTES.selecaoPersonagem, ROUTES.novaPartida])

// Música do jogo (/jogo). A tela do jogo só avisa o contexto da run (contextoDoJogo.js); aqui ele
// chega à mesa (mesaDoJogo.js), que decide e faz as trocas. Para o AudioManager, a música do jogo é
// uma fonte só, que fica tocando enquanto o jogador está em /jogo. Fora de /jogo ela para com fade,
// e a "A Vila Espera" segue a regra dela (VilaEsperaMusicController).
export function useMusicaDoJogo() {
  const location = useLocation()
  const { unlock, registerMusic, unregisterMusic, playMusic, stopMusic, activeMusicName } = useAudio()
  const [mesa] = useState(() => criarMesaDoJogo({ cache: CACHE_DAS_FAIXAS }))
  const noJogo = location.pathname === ROUTES.novaPartida

  // A reverb da música do jogo fica na própria mesa (cada faixa com a sua), então o envio do
  // AudioManager para esta fonte é zero
  useEffect(() => {
    registerMusic(MUSICA_DO_JOGO, (context) => mesa.criarFonte(context), { reverb: 0 })
    return () => unregisterMusic(MUSICA_DO_JOGO)
  }, [mesa, registerMusic, unregisterMusic])

  useEffect(() => {
    if (!ROTAS_QUE_PREPARAM_A_RUN.includes(location.pathname)) return
    void CACHE_DAS_FAIXAS.preparar(FAIXA_INICIAL).catch(() => {})
  }, [location.pathname])

  // Contexto da run → mesa. Fora de /jogo a mesa esquece a run.
  useEffect(() => {
    if (!noJogo) {
      clearGameMusicContext()
      mesa.limpar()
      return undefined
    }
    return subscribeGameMusic((contexto) => mesa.definirContexto(contexto))
  }, [noJogo, mesa])

  // A fonte do jogo toca enquanto o jogador está em /jogo. O áudio só destrava depois de um gesto
  // do jogador: até lá, cada tecla ou clique tenta de novo (como na "A Vila Espera").
  useEffect(() => {
    if (!noJogo) {
      if (activeMusicName === MUSICA_DO_JOGO) stopMusic({ fadeMs: FADES.saidaDoJogo })
      return undefined
    }
    if (activeMusicName === MUSICA_DO_JOGO) return undefined

    let installed = true
    let pending = false

    function removeInteractionListeners() {
      window.removeEventListener('keydown', handleInteraction)
      window.removeEventListener('pointerdown', handleInteraction)
    }

    async function start() {
      if (pending) return
      pending = true
      try {
        // Depois de um await: a Vila (que para ao entrar em /jogo) já saiu antes desta fonte entrar
        await unlock()
        if (!installed) return
        const result = playMusic(MUSICA_DO_JOGO, { fadeMs: 180 })
        if (result.played || result.reason === 'already-playing') removeInteractionListeners()
      } catch {
        // Falha transitória de áudio não atrapalha o jogo
      } finally {
        pending = false
      }
    }

    function handleInteraction(event) {
      if (event.type === 'keydown' && event.repeat) return
      void start()
    }

    window.addEventListener('keydown', handleInteraction)
    window.addEventListener('pointerdown', handleInteraction)
    void start()

    return () => {
      installed = false
      removeInteractionListeners()
    }
  }, [noJogo, activeMusicName, unlock, playMusic, stopMusic])
}
