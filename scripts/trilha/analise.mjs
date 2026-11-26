// Ferramentas do render da trilha: medições, cadeia do master fora do navegador e WAV.
// Usadas só por scripts/render-trilha.mjs (Node), nunca pelo jogo.

import { writeFileSync } from 'node:fs'
import { CADEIA_DO_MASTER, criarRespostaDeSala } from '../../src/audio/masterizacao.js'

// --------------------------------------------------
// FFT (radix 2, no lugar)
// --------------------------------------------------

export function fft(re, im) {
  const n = re.length
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1
    for (; j & bit; bit >>= 1) j ^= bit
    j ^= bit
    if (i < j) {
      ;[re[i], re[j]] = [re[j], re[i]]
      ;[im[i], im[j]] = [im[j], im[i]]
    }
  }
  for (let size = 2; size <= n; size <<= 1) {
    const angle = -2 * Math.PI / size
    const wr = Math.cos(angle)
    const wi = Math.sin(angle)
    for (let start = 0; start < n; start += size) {
      let cr = 1
      let ci = 0
      for (let k = 0; k < size / 2; k++) {
        const a = start + k
        const b = a + size / 2
        const tr = re[b] * cr - im[b] * ci
        const ti = re[b] * ci + im[b] * cr
        re[b] = re[a] - tr
        im[b] = im[a] - ti
        re[a] += tr
        im[a] += ti
        const next = cr * wr - ci * wi
        ci = cr * wi + ci * wr
        cr = next
      }
    }
  }
}

function ifft(re, im) {
  for (let i = 0; i < im.length; i++) im[i] = -im[i]
  fft(re, im)
  const n = re.length
  for (let i = 0; i < n; i++) {
    re[i] /= n
    im[i] = -im[i] / n
  }
}

const proximaPotencia = (n) => 2 ** Math.ceil(Math.log2(n))

// Espectro de potência médio (janela de Hann) de um sinal mono
export function espectroMedio(sinal, tamanho = 4096) {
  const potencia = new Float64Array(tamanho / 2)
  const janela = Float64Array.from({ length: tamanho }, (_, i) => 0.5 - 0.5 * Math.cos(2 * Math.PI * i / tamanho))
  const re = new Float64Array(tamanho)
  const im = new Float64Array(tamanho)
  let blocos = 0

  for (let inicio = 0; inicio + tamanho <= sinal.length; inicio += tamanho / 2) {
    for (let i = 0; i < tamanho; i++) {
      re[i] = sinal[inicio + i] * janela[i]
      im[i] = 0
    }
    fft(re, im)
    for (let k = 0; k < tamanho / 2; k++) potencia[k] += re[k] * re[k] + im[k] * im[k]
    blocos++
  }

  if (blocos === 0 && sinal.length > 0) {
    re.fill(0)
    im.fill(0)
    for (let i = 0; i < Math.min(tamanho, sinal.length); i++) re[i] = sinal[i] * janela[i]
    fft(re, im)
    for (let k = 0; k < tamanho / 2; k++) potencia[k] = re[k] * re[k] + im[k] * im[k]
  }

  return potencia
}

export function mono(canais) {
  const [esquerdo, direito] = canais
  const saida = new Float32Array(esquerdo.length)
  for (let i = 0; i < saida.length; i++) saida[i] = (esquerdo[i] + (direito ? direito[i] : esquerdo[i])) / 2
  return saida
}

// Porcentagem da energia acima de `hz` e centroide espectral (Hz)
// e porcentagem entre 2 e 5 kHz (a região onde o som "de lata" mais incomoda)
export function distribuicaoEspectral(sinal, sampleRate, hz = 5000, tamanho = 4096) {
  const potencia = espectroMedio(sinal, tamanho)
  const resolucao = sampleRate / tamanho
  let total = 0
  let acima = 0
  let faixa = 0
  let ponderado = 0
  for (let k = 1; k < potencia.length; k++) {
    const frequencia = k * resolucao
    total += potencia[k]
    ponderado += potencia[k] * frequencia
    if (frequencia >= hz) acima += potencia[k]
    if (frequencia >= 2000 && frequencia < 5000) faixa += potencia[k]
  }
  return {
    acimaPct: total > 0 ? 100 * acima / total : 0,
    faixa2a5kPct: total > 0 ? 100 * faixa / total : 0,
    centroideHz: total > 0 ? ponderado / total : 0,
  }
}

