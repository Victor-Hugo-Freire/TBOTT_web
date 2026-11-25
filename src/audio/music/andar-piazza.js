// A Ronda: Piazza. Faixa do andar 3: a praça à noite (fachadas, pedras, luz azulada).
//
// ESTILO E ANDAMENTO
//   Soul-jazz de trio de órgão em Fá menor (groove dórico), ♩ = 112. Grade de 12 passos por
//   compasso (swing). bpm do ZzFXM = 112 × 3/4 = 84.
//
// MATERIAL
//   Tema A (o head): abre com a célula do Tung (Dó – Mi♭ – Fá – Mi♭ – Dó em Fá) no órgão (no A1 em
//   quartas paralelas); a célula volta em sequência sobre Si♭ e, no compasso 5, com outro fim (sobe ao Sol).
//   Tema B: respostas da guitarra na ponte, no agudo.
//   O tung-tung-tung (madeira, em Fá) fecha algumas seções, nunca todas.
//
// FORMA (42 compassos, ~90 s; editar em FORMA)
//   A1  (8)  head no órgão; ride leve, cross-stick no 4, baixo de órgão
//   A2  (8)  o head de novo: a guitarra dobra a célula uma oitava abaixo e o fim da frase muda; o bumbo empurra
//            e uma virada leva à ponte
//   B   (8)  ponte: D♭maj7 – C7#9, Leslie rápido, a guitarra responde no agudo, campana no 2 e no 4
//   A3  (8)  o head passa para a guitarra, o órgão vira pad sustentado, caixa de verdade no 2 e no 4:
//            o ponto mais alto
//   C   (8)  a lua na praça: só o ride baixinho e o pedal do baixo; o órgão lembra pedaços da célula;
//            nos dois últimos compassos a bateria volta
//   Tag (2)  D♭maj7 – C7#9 com virada de tons e o tung-tung-tung, de volta ao A1
//   Energia: A1 média → A2 média-alta → B alta → A3 a mais alta → C a mais baixa → Tag sobe → (A1)
//
// ESPAÇO PARA OS EFEITOS SONOROS (100 a 650 Hz)
//   O baixo de órgão fica abaixo de 100 Hz; o head e as respostas ficam quase todos acima de 523 Hz;
//   o órgão acompanha com um ou dois toques curtos por compasso.
//
// LOOP SEM EMENDA
//   O áudio começa no A1; o Tag (C7#9 com o tung-tung-tung) leva ao A1 como uma virada V → i.
//
// ONDE AJUSTAR
//   FORMA · HEAD (tema A e variações por seção) · RESPOSTAS (tema B) · FRAGMENTOS (seção C) ·
//   GROOVES (bateria) · DINAMICA (intensidade por seção) · TUNG

import { bateria, celula, comAtenuacao, compassoVazio, criarGrade, expandirForma, linha, montarMusica, notas, secoesDaForma, tungTungTung, voz } from './partitura.js'

const A = ['Fm7', 'Fm7', 'Bb7', 'Bb7', 'Fm7', 'Fm7', 'Bb7', 'C7#9']

const FORMA = Object.freeze([
  { nome: 'A1', papel: 'head no órgão, ride leve', harmonia: A },
  { nome: 'A2', papel: 'head com a guitarra dobrando e outro fim', harmonia: A },
  { nome: 'B', papel: 'ponte: Leslie rápido e respostas da guitarra', harmonia: ['Dbmaj7', 'Dbmaj7', 'C7#9', 'C7#9', 'Dbmaj7', 'Gm7b5', 'C7#9', 'C7#9'] },
  { nome: 'A3', papel: 'head na guitarra, órgão em pad, bateria cheia', harmonia: A },
  { nome: 'C', papel: 'a lua na praça: ride, pedal e pedaços da célula', harmonia: ['Fm7', 'Fm7', 'Fm7', 'Fm7', 'Fm7', 'Fm7', 'Bb7', 'C7#9'] },
  { nome: 'Tag', papel: 'virada de volta ao A1', harmonia: ['Dbmaj7', 'C7#9'] },
])

