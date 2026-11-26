// A Ronda: Piazza. Faixa do andar 3: a praça à noite (fachadas, pedras, luz azulada, um trio tocando
// no café).
//
// ESTILO E ANDAMENTO
//   Valsa de jazz modal em Si dórico, ♩ = 112, compasso de 3 tempos com swing. Grade de 9 passos por
//   compasso (3 tempos × 3 tercinas). bpm do ZzFXM = 112 × 3/4 = 84. É o único andar em 3.
//
// HARMONIA (o que é só da Piazza)
//   Si dórico: a cor é a sexta maior (Sol#), que aparece no E13 (o IV maior do dórico). Ritmo
//   harmônico lento no A (um acorde a cada 2 compassos) e o vamp Bm9 ↔ E13 em que só uma voz do acorde
//   anda (Lá → Sol#). Cadências modais, sem sensível: IV7 → i (E13 → Bm9) e v → i (F#m11 → Bm9). A
//   ponte é o único trecho funcional (ii – V – I em Ré maior, com Sol natural) e a dominante só
//   aparece suspensa (F#7sus4), sem resolver em F#7.
//
// MATERIAL (ver MELODIA)
//   Tema A (o head): frases em arco de 4 compassos no vibrafone, com a tercina de semínima (três notas
//   em dois tempos, atravessando a barra), notas ligadas por cima da barra e saltos de quarta e sexta;
//   4 compassos de pergunta, 4 de resposta e um respiro.
//   A hemíola (A2): o clarinete grave em mínimas que atravessam a barra (dois compassos de 3 viram
//   três de 2), com o baixo e a guitarra acentuando junto e o ride seguindo a valsa por cima.
//   Tema B (a ponte): o clarinete em colcheias com swing sobre o ii – V – I.
//   A célula do Tung (Fá# – Lá – Si – Lá – Fá# em Si) aparece exata só na Lua, no vibrafone. O
//   tung-tung-tung (madeira, em Si) fecha algumas seções no 3º tempo.
//
// FORMA (60 compassos de 3 tempos, ~96 s; editar em FORMA)
//   A1    (16)  o head no vibrafone; vassourinha, baixo "em um", guitarra no 2 e no 3
//   A2    (16)  a hemíola: o clarinete em mínimas, ride com baquetas, bumbo e guitarra a cada 2 tempos
//   Ponte  (8)  ii – V – I em Ré: o clarinete em colcheias, o baixo caminha em três, a caixa comenta
//   A3    (12)  o head volta encurtado (o ritmo harmônico dobra no meio) e resolve no Si
//   Lua    (6)  a lua na praça: pedal de Si com o sub, a célula no vibrafone, vassourinha bem baixa
//   Tag    (2)  virada de tons e o tung-tung-tung, de volta ao A1
//   Energia: A1 média-baixa → A2 média → Ponte alta → A3 média → Lua a mais baixa → Tag sobe → (A1)
//
// GRAVE E AGUDO
//   Baixo (contrabaixoCheio) entre Fá#2 e Ré3; o Si1 só no pedal da Lua, com o sub embaixo. Acordes de
//   três notas entre Ré3 e Mi4; melodia entre Si3 e Mi5 (o vibrafone e o clarinete grave).
//
// LOOP SEM EMENDA
//   O áudio começa no A1; o Tag (F#7sus4 com o tung-tung-tung) volta ao Bm9 do A1.
//
// ONDE AJUSTAR
//   FORMA · HEAD, HEMIOLA, PONTE e LUA (as frases) · BAIXO · VOICINGS e COMPING · GROOVES ·
//   DINAMICA · TUNG

import { bateria, celula, comAtenuacao, compassoVazio, criarGrade, expandirForma, linha, montarMusica, notas, secoesDaForma, tokens, tungTungTung, voz } from './partitura.js'
import { CELULA_DO_TUNG_TEMPOS, temposParaPassos } from './motivos.js'

const A = ['Bm9', 'Bm9', 'E13', 'E13', 'Bm9', 'Bm9', 'E13', 'E13', 'Dmaj9', 'Dmaj9', 'C#m7', 'C#m7', 'Gmaj7#11', 'Gmaj7#11', 'F#m11', 'F#m11']

