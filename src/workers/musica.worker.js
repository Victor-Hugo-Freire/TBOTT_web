import { prepararFaixa } from '../audio/masterizacao.js'
import { obterFaixa } from '../audio/music/musicas.js'

// Gera uma faixa da trilha fora da thread principal: o corpo em loop contínuo e a introdução (se a
// faixa tiver), com a mesma saturação e normalização (masterizacao.js). A reverb e o compressor ficam
// no AudioManager e na mesa do jogo. Recebe { id, sampleRate } e devolve
// { id, channels, intro, introSamples } (ou { id, error }).
self.onmessage = ({ data }) => {
  const id = typeof data?.id === 'string' ? data.id : 'a-vila-espera'
  try {
    const sampleRate = Number.isFinite(data?.sampleRate) ? data.sampleRate : 44100
    const faixa = prepararFaixa(obterFaixa(id), sampleRate)
    const transferir = [...faixa.canais, ...(faixa.intro ?? [])].map((channel) => channel.buffer)
    self.postMessage({ id, channels: faixa.canais, intro: faixa.intro, introSamples: faixa.introAmostras }, transferir)
  } catch (error) {
    self.postMessage({ id, error: error?.message || 'Falha ao gerar a trilha.' })
  }
}