const COMPASSOS = expandirForma(FORMA)

export const PIAZZA_META = Object.freeze({
  id: 'andar-piazza',
  titulo: 'A Ronda: Piazza',
  estilo: 'soul-jazz de trio de órgão',
  andamento: 112,
  passosPorTempo: 3,
  temposPorCompasso: 4,
  compassos: COMPASSOS.length,
  inicioDoLoop: 0,
  tonalidade: 'Fá menor (dórico)',
  estrutura: 'A1 8 · A2 8 · B 8 · A3 8 · C 8 · Tag 2',
})

export const PIAZZA_SECOES = secoesDaForma(FORMA)
export const PIAZZA_HARMONIA = Object.freeze(COMPASSOS.map((c) => c.acorde))

const GRADE = criarGrade(PIAZZA_META.passosPorTempo, PIAZZA_META.temposPorCompasso)

export const PIAZZA_INSTRUMENTOS = Object.freeze([
  'orgaoBaixo', 'orgao', 'orgaoLeslieLento', 'orgaoLeslieRapido', 'orgaoSustentado', 'guitarraJazz',
  'ride', 'chimbal', 'caixaAro', 'caixa', 'caixaCorpo', 'bumbo', 'madeira',
])

const VOZ = Object.freeze({
  baixo: voz('orgaoBaixo', 'baixo', { semente: 41 }),
  head: voz('orgao', 'riff', { semente: 42 }),
  headFrase: voz('orgao', 'melodia', { semente: 47 }),
  headQuarta: voz('orgao', 'riff', { semente: 43 }),
  comping: voz('orgaoLeslieLento', 'comping', { semente: 44 }),
  ponte: voz('orgaoLeslieRapido', 'comping', { semente: 45 }),
  pad: voz('orgaoSustentado', 'comping', { semente: 48 }),
  guitarra: voz('guitarraJazz', 'melodia', { semente: 46 }),
  guitarraRiff: voz('guitarraJazz', 'riff', { semente: 49 }),
})

const cel = (tonica) => ({ celula: tonica })
const tocar = (entrada, v, compasso, transpor = 0) => {
  if (!entrada) return null
  if (typeof entrada === 'string') return linha(entrada, v, compasso, GRADE, transpor)
  return celula(entrada.celula + transpor, v, compasso, GRADE)
}

// --------------------------------------------------
// HEAD (tema A): a base é a do A1; o A2 e o A3 trocam o fim da frase
// --------------------------------------------------

const HEAD_A1 = Object.freeze({
  0: cel(65), 1: '. . . | . . Ab4 | Bb4 . . | C5 . .',
  2: cel(58), 3: '. . . | . . D5 | C5 . . | Ab4 . .',
  4: 'C5 . Eb5 | F5 . Eb5 | G5 . . | . . .', 5: '. . F5 | . . Eb5 | C5 . . | . . .',
  6: 'Bb4 . . | . . C5 | D5 . . | F5 . .', 7: 'E5 . . | . . . | . . . | . . .',
})

const HEAD = Object.freeze({
  A1: HEAD_A1,
  A2: { ...HEAD_A1, 6: 'Ab4 . . | . . Bb4 | C5 . . | Eb5 . .', 7: 'D5 . . | . . E5 | . . . | . . .' },
  A3: { ...HEAD_A1, 6: 'F5 . . | . . Eb5 | C5 . . | Bb4 . .', 7: 'C5 . . | . . . | . . . | . . .' },
})

// C: só pedaços da célula (as três primeiras notas), cada vez mais espaçados
const FRAGMENTOS = Object.freeze({
  1: 'C4 . Eb4 | F4 . . | . . . | . . .',
  3: 'Eb4 . F4 | . . . | . . . | . . .',
  5: 'C4 . . | Eb4 . . | F4 . . | . . .',
})

