// A Ronda: Cucina. Faixa do andar 2: a cozinha agitada.
//
// ESTILO E ANDAMENTO
//   Jump blues / boogie-woogie em Sol, ♩ = 104. Grade de 12 passos por compasso (shuffle).
//   bpm do ZzFXM = 104 × 3/4 = 78.
//
// MATERIAL
//   Tema A: uma cabeça de blues de 12 compassos no sax (pergunta, pergunta no IV, resposta). A
//   célula do Tung (Ré – Fá – Sol – Fá – Ré em Sol) abre cada frase, sobre Sol, Dó e Ré.
//   Tema B: o "shout" do sax, notas repetidas com a blue note, na seção B.
//   O tung-tung-tung (madeira, em Sol) aparece em lugares diferentes em cada seção.
//
// FORMA (44 compassos, ~101 s; editar em FORMA)
//   A1 (12)  cabeça: boogie no contrabaixo, chimbal em shuffle, o sax no tema A, o piano responde
//            com acordes agudos
//   A2 (12)  o piano assume: ele toca a célula uma oitava acima e sola no agudo; o sax segura notas
//            longas atrás; a bateria passa para o ride e o bumbo empurra mais
//   B  (12)  breques (a banda só no 1, o sax e o tung-tung-tung no silêncio) → shout (tema B, o
//            ponto mais alto) → a célula em sequência Ré → Dó e uma virada de tons
//   C  (8)   a cozinha esvazia: sem boogie (o baixo caminha), chimbal só no 2 e no 4, o sax em notas
//            graves; no fim um rulo de caixa cresce de volta ao A1
//   Energia: A1 média → A2 média-alta → B alta (breques: buracos) → C baixa → (A1)
//
// ESPAÇO PARA OS EFEITOS SONOROS (100 a 650 Hz)
//   O boogie fica quase todo abaixo de 100 Hz; o piano agudo fica acima de 650 Hz; o sax tem frases
//   curtas com pausas.
//
// LOOP SEM EMENDA
//   O áudio começa no A1; o fim do C (rulo e tung-tung-tung sobre D7) leva ao A1 como uma virada V → I.
//
// ONDE AJUSTAR
//   FORMA · SAX (temas por seção) · SOLO e MAO_DIREITA (piano) · BOOGIE e CAMINHADA · GROOVES ·
//   DINAMICA (intensidade da bateria por seção) · TUNG

import { bateria, celula, comAtenuacao, compassoVazio, criarGrade, expandirForma, linha, montarMusica, notas, secoesDaForma, tungTungTung, voz } from './partitura.js'

const BLUES = ['G7', 'C7', 'G7', 'G7', 'C7', 'C7', 'G7', 'G7', 'D7', 'C7', 'G7', 'D7']

const FORMA = Object.freeze([
  { nome: 'A1', papel: 'cabeça: o sax no tema A, chimbal em shuffle', harmonia: BLUES },
  { nome: 'A2', papel: 'o piano assume a célula e sola; ride', harmonia: BLUES },
  { nome: 'B', papel: 'breques, shout do sax e virada de tons', harmonia: BLUES },
  { nome: 'C', papel: 'a cozinha esvazia: baixo caminhando e notas graves', harmonia: ['G7', 'G7', 'C7', 'C7', 'G7', 'G7', 'D7', 'D7'] },
])

const COMPASSOS = expandirForma(FORMA)

export const CUCINA_META = Object.freeze({
  id: 'andar-cucina',
  titulo: 'A Ronda: Cucina',
  estilo: 'jump blues / boogie-woogie',
  andamento: 104,
  passosPorTempo: 3,
  temposPorCompasso: 4,
  compassos: COMPASSOS.length,
  inicioDoLoop: 0,
  tonalidade: 'Sol (G7)',
  estrutura: 'A1 12 · A2 12 · B 12 · C 8',
})

