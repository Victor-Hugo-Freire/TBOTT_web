// A Ronda: Pastificio. Faixa do andar 4: a fábrica de massa (metal, concreto, amarelo e preto).
//
// ESTILO E ANDAMENTO
//   Blues-rock em colcheias retas, em Mi, ♩ = 124. Grade de 16 passos por compasso (semicolcheias
//   retas). bpm do ZzFXM = 124.
//
// O TEMA (motivos.js)
//   A célula do Tung (Si – Ré – Mi – Ré – Si, 5 – ♭7 – 1' – ♭7 – 5 em Mi) é o riff, em power chords
//   (fundamental e quinta em dois canais da guitarra crunch). Na grade reta o ritmo da célula fica
//   longo-curto (passos 0, 3, 4, 7 e 8), como uma prensa. O tung-tung-tung (madeira, em Mi, em
//   semicolcheias nos passos 13, 14 e 15) fecha cada frase de 4 compassos; na ponte, um tom grave
//   dobra as batidas (a prensa da fábrica).
//
// FORMA (32 compassos)
//   0–7    Riff: a "máquina" (palm mute em colcheias no Mi2) e a célula nos compassos ímpares
//   8–15   Verso: E5 | E5 | A5 | E5 | B5 | A5 | E5 | B5, power chord no tempo 1 sobre a máquina
//   16–23  Riff de novo
//   24–31  Ponte: C5 | D5 | E5 | E5 | C5 | D5 | B5 | B5; a máquina para, entram o órgão sustentado
//          e power chords longos (no tempo 1), a bateria vai a meio-tempo e cresce no fim
//
// ESPAÇO PARA OS EFEITOS SONOROS (100 a 650 Hz)
//   A máquina fica no Mi2 (82 Hz) e o baixo, uma oitava abaixo; a célula aparece em 4 de cada 8
//   compassos; o órgão só toca na ponte.
//
// LOOP SEM EMENDA
//   A sequência começa no compasso 2 (dentro do primeiro riff) e dá a volta: a emenda (1 → 2) fica
//   com a máquina tocando dos dois lados.

import { bateria, celula, criarGrade, montarMusica, notas, tungTungTung, voz } from './partitura.js'

export const PASTIFICIO_META = Object.freeze({
  id: 'andar-pastificio',
  titulo: 'A Ronda: Pastificio',
  estilo: 'blues-rock reto',
  andamento: 124,
  passosPorTempo: 4,
  temposPorCompasso: 4,
  compassos: 32,
  inicioDoLoop: 2,
  tonalidade: 'Mi (E5)',
  estrutura: 'Riff 8 · Verso 8 · Riff 8 · Ponte 8 (áudio gira a partir do compasso 2)',
})

const GRADE = criarGrade(PASTIFICIO_META.passosPorTempo, PASTIFICIO_META.temposPorCompasso)

const RIFF = Array(8).fill('E5')
const VERSO = ['E5', 'E5', 'A5', 'E5', 'B5', 'A5', 'E5', 'B5']
const PONTE = ['C5', 'D5', 'E5', 'E5', 'C5', 'D5', 'B5', 'B5']
export const PASTIFICIO_HARMONIA = Object.freeze([...RIFF, ...VERSO, ...RIFF, ...PONTE])

export const PASTIFICIO_INSTRUMENTOS = Object.freeze([
  'baixoEletrico', 'guitarraPalmMute', 'guitarraCrunch', 'orgaoSustentado', 'bumbo', 'caixa', 'caixaCorpo', 'chimbal', 'madeira',
])

const VOZ = Object.freeze({
  baixo: voz('baixoEletrico', 'baixo', { semente: 51 }),
  maquina: voz('guitarraPalmMute', 'riff', { semente: 52 }),
  fundamental: voz('guitarraCrunch', 'riff', { semente: 53 }),
  quinta: voz('guitarraCrunch', 'riff', { semente: 54 }),
  orgao: voz('orgaoSustentado', 'comping', { semente: 55 }),
})

const secao = (compasso) => ['riff', 'verso', 'riff', 'ponte'][Math.floor(compasso / 8)]
const fechaFrase = (compasso) => compasso % 4 === 3
const temCelula = (compasso) => secao(compasso) === 'riff' && compasso % 2 === 1

// Fundamental de cada power chord na guitarra (o baixo toca uma oitava abaixo)
const RAIZ = Object.freeze({ E5: 40, A5: 45, B5: 47, C5: 48, D5: 50 })
const TONICA = 40 // Mi2: a célula soa Si2 – Ré3 – Mi3

// Colcheias retas: passos 0, 2, 4, ... 14
const COLCHEIAS = Array.from({ length: 8 }, (_, i) => i * 2)

// --------------------------------------------------
// GUITARRAS
// --------------------------------------------------

// A máquina: palm mute no Mi2 em colcheias (riff e verso). Nos compassos da célula, ela entra depois
// do riff; no fim da frase, ela para antes do tung-tung-tung.
function maquina(compasso) {
  if (secao(compasso) === 'ponte') return null
  let passos = COLCHEIAS
  if (temCelula(compasso)) passos = passos.filter((passo) => passo >= 10)
  else if (secao(compasso) === 'riff') passos = passos.filter((passo) => passo > 0)
  if (fechaFrase(compasso)) passos = passos.filter((passo) => passo < 13)
  return notas(passos.map((passo) => ({ passo, midi: TONICA, atenuacao: passo % 4 === 0 ? 0 : 0.15 })), VOZ.maquina, compasso, GRADE)
}