const FORMA = Object.freeze([
  { nome: 'A1', papel: 'o head no vibrafone, vassourinha', harmonia: A },
  { nome: 'A2', papel: 'a hemíola: o clarinete em mínimas, ride', harmonia: A },
  { nome: 'Ponte', papel: 'ii – V – I em Ré, o clarinete em colcheias', harmonia: ['Em9', 'A13', 'Dmaj9', 'Gmaj7#11', 'Em9', 'A13', 'F#7sus4', 'F#7sus4'] },
  { nome: 'A3', papel: 'o head encurtado, resolve no Si', harmonia: ['Bm9', 'Bm9', 'E13', 'E13', 'Dmaj9', 'C#m7', 'Gmaj7#11', 'F#m11', 'Bm9', 'Bm9', 'E13', 'E13'] },
  { nome: 'Lua', papel: 'pedal de Si, a célula no vibrafone', harmonia: ['Bm(add9)', 'E/B', 'Bm(add9)', 'E/B', 'Gmaj7#11/B', 'F#7sus4'] },
  { nome: 'Tag', papel: 'virada de volta ao A1', harmonia: ['Gmaj7#11', 'F#7sus4'] },
])

const COMPASSOS = expandirForma(FORMA)

export const PIAZZA_META = Object.freeze({
  id: 'andar-piazza',
  titulo: 'A Ronda: Piazza',
  estilo: 'valsa de jazz modal',
  andamento: 112,
  passosPorTempo: 3,
  temposPorCompasso: 3,
  compassos: COMPASSOS.length,
  inicioDoLoop: 0,
  tonalidade: 'Si dórico',
  tonica: 'B',
  modo: 'dorico',
  estrutura: 'A1 16 · A2 16 · Ponte 8 · A3 12 · Lua 6 · Tag 2',
})

export const PIAZZA_SECOES = secoesDaForma(FORMA)
export const PIAZZA_HARMONIA = Object.freeze(COMPASSOS.map((c) => c.acorde))

const GRADE = criarGrade(PIAZZA_META.passosPorTempo, PIAZZA_META.temposPorCompasso)

export const PIAZZA_INSTRUMENTOS = Object.freeze([
  'contrabaixoCheio', 'sub', 'vibrafone', 'clarinete', 'clarineteLongo', 'guitarraJazz',
  'vassourinha', 'ride', 'chimbal', 'bumbo', 'caixaAro', 'caixa', 'caixaCorpo', 'madeira',
])

const VOZ = Object.freeze({
  baixo: voz('contrabaixoCheio', 'baixo', { semente: 41 }),
  sub: voz('sub', 'baixo', { semente: 42 }),
  vibrafone: voz('vibrafone', 'melodia', { semente: 43 }),
  celula: voz('vibrafone', 'riff', { semente: 44 }),
  clarinete: voz('clarinete', 'melodia', { semente: 45 }),
  clarineteLongo: voz('clarineteLongo', 'melodia', { semente: 46 }),
  guitarra: voz('guitarraJazz', 'comping', { semente: 47 }),
})

// --------------------------------------------------
// TUNG: compassos (dentro da seção) que fecham com o tung-tung-tung no 3º tempo
// --------------------------------------------------

const TUNG = Object.freeze({ A1: [7], A2: [15], Ponte: [], A3: [11], Lua: [5], Tag: [1] })
const temTung = (compasso) => {
  const { secao, indice } = COMPASSOS[compasso]
  return TUNG[secao].includes(indice)
}
// No compasso do tung-tung-tung, o 3º tempo (passos 6 a 8) fica livre para ele
const INICIO_DO_TUNG = 6
const semOFim = (passos, compasso) => (temTung(compasso) ? passos.map((valor, passo) => (passo >= INICIO_DO_TUNG ? 0 : valor)) : passos)

// --------------------------------------------------
// MELODIA: o que distingue a Piazza dos outros andares
//   Figura rítmica: a tercina de semínima (três notas em dois tempos, passos 0, 2 e 4), que cruza o
//   swing e cai na tercina do meio; a nota ligada por cima da barra (entra no último passo e segura,
//   '~'); a mínima da hemíola, que atravessa a barra.
//   Notas: Si dórico (com o Sol#, a sexta maior), com saltos de quarta, quinta e sexta.
// --------------------------------------------------