export const CUCINA_SECOES = secoesDaForma(FORMA)
export const CUCINA_HARMONIA = Object.freeze(COMPASSOS.map((c) => c.acorde))

const GRADE = criarGrade(CUCINA_META.passosPorTempo, CUCINA_META.temposPorCompasso)

export const CUCINA_INSTRUMENTOS = Object.freeze([
  'contrabaixo', 'pianoBoogie', 'saxTenor', 'chimbal', 'chimbalAberto', 'ride', 'bumbo', 'caixa', 'caixaCorpo', 'caixaAro', 'madeira',
])

const VOZ = Object.freeze({
  baixo: voz('contrabaixo', 'baixo', { semente: 31 }),
  pianoGrave: voz('pianoBoogie', 'comping', { semente: 32 }),
  pianoAgudo: voz('pianoBoogie', 'comping', { semente: 33 }),
  pianoSolo: voz('pianoBoogie', 'melodia', { semente: 37 }),
  sax: voz('saxTenor', 'riff', { semente: 34 }),
  saxFrase: voz('saxTenor', 'melodia', { semente: 35 }),
  saxFundo: voz('saxTenor', 'comping', { semente: 36 }),
})

const cel = (tonica) => ({ celula: tonica })
const tocar = (entrada, v, compasso) => {
  if (!entrada) return null
  return typeof entrada === 'string' ? linha(entrada, v, compasso, GRADE) : celula(entrada.celula, v, compasso, GRADE)
}

// --------------------------------------------------
// TUNG: lugares diferentes em cada seção (compassos dentro da seção)
// --------------------------------------------------

const TUNG = Object.freeze({ A1: [3, 7], A2: [11], B: [1, 3, 11], C: [7] })
const temTung = (compasso) => {
  const { secao, indice } = COMPASSOS[compasso]
  return TUNG[secao].includes(indice)
}

// --------------------------------------------------
// BOOGIE: 1 – 3 – 5 – 6 – ♭7 – 6 – 5 – 3 em colcheias com swing (A1, A2 e B fora dos breques)
// --------------------------------------------------

const FUNDAMENTAL = Object.freeze({ G7: 31, C7: 36, D7: 38 })
const BOOGIE = Object.freeze([[0, 0], [2, 4], [3, 7], [5, 9], [6, 10], [8, 9], [9, 7], [11, 4]])

// Compassos com breque (a banda só ataca no tempo 1)
const ehBreque = ({ secao, indice }) => secao === 'B' && indice < 4

// C: o baixo caminha em semínimas (fundamental, terça, quinta, aproximação)
const CAMINHADA = Object.freeze({
  0: 'G1 . . | B1 . . | D2 . . | E2 . .', 1: 'G1 . . | D2 . . | F2 . . | . . B1',
  2: 'C2 . . | E2 . . | G2 . . | A2 . .', 3: 'C2 . . | G1 . . | A1 . . | . . B1',
  4: 'G1 . . | B1 . . | D2 . . | F2 . .', 5: 'G1 . . | . . . | D2 . . | . . C#2',
  6: 'D2 . . | F#2 . . | A2 . . | C3 . .', 7: 'D2 . . | . . . | A1 . . | . . .',
})

function baixo(compasso) {
  const c = COMPASSOS[compasso]
  if (c.secao === 'C') return linha(CAMINHADA[c.indice], VOZ.baixo, compasso, GRADE)
  const raiz = FUNDAMENTAL[c.acorde]
  if (ehBreque(c)) return notas([{ passo: 0, midi: raiz }], VOZ.baixo, compasso, GRADE)
  const passos = temTung(compasso) ? BOOGIE.filter(([passo]) => passo < 9) : BOOGIE
  return notas(passos.map(([passo, grau]) => ({ passo, midi: raiz + grau })), VOZ.baixo, compasso, GRADE)
}

// --------------------------------------------------
// SAX
// --------------------------------------------------

