import { prepararCanaisDaMusica } from '../audio/masterizacao.js'
import { obterMusica } from '../audio/music/musicas.js'

// Gera uma faixa da trilha fora da thread principal: soma dos canais em loop contínuo, saturação
// suave e normalização (masterizacao.js). A reverb e o compressor ficam no AudioManager e na mesa
// do jogo. Recebe { id, sampleRate } e devolve { id, channels } (ou { id, error }).
self.onmessage = ({ data }) => {
  const id = typeof data?.id === 'string' ? data.id : 'a-vila-espera'
  try {
    const sampleRate = Number.isFinite(data?.sampleRate) ? data.sampleRate : 44100
    const channels = prepararCanaisDaMusica(obterMusica(id), sampleRate)
    self.postMessage({ id, channels }, channels.map((channel) => channel.buffer))
  } catch (error) {
    self.postMessage({ id, error: error?.message || 'Falha ao gerar a trilha.' })
  }
}
