// A Ronda: Piazza. Faixa do andar 3: a praça à noite (fachadas, pedras, luz azulada).
//
// ESTILO E ANDAMENTO
//   Soul-jazz de trio de órgão em Fá menor (groove dórico), ♩ = 112. Grade de 12 passos por
//   compasso (swing). bpm do ZzFXM = 112 × 3/4 = 84.
//
// MATERIAL (ver MELODIA: as figuras rítmicas e as notas próprias da Piazza)
//   Tema A (o head): frases em tercina de semínima no órgão (no A1 em quartas paralelas), em Fá
//   dórico, com saltos de quarta e sexta e notas ligadas por cima da barra.
//   Tema B: respostas da guitarra na ponte, também em tercinas, com sextas e a nona bemol.
//   A célula do Tung (Dó – Mi♭ – Fá – Mi♭ – Dó em Fá) aparece exata só no fim do C.
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
//   FORMA · FIGURAS (ritmos da melodia) · HEAD (tema A e variações por seção) · RESPOSTAS (tema B) ·
//   LUA (seção C) ·
//   GROOVES (bateria) · DINAMICA (intensidade por seção) · TUNG

import { aplicarFigura, bateria, celula, comAtenuacao, compassoVazio, criarGrade, expandirForma, linha, montarMusica, notas, secoesDaForma, tungTungTung, voz } from './partitura.js'

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
  tonica: 'F',
  modo: 'dorico',
  estrutura: 'A1 8 · A2 8 · B 8 · A3 8 · C 8 · Tag 2',
})

export const PIAZZA_SECOES = secoesDaForma(FORMA)
export const PIAZZA_HARMONIA = Object.freeze(COMPASSOS.map((c) => c.acorde))

const GRADE = criarGrade(PIAZZA_META.passosPorTempo, PIAZZA_META.temposPorCompasso)

export const PIAZZA_INSTRUMENTOS = Object.freeze([
  'orgaoBaixo', 'orgao', 'orgaoLongo', 'orgaoLeslieLento', 'orgaoLeslieRapido', 'orgaoSustentado', 'guitarraJazz', 'guitarraJazzLonga',
  'ride', 'chimbal', 'caixaAro', 'caixa', 'caixaCorpo', 'bumbo', 'madeira',
])

const VOZ = Object.freeze({
  baixo: voz('orgaoBaixo', 'baixo', { semente: 41 }),
  head: voz('orgao', 'riff', { semente: 42 }),
  headFrase: voz('orgao', 'melodia', { semente: 47 }),
  headLonga: voz('orgaoLongo', 'melodia', { semente: 50 }),
  headQuarta: voz('orgao', 'comping', { semente: 43 }),
  comping: voz('orgaoLeslieLento', 'comping', { semente: 44 }),
  ponte: voz('orgaoLeslieRapido', 'comping', { semente: 45 }),
  pad: voz('orgaoSustentado', 'comping', { semente: 48 }),
  guitarra: voz('guitarraJazz', 'melodia', { semente: 46 }),
  guitarraLonga: voz('guitarraJazzLonga', 'melodia', { semente: 51 }),
})

const cel = (tonica) => ({ celula: tonica })

// --------------------------------------------------
// MELODIA: o que distingue a Piazza dos outros andares
//   Figura rítmica: a tercina de semínima (três notas iguais em dois tempos, passos 0, 2 e 4 ou 6, 8
//   e 10), que cruza o swing e cai na tercina do meio, que nenhum outro andar usa; e a nota ligada
//   por cima da barra (entra no último passo e segura).
//   Notas: Fá dórico (com o Ré natural, a sexta maior), com saltos de quarta, quinta e sexta.
//   A célula do Tung aparece exata só no fim do C (sobre Si♭ e Dó), como lembrança antes da volta.
// --------------------------------------------------

// 'x' = nota curta, 'X' = nota longa (versão longa do órgão ou da guitarra)
const FIGURAS = Object.freeze({
  tercina: 'x . x | . x . | . . . | . . .',
  tercinaLonga: 'x . x | . X . | . . . | . . .',
  tercinaNoFim: '. . . | . . . | x . x | . x .',
  tercinaLiga: 'x . x | . x . | . . . | . . X',
  tercinaDupla: 'x . x | . x . | x . x | . x .',
  quarta: 'X . . | . . . | x . . | . . .',
  longa: 'X . . | . . . | . . . | . . .',
})

const f = (nome, ...notasDaFrase) => aplicarFigura(FIGURAS[nome], notasDaFrase)

// Head (tema A) do A1; o A2 troca a segunda frase e o A3 (na guitarra) troca o fim
const HEAD_A1 = Object.freeze({
  0: f('tercinaLonga', 'C5', 'F5', 'Eb5'), 1: f('tercinaNoFim', 'Ab4', 'C5', 'D5'),
  2: f('tercinaLiga', 'F5', 'Bb4', 'D5', 'Ab4'), 3: f('quarta', 'G4', 'C5'),
  4: f('tercina', 'Ab4', 'Eb5', 'C5'), 5: f('tercinaNoFim', 'F5', 'C5', 'G5'),
  6: f('tercinaLiga', 'D5', 'F5', 'Ab4', 'G4'), 7: f('longa', 'E5'),
})