// Power chord: os passos em que ele soa, por seção
function passosDoAcorde(compasso) {
  if (secao(compasso) === 'ponte') return compasso >= 30 ? [0, 8] : [0]
  if (secao(compasso) === 'verso') return compasso === 15 ? [0, 8] : [0]
  return [0]
}

function powerChord(intervalo, v) {
  return (compasso) => {
    if (temCelula(compasso)) return celula(TONICA + intervalo, v, compasso, GRADE)
    const raiz = RAIZ[PASTIFICIO_HARMONIA[compasso]]
    return notas(passosDoAcorde(compasso).map((passo) => ({ passo, midi: raiz + intervalo })), v, compasso, GRADE)
  }
}

// --------------------------------------------------
// BAIXO: colcheias na fundamental, uma oitava abaixo da guitarra
// --------------------------------------------------

function baixo(compasso) {
  const raiz = RAIZ[PASTIFICIO_HARMONIA[compasso]] - 12
  const passos = fechaFrase(compasso) ? COLCHEIAS.filter((passo) => passo < 13) : COLCHEIAS
  return notas(passos.map((passo) => ({ passo, midi: raiz, atenuacao: passo % 4 === 0 ? 0 : 0.12 })), VOZ.baixo, compasso, GRADE)
}

// --------------------------------------------------
// ÓRGÃO (só na ponte): tríades sustentadas no tempo 1
// --------------------------------------------------

const TRIADES = Object.freeze({
  C5: [60, 64, 67],
  D5: [62, 66, 69],
  E5: [64, 68, 71],
  B5: [59, 63, 66],
})

function orgao(indice) {
  return (compasso) => {
    if (secao(compasso) !== 'ponte') return null
    return notas([{ passo: 0, midi: TRIADES[PASTIFICIO_HARMONIA[compasso]][indice] }], VOZ.orgao, compasso, GRADE)
  }
}

// --------------------------------------------------
// BATERIA
// --------------------------------------------------

const BUMBO = Object.freeze({ K: 12.42, k: 12.55, l: 19.2 }) // l = tom grave (a prensa da ponte)
const CAIXA = Object.freeze({ X: 12, x: 12.3, r: 12.55 })
const CAIXA_CORPO = Object.freeze({ X: 12, x: 12.3, r: 12.75 })
const CHIMBAL = Object.freeze({ X: 12.1, x: 12.35 })

function bumbo(compasso) {
  if (secao(compasso) === 'ponte') {
    if (compasso === 27 || compasso === 31) return bateria('K . . . | . . . . | . . . . | . l l l', BUMBO, GRADE)
    return bateria('K . . . | . . . . | . . . . | . . . .', BUMBO, GRADE)
  }
  return bateria('K . . . | . . . . | K . k . | . . . .', BUMBO, GRADE)
}

function linhaDaCaixa(compasso) {
  if (secao(compasso) === 'ponte') {
    // Meio-tempo na ponte (caixa no 3); no último compasso, colcheias em crescendo até a volta do riff
    if (compasso === 31) return 'r . r . | r . x . | x . X . | X . . .'
    return '. . . . | . . . . | X . . . | . . . .'
  }
  return '. . . . | X . . . | . . . . | X . . .'
}

const caixa = (mapa) => (compasso) => bateria(linhaDaCaixa(compasso), mapa, GRADE)

function chimbal(compasso) {
  if (secao(compasso) === 'ponte') return bateria('X . . . | x . . . | X . . . | x . . .', CHIMBAL, GRADE)
  if (fechaFrase(compasso)) return bateria('X . x . | X . x . | X . x . | X . . .', CHIMBAL, GRADE)
  return bateria('X . x . | X . x . | X . x . | X . x .', CHIMBAL, GRADE)
}

const ALTURA_DO_TUNG = 76 // Mi5
function madeira(compasso) {
  return fechaFrase(compasso) ? tungTungTung(ALTURA_DO_TUNG, compasso, GRADE) : null
}

// --------------------------------------------------
// CANAIS
// --------------------------------------------------

const CANAIS = [
  ['baixoEletrico', 0, baixo],
  ['guitarraPalmMute', -0.25, maquina],
  ['guitarraCrunch', -0.3, powerChord(0, VOZ.fundamental)],
  ['guitarraCrunch', 0.3, powerChord(7, VOZ.quinta)],
  ['orgaoSustentado', 0.2, orgao(0)],
  ['orgaoSustentado', 0.28, orgao(1)],
  ['orgaoSustentado', 0.24, orgao(2)],
  ['bumbo', 0, bumbo],
  ['caixa', 0, caixa(CAIXA)],
  ['caixaCorpo', 0, caixa(CAIXA_CORPO)],
  ['chimbal', -0.18, chimbal],
  ['madeira', 0.08, madeira],
]

export const PASTIFICIO_SONG = montarMusica({
  instrumentos: PASTIFICIO_INSTRUMENTOS,
  canais: CANAIS,
  compassos: PASTIFICIO_META.compassos,
  inicioDoLoop: PASTIFICIO_META.inicioDoLoop,
  grade: GRADE,
  andamento: PASTIFICIO_META.andamento,
})

export const PASTIFICIO_MOTIVO = Object.freeze({
  riff: { instrumento: 'guitarraCrunch', compassos: Object.fromEntries(Array.from({ length: 32 }, (_, c) => c).filter(temCelula).map((c) => [c, TONICA])) },
  tung: { compassos: Array.from({ length: 32 }, (_, c) => c).filter(fechaFrase) },
})
