// A Ronda: Cucina. Faixa do andar 2: a cozinha agitada.
//
// ESTILO E ANDAMENTO
//   Jump blues / boogie-woogie em Sol, ♩ = 104. Grade de 12 passos por compasso (shuffle).
//   bpm do ZzFXM = 104 × 3/4 = 78.
//
// O TEMA (motivos.js)
//   A célula do Tung (Ré – Fá – Sol – Fá – Ré, 5 – ♭7 – 1' – ♭7 – 5 em Sol) é o riff do sax tenor,
//   sobre Sol, Dó e Ré. O tung-tung-tung (madeira, em Sol) fecha cada frase de 4 compassos.
//
// FORMA (24 compassos = duas voltas do blues de 12)
//   Harmonia de cada volta: G7 | C7 | G7 | G7 | C7 | C7 | G7 | G7 | D7 | C7 | G7 | D7
//   0–11   Primeira volta: o boogie (contrabaixo) e a bateria em shuffle; o sax faz a célula nos
//          compassos 1, 3, 5, 7, 9 e 10 da volta, e a mão direita do piano responde no agudo.
//   12–23  Segunda volta: começa com breques (compassos 12–15): a banda ataca só no tempo 1 e o
//          sax e o tung-tung-tung preenchem o silêncio. Depois o boogie volta e o sax responde.
//
// ESPAÇO PARA OS EFEITOS SONOROS (100 a 650 Hz)
//   O boogie fica no grave (Sol1 a Dó3, quase todo abaixo de 100 Hz); a mão direita do piano fica
//   acima de 650 Hz; o sax tem a célula (5 notas) e respostas curtas.
//
// LOOP SEM EMENDA
//   A sequência começa no compasso 2 e dá a volta (2…23, 0, 1): a emenda (1 → 2) fica dentro da
//   primeira volta, com a mesma textura dos dois lados; os breques ficam no meio do áudio.

import { bateria, celula, criarGrade, linha, montarMusica, notas, tungTungTung, voz } from './partitura.js'

export const CUCINA_META = Object.freeze({
  id: 'andar-cucina',
  titulo: 'A Ronda: Cucina',
  estilo: 'jump blues / boogie-woogie',
  andamento: 104,
  passosPorTempo: 3,
  temposPorCompasso: 4,
  compassos: 24,
  inicioDoLoop: 2,
  tonalidade: 'Sol (G7)',
  estrutura: 'Blues de 12 × 2: volta 1 boogie com a célula no sax; volta 2 com breques e respostas (áudio gira a partir do compasso 2)',
})

const GRADE = criarGrade(CUCINA_META.passosPorTempo, CUCINA_META.temposPorCompasso)
const VOLTA = 12

export const CUCINA_HARMONIA = Object.freeze(['G7', 'C7', 'G7', 'G7', 'C7', 'C7', 'G7', 'G7', 'D7', 'C7', 'G7', 'D7'])

export const CUCINA_INSTRUMENTOS = Object.freeze([
  'contrabaixo', 'pianoBoogie', 'saxTenor', 'chimbal', 'bumbo', 'caixa', 'caixaCorpo', 'caixaAro', 'madeira',
])

const VOZ = Object.freeze({
  baixo: voz('contrabaixo', 'baixo', { semente: 31 }),
  pianoGrave: voz('pianoBoogie', 'comping', { semente: 32 }),
  pianoAgudo: voz('pianoBoogie', 'comping', { semente: 33 }),
  sax: voz('saxTenor', 'riff', { semente: 34 }),
  saxResposta: voz('saxTenor', 'melodia', { semente: 35 }),
})

const volta = (compasso) => Math.floor(compasso / VOLTA)
const posicao = (compasso) => compasso % VOLTA
const FIM_DE_FRASE = Object.freeze([3, 7, 11])
const BRECAS = Object.freeze([0, 1, 2, 3]) // compassos da segunda volta com breques
const ehBreque = (compasso) => volta(compasso) === 1 && BRECAS.includes(posicao(compasso))
// Tung-tung-tung: no fim das frases e, nos breques, também no compasso 1 da volta (o espaço vazio)
const temTung = (compasso) => FIM_DE_FRASE.includes(posicao(compasso)) || (ehBreque(compasso) && posicao(compasso) === 1)