function orgaoHead(compasso) {
  const { secao, indice } = COMPASSOS[compasso]
  if (secao === 'A1' || secao === 'A2') {
    const entrada = HEAD[secao][indice]
    return tocar(entrada, typeof entrada === 'string' ? VOZ.headFrase : VOZ.head, compasso)
  }
  if (secao === 'C' && FRAGMENTOS[indice]) return linha(FRAGMENTOS[indice], VOZ.headFrase, compasso, GRADE)
  return null
}

// Quartas paralelas na célula do A1 (o som de trio de órgão); no A2 quem engrossa a célula é a guitarra
function orgaoQuarta(compasso) {
  const { secao, indice } = COMPASSOS[compasso]
  if (secao !== 'A1' || ![0, 2].includes(indice)) return null
  return tocar(HEAD.A1[indice], VOZ.headQuarta, compasso, -5)
}

// --------------------------------------------------
// GUITARRA: dobra a célula no A2 (uma oitava abaixo), responde na ponte, assume o head no A3
// --------------------------------------------------

const RESPOSTAS = Object.freeze({
  1: '. . F5 | . . Ab5 | . . F5 | Eb5 . .',
  3: '. . G5 | . . E5 | . . Db5 | C5 . .',
  5: '. . Db5 | . . F5 | . . Ab5 | . . .',
  7: '. . Eb5 | . . E5 | G5 . . | . . .',
})

function guitarra(compasso) {
  const { secao, indice } = COMPASSOS[compasso]
  if (secao === 'A2' && (indice === 0 || indice === 2)) {
    const entrada = HEAD.A2[indice]
    return tocar(entrada, typeof entrada === 'string' ? VOZ.guitarra : VOZ.guitarraRiff, compasso, -12)
  }
  if (secao === 'B' && RESPOSTAS[indice]) return linha(RESPOSTAS[indice], VOZ.guitarra, compasso, GRADE)
  if (secao === 'A3') {
    const entrada = HEAD.A3[indice]
    return tocar(entrada, typeof entrada === 'string' ? VOZ.guitarra : VOZ.guitarraRiff, compasso)
  }
  return null
}

// --------------------------------------------------
// ACOMPANHAMENTO DO ÓRGÃO
// --------------------------------------------------

const VOICINGS = Object.freeze({
  Fm7: [56, 60, 63], Bb7: [56, 62, 67], 'C7#9': [52, 58, 63], Dbmaj7: [53, 60, 65], Gm7b5: [53, 58, 61],
})

// Toques curtos (Leslie lento): um por compasso no A1, dois no A2; acordes longos no C a cada 2 compassos
function comping(indiceDaVoz) {
  return (compasso) => {
    const { secao, indice, acorde } = COMPASSOS[compasso]
    const nota = VOICINGS[acorde][indiceDaVoz]
    // Nas seções A o head já ocupa o meio: o acompanhamento fica com duas vozes (sem a do meio)
    if ((secao === 'A1' || secao === 'A2') && indiceDaVoz === 1) return null
    if (secao === 'A1') return notas([{ passo: 3, midi: nota }], VOZ.comping, compasso, GRADE)
    if (secao === 'A2') return notas((indice === 7 ? [2] : [2, 8]).map((passo) => ({ passo, midi: nota })), VOZ.comping, compasso, GRADE)
    if (secao === 'C' && indice % 2 === 0) return notas([{ passo: 0, midi: nota, atenuacao: 0.15 }], VOZ.comping, compasso, GRADE)
    return null
  }
}

// Ponte e Tag: Leslie rápido, duas vozes
function ponte(indiceDaVoz) {
  return (compasso) => {
    const { secao, indice, acorde } = COMPASSOS[compasso]
    if (secao !== 'B' && secao !== 'Tag') return null
    const nota = VOICINGS[acorde][indiceDaVoz + 1]
    const passos = secao === 'Tag' || indice === 7 ? [0] : [0, 8]
    return notas(passos.map((passo) => ({ passo, midi: nota })), VOZ.ponte, compasso, GRADE)
  }
}

// A3: o órgão vira pad sustentado atrás da guitarra
function pad(indiceDaVoz) {
  return (compasso) => {
    const { secao, acorde } = COMPASSOS[compasso]
    if (secao !== 'A3') return null
    return notas([{ passo: 0, midi: VOICINGS[acorde][indiceDaVoz] }], VOZ.pad, compasso, GRADE)
  }
}

