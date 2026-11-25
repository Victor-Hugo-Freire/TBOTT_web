// A Ronda: Cucina. Faixa do andar 2: a cozinha agitada.
//
// ESTILO E ANDAMENTO
//   Jump blues / boogie-woogie em Sol, ♩ = 104. Grade de 12 passos por compasso (shuffle).
//   bpm do ZzFXM = 104 × 3/4 = 78.
//
// MATERIAL (ver MELODIA: as figuras rítmicas e as notas próprias da Cucina)
//   Tema A: uma cabeça de blues de 12 compassos no sax, feita de notas repetidas ("panela batendo"),
//   antecipações e saltos de oitava, em Sol maior com o Si♭ subindo ao Si.
//   Tema B: o "shout" do sax, notas repetidas com saltos de oitava, na seção B. A célula do Tung
//   (Ré – Fá – Sol – Fá – Ré em Sol) aparece exata só na virada do B, como citação.
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
//   FORMA · FIGURAS (ritmos da melodia) · SAX e SOLO (as frases, feitas com as figuras) ·
//   MAO_DIREITA (piano) · BOOGIE e CAMINHADA · GROOVES ·
//   DINAMICA (intensidade da bateria por seção) · TUNG

import { aplicarFigura, bateria, celula, comAtenuacao, compassoVazio, criarGrade, expandirForma, linha, montarMusica, notas, secoesDaForma, tungTungTung, voz } from './partitura.js'

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
  tonica: 'G',
  modo: 'mixolidio',
  estrutura: 'A1 12 · A2 12 · B 12 · C 8',
})

export const CUCINA_SECOES = secoesDaForma(FORMA)
export const CUCINA_HARMONIA = Object.freeze(COMPASSOS.map((c) => c.acorde))

const GRADE = criarGrade(CUCINA_META.passosPorTempo, CUCINA_META.temposPorCompasso)

export const CUCINA_INSTRUMENTOS = Object.freeze([
  'contrabaixo', 'pianoBoogie', 'saxTenor', 'saxTenorLongo', 'chimbal', 'chimbalAberto', 'ride', 'bumbo', 'caixa', 'caixaCorpo', 'caixaAro', 'madeira',
])

const VOZ = Object.freeze({
  baixo: voz('contrabaixo', 'baixo', { semente: 31 }),
  pianoGrave: voz('pianoBoogie', 'comping', { semente: 32 }),
  pianoAgudo: voz('pianoBoogie', 'comping', { semente: 33 }),
  pianoSolo: voz('pianoBoogie', 'melodia', { semente: 37 }),
  sax: voz('saxTenor', 'riff', { semente: 34 }),
  saxFrase: voz('saxTenor', 'melodia', { semente: 35 }),
  saxLongo: voz('saxTenorLongo', 'melodia', { semente: 36 }),
  saxFundo: voz('saxTenorLongo', 'comping', { semente: 38 }),
})

const cel = (tonica) => ({ celula: tonica })

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
// MELODIA: o que distingue a Cucina dos outros andares
//   Figuras rítmicas: a nota repetida ("panela batendo"), a antecipação no "a" do 4 (a nota entra
//   antes do tempo 1 e fica soando por cima dele) e o salto de oitava.
//   Notas: Sol maior com o Si♭ que sobe para o Si e a sexta (Mi), no médio-grave do sax.
//   A célula do Tung aparece exata só na virada do B (Ré → Dó), como citação.
// --------------------------------------------------

// 'x' = nota curta, 'X' = nota longa (versão longa do sax)
const FIGURAS = Object.freeze({
  panela: 'x . x | x . . | x . . | . . .',
  panelaAntecipa: 'x . x | x . . | x . . | . . X',
  martelo: 'x . x | x . x | x . . | . . .',
  marteloAntecipa: 'x . x | x . x | x . . | . . X',
  grito: 'x . x | x . x | . . x | . . .',
  oitava: 'x . . | X . . | . . . | . . .',
  oitavaAntecipa: 'x . . | X . . | . . . | . . X',
  gritoAntecipa: 'x . x | x . x | . . x | . . X',
  resposta: '. . . | x . x | X . . | . . .',
  respostaAntecipa: '. . . | x . x | x . . | . . X',
  depoisDoBreque: '. . . | x . x | x . . | . . .',
  quedaDeOitava: '. . . | x . . | X . . | . . .',
  longa: 'X . . | . . . | . . . | . . .',
})

const f = (nome, ...notasDaFrase) => aplicarFigura(FIGURAS[nome], notasDaFrase)

