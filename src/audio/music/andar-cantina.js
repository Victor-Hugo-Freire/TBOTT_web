// A Ronda: Cantina. Faixa do andar 1 e tema da gameplay (é a faixa que todo jogador ouve em toda run).
//
// ESTILO E ANDAMENTO
//   Blues shuffle em Lá menor, ♩ = 88. Grade de 12 passos por compasso (colcheias em tercina; o
//   swing cai nos passos 0 e 2 de cada tempo). bpm do ZzFXM = 88 × 3/4 = 66.
//
// O TEMA (motivos.js)
//   A célula do Tung (5 – ♭7 – 1' – ♭7 – 5) é o riff, tocada pelo contrabaixo e pelo Rhodes em
//   oitavas, nos três primeiros tempos do compasso. O tung-tung-tung (madeira, em Lá) fecha cada
//   frase de 4 compassos, no quarto tempo, como anacruse do tempo forte seguinte. Nesses compassos
//   a bateria deixa o quarto tempo livre para ele.
//
// FORMA (24 compassos = duas voltas do blues menor de 12)
//   Harmonia de cada volta: Am7 | Dm7 | Am7 | Am7 | Dm7 | Dm7 | Am7 | Am7 | E7#9 | Dm7 | Am7 | E7#9
//   Riff (pergunta) nos compassos 1, 3, 5, 7, 9 e 10 de cada volta (sobre Lá, Ré e Mi); os outros
//   compassos são o espaço da resposta.
//   0–11   Primeira volta: só vassourinha e riff. Nas respostas, só o baixo e o silêncio.
//   12–23  Segunda volta: baquetas (ride, caixa com ghost notes), o baixo caminha, a guitarra limpa
//          responde o riff e o Rhodes marca os acordes com toques curtos.
//
// ESPAÇO PARA OS EFEITOS SONOROS (100 a 650 Hz)
//   Nenhuma linha densa nessa região: o riff tem cinco notas e uma pausa de um tempo; as respostas
//   da guitarra ficam quase todas acima de 587 Hz (Ré5 em diante) e têm de duas a quatro notas; o
//   Rhodes só toca dois toques curtos por compasso, e só na segunda volta.
//
// LOOP SEM EMENDA
//   A sequência começa no compasso 2 (riff sobre Lá, primeira volta) e dá a volta: 2…23, 0, 1. A
//   emenda (compasso 1 → 2) fica dentro da primeira volta, com vassourinha dos dois lados; a troca
//   vassourinha → baquetas (11 → 12) e a volta das baquetas para a vassourinha (23 → 0) ficam no
//   meio do áudio. A cauda das notas do último compasso volta para o começo (loop contínuo do ZzFXM).

import { notaDoInstrumento } from './instrumentos.js'
import { celulaDoTung, passosDoTungTungTung, TUNG_TUNG_TUNG_ATENUACAO } from './motivos.js'
import { bateria, compassoVazio, criarGrade, linha, montarMusica, notas, variacao, voz } from './partitura.js'

export const CANTINA_META = Object.freeze({
  id: 'andar-cantina',
  titulo: 'A Ronda: Cantina',
  estilo: 'blues shuffle em menor',
  andamento: 88,
  passosPorTempo: 3,
  temposPorCompasso: 4,
  compassos: 24,
  inicioDoLoop: 2,
  tonalidade: 'Lá menor',
  estrutura: 'Blues menor de 12 × 2: volta 1 só vassourinha e riff; volta 2 baquetas, guitarra respondendo (áudio gira a partir do compasso 2)',
})

const GRADE = criarGrade(CANTINA_META.passosPorTempo, CANTINA_META.temposPorCompasso)
const VOLTA = 12

export const CANTINA_HARMONIA = Object.freeze([
  'Am7', 'Dm7', 'Am7', 'Am7', 'Dm7', 'Dm7', 'Am7', 'Am7', 'E7#9', 'Dm7', 'Am7', 'E7#9',
])

// Instrumentos da faixa, na ordem do array de instrumentos da música
export const CANTINA_INSTRUMENTOS = Object.freeze([
  'contrabaixo', 'rhodes', 'guitarraJazz', 'vassourinha', 'bumbo', 'chimbal', 'ride', 'caixa', 'caixaCorpo', 'madeira',
])

const VOZ = Object.freeze({
  baixo: voz('contrabaixo', 'baixo', { semente: 1 }),
  riff: voz('rhodes', 'riff', { semente: 2 }),
  guitarra: voz('guitarraJazz', 'melodia', { semente: 3 }),
  compingGrave: voz('rhodes', 'comping', { semente: 4 }),
  compingAgudo: voz('rhodes', 'comping', { semente: 5 }),
})

const volta = (compasso) => Math.floor(compasso / VOLTA) // 0 = vassourinha, 1 = baquetas
const posicao = (compasso) => compasso % VOLTA

// Compassos (dentro da volta) que fecham uma frase com o tung-tung-tung
const FIM_DE_FRASE = Object.freeze([3, 7, 11])
const fechaFrase = (compasso) => FIM_DE_FRASE.includes(posicao(compasso))