// --------------------------------------------------
// Equilíbrio grave/agudo e volume percebido
// --------------------------------------------------

// Regiões do espectro usadas no relatório e nos testes de equilíbrio
export const BANDAS = Object.freeze([
  Object.freeze({ nome: 'sub', de: 0, ate: 60 }),
  Object.freeze({ nome: 'grave', de: 60, ate: 250 }),
  Object.freeze({ nome: 'medioGrave', de: 250, ate: 500 }),
  Object.freeze({ nome: 'medio', de: 500, ate: 2000 }),
  Object.freeze({ nome: 'presenca', de: 2000, ate: 5000 }),
  Object.freeze({ nome: 'agudo', de: 5000, ate: Infinity }),
])

// Ponderação A (potência): o ouvido em volume baixo, que quase não escuta abaixo de 100 Hz
function pesoA(frequencia) {
  const f2 = frequencia * frequencia
  const r = (12194 ** 2 * f2 * f2) / ((f2 + 20.6 ** 2) * Math.sqrt((f2 + 107.7 ** 2) * (f2 + 737.9 ** 2)) * (f2 + 12194 ** 2))
  return (r * 10 ** (2 / 20)) ** 2
}

// Parte da energia (0 a 1) em cada banda; peloOuvido aplica a ponderação A
export function energiaPorBanda(sinal, sampleRate, { peloOuvido = false, tamanho = 8192 } = {}) {
  const potencia = espectroMedio(sinal, tamanho)
  const resolucao = sampleRate / tamanho
  const soma = Object.fromEntries(BANDAS.map(({ nome }) => [nome, 0]))
  let total = 0
  for (let k = 1; k < potencia.length; k++) {
    const frequencia = k * resolucao
    const valor = peloOuvido ? potencia[k] * pesoA(frequencia) : potencia[k]
    total += valor
    soma[BANDAS.find(({ de, ate }) => frequencia >= de && frequencia < ate).nome] += valor
  }
  return Object.fromEntries(Object.entries(soma).map(([nome, valor]) => [nome, total > 0 ? valor / total : 0]))
}

// Energia total com a ponderação A (para comparar o peso de um grupo de instrumentos na mistura)
export function energiaPonderada(sinal, sampleRate, tamanho = 8192) {
  const potencia = espectroMedio(sinal, tamanho)
  const resolucao = sampleRate / tamanho
  let total = 0
  for (let k = 1; k < potencia.length; k++) total += potencia[k] * pesoA(k * resolucao)
  return total
}

// Parte da energia (0 a 1) acima de `hz`: num alto-falante de notebook ou celular, o que sobra do
// baixo é o que fica acima de ~150 Hz
export function energiaAcimaDe(sinal, sampleRate, hz, tamanho = 8192) {
  const potencia = espectroMedio(sinal, tamanho)
  const resolucao = sampleRate / tamanho
  let total = 0
  let acima = 0
  for (let k = 1; k < potencia.length; k++) {
    total += potencia[k]
    if (k * resolucao >= hz) acima += potencia[k]
  }
  return total > 0 ? acima / total : 0
}

