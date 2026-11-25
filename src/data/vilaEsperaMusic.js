import { VILA_ESPERA_META, VILA_ESPERA_SONG } from '../audio/music/vila-espera.js'
import { prepararCanaisDaMusica } from '../audio/masterizacao.js'
import { CACHE_DAS_FAIXAS } from '../audio/music/cacheDeFaixas.js'
export { VILA_ESPERA_META } from '../audio/music/vila-espera.js'

export const VILA_ESPERA_MUSIC_NAME = 'a-vila-espera'

// Opções de registro no AudioManager (envio para a reverb de sala)
export const VILA_ESPERA_MUSIC_OPTIONS = Object.freeze({ reverb: VILA_ESPERA_META.reverb })

// Prepara a trilha num worker, no cache comum da trilha (no máximo 3 faixas; ver cacheDeFaixas.js).
// É urgente: é a música que o jogador está esperando ouvir no menu.
export function prepareVilaEsperaAudio() {
    return CACHE_DAS_FAIXAS.preparar(VILA_ESPERA_MUSIC_NAME, { urgente: true })
}

export function createVilaEsperaAudioSource(context) {
    // Sem preparação prévia (ou depois de o cache liberar a faixa no jogo), gera aqui mesmo:
    // mais lento, mas o som é o mesmo
    if (!CACHE_DAS_FAIXAS.estaPronta(VILA_ESPERA_MUSIC_NAME)) {
        CACHE_DAS_FAIXAS.guardar(VILA_ESPERA_MUSIC_NAME, prepararCanaisDaMusica(VILA_ESPERA_SONG))
    }

    const source = context.createBufferSource()
    source.buffer = CACHE_DAS_FAIXAS.obterBuffer(VILA_ESPERA_MUSIC_NAME, context)
    source.loop = true
    return source
}

// Em /jogo a Vila cede a vez à música do jogo (useMusicaDoJogo)
export function shouldPlayVilaEsperaForPathname(pathname) {
    return pathname !== '/jogo'
}

// A Vila entra com fade (ao abrir o site, depois do primeiro gesto, e ao voltar do jogo)
export const VILA_ESPERA_FADE_IN_MS = 1000

// A Vila deve começar agora? Basta o áudio estar destravado ('ready'): o navegador só exige um
// gesto do jogador (tecla ou clique) depois de abrir ou recarregar a página, e o AudioProvider já
// atende esse gesto. Trocar de tela ou voltar do jogo não pede gesto nenhum.
export function shouldStartVilaEspera({ pathname, audioState, activeMusicName }) {
    return shouldPlayVilaEsperaForPathname(pathname)
        && audioState === 'ready'
        && activeMusicName !== VILA_ESPERA_MUSIC_NAME
}