// Head (vibrafone): A1 e, encurtado, A3. Pergunta (4 compassos), resposta (4), desenvolvimento e
// cadência; cada frase de 4 compassos sobe por saltos e desce por graus, com respiro no fim.
const HEAD = Object.freeze({
  A1: [
    'F#4 . B4 | . D5 . | C#5 . .', '. . . | E4 . A4 | . G#4 .', 'B4 . E5 | . D5 . | C#5 . .', '. F#4 . | B4 . . | G#4 . .',
    'F#4 . B4 | . D5 . | C#5 . .', '. . . | F#4 . B4 | . A4 .', 'D4 . G#4 | . B4 . | C#5 . .', '. . . | . . . | . . .',
    '. B4 . | E4 . A4 | . . .', '. . . | F#4 . C#5 | . A4 .', 'G#4 . C#5 | . B4 . | G#4 . .', '. . . | . . . | . . F#4',
    '. . . | B4 . C#5 | . F#4 .', 'C#5 . . | . B4 . | . . .', 'A4 . E4 | . B4 . | A4 . .', '. . . | . . . | . . .',
  ],
  // A3: a pergunta de novo (com outro fim), o meio em metade do tempo e a resposta que pousa no Si
  A3: [
    'F#4 . B4 | . D5 . | C#5 . .', '. . . | E4 . A4 | . G#4 .', 'B4 . E5 | . D5 . | C#5 . .', '. . . | B4 . F#4 | . E4 .',
    '. B4 . | E4 . A4 | . C#5 .', 'G#4 . C#5 | . B4 . | G#4 . .', '. . . | B4 . C#5 | . F#4 .', 'A4 . E4 | . B4 . | A4 . .',
    'F#4 . B4 | . A4 . | F#4 . .', '. . . | D4 . E4 | . F#4 .', 'B3 . . | . . . | . . .', '. . . | . . . | . . .',
  ],
})

// A2: a hemíola no clarinete longo. Em cada par de compassos, mínimas nos passos 0 e 6 e no passo 3
// do compasso seguinte: três notas de dois tempos em dois compassos de três.
const HEMIOLA = Object.freeze([
  'F#4 . . | . . . | B4 . .', '. . . | E5 . . | . . .', 'C#5 . . | . . . | G#4 . .', '. . . | B4 . . | . . .',
  'A4 . . | . . . | D5 . .', '. . . | F#4 . . | . . .', 'G#4 . . | . . . | C#5 . .', '. . . | B4 . . | . . .',
  'F#4 . . | . . . | B4 . .', '. . . | E5 . . | . . .', 'B4 . . | . . . | G#4 . .', '. . . | E4 . . | . . .',
  'B4 . . | . . . | F#4 . .', '. . . | C#5 . . | . . .', 'E5 . . | . . . | A4 . .', '. . . | F#4 . . | . . .',
])

// Ponte: o clarinete em colcheias com swing (passos 0 e 2 de cada tempo) sobre o ii – V – I; sobe
// até o Mi5 no 5º compasso e fica no ar na dominante suspensa
const PONTE = Object.freeze([
  'B4 . A4 | G4 . F#4 | E4~ . .', '. . C#5 | . B4 . | A4 . F#4', '. E4 . | A4 . D5 | . C#5 .', 'B4~ . . | . F#4 . | C#5 . .',
  'E5~ . . | . . . | D5 . B4', 'C#5 . F#4 | . A4 . | E4~ . .', 'B4~ . . | . . . | C#5 . .', '. . . | . . . | . . .',
])

// Lua: a célula do Tung exata no vibrafone (sobre o Si) e a sexta dórica respondendo
const CELULA_NA_LUA = Object.freeze({ 0: 59, 2: 59 })
const LUA = Object.freeze({ 1: '. G#4 . | . . . | . . .', 3: '. G#4 . | . . . | B4 . .', 4: 'D5 . . | C#5 . . | . . .' })

function vibrafone(compasso) {
  const { secao, indice } = COMPASSOS[compasso]
  if (secao === 'Lua' && indice in CELULA_NA_LUA) return celula(CELULA_NA_LUA[indice], VOZ.celula, compasso, GRADE)
  const texto = secao === 'Lua' ? LUA[indice] : HEAD[secao]?.[indice]
  if (!texto) return null
  return semOFim(linha(texto, VOZ.vibrafone, compasso, GRADE), compasso)
}

// O clarinete: as mínimas da hemíola (longo) no A2 e a ponte (curto, com as notas '~' no longo)
function clarinete(articulacao) {
  return (compasso) => {
    const { secao, indice } = COMPASSOS[compasso]
    if (secao === 'A2') {
      if (articulacao !== 'longa') return null
      return semOFim(linha(HEMIOLA[indice], VOZ.clarineteLongo, compasso, GRADE), compasso)
    }
    if (secao !== 'Ponte' || !PONTE[indice]) return null
    return linha(PONTE[indice], articulacao === 'longa' ? VOZ.clarineteLongo : VOZ.clarinete, compasso, GRADE, 0, 0, articulacao)
  }
}

