import { VILA_ESPERA_INTRO_SONG, VILA_ESPERA_META, VILA_ESPERA_SONG } from '../audio/music/vila-espera.js'
import { prepararFaixa } from '../audio/masterizacao.js'
import { CACHE_DAS_FAIXAS } from '../audio/music/cacheDeFaixas.js'
import { criarFonteComIntro } from '../audio/fonteComIntro.js'
export { VILA_ESPERA_META } from '../audio/music/vila-espera.js'

export const VILA_ESPERA_MUSIC_NAME = 'a-vila-espera'

// Opções de registro no AudioManager (envio para a reverb de sala)
export const VILA_ESPERA_MUSIC_OPTIONS = Object.freeze({ reverb: VILA_ESPERA_META.reverb })

// Prepara a trilha num worker, no cache comum da trilha (no máximo 3 faixas; ver cacheDeFaixas.js).
// É urgente: é a música que o jogador está esperando ouvir no menu.
export function prepareVilaEsperaAudio() {
    return CACHE_DAS_FAIXAS.preparar(VILA_ESPERA_MUSIC_NAME, { urgente: true })
}

// A fonte toca a introdução uma vez e depois o corpo em loop (fonteComIntro.js)
export function createVilaEsperaAudioSource(context) {
    // Sem preparação prévia (ou depois de o cache liberar a faixa no jogo), gera aqui mesmo:
    // mais lento, mas o som é o mesmo
    if (!CACHE_DAS_FAIXAS.estaPronta(VILA_ESPERA_MUSIC_NAME)) {
        CACHE_DAS_FAIXAS.guardar(VILA_ESPERA_MUSIC_NAME, prepararFaixa({ corpo: VILA_ESPERA_SONG, intro: VILA_ESPERA_INTRO_SONG }))
    }

    const corpo = CACHE_DAS_FAIXAS.obterBuffer(VILA_ESPERA_MUSIC_NAME, context)
    const intro = CACHE_DAS_FAIXAS.obterIntro(VILA_ESPERA_MUSIC_NAME, context)
    return criarFonteComIntro(context, corpo, intro)
}

// Em /jogo a Vila cede a vez à música do jogo (useMusicaDoJogo)
export function shouldPlayVilaEsperaForPathname(pathname) {
    return pathname !== '/jogo'
}

// Fade de entrada do AudioManager por cima da introdução (que já começa suave): só evita qualquer
// clique no primeiro instante. A duração da introdução fica em VILA_ESPERA_INTRO_COMPASSOS
// (src/audio/music/vila-espera.js).
export const VILA_ESPERA_FADE_IN_MS = 600

// A Vila deve começar agora? Basta o áudio estar destravado ('ready'): o navegador só exige um
// gesto do jogador (tecla ou clique) depois de abrir ou recarregar a página, e o AudioProvider já
// atende esse gesto. Trocar de tela ou voltar do jogo não pede gesto nenhum.
export function shouldStartVilaEspera({ pathname, audioState, activeMusicName }) {
    return shouldPlayVilaEsperaForPathname(pathname)
        && audioState === 'ready'
        && activeMusicName !== VILA_ESPERA_MUSIC_NAME
}
