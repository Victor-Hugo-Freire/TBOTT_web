import { VILA_ESPERA_META, VILA_ESPERA_SONG } from '../audio/music/vila-espera.js'
import { prepararCanaisDaMusica } from '../audio/masterizacao.js'
export { VILA_ESPERA_META } from '../audio/music/vila-espera.js'

export const VILA_ESPERA_MUSIC_NAME = 'a-vila-espera'

// Opções de registro no AudioManager (envio para a reverb de sala)
export const VILA_ESPERA_MUSIC_OPTIONS = Object.freeze({ reverb: VILA_ESPERA_META.reverb })

let preparedChannels = null
let preparationPromise = null

export function prepareVilaEsperaAudio() {
    if (preparedChannels) return Promise.resolve(preparedChannels)
    if (preparationPromise) return preparationPromise

    if (typeof Worker === 'undefined') {
        preparationPromise = Promise.resolve().then(() => {
            preparedChannels = prepararCanaisDaMusica(VILA_ESPERA_SONG)
            return preparedChannels
        })
        return preparationPromise
    }

    preparationPromise = new Promise((resolve, reject) => {
        const worker = new Worker(new URL('../workers/vilaEsperaMusic.worker.js', import.meta.url), { type: 'module' })

        worker.onmessage = ({ data }) => {
            worker.terminate()

            if (data?.error) {
                preparationPromise = null
                reject(new Error(data.error))
                return
            }

            if (!Array.isArray(data?.channels) || data.channels.length !== 2) {
                preparationPromise = null
                reject(new Error('A preparação da trilha não produziu canais válidos.'))
                return
            }

            preparedChannels = data.channels
            resolve(preparedChannels)
        }

        worker.onerror = () => {
            worker.terminate()
            preparationPromise = null
            reject(new Error('Falha ao iniciar a preparação da trilha.'))
        }

        worker.postMessage({ prepare: true })
    })

    return preparationPromise
}

export function createVilaEsperaAudioSource(context) {
    // Sem preparação prévia, gera aqui mesmo (mais lento, mas o som é o mesmo)
    if (
        !preparedChannels
        || preparedChannels.length !== 2
        || !(preparedChannels[0] instanceof Float32Array)
    ) {
        preparedChannels = prepararCanaisDaMusica(VILA_ESPERA_SONG)
    }

    const sampleRate = 44100
    const buffer = context.createBuffer(2, preparedChannels[0].length, sampleRate)
    buffer.getChannelData(0).set(preparedChannels[0])
    buffer.getChannelData(1).set(preparedChannels[1])

    const source = context.createBufferSource()
    source.buffer = buffer
    source.loop = true
    return source
}

export function shouldPlayVilaEsperaForPathname(pathname) {
    return pathname !== '/jogo'
}