// --------------------------------------------------
// RIFF: a célula do Tung (tônica do baixo em MIDI, por compasso da volta)
// --------------------------------------------------

// Lá1, Lá1, Ré2, Lá1, Mi1 e Ré1: o riff desce Mi → Ré nos compassos 9 e 10 (V → IV do blues)
const TONICA_DO_RIFF = Object.freeze({ 0: 33, 2: 33, 4: 38, 6: 33, 8: 28, 9: 26 })

// Nota de aproximação do baixo no último passo do compasso de riff (leva ao compasso seguinte)
const APROXIMACAO = Object.freeze({ 0: 37, 2: 44, 4: 37, 6: 44, 8: 34, 9: 32 })

function riffDoBaixo(compasso) {
  const r = posicao(compasso)
  const lista = celulaDoTung(TONICA_DO_RIFF[r], GRADE.passosPorTempo)
  lista.push({ passo: GRADE.passos - 1, midi: APROXIMACAO[r], atenuacao: 0.2 })
  return notas(lista, VOZ.baixo, compasso, GRADE)
}

// O Rhodes dobra o riff uma oitava acima do baixo (sem a nota de aproximação)
function riffDoRhodes(compasso) {
  const lista = celulaDoTung(TONICA_DO_RIFF[posicao(compasso)] + 12, GRADE.passosPorTempo)
  return notas(lista, VOZ.riff, compasso, GRADE)
}

// --------------------------------------------------
// BAIXO nos compassos de resposta
// --------------------------------------------------

// Primeira volta: só o essencial (fundamental, quinta e aproximação)
const BAIXO_VOLTA_1 = Object.freeze({
  1: 'D2 . . | . . . | A2 . . | . . D#2',
  3: 'A2 . . | . . . | G2 . . | . . .',
  5: 'D2 . . | . . . | A2 . . | . . D#2',
  7: 'A2 . . | . . . | E2 . . | . . .',
  10: 'A1 . . | . . . | E2 . . | . . F2',
  11: 'E2 . . | . . . | B1 . . | . . .',
})

// Segunda volta: o baixo caminha nos três primeiros tempos (o quarto é do tung-tung-tung ou da aproximação)
const BAIXO_VOLTA_2 = Object.freeze({
  1: 'D2 . . | F2 . . | A2 . . | . . D#2',
  3: 'A2 . . | C3 . . | G2 . . | . . .',
  5: 'D2 . . | F2 . . | A2 . . | . . D#2',
  7: 'A2 . . | C3 . . | E2 . . | . . .',
  10: 'A1 . . | C2 . . | E2 . . | . . F2',
  11: 'E2 . . | G#2 . . | B1 . . | . . .',
})

function baixo(compasso) {
  const r = posicao(compasso)
  if (r in TONICA_DO_RIFF) return riffDoBaixo(compasso)
  const texto = (volta(compasso) === 0 ? BAIXO_VOLTA_1 : BAIXO_VOLTA_2)[r]
  return linha(texto, VOZ.baixo, compasso, GRADE)
}

function rhodesRiff(compasso) {
  return posicao(compasso) in TONICA_DO_RIFF ? riffDoRhodes(compasso) : null
}

// --------------------------------------------------
// SEGUNDA VOLTA: respostas da guitarra e toques do Rhodes
// --------------------------------------------------

// Respostas curtas, quase todas acima de Ré5; terminam antes do quarto tempo quando ele é do tung-tung-tung
const RESPOSTAS = Object.freeze({
  1: '. . F5 | . . E5 | D5 . . | . . .',
  3: '. . E5 | . . C5 | A4 . . | . . .',
  5: '. . A5 | . . G5 | F5 . . | D5 . .',
  7: '. . E5 | . . Eb5 | D5 . . | . . .',
  10: '. . G5 | A5! . . | E5 . . | . . .',
  11: '. . G#5 | . . F5 | D5 . . | . . .',
})

function guitarra(compasso) {
  if (volta(compasso) === 0) return null
  const texto = RESPOSTAS[posicao(compasso)]
  return texto ? linha(texto, VOZ.guitarra, compasso, GRADE) : null
}

// Acordes em duas vozes (terça e sétima), do grave ao agudo, em MIDI
const VOICINGS = Object.freeze({
  Am7: [55, 60],     // Sol3 Dó4
  Dm7: [53, 60],     // Fá3 Dó4
  'E7#9': [56, 62],  // Sol#3 Ré4
})

// Toques curtos no tempo 1 e no "e" do 3; nos compassos do tung-tung-tung, só no tempo 1
function comping(indiceDaVoz, v) {
  return (compasso) => {
    const r = posicao(compasso)
    if (volta(compasso) === 0 || r in TONICA_DO_RIFF) return null
    const acorde = VOICINGS[CANTINA_HARMONIA[r]]
    const passos = fechaFrase(compasso) ? [0] : [0, 8]
    return notas(passos.map((passo) => ({ passo, midi: acorde[indiceDaVoz] })), v, compasso, GRADE)
  }
}

// --------------------------------------------------
// BATERIA
// --------------------------------------------------