// --------------------------------------------------
// GUITARRA: acordes de três notas (Ré3 a Fá#4), no 2 e no 3 da valsa, a cada 2 tempos na hemíola e
// no contratempo na ponte. No vamp Bm9 → E13 só uma voz anda (Lá → Sol#), embaixo do Dó#–Ré parado.
// --------------------------------------------------

const VOICINGS = Object.freeze({
  Bm9: [57, 61, 62], E13: [56, 61, 62], Dmaj9: [54, 57, 61], 'C#m7': [52, 56, 59], 'Gmaj7#11': [54, 59, 61], 'F#m11': [52, 57, 59],
  Em9: [55, 59, 62], A13: [55, 61, 64], 'F#7sus4': [52, 59, 61],
  'Bm(add9)': [50, 54, 61], 'E/B': [52, 56, 59], 'Gmaj7#11/B': [54, 59, 61],
})

function ritmoDaGuitarra(secao, indice) {
  if (secao === 'A1') return indice % 4 === 3 ? [3] : [3, 6]
  if (secao === 'A2') return indice % 2 === 0 ? [0, 6] : [3]
  if (secao === 'Ponte') return indice === 7 ? [0] : [2, 5]
  if (secao === 'A3') return indice % 2 === 0 ? [3, 6] : [3, 8]
  if (secao === 'Lua') return indice % 2 === 0 ? [0] : null
  if (secao === 'Tag') return indice === 0 ? [0, 6] : [0]
  return null
}

// Passos em que a melodia (vibrafone ou clarinete) ataca: a guitarra deixa esses passos livres
function passosDaMelodia(secao, indice) {
  const texto = secao === 'A2' ? HEMIOLA[indice] : secao === 'Ponte' ? PONTE[indice] : secao === 'Lua' ? LUA[indice] : HEAD[secao]?.[indice]
  const ocupados = new Set()
  if (texto) tokens(texto).forEach((token, passo) => { if (token !== '.') ocupados.add(passo) })
  if (secao === 'Lua' && indice in CELULA_NA_LUA) temposParaPassos(CELULA_DO_TUNG_TEMPOS, GRADE.passosPorTempo).forEach((passo) => ocupados.add(passo))
  return ocupados
}

function guitarra(indiceDaVoz) {
  return (compasso) => {
    const { secao, indice, acorde } = COMPASSOS[compasso]
    const ritmo = ritmoDaGuitarra(secao, indice)
    if (!ritmo) return null
    const extra = secao === 'Lua' ? 0.15 : 0
    const melodia = passosDaMelodia(secao, indice)
    const lista = ritmo.filter((passo) => (!temTung(compasso) || passo < INICIO_DO_TUNG) && !melodia.has(passo))
    return notas(lista.map((passo) => ({ passo, midi: VOICINGS[acorde][indiceDaVoz], atenuacao: extra })), VOZ.guitarra, compasso, GRADE)
  }
}

// --------------------------------------------------
// BAIXO: "em um" no A1 (a fundamental no 1, a quinta no 3, a aproximação no último passo), mínimas da
// hemíola no A2, caminhando em três na ponte, pedal de Si na Lua
// --------------------------------------------------

