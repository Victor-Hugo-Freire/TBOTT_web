// A Ronda: Porto. Faixa do andar 5: tempestade no cais, o clímax dos andares.
//
// ESTILO E ANDAMENTO
//   Swamp blues / rock pesado em Dó menor, ♩ = 136. Grade de 16 passos por compasso (semicolcheias
//   retas). bpm do ZzFXM = 136.
//
// O TEMA (motivos.js)
//   A célula do Tung (Sol – Si♭ – Dó – Si♭ – Sol, 5 – ♭7 – 1' – ♭7 – 5 em Dó) é tocada pelo naipe de
//   metais em três oitavas (trompete, trombone e sax barítono) na seção B, e de novo sobre Sol no fim
//   dela. O tung-tung-tung (madeira, em Dó) fecha cada frase de 4 compassos; na tempestade, um tom
//   grave dobra as batidas.
//
// FORMA (32 compassos)
//   0–7    A, meio-tempo: Cm | Cm | A♭ | G7#9 | Cm | Cm | Fm | G7#9. Guitarra com tremolo (o balanço
//          da água), baixo palhetado em colcheias, caixa no 3.
//   8–15   B, tempo cheio: Cm | B♭ | A♭ | G | Cm | B♭ | A♭ | G7#9. A célula nos metais e ataques
//          do naipe nos outros compassos.
//   16–23  A de novo
//   24–31  Tempestade: Cm (6 compassos) | A♭ | G7#9. Só os tons em ondas, crescendo, o tremolo e o
//          baixo em mínimas; o tung-tung-tung com o tom grave leva de volta ao A.
//
// ESPAÇO PARA OS EFEITOS SONOROS (100 a 650 Hz)
//   O baixo fica abaixo de 100 Hz; a guitarra toca um acorde de duas notas por compasso (longo, com
//   tremolo); os metais só entram na seção B, em ataques curtos.
//
// LOOP SEM EMENDA
//   A sequência começa no compasso 2 (dentro do primeiro A) e dá a volta: a emenda (1 → 2) fica no
//   meio-tempo, com a mesma textura dos dois lados; a tempestade e a volta ao A ficam no meio do áudio.

import { bateria, celula, criarGrade, montarMusica, notas, tungTungTung, voz } from './partitura.js'

export const PORTO_META = Object.freeze({
  id: 'andar-porto',
  titulo: 'A Ronda: Porto',
  estilo: 'swamp blues / rock pesado',
  andamento: 136,
  passosPorTempo: 4,
  temposPorCompasso: 4,
  compassos: 32,
  inicioDoLoop: 2,
  tonalidade: 'Dó menor',
  estrutura: 'A meio-tempo 8 · B com metais 8 · A 8 · Tempestade 8 (áudio gira a partir do compasso 2)',
})

const GRADE = criarGrade(PORTO_META.passosPorTempo, PORTO_META.temposPorCompasso)

const A = ['Cm', 'Cm', 'Ab', 'G7#9', 'Cm', 'Cm', 'Fm', 'G7#9']
const B = ['Cm', 'Bb', 'Ab', 'G', 'Cm', 'Bb', 'Ab', 'G7#9']
const TEMPESTADE = ['Cm', 'Cm', 'Cm', 'Cm', 'Cm', 'Cm', 'Ab', 'G7#9']
export const PORTO_HARMONIA = Object.freeze([...A, ...B, ...A, ...TEMPESTADE])

export const PORTO_INSTRUMENTOS = Object.freeze([
  'baixoEletrico', 'guitarraTremolo', 'trompete', 'trombone', 'saxBaritono',
  'bumbo', 'caixa', 'caixaCorpo', 'chimbal', 'chimbalAberto', 'madeira',
])