// Vassourinha: s = varrida suave (1 e 3), S = varrida com acento (2 e 4), t = toque leve no "skip"
const VASSOURINHA = Object.freeze({ S: 12, s: 12.3, t: 12.58 })
// Bumbo: K = tempo 1, k = apoio. Na primeira volta ele é só sentido ("feathering"); na segunda,
// firme mas abaixo do baixo (o bumbo da biblioteca é dimensionado para o rock da Vila).
const BUMBO_VASSOURINHA = Object.freeze({ K: 12.72, k: 12.8 })
const BUMBO_BAQUETAS = Object.freeze({ K: 12.42, k: 12.55 })
// Ride: X = 2 e 4 (acento), x = 1 e 3, s = nota "skip" do shuffle
const RIDE = Object.freeze({ X: 12.05, x: 12.25, s: 12.55 })
// Caixa: X = backbeat, x = toque normal, g = ghost note. O corpo some nas ghost notes.
const CAIXA = Object.freeze({ X: 12, x: 12.3, g: 12.7 })
const CAIXA_CORPO = Object.freeze({ X: 12, x: 12.3, g: 12.92 })
const PEDAL = Object.freeze({ c: 12.4 })

function vassourinha(compasso) {
  if (volta(compasso) !== 0) return null
  const texto = fechaFrase(compasso) ? 's . t | S . t | s . t | . . .' : 's . t | S . t | s . t | S . t'
  return bateria(texto, VASSOURINHA, GRADE)
}

function bumbo(compasso) {
  if (volta(compasso) === 0) return bateria('K . . | . . . | k . . | . . .', BUMBO_VASSOURINHA, GRADE)
  if (fechaFrase(compasso)) return bateria('K . . | . . . | k . . | . . .', BUMBO_BAQUETAS, GRADE)
  return bateria(compasso % 2 === 0 ? 'K . . | . . . | k . . | . . k' : 'K . . | . . k | k . . | . . .', BUMBO_BAQUETAS, GRADE)
}

function ride(compasso) {
  if (volta(compasso) === 0) return null
  return bateria(fechaFrase(compasso) ? 'x . s | X . s | x . s | . . .' : 'x . s | X . s | x . s | X . s', RIDE, GRADE)
}

function linhaDaCaixa(compasso) {
  if (volta(compasso) === 0) return null
  if (fechaFrase(compasso)) return '. . . | X . . | . . g | . . .'
  return compasso % 2 === 0 ? '. . . | X . . | . . g | X . .' : '. . g | X . . | . . . | X . g'
}

const caixa = (mapa) => (compasso) => {
  const texto = linhaDaCaixa(compasso)
  return texto ? bateria(texto, mapa, GRADE) : null
}

// Pedal do chimbal no 2 e no 4 nas duas voltas (sem o 4 quando o tung-tung-tung fecha a frase)
function chimbal(compasso) {
  return bateria(fechaFrase(compasso) ? '. . . | c . . | . . . | . . .' : '. . . | c . . | . . . | c . .', PEDAL, GRADE)
}

// Madeira: o tung-tung-tung em Lá, em crescendo, nos passos 9, 10 e 11 dos compassos que fecham frase
const ALTURA_DO_TUNG = 69 // Lá4
function madeira(compasso) {
  if (!fechaFrase(compasso)) return null
  const passos = compassoVazio(GRADE)
  passosDoTungTungTung(GRADE.passosPorTempo, GRADE.temposPorCompasso).forEach((passo, indice) => {
    const desvio = variacao(compasso, passo, 9) / 2
    passos[passo] = notaDoInstrumento(ALTURA_DO_TUNG, 'madeira', Math.max(0, TUNG_TUNG_TUNG_ATENUACAO[indice] + desvio))
  })
  return passos
}

// --------------------------------------------------
// CANAIS: [instrumento, panorama, gerador de passos]
// Baixo, bumbo, caixa e riff no centro; guitarra à esquerda e Rhodes à direita; ride à direita e
// pedal do chimbal à esquerda; nada nos extremos.
// --------------------------------------------------

const CANAIS = [
  ['contrabaixo', 0, baixo],
  ['rhodes', 0.12, rhodesRiff],
  ['guitarraJazz', -0.28, guitarra],
  ['rhodes', 0.22, comping(0, VOZ.compingGrave)],
  ['rhodes', 0.3, comping(1, VOZ.compingAgudo)],
  ['vassourinha', 0.06, vassourinha],
  ['bumbo', 0, bumbo],
  ['chimbal', -0.2, chimbal],
  ['ride', 0.22, ride],
  ['caixa', 0, caixa(CAIXA)],
  ['caixaCorpo', 0, caixa(CAIXA_CORPO)],
  ['madeira', 0.08, madeira],
]

export const CANTINA_SONG = montarMusica({
  instrumentos: CANTINA_INSTRUMENTOS,
  canais: CANAIS,
  compassos: CANTINA_META.compassos,
  inicioDoLoop: CANTINA_META.inicioDoLoop,
  grade: GRADE,
  andamento: CANTINA_META.andamento,
})