// Biquad (fórmulas de Robert Bristow-Johnson) aplicado a um canal, com os coeficientes prontos
function filtrarComCoeficientes(sinal, { b0, b1, b2, a0, a1, a2 }) {
  const saida = new Float32Array(sinal.length)
  let x1 = 0
  let x2 = 0
  let y1 = 0
  let y2 = 0
  for (let i = 0; i < sinal.length; i++) {
    const y = (b0 * sinal[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0
    x2 = x1
    x1 = sinal[i]
    y2 = y1
    y1 = y
    saida[i] = y
  }
  return saida
}

function coeficientesPrateleiraAlta(sampleRate, frequencia, ganhoDb, q) {
  const A = 10 ** (ganhoDb / 40)
  const w = 2 * Math.PI * frequencia / sampleRate
  const cos = Math.cos(w)
  const alfa = Math.sin(w) / (2 * q)
  const raiz = 2 * Math.sqrt(A) * alfa
  return {
    b0: A * ((A + 1) + (A - 1) * cos + raiz), b1: -2 * A * ((A - 1) + (A + 1) * cos), b2: A * ((A + 1) + (A - 1) * cos - raiz),
    a0: (A + 1) - (A - 1) * cos + raiz, a1: 2 * ((A - 1) - (A + 1) * cos), a2: (A + 1) - (A - 1) * cos - raiz,
  }
}

function coeficientesPassaAlta(sampleRate, frequencia, q) {
  const w = 2 * Math.PI * frequencia / sampleRate
  const cos = Math.cos(w)
  const alfa = Math.sin(w) / (2 * q)
  return { b0: (1 + cos) / 2, b1: -(1 + cos), b2: (1 + cos) / 2, a0: 1 + alfa, a1: -2 * cos, a2: 1 - alfa }
}

// Volume percebido em LUFS (ponderação K da ITU-R BS.1770, sem o gate: as faixas são loops sem
// silêncio). Serve para comparar as faixas entre si.
export function volumePercebido(canais, sampleRate) {
  let soma = 0
  for (const canal of canais) {
    const filtrado = filtrarComCoeficientes(filtrarComCoeficientes(canal, coeficientesPrateleiraAlta(sampleRate, 1681.97, 4, 0.7072)), coeficientesPassaAlta(sampleRate, 38.135, 0.5003))
    let quadrados = 0
    for (let i = 0; i < filtrado.length; i++) quadrados += filtrado[i] * filtrado[i]
    soma += quadrados / filtrado.length
  }
  return -0.691 + 10 * Math.log10(soma || 1e-12)
}

// Fração da energia de uma nota que NÃO cai na série harmônica de f0: aliasing,
// ruído e parciais estranhas (o "som de lata" aparece aqui).
export function inarmonicidade(sinal, sampleRate, f0) {
  const tamanho = 8192
  const inicio = Math.min(Math.floor(sampleRate * 0.02), Math.max(0, sinal.length - tamanho))
  const trecho = sinal.subarray(inicio, inicio + tamanho)
  const potencia = espectroMedio(trecho, tamanho)
  const resolucao = sampleRate / tamanho
  let total = 0
  let fora = 0
  for (let k = 1; k < potencia.length; k++) {
    const frequencia = k * resolucao
    const harmonico = Math.max(1, Math.round(frequencia / f0))
    const distancia = Math.abs(frequencia - harmonico * f0)
    total += potencia[k]
    if (distancia > Math.max(4 * resolucao, 0.03 * f0)) fora += potencia[k]
  }
  return total > 0 ? 100 * fora / total : 0
}

// --------------------------------------------------
// Medições de uma faixa
// --------------------------------------------------

const db = (valor) => (valor > 0 ? 20 * Math.log10(valor) : -Infinity)

export function medirFaixa(canais, sampleRate) {
  let pico = 0
  let soma = 0
  let clipadas = 0
  const saltos = []
  let amostras = 0

  for (const canal of canais) {
    for (let i = 0; i < canal.length; i++) {
      const valor = canal[i]
      const absoluto = Math.abs(valor)
      if (absoluto > pico) pico = absoluto
      if (absoluto >= 1) clipadas++
      soma += valor * valor
      amostras++
      // Amostra de saltos entre vizinhas (1 a cada 7, para não guardar milhões de números)
      if (i > 0 && i % 7 === 0) saltos.push(Math.abs(valor - canal[i - 1]))
    }
  }

  saltos.sort((a, b) => a - b)
  const percentil = (p) => saltos[Math.min(saltos.length - 1, Math.floor(p * saltos.length))] || 0
  const emenda = canais.map((canal) => Math.abs(canal[0] - canal[canal.length - 1]))
  const espectro = distribuicaoEspectral(mono(canais), sampleRate)

  return {
    duracao: canais[0].length / sampleRate,
    picoDb: db(pico),
    rmsDb: db(Math.sqrt(soma / Math.max(1, amostras))),
    clipadas,
    acima5kPct: espectro.acimaPct,
    faixa2a5kPct: espectro.faixa2a5kPct,
    centroideHz: espectro.centroideHz,
    emendaEsquerda: emenda[0],
    emendaDireita: emenda[1] ?? emenda[0],
    saltoMediano: percentil(0.5),
    saltoP95: percentil(0.95),
  }
}

// --------------------------------------------------
// Cadeia do master fora do navegador (aproxima o que o AudioManager monta)
// --------------------------------------------------

// Biquad RBJ (Q = 0,707), como o BiquadFilterNode. Em loop, o estado começa aquecido pelo fim do áudio.
function biquad(canal, sampleRate, tipo, frequencia, loop = true) {
  const w = 2 * Math.PI * frequencia / sampleRate
  const cos = Math.cos(w)
  const alpha = Math.sin(w) / (2 * Math.SQRT1_2)
  const b0 = tipo === 'lowpass' ? (1 - cos) / 2 : (1 + cos) / 2
  const b1 = tipo === 'lowpass' ? 1 - cos : -(1 + cos)
  const b2 = b0
  const a0 = 1 + alpha
  const a1 = -2 * cos
  const a2 = 1 - alpha
  let x1 = 0
  let x2 = 0
  let y1 = 0
  let y2 = 0
  // Duas passadas: a primeira aquece o estado com o fim do áudio (o sinal é um loop)
  for (let passada = loop ? 0 : 1; passada < 2; passada++) {
    const inicio = passada === 0 ? Math.max(0, canal.length - sampleRate) : 0
    for (let i = inicio; i < canal.length; i++) {
      const x = canal[i]
      const y = (b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0
      x2 = x1
      x1 = x
      y2 = y1
      y1 = y
      if (passada === 1) canal[i] = y
    }
  }
}

// Convolução: em loop, a cauda da reverb que passa do fim volta para o começo; sem loop, é cortada
function convolverCircular(canal, resposta, loop = true) {
  const tamanho = proximaPotencia(canal.length + resposta.length)
  const re = new Float64Array(tamanho)
  const im = new Float64Array(tamanho)
  const reH = new Float64Array(tamanho)
  const imH = new Float64Array(tamanho)
  re.set(canal)
  reH.set(resposta)
  fft(re, im)
  fft(reH, imH)
  for (let k = 0; k < tamanho; k++) {
    const r = re[k] * reH[k] - im[k] * imH[k]
    const i = re[k] * imH[k] + im[k] * reH[k]
    re[k] = r
    im[k] = i
  }
  ifft(re, im)
  const saida = new Float32Array(canal.length)
  for (let i = 0; i < tamanho; i++) {
    if (loop) saida[i % canal.length] += re[i]
    else if (i < canal.length) saida[i] += re[i]
  }
  return saida
}

// Compressor parecido com o DynamicsCompressorNode (curva com joelho e ganho de compensação).
// Em loop, o detector começa aquecido pelo último segundo (no navegador ele roda sem parar no loop).
function comprimir(canais, sampleRate, { threshold, knee, ratio, attack, release }, loop = true) {
  const curva = (entradaDb) => {
    const acima = entradaDb - threshold
    if (acima <= -knee / 2) return entradaDb
    if (acima >= knee / 2) return threshold + acima / ratio
    const x = acima + knee / 2
    return entradaDb + (1 / ratio - 1) * x * x / (2 * knee)
  }
  const compensacao = (-curva(0)) * 0.6
  const coefAtaque = Math.exp(-1 / (attack * sampleRate))
  const coefSoltura = Math.exp(-1 / (release * sampleRate))
  let reducao = 0
  const [esquerdo, direito] = canais
  if (loop) {
    for (let i = Math.max(0, esquerdo.length - sampleRate); i < esquerdo.length; i++) {
      const nivelDb = 20 * Math.log10(Math.max(Math.abs(esquerdo[i]), Math.abs(direito[i]), 1e-9))
      const alvo = nivelDb - curva(nivelDb)
      const coef = alvo > reducao ? coefAtaque : coefSoltura
      reducao = coef * reducao + (1 - coef) * alvo
    }
  }
  for (let i = 0; i < esquerdo.length; i++) {
    const nivel = Math.max(Math.abs(esquerdo[i]), Math.abs(direito[i]), 1e-9)
    const nivelDb = 20 * Math.log10(nivel)
    const alvo = nivelDb - curva(nivelDb)
    const coef = alvo > reducao ? coefAtaque : coefSoltura
    reducao = coef * reducao + (1 - coef) * alvo
    const ganho = 10 ** ((compensacao - reducao) / 20)
    esquerdo[i] *= ganho
    direito[i] *= ganho
  }
}

// fonte → passa-alta → passa-baixa → (seco + envio para a sala) → compressor
// loop: false para um trecho que não volta ao começo (a introdução seguida do corpo)
export function aplicarCadeiaDoMaster(canais, sampleRate, reverbMix = CADEIA_DO_MASTER.reverbPadrao, { loop = true } = {}) {
  const saida = canais.map((canal) => Float32Array.from(canal))
  for (const canal of saida) {
    biquad(canal, sampleRate, 'highpass', CADEIA_DO_MASTER.passaAltaHz, loop)
    biquad(canal, sampleRate, 'lowpass', CADEIA_DO_MASTER.passaBaixaHz, loop)
  }
  const sala = criarRespostaDeSala(sampleRate)
  const molhado = saida.map((canal, indice) => convolverCircular(canal, sala[indice], loop))
  for (let c = 0; c < saida.length; c++) {
    for (let i = 0; i < saida[c].length; i++) saida[c][i] += molhado[c][i] * reverbMix
  }
  comprimir(saida, sampleRate, CADEIA_DO_MASTER.compressor, loop)
  for (const canal of saida) {
    for (let i = 0; i < canal.length; i++) canal[i] *= CADEIA_DO_MASTER.ganhoDeSaida
  }
  return saida
}

// --------------------------------------------------
// WAV (PCM 16 bits, estéreo)
// --------------------------------------------------

export function salvarWav(caminho, canais, sampleRate) {
  const quadros = canais[0].length
  const buffer = Buffer.alloc(44 + quadros * 4)
  buffer.write('RIFF', 0)
  buffer.writeUInt32LE(36 + quadros * 4, 4)
  buffer.write('WAVE', 8)
  buffer.write('fmt ', 12)
  buffer.writeUInt32LE(16, 16)
  buffer.writeUInt16LE(1, 20)
  buffer.writeUInt16LE(2, 22)
  buffer.writeUInt32LE(sampleRate, 24)
  buffer.writeUInt32LE(sampleRate * 4, 28)
  buffer.writeUInt16LE(4, 32)
  buffer.writeUInt16LE(16, 34)
  buffer.write('data', 36)
  buffer.writeUInt32LE(quadros * 4, 40)
  for (let i = 0; i < quadros; i++) {
    for (let c = 0; c < 2; c++) {
      const valor = Math.max(-1, Math.min(1, (canais[c] || canais[0])[i]))
      buffer.writeInt16LE(Math.round(valor * 32767), 44 + i * 4 + c * 2)
    }
  }
  writeFileSync(caminho, buffer)
}

// Nível (dB RMS) de cada trecho de `tamanho` amostras, nos dois canais juntos
export function niveisPorTrecho(canais, inicio, tamanho, quantos) {
  const niveis = []
  for (let trecho = 0; trecho < quantos; trecho++) {
    let soma = 0
    let n = 0
    const de = inicio + trecho * tamanho
    for (const canal of canais) {
      for (let i = de; i < Math.min(canal.length, de + tamanho); i++) {
        soma += canal[i] * canal[i]
        n++
      }
    }
    niveis.push(n > 0 && soma > 0 ? 10 * Math.log10(soma / n) : -Infinity)
  }
  return niveis
}

// Maior salto entre amostras vizinhas perto de uma posição (a passagem da introdução para o corpo)
export function maiorSaltoPerto(canais, posicao, raio) {
  let maior = 0
  for (const canal of canais) {
    for (let i = Math.max(1, posicao - raio); i < Math.min(canal.length, posicao + raio); i++) {
      maior = Math.max(maior, Math.abs(canal[i] - canal[i - 1]))
    }
  }
  return maior
}