// --------------------------------------------------
// BAIXO DE ÓRGÃO: fundamental, quinta e aproximação; pedal no C
// --------------------------------------------------

const FUNDAMENTAL = Object.freeze({ Fm7: 29, Bb7: 34, 'C7#9': 36, Dbmaj7: 37, Gm7b5: 31 })

function dobrarNoGrave(midi) {
  let nota = midi
  while (nota > 45) nota -= 12
  while (nota < 28) nota += 12
  return nota
}

function baixo(compasso) {
  const { secao, indice, acorde } = COMPASSOS[compasso]
  const proximo = COMPASSOS[(compasso + 1) % COMPASSOS.length].acorde
  const raiz = FUNDAMENTAL[acorde]
  if (secao === 'C' && indice < 6) {
    // Pedal: o Fá grave, às vezes com a oitava
    return notas([{ passo: 0, midi: raiz }, ...(indice % 2 === 1 ? [{ passo: 6, midi: raiz + 12, atenuacao: 0.2 }] : [])], VOZ.baixo, compasso, GRADE)
  }
  const alvo = FUNDAMENTAL[proximo]
  const lista = [{ passo: 0, midi: raiz }, { passo: 6, midi: dobrarNoGrave(raiz + 7) }]
  if (temTung(compasso)) return notas(lista, VOZ.baixo, compasso, GRADE)
  if (alvo !== raiz) lista.push({ passo: 11, midi: dobrarNoGrave(alvo + (alvo > raiz ? -1 : 1)), atenuacao: 0.15 })
  else lista.push({ passo: 9, midi: dobrarNoGrave(raiz + 12), atenuacao: 0.2 })
  return notas(lista, VOZ.baixo, compasso, GRADE)
}

// --------------------------------------------------
// BATERIA
// --------------------------------------------------

// Tung-tung-tung (compassos dentro da seção): no A2 o fim é uma virada de caixa, no C não há
const TUNG = Object.freeze({ A1: [7], A2: [], B: [7], A3: [7], C: [], Tag: [1] })
const temTung = (compasso) => {
  const { secao, indice } = COMPASSOS[compasso]
  return TUNG[secao].includes(indice)
}

const RIDE = Object.freeze({ X: 12, x: 12.16, s: 12.45, B: 17.05 })
const PEDAL = Object.freeze({ c: 12.4 })
const ARO = Object.freeze({ X: 12.1 })
const CAIXA = Object.freeze({ X: 12, x: 12.3, g: 12.7, p: 12.55, q: 12.38 })
const CAIXA_CORPO = Object.freeze({ X: 12, x: 12.3, g: 12.92, p: 12.6, q: 12.45 })
const BUMBO = Object.freeze({ K: 12.5, k: 12.62, l: 19.2, m: 22.25, h: 26.3 })

// Intensidade da bateria por seção (atenuação somada; 0 = cheia)
const DINAMICA = Object.freeze({ A1: 0.1, A2: 0.04, B: 0.02, A3: 0, C: 0.25, Tag: 0 })