// Fundamental (MIDI) de cada acorde, para o boogie
const FUNDAMENTAL = Object.freeze({ G7: 31, C7: 36, D7: 38 })
// Tônica do riff do sax por compasso da volta (a célula sobre o acorde)
const TONICA_DO_RIFF = Object.freeze({ 0: 55, 2: 55, 4: 48, 6: 55, 8: 50, 9: 48 })

// --------------------------------------------------
// BOOGIE: 1 – 3 – 5 – 6 – ♭7 – 6 – 5 – 3 em colcheias com swing, no contrabaixo
// --------------------------------------------------

const BOOGIE = Object.freeze([[0, 0], [2, 4], [3, 7], [5, 9], [6, 10], [8, 9], [9, 7], [11, 4]])

function boogie(compasso) {
  const raiz = FUNDAMENTAL[CUCINA_HARMONIA[posicao(compasso)]]
  if (ehBreque(compasso)) return notas([{ passo: 0, midi: raiz }], VOZ.baixo, compasso, GRADE)
  // No fim de frase o baixo para no 3º tempo: o 4º é do tung-tung-tung
  const passos = temTung(compasso) ? BOOGIE.filter(([passo]) => passo < 9) : BOOGIE
  return notas(passos.map(([passo, grau]) => ({ passo, midi: raiz + grau })), VOZ.baixo, compasso, GRADE)
}

// --------------------------------------------------
// PIANO: a mão esquerda reforça o tempo 1 no grave; a direita toca acordes curtos no agudo
// (acima de 650 Hz), no contratempo do 2 e do 4
// --------------------------------------------------

// Duas notas por acorde (terça e sétima, uma oitava e meia acima do meio do teclado)
const MAO_DIREITA = Object.freeze({ G7: [77, 83], C7: [76, 82], D7: [78, 84] })

function maoDireita(indice) {
  return (compasso) => {
    const acorde = MAO_DIREITA[CUCINA_HARMONIA[posicao(compasso)]]
    if (ehBreque(compasso)) return notas([{ passo: 0, midi: acorde[indice] }], VOZ.pianoAgudo, compasso, GRADE)
    const passos = temTung(compasso) ? [5] : [5, 11]
    // Na segunda volta a mão direita repete o toque em tercina antes do 4 (o "rolo" do boogie)
    const rolo = volta(compasso) === 1 && !temTung(compasso) && compasso % 2 === 1 ? [8, 9, 10] : []
    return notas([...passos, ...rolo].map((passo) => ({ passo, midi: acorde[indice], atenuacao: rolo.includes(passo) ? 0.15 : 0 })), VOZ.pianoAgudo, compasso, GRADE)
  }
}

function maoEsquerda(compasso) {
  const raiz = FUNDAMENTAL[CUCINA_HARMONIA[posicao(compasso)]] + 12
  return notas([{ passo: 0, midi: raiz, atenuacao: 0.1 }], VOZ.pianoGrave, compasso, GRADE)
}

// --------------------------------------------------
// SAX: a célula como riff e, na segunda volta, respostas curtas
// --------------------------------------------------

const RESPOSTAS = Object.freeze({
  1: '. . . | . . D4 | F4 . . | . . .',
  3: '. . G4 | . . F4 | D4 . . | . . .',
  5: '. . . | . . G4 | Bb4 . . | G4 . .',
  7: '. . Bb4 | . . A4 | G4 . . | . . .',
  10: '. . D4 | F4 . . | G4 . . | . . .',
  11: '. . F#4 | . . A4 | . . . | . . .',
})

