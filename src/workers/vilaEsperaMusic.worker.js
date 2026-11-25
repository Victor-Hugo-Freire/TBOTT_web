import { prepararCanaisDaMusica } from '../audio/masterizacao.js'
import { VILA_ESPERA_SONG } from '../audio/music/vila-espera.js'

// Gera a trilha fora da thread principal: soma dos canais em loop contínuo, saturação
// suave e normalização (masterizacao.js). A reverb e o compressor ficam no AudioManager.
self.onmessage = ({ data }) => {
  try {
    const sampleRate = Number.isFinite(data?.sampleRate) ? data.sampleRate : 44100
    const channels = prepararCanaisDaMusica(VILA_ESPERA_SONG, sampleRate)
    self.postMessage({ channels }, channels.map((channel) => channel.buffer))
  } catch (error) {
    self.postMessage({ error: error?.message || 'Falha ao gerar a trilha.' })
  }
}