const SAX = Object.freeze({
  // Tema A: AAB. Cada frase abre com a célula (Sol, Dó, Ré) e termina de um jeito diferente.
  A1: {
    0: cel(55), 1: 'E4 . . | . . G4 | Bb4 . . | G4 . .', 2: 'D4 . F4 | G4 . . | . . . | . . .', 3: 'B3 . . | D4 . . | . . . | . . .',
    4: cel(48), 5: 'A3 . . | . . C4 | Eb4 . . | C4 . .', 6: 'D4 . F4 | G4 . . | Bb4 . . | . . .',
    8: cel(50), 9: 'G3 . Bb3 | C4 . . | . . . | . . .', 10: 'B3 . . | D4 . G4 | . . . | F4 . .', 11: 'F#4 . . | A4 . . | . . . | . . .',
  },
  // B: nos breques o sax enche o silêncio; depois o shout (tema B) e a célula em sequência no fim
  B: {
    0: cel(55), 2: cel(48), 3: '. . . | . . D4 | F4 . . | G4 . .',
    4: 'D4 . D4 | . . D4 | F4 . D4 | . . .', 5: 'Eb4 . Eb4 | . . Eb4 | G4 . Eb4 | . . .',
    6: 'D4 . D4 | . . D4 | F4 . D4 | . . B3', 7: 'D4 . . | . . . | G4 . . | . . .',
    8: cel(50), 9: cel(48), 10: 'B3 . D4 | G4 . . | . . . | . . .',
  },
  // C: notas graves e longas, uma por frase
  C: { 0: 'G3 . . | . . . | . . . | . . .', 2: 'E3 . . | . . . | G3 . . | . . .', 4: 'D3 . . | . . . | F3 . . | . . .', 6: 'F#3 . . | . . . | . . . | . . .' },
})

// A2: atrás do piano, notas longas (a terça ou a sétima de cada acorde), a cada dois compassos
const FUNDO_DO_SAX = Object.freeze({ G7: 59, C7: 58, D7: 60 })

function sax(compasso) {
  const c = COMPASSOS[compasso]
  if (c.secao === 'A2') {
    if (c.indice % 2 === 1 || temTung(compasso)) return null
    return notas([{ passo: 0, midi: FUNDO_DO_SAX[c.acorde], atenuacao: 0.1 }], VOZ.saxFundo, compasso, GRADE)
  }
  const entrada = SAX[c.secao]?.[c.indice]
  return tocar(entrada, typeof entrada === 'string' ? VOZ.saxFrase : VOZ.sax, compasso)
}

// --------------------------------------------------
// PIANO
// --------------------------------------------------

// Mão direita: duas notas por acorde, no agudo (acima de 650 Hz)
const MAO_DIREITA = Object.freeze({ G7: [77, 83], C7: [76, 82], D7: [78, 84] })

// A2: o solo do piano no agudo. Abre com a célula uma oitava acima do sax.
const SOLO = Object.freeze({
  0: cel(67), 1: '. . G5 | . . Bb5 | C6 . . | Bb5 . G5', 2: 'B5 . . | D6 . . | . . B5 | G5 . .', 3: '. . . | . . F5 | G5 . . | . . .',
  4: cel(60), 5: '. . E5 | G5 . . | Bb5 . . | A5 . G5', 6: 'B5 . D6 | . . B5 | G5 . . | . . .', 7: '. . . | . . . | F5 . G5 | . . .',
  8: 'A5 . . | . . F#5 | . . A5 | C6 . .', 9: 'Bb5 . . | . . G5 | E5 . . | . . .', 10: 'D6 . B5 | G5 . . | . . . | . . .',
})

