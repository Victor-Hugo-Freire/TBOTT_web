// Masterização das trilhas: o que acontece com a mistura depois que o ZzFXM soma os canais.
//
// São duas etapas:
// 1. No worker (prepararCanaisDaMusica): saturação suave e normalização. São operações por
//    amostra e sem estado, então a emenda do loop continua igual depois delas.
// 2. Em tempo de execução (AudioManager): filtros do master, reverb de sala e compressor.
//    A reverb fica aqui porque a fonte toca em loop contínuo: a cauda passa pela emenda e
//    pelo crossfade entre faixas sem precisar de nenhum cuidado.
//
// As constantes da etapa 2 ficam aqui para o script de render (scripts/render-trilha.mjs)
// reproduzir a mesma cadeia num WAV.

import { ZZFX_EXPERIMENTAL_SAMPLE_RATE } from './zzfxExperimental.js'
import { generateZzfxMusicSamples } from './zzfxmExperimental.js'

// Pico final da faixa preparada: -1 dBFS
export const PICO_DA_FAIXA = 0.89

// Quanto a saturação "aperta" os picos. Com 1,4, um pico em 1 sai em tanh(1,4) ≈ 0,885
// antes da normalização: os picos arredondam um pouco e o resto quase não muda.
export const DRIVE_DA_SATURACAO = 1.4

// Cadeia do master em tempo de execução
export const CADEIA_DO_MASTER = Object.freeze({
  passaAltaHz: 30,
  passaBaixaHz: 10000,
  reverbPadrao: 0.15,
  sala: Object.freeze({ duracao: 1.2, preDelay: 0.012, semente: 1907 }),
  compressor: Object.freeze({ threshold: -14, knee: 10, ratio: 2, attack: 0.012, release: 0.25 }),
  // O DynamicsCompressorNode aplica sozinho um ganho de compensação (~4 dB com esta curva)
  // que não dá para desligar; este ganho depois dele devolve o pico para perto de -1 dBFS.
  ganhoDeSaida: 0.6,
})

// Saturação suave seguida de normalização dos dois canais juntos (o estéreo não muda).
// Altera os canais no lugar e devolve { picoAntes, ganho } para as medições.
export function saturarENormalizar(canais, { drive = DRIVE_DA_SATURACAO, pico = PICO_DA_FAIXA } = {}) {
  let picoAntes = 0
  for (const canal of canais) {
    for (let i = 0; i < canal.length; i++) picoAntes = Math.max(picoAntes, Math.abs(canal[i]))
  }
  if (picoAntes === 0) return { picoAntes, ganho: 1 }

  // Primeiro leva o pico a 1, para o drive ter o mesmo efeito em qualquer faixa
  const entrada = 1 / picoAntes
  let picoSaturado = 0
  for (const canal of canais) {
    for (let i = 0; i < canal.length; i++) {
      canal[i] = Math.tanh(canal[i] * entrada * drive)
      picoSaturado = Math.max(picoSaturado, Math.abs(canal[i]))
    }
  }

  const saida = pico / picoSaturado
  for (const canal of canais) {
    for (let i = 0; i < canal.length; i++) canal[i] *= saida
  }

  return { picoAntes, ganho: entrada * saida }
}

// Gera os dois canais finais de uma música ZzFXM: loop contínuo, saturação e normalização.
export function prepararCanaisDaMusica(song, sampleRate = ZZFX_EXPERIMENTAL_SAMPLE_RATE) {
  const canais = generateZzfxMusicSamples(song, sampleRate, { loop: true, normalize: false })
  saturarENormalizar(canais)
  return canais
}

// Gerador pseudoaleatório com semente (mulberry32): a sala é sempre a mesma.
function criarAleatorio(semente) {
  let estado = semente >>> 0
  return () => {
    estado = (estado + 0x6d2b79f5) >>> 0
    let t = estado
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Resposta ao impulso de uma sala pequena, feita por código: ruído estéreo (um ruído
// diferente em cada lado) com decaimento exponencial, cada vez mais abafado perto do fim
// (o ar e as paredes absorvem primeiro os agudos). A energia de cada canal é 1, então o
// nível da reverb é o valor do envio.
export function criarRespostaDeSala(sampleRate = ZZFX_EXPERIMENTAL_SAMPLE_RATE, {
  duracao = CADEIA_DO_MASTER.sala.duracao,
  preDelay = CADEIA_DO_MASTER.sala.preDelay,
  semente = CADEIA_DO_MASTER.sala.semente,
} = {}) {
  const tamanho = Math.max(1, Math.round(sampleRate * duracao))
  const atraso = Math.round(sampleRate * preDelay)
  const aleatorio = criarAleatorio(semente)
  const canais = [new Float32Array(tamanho), new Float32Array(tamanho)]

  for (const canal of canais) {
    let filtrado = 0
    let energia = 0

    for (let i = atraso; i < tamanho; i++) {
      const progresso = (i - atraso) / (tamanho - atraso)
      // -60 dB no fim da resposta
      const envelope = Math.exp(-6.9 * progresso)
      // Corte do passa-baixa de um polo: de ~9 kHz no início a ~1,2 kHz no fim
      const corte = 9000 * (1 - progresso) + 1200 * progresso
      const coeficiente = 1 - Math.exp(-2 * Math.PI * corte / sampleRate)
      filtrado += coeficiente * ((aleatorio() * 2 - 1) - filtrado)
      canal[i] = filtrado * envelope
      energia += canal[i] * canal[i]
    }

    const escala = energia > 0 ? 1 / Math.sqrt(energia) : 0
    for (let i = 0; i < tamanho; i++) canal[i] *= escala
  }

  return canais
}