const GROOVES = Object.freeze({
  ride: {
    A1: (i, tung) => (tung ? 'x . s | X . s | x . s | . . .' : 'x . s | X . s | x . s | X . s'),
    A2: (i) => (i >= 4 ? 'x . s | X . s | x s s | X . s' : 'x . s | X . s | x . s | X . s'),
    B: (i, tung) => (tung ? 'x . . | B . . | x . . | . . .' : 'x . . | B . . | x . . | B . .'),
    A3: (i, tung) => (tung ? 'x . s | X . s | x . s | . . .' : 'x . s | X . s | x . s | X . s'),
    C: (i) => (i >= 6 ? 'x . s | X . s | x . s | X . s' : 'x . . | x . . | x . . | x . .'),
  },
  pedal: {
    A2: () => '. . . | c . . | . . . | c . .',
    B: () => '. . . | c . . | . . . | c . .',
    A3: (i, tung) => (tung ? '. . . | c . . | . . . | . . .' : '. . . | c . . | . . . | c . .'),
  },
  aro: {
    A1: (i, tung) => (tung ? null : '. . . | . . . | . . . | X . .'),
    A2: (i) => (i === 7 ? null : '. . . | . . . | . . . | X . .'),
    B: (i, tung) => (tung ? '. . . | X . . | . . . | . . .' : '. . . | X . . | . . . | X . .'),
    C: (i) => (i >= 6 ? '. . . | . . . | . . . | X . .' : null),
  },
  caixa: {
    A2: (i) => (i === 7 ? '. . . | X . . | p q x | p q X' : null), // virada para a ponte
    B: (i) => (i === 7 ? '. . . | . . . | p q X | . . .' : null),
    A3: (i, tung) => {
      if (tung) return '. . . | X . . | . . g | . . .'
      return i % 2 === 0 ? '. . . | X . . | . . g | X . .' : '. . g | X . . | . . . | X . g'
    },
    Tag: (i) => (i === 0 ? '. . . | X . . | p q X | . . .' : null),
  },
  bumbo: {
    A1: () => 'K . . | . . . | k . . | . . .',
    A2: (i) => (i % 2 === 0 ? 'K . . | . . k | k . . | . . .' : 'K . . | . . . | k . . | . . k'),
    B: () => 'K . . | . . k | . . . | . . .',
    A3: (i, tung) => (tung ? 'K . . | . . . | l . l | . . .' : 'K . . | . . k | K . . | . . k'),
    C: (i) => (i === 7 ? 'K . . | . . k | K . . | . . k' : i === 6 ? 'K . . | . . . | k . . | . . .' : null),
    Tag: (i) => (i === 0 ? 'K . . | . . . | K . . | . . .' : 'K . . | h . h | m . m | l l l'),
  },
})

function peca(nome, mapa) {
  return (compasso) => {
    const { secao, indice } = COMPASSOS[compasso]
    const groove = GROOVES[nome][secao]
    const texto = groove ? groove(indice, temTung(compasso)) : null
    return texto ? bateria(texto, comAtenuacao(mapa, DINAMICA[secao]), GRADE) : null
  }
}

const ALTURA_DO_TUNG = 65 // Fá4
const madeira = (compasso) => (temTung(compasso) ? tungTungTung(ALTURA_DO_TUNG, compasso, GRADE) : compassoVazio(GRADE))

// --------------------------------------------------
// CANAIS
// --------------------------------------------------

const CANAIS = [
  ['orgaoBaixo', 0, baixo],
  ['orgao', 0.14, orgaoHead],
  ['orgao', 0.2, orgaoQuarta],
  ['orgaoLeslieLento', 0.2, comping(0)],
  ['orgaoLeslieLento', 0.3, comping(1)],
  ['orgaoLeslieLento', 0.25, comping(2)],
  ['orgaoLeslieRapido', 0.22, ponte(0)],
  ['orgaoLeslieRapido', 0.3, ponte(1)],
  ['orgaoSustentado', 0.2, pad(0)],
  ['orgaoSustentado', 0.3, pad(1)],
  ['orgaoSustentado', 0.26, pad(2)],
  ['guitarraJazz', -0.28, guitarra],
  ['ride', 0.22, peca('ride', RIDE)],
  ['chimbal', -0.2, peca('pedal', PEDAL)],
  ['caixaAro', 0.04, peca('aro', ARO)],
  ['caixa', 0, peca('caixa', CAIXA)],
  ['caixaCorpo', 0, peca('caixa', CAIXA_CORPO)],
  ['bumbo', 0, peca('bumbo', BUMBO)],
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
  riff: [
    { instrumento: 'orgao', compassos: { 0: 65, 2: 58, 8: 65, 10: 58 } },
    { instrumento: 'guitarraJazz', compassos: { 8: 53, 10: 46, 24: 65, 26: 58 } },
  ],
  tung: { compassos: COMPASSOS.map((_, compasso) => compasso).filter(temTung) },
})
