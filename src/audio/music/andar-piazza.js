// A Ronda: Piazza. Faixa do andar 3: a praça à noite (fachadas, pedras, luz azulada).
//
// ESTILO E ANDAMENTO
//   Soul-jazz de trio de órgão em Fá menor (groove dórico), ♩ = 112. Grade de 12 passos por
//   compasso (swing). bpm do ZzFXM = 112 × 3/4 = 84.
//
// O TEMA (motivos.js)
//   A célula do Tung (Dó – Mi♭ – Fá – Mi♭ – Dó, 5 – ♭7 – 1' – ♭7 – 5 em Fá) é o "head" do órgão,
//   em quartas paralelas (a voz de baixo uma quarta abaixo), nos compassos 1 e 5 de cada A.
//   O tung-tung-tung (madeira, em Fá) fecha cada seção de 8 compassos.
//
// FORMA (32 compassos, AABA; a forma é diferente da Cantina, que é blues)
//   A (8): Fm7 | Fm7 | B♭7 | B♭7 | Fm7 | Fm7 | B♭7 | C7#9        órgão com Leslie lento
//   B (8): D♭maj7 | D♭maj7 | C7#9 | C7#9 | D♭maj7 | Gm7♭5 | C7#9 | C7#9
//          a ponte: Leslie rápido e a guitarra respondendo no agudo
//   A A B A = compassos 0–7, 8–15, 16–23, 24–31
//
// ESPAÇO PARA OS EFEITOS SONOROS (100 a 650 Hz)
//   O baixo de órgão fica abaixo de 100 Hz; o órgão acompanha com um toque curto por compasso; a
//   guitarra só entra na ponte, quase toda acima de 587 Hz.
//
// LOOP SEM EMENDA
//   A sequência começa no compasso 2 (dentro do primeiro A) e dá a volta: a emenda (1 → 2) fica no
//   vamp, com a mesma textura dos dois lados.

import { bateria, celula, criarGrade, linha, montarMusica, notas, tungTungTung, voz } from './partitura.js'

export const PIAZZA_META = Object.freeze({
  id: 'andar-piazza',
  titulo: 'A Ronda: Piazza',
  estilo: 'soul-jazz de trio de órgão',
  andamento: 112,
  passosPorTempo: 3,
  temposPorCompasso: 4,
  compassos: 32,
  inicioDoLoop: 2,
  tonalidade: 'Fá menor (dórico)',
  estrutura: 'AABA de 8: vamp Fm7–B♭7 com a célula no órgão; ponte com Leslie rápido e guitarra (áudio gira a partir do compasso 2)',
})

const GRADE = criarGrade(PIAZZA_META.passosPorTempo, PIAZZA_META.temposPorCompasso)

const HARMONIA_A = ['Fm7', 'Fm7', 'Bb7', 'Bb7', 'Fm7', 'Fm7', 'Bb7', 'C7#9']
const HARMONIA_B = ['Dbmaj7', 'Dbmaj7', 'C7#9', 'C7#9', 'Dbmaj7', 'Gm7b5', 'C7#9', 'C7#9']
export const PIAZZA_HARMONIA = Object.freeze([...HARMONIA_A, ...HARMONIA_A, ...HARMONIA_B, ...HARMONIA_A])

export const PIAZZA_INSTRUMENTOS = Object.freeze([
  'orgaoBaixo', 'orgao', 'orgaoLeslieLento', 'orgaoLeslieRapido', 'guitarraJazz', 'ride', 'chimbal', 'caixaAro', 'bumbo', 'madeira',
])

const VOZ = Object.freeze({
  baixo: voz('orgaoBaixo', 'baixo', { semente: 41 }),
  head: voz('orgao', 'riff', { semente: 42 }),
  headQuarta: voz('orgao', 'riff', { semente: 43 }),
  comping: voz('orgaoLeslieLento', 'comping', { semente: 44 }),
  ponte: voz('orgaoLeslieRapido', 'comping', { semente: 45 }),
  guitarra: voz('guitarraJazz', 'melodia', { semente: 46 }),
})