function sax(compasso) {
  const r = posicao(compasso)
  if (r in TONICA_DO_RIFF) return celula(TONICA_DO_RIFF[r], VOZ.sax, compasso, GRADE)
  if (volta(compasso) === 1 && RESPOSTAS[r]) return linha(RESPOSTAS[r], VOZ.saxResposta, compasso, GRADE)
  return null
}

// --------------------------------------------------
// BATERIA
// --------------------------------------------------

// Chimbal fechado em shuffle: X = 2 e 4 (acento), x = 1 e 3, s = nota "skip"
const CHIMBAL = Object.freeze({ X: 12.05, x: 12.22, s: 12.5 })
const BUMBO = Object.freeze({ K: 12.45, k: 12.6 })
const CAIXA = Object.freeze({ X: 12, x: 12.28, g: 12.7 })
const CAIXA_CORPO = Object.freeze({ X: 12, x: 12.28, g: 12.92 })
const ARO = Object.freeze({ X: 12 })

function chimbal(compasso) {
  if (ehBreque(compasso)) return bateria('x . . | . . . | . . . | . . .', CHIMBAL, GRADE)
  return bateria(temTung(compasso) ? 'x . s | X . s | x . s | . . .' : 'x . s | X . s | x . s | X . s', CHIMBAL, GRADE)
}

function bumbo(compasso) {
  if (ehBreque(compasso)) return bateria('K . . | . . . | . . . | . . .', BUMBO, GRADE)
  if (temTung(compasso)) return bateria('K . . | . . . | k . . | . . .', BUMBO, GRADE)
  return bateria(compasso % 2 === 0 ? 'K . . | . . . | k . . | . . k' : 'K . . | . . k | k . . | . . .', BUMBO, GRADE)
}

function linhaDaCaixa(compasso) {
  if (ehBreque(compasso)) return null
  if (temTung(compasso)) return '. . . | X . . | . . g | . . .'
  return compasso % 2 === 0 ? '. . . | X . . | . . g | X . .' : '. . g | X . . | . . . | X . g'
}

const caixa = (mapa) => (compasso) => {
  const texto = linhaDaCaixa(compasso)
  return texto ? bateria(texto, mapa, GRADE) : null
}

// Aro: o estalo do breque, junto com a banda no tempo 1
function aro(compasso) {
  return ehBreque(compasso) ? bateria('X . . | . . . | . . . | . . .', ARO, GRADE) : null
}

const ALTURA_DO_TUNG = 67 // Sol4
function madeira(compasso) {
  return temTung(compasso) ? tungTungTung(ALTURA_DO_TUNG, compasso, GRADE) : null
}

// --------------------------------------------------
// CANAIS
// --------------------------------------------------

const CANAIS = [
  ['contrabaixo', 0, boogie],
  ['pianoBoogie', 0.24, maoEsquerda],
  ['pianoBoogie', 0.28, maoDireita(0)],
  ['pianoBoogie', 0.32, maoDireita(1)],
  ['saxTenor', 0, sax],
  ['chimbal', -0.2, chimbal],
  ['bumbo', 0, bumbo],
  ['caixa', 0, caixa(CAIXA)],
  ['caixaCorpo', 0, caixa(CAIXA_CORPO)],
  ['caixaAro', 0.05, aro],
  ['madeira', 0.08, madeira],
]

export const CUCINA_SONG = montarMusica({
  instrumentos: CUCINA_INSTRUMENTOS,
  canais: CANAIS,
  compassos: CUCINA_META.compassos,
  inicioDoLoop: CUCINA_META.inicioDoLoop,
  grade: GRADE,
  andamento: CUCINA_META.andamento,
})

// Onde estão o riff e o tung-tung-tung (os testes conferem)
export const CUCINA_MOTIVO = Object.freeze({
  riff: { instrumento: 'saxTenor', compassos: Object.fromEntries([0, 12].flatMap((inicio) => Object.entries(TONICA_DO_RIFF).map(([r, tonica]) => [inicio + Number(r), tonica]))) },
  tung: { compassos: Array.from({ length: CUCINA_META.compassos }, (_, compasso) => compasso).filter(temTung) },
})