const VOZ = Object.freeze({
  baixo: voz('baixoEletrico', 'baixo', { semente: 61 }),
  guitarraGrave: voz('guitarraTremolo', 'comping', { semente: 62 }),
  guitarraAguda: voz('guitarraTremolo', 'comping', { semente: 63 }),
  trompete: voz('trompete', 'naipe', { semente: 64 }),
  trombone: voz('trombone', 'naipe', { semente: 65 }),
  baritono: voz('saxBaritono', 'naipe', { semente: 66 }),
})

const secao = (compasso) => ['A', 'B', 'A', 'tempestade'][Math.floor(compasso / 8)]
const fechaFrase = (compasso) => compasso % 4 === 3

// Fundamental de cada acorde no baixo
const RAIZ = Object.freeze({ Cm: 36, Ab: 32, 'G7#9': 31, G: 31, Fm: 29, Bb: 34 })

// --------------------------------------------------
// BAIXO: colcheias palhetadas na fundamental; mínimas na tempestade
// --------------------------------------------------

const COLCHEIAS = Array.from({ length: 8 }, (_, i) => i * 2)

function baixo(compasso) {
  const raiz = RAIZ[PORTO_HARMONIA[compasso]]
  let passos = secao(compasso) === 'tempestade' && compasso < 30 ? [0, 8] : COLCHEIAS
  if (fechaFrase(compasso)) passos = passos.filter((passo) => passo < 13)
  return notas(passos.map((passo) => ({ passo, midi: raiz, atenuacao: passo % 8 === 0 ? 0 : 0.14 })), VOZ.baixo, compasso, GRADE)
}

// --------------------------------------------------
// GUITARRA COM TREMOLO: um acorde de duas notas no tempo 1, que fica soando
// --------------------------------------------------

const ACORDES = Object.freeze({
  Cm: [55, 63],    // Sol3 Mi♭4
  Ab: [56, 60],    // Lá♭3 Dó4
  'G7#9': [59, 65], // Si3 Fá4
  G: [55, 59],     // Sol3 Si3
  Fm: [53, 60],    // Fá3 Dó4
  Bb: [58, 62],    // Si♭3 Ré4
})

function guitarra(indice, v) {
  return (compasso) => notas([{ passo: 0, midi: ACORDES[PORTO_HARMONIA[compasso]][indice] }], v, compasso, GRADE)
}

// --------------------------------------------------
// METAIS (seção B): a célula em três oitavas e ataques curtos do naipe
// --------------------------------------------------

// Compassos da célula e a tônica (Dó, e Sol no último compasso do B)
const CELULA_NOS_METAIS = Object.freeze({ 8: 60, 12: 60, 15: 55 })
// Ataques do naipe no tempo 1: [trompete, trombone, barítono]
const ATAQUES = Object.freeze({ 9: [74, 62, 46], 10: [72, 60, 44], 11: [71, 59, 43], 13: [74, 62, 46], 14: [72, 60, 44] })

function metal(oitava, indiceDoAtaque, v) {
  return (compasso) => {
    if (compasso in CELULA_NOS_METAIS) return celula(CELULA_NOS_METAIS[compasso] + oitava, v, compasso, GRADE)
    if (compasso in ATAQUES) return notas([{ passo: 0, midi: ATAQUES[compasso][indiceDoAtaque] }], v, compasso, GRADE)
    return null
  }
}

// --------------------------------------------------
// BATERIA
// --------------------------------------------------

// Bumbo e tons no mesmo canal: K/k = bumbo; l/m/h = tons grave, médio e agudo
const BUMBO = Object.freeze({ K: 12.42, k: 12.55, l: 19.28, m: 22.32, h: 26.38 })
const CAIXA = Object.freeze({ X: 12, x: 12.3 })
const CAIXA_CORPO = Object.freeze({ X: 12, x: 12.3 })
const CHIMBAL = Object.freeze({ X: 12.12, x: 12.38 })
const ABERTO = Object.freeze({ o: 12.3 })