const secao = (compasso) => (compasso >= 16 && compasso < 24 ? 'B' : 'A')
const naSecao = (compasso) => compasso % 8
const fechaSecao = (compasso) => naSecao(compasso) === 7
const temCelula = (compasso) => secao(compasso) === 'A' && (naSecao(compasso) === 0 || naSecao(compasso) === 4)

// --------------------------------------------------
// BAIXO DE ÓRGÃO: fundamental no 1, quinta no 3 e aproximação cromática para o próximo compasso
// --------------------------------------------------

const FUNDAMENTAL = Object.freeze({ Fm7: 29, Bb7: 34, 'C7#9': 36, Dbmaj7: 37, Gm7b5: 31 })

function dobrarNoGrave(midi) {
  let nota = midi
  while (nota > 45) nota -= 12
  while (nota < 28) nota += 12
  return nota
}

function baixo(compasso) {
  const acorde = PIAZZA_HARMONIA[compasso]
  const proximo = PIAZZA_HARMONIA[(compasso + 1) % PIAZZA_META.compassos]
  const raiz = FUNDAMENTAL[acorde]
  const alvo = FUNDAMENTAL[proximo]
  const lista = [
    { passo: 0, midi: raiz },
    { passo: 6, midi: dobrarNoGrave(raiz + 7) },
  ]
  // Aproximação: meio tom acima ou abaixo da próxima fundamental, no "e" do 4
  if (!fechaSecao(compasso) && alvo !== raiz) lista.push({ passo: 11, midi: dobrarNoGrave(alvo + (alvo > raiz ? -1 : 1)), atenuacao: 0.15 })
  else if (!fechaSecao(compasso)) lista.push({ passo: 9, midi: dobrarNoGrave(raiz + 12), atenuacao: 0.2 })
  return notas(lista, VOZ.baixo, compasso, GRADE)
}

// --------------------------------------------------
// ÓRGÃO: o head (a célula em quartas) e o acompanhamento
// --------------------------------------------------

const TONICA = 65 // Fá4: a célula soa Dó5 – Mi♭5 – Fá5

function head(compasso) {
  return temCelula(compasso) ? celula(TONICA, VOZ.head, compasso, GRADE) : null
}

function headQuarta(compasso) {
  return temCelula(compasso) ? celula(TONICA - 5, VOZ.headQuarta, compasso, GRADE) : null
}

// Acordes sem fundamental, do grave ao agudo
const VOICINGS = Object.freeze({
  Fm7: [56, 60, 63],     // Lá♭3 Dó4 Mi♭4
  Bb7: [56, 62, 67],     // Lá♭3 Ré4 Sol4 (com a 13ª)
  'C7#9': [52, 58, 63],  // Mi3 Si♭3 Mi♭4 (a #9)
  Dbmaj7: [53, 60, 65],  // Fá3 Dó4 Fá4
  Gm7b5: [53, 58, 61],   // Fá3 Si♭3 Ré♭4
})

// Seções A: um toque curto no "e" do 1 (nos compassos sem a célula); na virada para o próximo A,
// também no "e" do 3
function comping(indice) {
  return (compasso) => {
    if (secao(compasso) !== 'A' || temCelula(compasso)) return null
    const acorde = VOICINGS[PIAZZA_HARMONIA[compasso]]
    const passos = naSecao(compasso) === 6 ? [2, 8] : [2]
    return notas(passos.map((passo) => ({ passo, midi: acorde[indice] })), VOZ.comping, compasso, GRADE)
  }
}

// Ponte: Leslie rápido, duas vozes, no 1 e no "e" do 3 (no fim da ponte, só no 1)
function ponte(indice) {
  return (compasso) => {
    if (secao(compasso) !== 'B') return null
    const acorde = VOICINGS[PIAZZA_HARMONIA[compasso]]
    const passos = fechaSecao(compasso) ? [0] : [0, 8]
    return notas(passos.map((passo) => ({ passo, midi: acorde[indice + 1] })), VOZ.ponte, compasso, GRADE)
  }
}