function maoDireita(indiceDaVoz) {
  return (compasso) => {
    const c = COMPASSOS[compasso]
    const acorde = MAO_DIREITA[c.acorde]
    if (c.secao === 'C' || c.secao === 'A2') return null
    if (ehBreque(c)) return notas([{ passo: 0, midi: acorde[indiceDaVoz] }], VOZ.pianoAgudo, compasso, GRADE)
    // Shout: a mão direita repete o acorde em tercinas (o "rolo" do boogie)
    if (c.secao === 'B' && c.indice >= 4 && c.indice < 8) {
      return notas([2, 3, 4, 5, 8, 9, 10, 11].map((passo) => ({ passo, midi: acorde[indiceDaVoz], atenuacao: passo % 3 === 0 ? 0.05 : 0.2 })), VOZ.pianoAgudo, compasso, GRADE)
    }
    const passos = temTung(compasso) ? [5] : [5, 11]
    return notas(passos.map((passo) => ({ passo, midi: acorde[indiceDaVoz] })), VOZ.pianoAgudo, compasso, GRADE)
  }
}

function pianoSolo(compasso) {
  const c = COMPASSOS[compasso]
  return c.secao === 'A2' ? tocar(SOLO[c.indice], VOZ.pianoSolo, compasso) : null
}

function maoEsquerda(compasso) {
  const c = COMPASSOS[compasso]
  // No C, a mão esquerda só no primeiro compasso de cada par
  if (c.secao === 'C' && c.indice % 2 === 1) return null
  const raiz = FUNDAMENTAL[c.acorde] + 12
  return notas([{ passo: 0, midi: raiz, atenuacao: 0.1 }], VOZ.pianoGrave, compasso, GRADE)
}

// --------------------------------------------------
// BATERIA: um groove por seção, com viradas nas passagens
// --------------------------------------------------

const CHIMBAL = Object.freeze({ X: 12.05, x: 12.22, s: 12.5, c: 12.35 })
const ABERTO = Object.freeze({ o: 12.25 })
const RIDE = Object.freeze({ X: 12.05, x: 12.22, s: 12.5, B: 17.08 })
const BUMBO = Object.freeze({ K: 12.45, k: 12.6, l: 19.2, m: 22.25, h: 26.3 })
const CAIXA = Object.freeze({ X: 12, x: 12.28, g: 12.7, p: 12.55, q: 12.38 })
const CAIXA_CORPO = Object.freeze({ X: 12, x: 12.28, g: 12.92, p: 12.6, q: 12.45 })
const ARO = Object.freeze({ X: 12 })