const HEAD = Object.freeze({
  A1: HEAD_A1,
  A2: {
    ...HEAD_A1,
    4: f('tercina', 'C5', 'G5', 'F5'), 5: f('tercinaNoFim', 'Eb5', 'C5', 'Ab4'),
    6: f('tercinaLiga', 'Bb4', 'F5', 'D5', 'C5'), 7: f('quarta', 'G5', 'E5'),
  },
  A3: { ...HEAD_A1, 6: f('tercinaLiga', 'F5', 'C5', 'Ab4', 'Bb4'), 7: f('longa', 'C5') },
})

// C: pedaços da célula transformados em tercina de semínima; no fim, a célula exata (Si♭ e Dó)
const LUA = Object.freeze({
  1: f('tercina', 'C4', 'Eb4', 'F4'), 3: f('tercinaNoFim', 'Eb4', 'F4', 'C4'), 5: f('quarta', 'F4', 'C4'),
  6: cel(58), 7: cel(60),
})

// O órgão em dois canais: as notas curtas no orgao e as longas ('~') no orgaoLongo
function orgaoHead(articulacao) {
  return (compasso) => {
    const { secao, indice } = COMPASSOS[compasso]
    const entrada = secao === 'A1' || secao === 'A2' ? HEAD[secao][indice] : secao === 'C' ? LUA[indice] : null
    if (!entrada) return null
    if (typeof entrada !== 'string') return articulacao === 'curta' ? celula(entrada.celula, VOZ.head, compasso, GRADE) : null
    return linha(entrada, articulacao === 'longa' ? VOZ.headLonga : VOZ.headFrase, compasso, GRADE, 0, 0, articulacao)
  }
}

// Quartas paralelas nas duas primeiras frases do A1 (o som de trio de órgão), uma quarta abaixo
function orgaoQuarta(compasso) {
  const { secao, indice } = COMPASSOS[compasso]
  if (secao !== 'A1' || ![0, 2].includes(indice)) return null
  return linha(HEAD.A1[indice], VOZ.headQuarta, compasso, GRADE, -5)
}

// --------------------------------------------------
// GUITARRA: dobra o começo do head no A2 (uma oitava abaixo), responde na ponte, assume o head no A3
// --------------------------------------------------

// Ponte: respostas em tercina de semínima, com sextas e a nona bemol
const RESPOSTAS = Object.freeze({
  1: f('tercinaNoFim', 'F5', 'Db5', 'Ab4'),
  3: f('tercinaLonga', 'E5', 'G5', 'Db5'),
  5: f('tercinaNoFim', 'Bb4', 'F5', 'Db5'),
  7: f('quarta', 'G5', 'E5'),
})

function guitarra(articulacao) {
  return (compasso) => {
    const { secao, indice } = COMPASSOS[compasso]
    let texto = null
    let transpor = 0
    if (secao === 'A2' && (indice === 0 || indice === 2)) {
      texto = HEAD.A2[indice]
      transpor = -12
    } else if (secao === 'B') texto = RESPOSTAS[indice]
    else if (secao === 'A3') texto = HEAD.A3[indice]
    if (!texto) return null
    return linha(texto, articulacao === 'longa' ? VOZ.guitarraLonga : VOZ.guitarra, compasso, GRADE, transpor, 0, articulacao)
  }
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
  ['orgao', 0.14, orgaoHead('curta')],
  ['orgaoLongo', 0.14, orgaoHead('longa')],
  ['orgao', 0.2, orgaoQuarta],
  ['orgaoLeslieLento', 0.2, comping(0)],
  ['orgaoLeslieLento', 0.3, comping(1)],
  ['orgaoLeslieLento', 0.25, comping(2)],
  ['orgaoLeslieRapido', 0.22, ponte(0)],
  ['orgaoLeslieRapido', 0.3, ponte(1)],
  ['orgaoSustentado', 0.2, pad(0)],
  ['orgaoSustentado', 0.3, pad(1)],
  ['orgaoSustentado', 0.26, pad(2)],
  ['guitarraJazz', -0.28, guitarra('curta')],
  ['guitarraJazzLonga', -0.28, guitarra('longa')],
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
  riff: [{ instrumento: 'orgao', compassos: { 38: 58, 39: 60 } }],
  tung: { compassos: COMPASSOS.map((_, compasso) => compasso).filter(temTung) },
})

// Vozes de melodia (analiseMelodica.js): o órgão (curto e longo) e a guitarra (curta e longa)
export const PIAZZA_MELODIA = Object.freeze([[['orgao', 0], ['orgaoLongo', 0]], [['guitarraJazz', 0], ['guitarraJazzLonga', 0]]])