const BAIXO = Object.freeze({
  A1: [
    'B2 . . | . . . | F#2 . .', 'B2 . . | . . . | A2 . F2', 'E2 . . | . . . | B2 . .', 'E2 . . | . . . | G#2 . A#2',
    'B2 . . | . . . | F#2 . .', 'B2 . . | . . . | A2 . F2', 'E2 . . | . . . | B2 . .', 'E2 . . | . . . | . . .',
    'D3 . . | . . . | A2 . .', 'D3 . . | . . . | F#2 . D3', 'C#3 . . | . . . | G#2 . .', 'C#3 . . | . . . | G#2 . F#2',
    'G2 . . | . . . | D3 . .', 'G2 . . | . . . | B2 . G2', 'F#2 . . | . . . | C#3 . .', 'F#2 . . | . . . | E2 . A#2',
  ],
  A2: [
    'B2 . . | . . . | F#2 . .', '. . . | A2 . . | . . .', 'E2 . . | . . . | B2 . .', '. . . | D3 . . | . . .',
    'B2 . . | . . . | D3 . .', '. . . | C#3 . . | . . .', 'E2 . . | . . . | G#2 . .', '. . . | B2 . . | . . .',
    'D3 . . | . . . | A2 . .', '. . . | F#2 . . | . . .', 'C#3 . . | . . . | G#2 . .', '. . . | E2 . . | . . .',
    'G2 . . | . . . | D3 . .', '. . . | B2 . . | . . .', 'F#2 . . | . . . | C#3 . .', '. . . | A2 . . | . . .',
  ],
  Ponte: [
    'E2 . . | G2 . . | B2 . .', 'A2 . . | C#3 . . | E3 . D#3', 'D3 . . | C#3 . . | A2 . .', 'G2 . . | B2 . . | D3 . F2',
    'E2 . . | F#2 . . | G2 . .', 'A2 . . | G2 . . | E2 . F2', 'F#2 . . | C#3 . . | B2 . .', 'F#2 . . | . . . | C#3 . A#2',
  ],
  A3: [
    'B2 . . | . . . | F#2 . .', 'B2 . . | D3 . . | F#2 . F2', 'E2 . . | . . . | B2 . .', 'E2 . . | G#2 . . | B2 . C#3',
    'D3 . . | . . . | A2 . D3', 'C#3 . . | . . . | G#2 . F#2', 'G2 . . | . . . | D3 . G2', 'F#2 . . | . . . | C#3 . A#2',
    'B2 . . | . . . | F#2 . .', 'B2 . . | . . . | A2 . F2', 'E2 . . | . . . | B2 . .', 'E2 . . | . . . | . . .',
  ],
  Lua: ['B1 . . | . . . | . . .', 'B1 . . | . . . | F#2 . .', 'B1 . . | . . . | . . .', 'B1 . . | . . . | F#2 . .', 'B1 . . | . . . | . . .', 'B1 . . | . . . | . . .'],
  Tag: ['G2 . . | . . . | D3 . .', 'F#2 . . | . . . | . . .'],
})

function baixo(compasso) {
  const { secao, indice } = COMPASSOS[compasso]
  return semOFim(linha(BAIXO[secao][indice], VOZ.baixo, compasso, GRADE), compasso)
}

// Sub: o Si1 do pedal da Lua, no 1 de um compasso sim, outro não (peso sem virar um zumbido)
const sub = (compasso) => {
  const { secao, indice } = COMPASSOS[compasso]
  return secao === 'Lua' && indice % 2 === 0 ? notas([{ passo: 0, midi: 35, atenuacao: 0.3 }], VOZ.sub, compasso, GRADE) : null
}

// --------------------------------------------------
// BATERIA: a valsa de vassourinha, o ride da valsa por cima da hemíola, a caixa comentando na ponte
// --------------------------------------------------

const VASSOURINHA = Object.freeze({ S: 12.29, s: 12.5, t: 12.7 })
const RIDE = Object.freeze({ X: 12.33, x: 12.47, s: 12.68 })
const PEDAL = Object.freeze({ c: 12.58 })
const ARO = Object.freeze({ X: 12.15 })
const CAIXA = Object.freeze({ X: 12.1, x: 12.35, g: 12.75, p: 12.55, q: 12.4 })
const CAIXA_CORPO = Object.freeze({ X: 12, x: 12.3, g: 12.92, p: 12.6, q: 12.45 })
const BUMBO = Object.freeze({ K: 12.5, k: 12.62, l: 19.2, m: 22.25, h: 26.3 })

