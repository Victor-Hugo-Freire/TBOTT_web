import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAudio } from '../../context/useAudio.js'
import { ROUTES } from '../../routes/paths.js'
import { CACHE_DAS_FAIXAS } from '../../audio/music/cacheDeFaixas.js'
import { clearGameMusicContext, subscribeGameMusic } from '../../audio/music/contextoDoJogo.js'
import { criarMesaDoJogo, FADES, MUSICA_DO_JOGO, shouldStartGameMusic } from '../../audio/music/mesaDoJogo.js'
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
  const { state, registerMusic, unregisterMusic, playMusic, stopMusic, activeMusicName } = useAudio()
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

  // A fonte do jogo toca enquanto o jogador está em /jogo, assim que o áudio estiver destravado.
  // Sem gesto ainda (F5 direto em /jogo), ela entra sozinha no primeiro gesto: o AudioProvider
  // destrava e `state` vira 'ready'. A parada leva o nome: nunca derruba a Vila que entrou no lugar.
  useEffect(() => {
    if (!noJogo) {
      if (activeMusicName === MUSICA_DO_JOGO) stopMusic({ fadeMs: FADES.saidaDoJogo, name: MUSICA_DO_JOGO })
      return
    }
    if (!shouldStartGameMusic({ pathname: location.pathname, audioState: state, activeMusicName })) return
    playMusic(MUSICA_DO_JOGO, { fadeMs: 180 })
  }, [noJogo, location.pathname, state, activeMusicName, playMusic, stopMusic])
}