// --------------------------------------------------
// GUITARRA: respostas na ponte, no agudo
// --------------------------------------------------

const RESPOSTAS = Object.freeze({
  17: '. . F5 | . . Ab5 | . . F5 | Eb5 . .',
  19: '. . G5 | . . E5 | . . Db5 | C5 . .',
  21: '. . Db5 | . . F5 | . . Ab5 | . . .',
  23: '. . Eb5 | . . E5 | G5 . . | . . .',
})

function guitarra(compasso) {
  return RESPOSTAS[compasso] ? linha(RESPOSTAS[compasso], VOZ.guitarra, compasso, GRADE) : null
}

// --------------------------------------------------
// BATERIA: ride em swing, pedal do chimbal no 2 e no 4, cross-stick no 4 (no 2 e no 4 na ponte)
// --------------------------------------------------

const RIDE = Object.freeze({ X: 12, x: 12.16, s: 12.45 })
const PEDAL = Object.freeze({ c: 12.4 })
const ARO = Object.freeze({ X: 12.1 })
const BUMBO = Object.freeze({ K: 12.62, k: 12.72 })

function ride(compasso) {
  return bateria(fechaSecao(compasso) ? 'x . s | X . s | x . s | . . .' : 'x . s | X . s | x . s | X . s', RIDE, GRADE)
}

function pedal(compasso) {
  return bateria(fechaSecao(compasso) ? '. . . | c . . | . . . | . . .' : '. . . | c . . | . . . | c . .', PEDAL, GRADE)
}

function aro(compasso) {
  if (fechaSecao(compasso)) return secao(compasso) === 'B' ? bateria('. . . | X . . | . . . | . . .', ARO, GRADE) : null
  return bateria(secao(compasso) === 'B' ? '. . . | X . . | . . . | X . .' : '. . . | . . . | . . . | X . .', ARO, GRADE)
}

function bumbo() {
  return bateria('K . . | . . . | k . . | . . .', BUMBO, GRADE)
}

const ALTURA_DO_TUNG = 65 // Fá4
function madeira(compasso) {
  return fechaSecao(compasso) ? tungTungTung(ALTURA_DO_TUNG, compasso, GRADE) : null
}

// --------------------------------------------------
// CANAIS
// --------------------------------------------------

const CANAIS = [
  ['orgaoBaixo', 0, baixo],
  ['orgao', 0.14, head],
  ['orgao', 0.2, headQuarta],
  ['orgaoLeslieLento', 0.2, comping(0)],
  ['orgaoLeslieLento', 0.3, comping(1)],
  ['orgaoLeslieLento', 0.25, comping(2)],
  ['orgaoLeslieRapido', 0.22, ponte(0)],
  ['orgaoLeslieRapido', 0.3, ponte(1)],
  ['guitarraJazz', -0.28, guitarra],
  ['ride', 0.22, ride],
  ['chimbal', -0.2, pedal],
  ['caixaAro', 0.04, aro],
  ['bumbo', 0, bumbo],
  ['madeira', 0.08, madeira],
]

export const PIAZZA_SONG = montarMusica({
  instrumentos: PIAZZA_INSTRUMENTOS,
  canais: CANAIS,
  compassos: PIAZZA_META.compassos,
  inicioDoLoop: PIAZZA_META.inicioDoLoop,
  grade: GRADE,
  andamento: PIAZZA_META.andamento,
})

export const PIAZZA_MOTIVO = Object.freeze({
  riff: { instrumento: 'orgao', compassos: Object.fromEntries(Array.from({ length: 32 }, (_, c) => c).filter(temCelula).map((c) => [c, TONICA])) },
  tung: { compassos: Array.from({ length: 32 }, (_, c) => c).filter(fechaSecao) },
})