const SAX = Object.freeze({
  // Tema A: AAB, cada frase de 4 compassos com uma nota repetida, uma resposta e um salto
  A1: {
    0: f('panelaAntecipa', 'G3', 'G3', 'G3', 'Bb3', 'C4'), 1: f('resposta', 'E4', 'G4', 'Bb4'),
    2: f('oitavaAntecipa', 'G3', 'G4', 'D4'), 3: f('panela', 'D4', 'D4', 'D4', 'B3'),
    4: f('panelaAntecipa', 'C4', 'C4', 'C4', 'Eb4', 'E4'), 5: f('respostaAntecipa', 'G4', 'Bb4', 'C5', 'D4'),
    6: f('marteloAntecipa', 'D4', 'D4', 'D4', 'D4', 'B3', 'G3'), 7: f('longa', 'G3'),
    8: f('oitavaAntecipa', 'D3', 'D4', 'C4'), 9: f('panelaAntecipa', 'C4', 'C4', 'Bb3', 'G3', 'B3'),
    10: f('panelaAntecipa', 'B3', 'B3', 'D4', 'E4', 'F#4'), 11: f('resposta', 'A4', 'F#4', 'D4'),
  },
  // B: nos breques o sax entra depois do ataque da banda; no shout, notas repetidas com saltos de
  // oitava; na virada, a célula exata (Ré e Dó)
  B: {
    0: f('depoisDoBreque', 'G3', 'G3', 'G3'), 1: f('depoisDoBreque', 'E4', 'E4', 'C4'),
    2: f('quedaDeOitava', 'G4', 'G3'), 3: f('depoisDoBreque', 'Bb3', 'B3', 'D4'),
    4: f('gritoAntecipa', 'C4', 'C4', 'C4', 'C5', 'C4', 'Eb4'), 5: f('marteloAntecipa', 'Eb4', 'E4', 'G4', 'G4', 'Bb4', 'G3'),
    6: f('gritoAntecipa', 'G3', 'G3', 'G3', 'G4', 'G3', 'Bb3'), 7: f('martelo', 'Bb3', 'B3', 'D4', 'D4', 'D4'),
    8: cel(50), 9: cel(48),
    10: f('respostaAntecipa', 'B3', 'D4', 'G4', 'A3'), 11: f('depoisDoBreque', 'F#4', 'A4', 'D4'),
  },
  // C: a cozinha esvazia; notas graves, longas ou repetidas devagar
  C: {
    0: f('longa', 'G3'), 2: f('resposta', 'E3', 'E3', 'G3'),
    4: f('longa', 'D3'), 6: f('resposta', 'F#3', 'F#3', 'A3'),
  },
})

// A2: atrás do piano, notas longas (a terça ou a sétima de cada acorde), a cada dois compassos
const FUNDO_DO_SAX = Object.freeze({ G7: 'B3', C7: 'Bb3', D7: 'C4' })

// O sax em dois canais: as notas curtas no saxTenor e as longas ('~') no saxTenorLongo
function sax(articulacao) {
  return (compasso) => {
    const c = COMPASSOS[compasso]
    if (c.secao === 'A2') {
      if (articulacao !== 'longa' || c.indice % 2 === 1 || temTung(compasso)) return null
      return linha(f('longa', FUNDO_DO_SAX[c.acorde]), VOZ.saxFundo, compasso, GRADE, 0, 0.1, 'longa')
    }
    const entrada = SAX[c.secao]?.[c.indice]
    if (!entrada) return null
    if (typeof entrada !== 'string') return articulacao === 'curta' ? celula(entrada.celula, VOZ.sax, compasso, GRADE) : null
    return linha(entrada, articulacao === 'longa' ? VOZ.saxLongo : VOZ.saxFrase, compasso, GRADE, 0, 0, articulacao)
  }
}

// --------------------------------------------------
// PIANO
// --------------------------------------------------

// Mão direita: duas notas por acorde, no agudo (acima de 650 Hz)
const MAO_DIREITA = Object.freeze({ G7: [77, 83], C7: [76, 82], D7: [78, 84] })

// A2: o solo do piano no agudo, com as mesmas figuras do sax (repetição, antecipação e oitava)
const SOLO = Object.freeze({
  0: f('panelaAntecipa', 'D5', 'D5', 'D5', 'G5', 'B5'), 1: f('resposta', 'C6', 'Bb5', 'G5'),
  2: f('oitavaAntecipa', 'D5', 'D6', 'B5'), 3: f('panela', 'B5', 'B5', 'A5', 'G5'),
  4: f('panelaAntecipa', 'C5', 'C5', 'C5', 'E5', 'G5'), 5: f('resposta', 'Bb5', 'G5', 'E5'),
  6: f('marteloAntecipa', 'B5', 'B5', 'B5', 'B5', 'G5', 'F5'), 7: f('panela', 'F5', 'F5', 'F5', 'D5'),
  8: f('panelaAntecipa', 'A5', 'A5', 'A5', 'F#5', 'D6'), 9: f('resposta', 'C6', 'Bb5', 'G5'),
  10: f('marteloAntecipa', 'G5', 'G5', 'B5', 'B5', 'D6', 'A5'), 11: f('panela', 'A5', 'A5', 'F#5', 'D5'),
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
  return c.secao === 'A2' && SOLO[c.indice] ? linha(SOLO[c.indice], VOZ.pianoSolo, compasso, GRADE) : null
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
  ['saxTenor', 0, sax('curta')],
  ['saxTenorLongo', 0, sax('longa')],
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
  riff: [{ instrumento: 'saxTenor', compassos: { 32: 50, 33: 48 } }],
  tung: { compassos: COMPASSOS.map((_, compasso) => compasso).filter(temTung) },
})

// Vozes de melodia (analiseMelodica.js): o sax (curto e longo) e o solo do piano
export const CUCINA_MELODIA = Object.freeze([[['saxTenor', 0], ['saxTenorLongo', 0]], [['pianoBoogie', 3]]])