// Ondas de tons na tempestade: cada compasso um pouco mais forte
const ONDAS = Object.freeze([
  'l . . . | m . . . | l . . . | . . . .',
  'l . . . | m . . . | l . m . | . . . .',
  'l . m . | h . m . | l . . . | m . l .',
  'l . m . | h . m . | l . m . | h . . .',
  'l . m . | h . m . | l . m . | h . m .',
  'l . m . | h . m . | l . m . | h . m l',
  'l m h . | m h l . | m h l . | m h . .',
  'K . . . | l . m . | h . m . | . l l l',
])

function bumbo(compasso) {
  if (secao(compasso) === 'tempestade') {
    const onda = ONDAS[compasso - 24]
    const crescendo = (31 - compasso) * 0.05
    const mapa = Object.fromEntries(Object.entries(BUMBO).map(([token, valor]) => [token, Math.floor(valor) + Math.min(0.9, valor % 1 + crescendo)]))
    return bateria(onda, mapa, GRADE)
  }
  if (secao(compasso) === 'B') return bateria('K . . . | . . . . | K . k . | . . . .', BUMBO, GRADE)
  // Meio-tempo: bumbo no 1 e no "e" do 3
  return bateria('K . . . | . . . . | . . k . | . . . .', BUMBO, GRADE)
}

function linhaDaCaixa(compasso) {
  if (secao(compasso) === 'tempestade') return null
  if (secao(compasso) === 'B') return '. . . . | X . . . | . . . . | X . . .'
  return '. . . . | . . . . | X . . . | . . . .' // meio-tempo: caixa no 3
}

const caixa = (mapa) => (compasso) => {
  const texto = linhaDaCaixa(compasso)
  return texto ? bateria(texto, mapa, GRADE) : null
}

function chimbal(compasso) {
  if (secao(compasso) === 'tempestade') return null
  if (fechaFrase(compasso)) return bateria('X . x . | X . x . | X . x . | X . . .', CHIMBAL, GRADE)
  // Na seção B o "e" do 4 vai para o chimbal aberto
  if (secao(compasso) === 'B') return bateria('X . x . | X . x . | X . x . | X . . .', CHIMBAL, GRADE)
  return bateria('X . x . | X . x . | X . x . | X . x .', CHIMBAL, GRADE)
}

function chimbalAberto(compasso) {
  return secao(compasso) === 'B' && !fechaFrase(compasso) ? bateria('. . . . | . . . . | . . . . | . . o .', ABERTO, GRADE) : null
}

const ALTURA_DO_TUNG = 72 // Dó5
function madeira(compasso) {
  return fechaFrase(compasso) ? tungTungTung(ALTURA_DO_TUNG, compasso, GRADE) : null
}

// --------------------------------------------------
// CANAIS
// --------------------------------------------------

const CANAIS = [
  ['baixoEletrico', 0, baixo],
  ['guitarraTremolo', -0.3, guitarra(0, VOZ.guitarraGrave)],
  ['guitarraTremolo', -0.18, guitarra(1, VOZ.guitarraAguda)],
  ['trompete', 0.22, metal(0, 0, VOZ.trompete)],
  ['trombone', 0.12, metal(-12, 1, VOZ.trombone)],
  ['saxBaritono', 0.05, metal(-24, 2, VOZ.baritono)],
  ['bumbo', 0, bumbo],
  ['caixa', 0, caixa(CAIXA)],
  ['caixaCorpo', 0, caixa(CAIXA_CORPO)],
  ['chimbal', -0.2, chimbal],
  ['chimbalAberto', -0.24, chimbalAberto],
  ['madeira', 0.08, madeira],
]

export const PORTO_SONG = montarMusica({
  instrumentos: PORTO_INSTRUMENTOS,
  canais: CANAIS,
  compassos: PORTO_META.compassos,
  inicioDoLoop: PORTO_META.inicioDoLoop,
  grade: GRADE,
  andamento: PORTO_META.andamento,
})

export const PORTO_MOTIVO = Object.freeze({
  riff: { instrumento: 'trompete', compassos: { ...CELULA_NOS_METAIS } },
  tung: { compassos: Array.from({ length: 32 }, (_, c) => c).filter(fechaFrase) },
})