const GROOVES = Object.freeze({
  vassourinha: {
    // A valsa: varrida no 1, toques no 2 (com o swing) e no 3
    A1: (i, tung) => {
      if (tung) return 'S . . | s . t | . . .'
      return i === 15 ? 'S t t | S t t | S t S' : 'S . . | s . t | s . .' // virada de vassourinha para o A2
    },
    A3: (i, tung) => (tung ? 'S . . | s . t | . . .' : 'S . . | s . t | s . t'),
    Lua: (i, tung) => (tung ? 'S . . | . . . | . . .' : 'S . . | . . . | s . .'),
  },
  ride: {
    // "1 – 2-a – 3": o ride segue a valsa enquanto o resto faz a hemíola
    A2: (i, tung) => (tung ? 'X . . | x . s | . . .' : 'X . . | x . s | x . .'),
    Ponte: (i) => (i === 7 ? 'X . . | x . . | . . .' : 'X . . | x . s | x . s'),
  },
  pedal: {
    A1: (i, tung) => (tung ? '. . . | c . . | . . .' : '. . . | c . . | c . .'),
    A2: () => '. . . | c . . | . . .',
    Ponte: () => '. . . | c . . | c . .',
    A3: (i, tung) => (tung ? '. . . | c . . | . . .' : '. . . | c . . | c . .'),
  },
  aro: {
    A1: (i, tung) => (tung || i === 15 ? null : '. . . | . . . | X . .'),
    A3: (i, tung) => (tung ? null : '. . . | X . . | . . .'),
  },
  caixa: {
    A2: (i) => (i === 15 ? null : i % 2 === 0 ? '. . . | . . . | . . g' : '. . g | . . . | . . .'),
    Ponte: (i) => (i === 7 ? '. . . | . . . | p q X' : '. . g | . . g | . . .'), // virada para o A3
    A3: (i, tung) => (tung || i % 2 === 1 ? null : '. . . | . . g | . . .'),
    Tag: (i) => (i === 0 ? '. . . | . . . | p q X' : null),
  },
  bumbo: {
    A1: () => 'K . . | . . . | . . .',
    // A2: o bumbo marca a hemíola (a cada 2 tempos); no fim, tons para a ponte
    A2: (i) => (i === 15 ? 'K . . | h h m | . . .' : i % 2 === 0 ? 'K . . | . . . | k . .' : '. . . | k . . | . . .'),
    Ponte: (i) => (i === 7 ? 'K . . | . . . | . . .' : 'K . . | . . k | . . .'),
    A3: (i, tung) => (tung ? 'K . . | . . . | . . .' : 'K . . | . . . | . . k'),
    Tag: (i) => (i === 0 ? 'K . . | . . . | K . .' : 'K . . | h m l | . . .'),
  },
})

// Intensidade da bateria por seção (atenuação somada; 0 = cheia)
const DINAMICA = Object.freeze({ A1: 0.1, A2: 0.04, Ponte: 0.02, A3: 0.04, Lua: 0.25, Tag: 0 })

function peca(nome, mapa) {
  return (compasso) => {
    const { secao, indice } = COMPASSOS[compasso]
    const groove = GROOVES[nome][secao]
    const texto = groove ? groove(indice, temTung(compasso)) : null
    return texto ? bateria(texto, comAtenuacao(mapa, DINAMICA[secao]), GRADE) : null
  }
}

const ALTURA_DO_TUNG = 71 // Si4
const madeira = (compasso) => (temTung(compasso) ? tungTungTung(ALTURA_DO_TUNG, compasso, GRADE) : compassoVazio(GRADE))

// --------------------------------------------------
// CANAIS
// --------------------------------------------------

const CANAIS = [
  ['contrabaixoCheio', 0, baixo],
  ['sub', 0, sub],
  ['vibrafone', 0.14, vibrafone],
  ['clarinete', -0.16, clarinete('curta')],
  ['clarineteLongo', -0.16, clarinete('longa')],
  ['guitarraJazz', -0.26, guitarra(0)],
  ['guitarraJazz', -0.3, guitarra(1)],
  ['guitarraJazz', -0.22, guitarra(2)],
  ['vassourinha', 0.06, peca('vassourinha', VASSOURINHA)],
  ['ride', 0.22, peca('ride', RIDE)],
  ['chimbal', -0.2, peca('pedal', PEDAL)],
  ['bumbo', 0, peca('bumbo', BUMBO)],
  ['caixaAro', 0.04, peca('aro', ARO)],
  ['caixa', 0, peca('caixa', CAIXA)],
  ['caixaCorpo', 0, peca('caixa', CAIXA_CORPO)],
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

const inicioDaLua = PIAZZA_SECOES.find((secao) => secao.nome === 'Lua').inicio

export const PIAZZA_MOTIVO = Object.freeze({
  riff: [{ instrumento: 'vibrafone', compassos: Object.fromEntries(Object.entries(CELULA_NA_LUA).map(([indice, tonica]) => [inicioDaLua + Number(indice), tonica])) }],
  tung: { compassos: COMPASSOS.map((_, compasso) => compasso).filter(temTung) },
})

// Vozes de melodia (analiseMelodica.js): o vibrafone e o clarinete (curto e longo)
export const PIAZZA_MELODIA = Object.freeze([[['vibrafone', 0]], [['clarinete', 0], ['clarineteLongo', 0]]])