const GROOVES = Object.freeze({
  chimbal: {
    A1: (i, tung) => (tung ? 'x . s | X . s | x . s | . . .' : 'x . s | X . s | x . s | X . s'),
    B: (i, tung) => {
      if (i < 4) return 'x . . | . . . | . . . | . . .'
      if (i >= 8) return tung ? 'x . s | X . s | x . s | . . .' : 'x . s | X . s | x . s | X . s'
      return null
    },
    C: (i, tung) => (tung ? '. . . | c . . | . . . | . . .' : '. . . | c . . | . . . | c . .'),
  },
  aberto: {
    // Shout: chimbal aberto no 2 e no 4
    B: (i) => (i >= 4 && i < 8 ? '. . . | o . . | . . . | o . .' : null),
  },
  ride: {
    A2: (i, tung) => {
      if (tung) return 'x . s | X . s | x . s | . . .'
      return i >= 8 ? 'x . . | B . . | x . . | B . .' : 'x . s | X . s | x . s | X . s'
    },
  },
  bumbo: {
    A1: (i, tung) => (tung ? 'K . . | . . . | k . . | . . .' : 'K . . | . . . | k . . | . . k'),
    A2: (i, tung) => {
      if (i === 11) return 'K . . | . . . | h m l | . . .' // virada de tons antes do B
      if (tung) return 'K . . | . . . | k . . | . . .'
      return i % 2 === 0 ? 'K . . | . . k | k . . | . . k' : 'K . . | . . . | K . . | . . k'
    },
    B: (i, tung) => {
      if (i < 4) return 'K . . | . . . | . . . | . . .'
      if (i === 11) return 'K . . | h . h | m . m | l l l' // virada grande antes de a cozinha esvaziar
      if (tung) return 'K . . | . . . | k . . | . . .'
      return 'K . . | . . k | K . . | . . k'
    },
    C: (i) => (i === 7 ? null : 'K . . | . . . | . . . | . . .'),
  },
  caixa: {
    A1: (i, tung) => {
      if (i === 11) return '. . . | X . . | . . g | p q X' // rulo para o A2
      if (tung) return '. . . | X . . | . . g | . . .'
      return i % 2 === 0 ? '. . . | X . . | . . g | X . .' : '. . g | X . . | . . . | X . g'
    },
    A2: (i, tung) => {
      if (i === 11) return '. . . | X . . | . . . | . . .'
      if (tung) return '. . . | X . . | . . g | . . .'
      return i >= 8 ? '. . . | X . . | . . . | X . .' : '. . g | X . g | . . . | X . .'
    },
    B: (i, tung) => {
      if (i < 4 || i === 11) return null
      if (tung) return '. . . | X . . | . . g | . . .'
      return i < 8 ? '. . . | X . . | . . . | X . .' : '. . g | X . . | . . g | X . .'
    },
    // C: só o rulo do fim, crescendo
    C: (i) => {
      if (i === 6) return '. . . | . . . | p . q | p q x'
      if (i === 7) return 'p q x | p q x | p q X | . . .'
      return null
    },
  },
  aro: {
    B: (i) => (i < 4 ? 'X . . | . . . | . . . | . . .' : null),
  },
})

// Intensidade da bateria por seção (atenuação somada a todas as batidas; 0 = cheia)
const DINAMICA = Object.freeze({ A1: 0.1, A2: 0.03, B: 0, C: 0.2 })

function peca(nome, mapa) {
  return (compasso) => {
    const { secao, indice } = COMPASSOS[compasso]
    const groove = GROOVES[nome][secao]
    const texto = groove ? groove(indice, temTung(compasso)) : null
    return texto ? bateria(texto, comAtenuacao(mapa, DINAMICA[secao]), GRADE) : null
  }
}

const ALTURA_DO_TUNG = 67 // Sol4
const madeira = (compasso) => (temTung(compasso) ? tungTungTung(ALTURA_DO_TUNG, compasso, GRADE) : compassoVazio(GRADE))

// --------------------------------------------------
// CANAIS
// --------------------------------------------------

const CANAIS = [
  ['contrabaixo', 0, baixo],
  ['pianoBoogie', 0.24, maoEsquerda],
  ['pianoBoogie', 0.28, maoDireita(0)],
  ['pianoBoogie', 0.32, maoDireita(1)],
  ['pianoBoogie', 0.18, pianoSolo],
  ['saxTenor', 0, sax],
  ['chimbal', -0.2, peca('chimbal', CHIMBAL)],
  ['chimbalAberto', -0.22, peca('aberto', ABERTO)],
  ['ride', 0.22, peca('ride', RIDE)],
  ['bumbo', 0, peca('bumbo', BUMBO)],
  ['caixa', 0, peca('caixa', CAIXA)],
  ['caixaCorpo', 0, peca('caixa', CAIXA_CORPO)],
  ['caixaAro', 0.05, peca('aro', ARO)],
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

// Onde estão a célula (exata) e o tung-tung-tung (os testes conferem)
export const CUCINA_MOTIVO = Object.freeze({
  riff: [
    { instrumento: 'saxTenor', compassos: { 0: 55, 4: 48, 8: 50, 24: 55, 26: 48, 32: 50, 33: 48 } },
    { instrumento: 'pianoBoogie', ordem: 3, compassos: { 12: 67, 16: 60 } },
  ],
  tung: { compassos: COMPASSOS.map((_, compasso) => compasso).filter(temTung) },
})
