// A Ronda: Cantina. Faixa do andar 1 e tema da gameplay (é a faixa que todo jogador ouve em toda run).
//
// ESTILO E ANDAMENTO
//   Blues shuffle em Lá menor, ♩ = 88. Grade de 12 passos por compasso (colcheias em tercina; o
//   swing cai nos passos 0 e 2 de cada tempo). bpm do ZzFXM = 88 × 3/4 = 66.
//
// MATERIAL
//   Tema A: a célula do Tung (5 – ♭7 – 1' – ♭7 – 5, motivos.js) como riff, com respostas curtas.
//   Tema B: a mesma célula em valores longos (cada nota dura um tempo e meio), na guitarra, sobre
//   uma harmonia nova. O tung-tung-tung (madeira, em Lá) fecha algumas frases, nunca todas.
//
// FORMA (36 compassos, ~98 s; editar em FORMA)
//   A1 (12)  exposição: vassourinha; o riff no baixo e no Rhodes (sobre Lá, Ré e, no fim, Mi → Ré)
//   A2 (12)  variação: entram as baquetas; a guitarra pega o riff uma oitava acima e responde; o baixo
//            caminha; o riff sobre Mi → Ré termina com outra nota; virada de tons no fim
//   B  (8)   segundo tema: Fmaj7 – E7#9 – Dm7 – Am7, meio-tempo (aro no 3, ride em semínimas), o
//            Rhodes em acordes longos e a guitarra no tema B; na segunda metade a caixa entra no 3
//            e uma segunda guitarra dobra o tema uma oitava abaixo: o ponto mais alto da faixa
//   R  (4)   respiro: só baixo, vassourinha e o tung-tung-tung respondendo fragmentos da célula no
//            Rhodes; a menor energia da faixa, antes de voltar ao A1
//   Energia: A1 média-baixa → A2 média-alta → B alta → R baixa → (A1)
//
// ESPAÇO PARA OS EFEITOS SONOROS (100 a 650 Hz)
//   O riff tem cinco notas e aparece em poucos compassos; as respostas e o tema B ficam quase todos
//   acima de 587 Hz; o Rhodes acompanha com toques curtos.
//
// LOOP SEM EMENDA
//   O áudio começa no A1. O fim do respiro (tung-tung-tung sobre E7#9) leva ao riff do A1 como uma
//   virada V → I; a cauda das notas do fim volta para o começo (loop contínuo do ZzFXM).
//
// ONDE AJUSTAR
//   FORMA (seções e harmonia) · BAIXO (linhas por seção) · RHODES e GUITARRA (temas e respostas) ·
//   GROOVES (bateria por seção) · TUNG (onde entra o tung-tung-tung)

import { bateria, celula, compassoVazio, criarGrade, expandirForma, linha, montarMusica, notas, secoesDaForma, tungTungTung, voz } from './partitura.js'

const BLUES = ['Am7', 'Dm7', 'Am7', 'Am7', 'Dm7', 'Dm7', 'Am7', 'Am7', 'E7#9', 'Dm7', 'Am7', 'E7#9']

const FORMA = Object.freeze([
  { nome: 'A1', papel: 'exposição: vassourinha e o riff no baixo e no Rhodes', harmonia: BLUES },
  { nome: 'A2', papel: 'variação: baquetas, a guitarra pega o riff e responde', harmonia: BLUES },
  { nome: 'B', papel: 'segundo tema: a célula em valores longos, meio-tempo', harmonia: ['Fmaj7', 'E7#9', 'Dm7', 'Am7', 'Fmaj7', 'E7#9', 'Dm7', 'E7#9'] },
  { nome: 'R', papel: 'respiro: baixo, vassourinha e o tung-tung-tung', harmonia: ['Am7', 'Am7', 'Dm7', 'E7#9'] },
])

const COMPASSOS = expandirForma(FORMA)

export const CANTINA_META = Object.freeze({
  id: 'andar-cantina',
  titulo: 'A Ronda: Cantina',
  estilo: 'blues shuffle em menor',
  andamento: 88,
  passosPorTempo: 3,
  temposPorCompasso: 4,
  compassos: COMPASSOS.length,
  inicioDoLoop: 0,
  tonalidade: 'Lá menor',
  estrutura: 'A1 12 · A2 12 · B 8 · Respiro 4',
})

export const CANTINA_SECOES = secoesDaForma(FORMA)
export const CANTINA_HARMONIA = Object.freeze(COMPASSOS.map((c) => c.acorde))

const GRADE = criarGrade(CANTINA_META.passosPorTempo, CANTINA_META.temposPorCompasso)

export const CANTINA_INSTRUMENTOS = Object.freeze([
  'contrabaixo', 'rhodes', 'guitarraJazz', 'vassourinha', 'bumbo', 'chimbal', 'ride', 'caixa', 'caixaCorpo', 'caixaAro', 'madeira',
])

const VOZ = Object.freeze({
  baixo: voz('contrabaixo', 'baixo', { semente: 1 }),
  rhodes: voz('rhodes', 'riff', { semente: 2 }),
  rhodesResposta: voz('rhodes', 'melodia', { semente: 7 }),
  guitarra: voz('guitarraJazz', 'melodia', { semente: 3 }),
  guitarraRiff: voz('guitarraJazz', 'riff', { semente: 8 }),
  guitarraDobra: voz('guitarraJazz', 'melodia', { semente: 9 }),
  compingGrave: voz('rhodes', 'comping', { semente: 4 }),
  compingAgudo: voz('rhodes', 'comping', { semente: 5 }),
})

// --------------------------------------------------
// BAIXO: célula (tônica em MIDI), linha escrita, ou a célula com outro fim
// --------------------------------------------------

const cel = (tonica, aproximacao) => ({ celula: tonica, aproximacao })

const BAIXO = Object.freeze({
  A1: [
    cel(33, 37), 'D2 . . | . . . | A2 . . | . . D#2', 'A1 . . | . . . | E2 . . | . . .', 'A1 . . | . . . | C2 . . | . . .',
    cel(38, 37), 'D2 . . | . . . | F2 . . | . . G#1', 'A1 . . | . . . | E2 . . | . . .', 'A1 . . | . . . | E2 . . | . . C2',
    cel(28, 34), cel(26, 32), 'A1 . . | . . . | E2 . . | . . F2', 'E2 . . | . . . | B1 . . | . . .',
  ],
  // A2: o baixo caminha; no compasso 9 a célula sobre Ré termina subindo para o Mi (outro fim)
  A2: [
    'A1 . . | C2 . . | E2 . . | G2 . C#2', 'D2 . . | F2 . . | A2 . . | C3 . G#1', 'A1 . . | E2 . . | G2 . . | E2 . .', 'A1 . . | C2 . . | E2 . . | G2 . C#2',
    'D2 . . | F2 . . | A2 . . | F2 . .', 'D2 . . | A1 . . | C2 . . | D2 . G#1', 'A1 . . | C2 . . | E2 . . | A2 . .', 'A1 . . | E2 . . | C2 . . | . . .',
    cel(28, 34), 'A1 . C2 | D2 . C2 | E2 . . | . . G#1', 'A1 . . | C2 . . | E2 . . | G2 . F2', 'E2 . . | G#2 . . | B1 . . | . . .',
  ],
  // B: meio-tempo, notas longas
  B: [
    'F2 . . | . . . | C2 . . | . . .', 'E2 . . | . . . | B1 . . | . . .', 'D2 . . | . . . | A1 . . | . . .', 'A1 . . | . . . | E2 . . | . . .',
    'F2 . . | . . . | A2 . . | . . .', 'E2 . . | . . . | G#2 . . | . . .', 'D2 . . | . . . | F2 . . | . . .', 'E2 . . | . . . | B1 . . | . . .',
  ],
  R: ['A1 . . | . . . | . . . | . . .', 'A1 . . | . . . | E2 . . | . . .', 'D2 . . | . . . | . . . | . . .', 'E2 . . | . . . | B1 . . | . . .'],
})

function tocar(entrada, v, compasso) {
  if (!entrada) return null
  if (typeof entrada === 'string') return linha(entrada, v, compasso, GRADE)
  const mais = entrada.aproximacao ? [{ passo: GRADE.passos - 1, midi: entrada.aproximacao, atenuacao: 0.2 }] : []
  return celula(entrada.celula, v, compasso, GRADE, { mais })
}

const baixo = (compasso) => {
  const { secao, indice } = COMPASSOS[compasso]
  return tocar(BAIXO[secao][indice], VOZ.baixo, compasso)
}

// --------------------------------------------------
// RHODES: o riff (A1), a célula em sequência (A2), fragmentos (R) e respostas
// --------------------------------------------------

const RHODES = Object.freeze({
  A1: { 0: cel(45), 1: '. . . | . . D5 | C5 . . | A4 . .', 4: cel(50), 5: '. . . | . . F5 | E5 . . | C5 . .', 8: cel(40), 9: cel(38), 10: '. . E5 | . . . | C5 . . | . . .' },
  A2: { 8: cel(40), 9: 'A2 . C3 | D3 . C3 | E3 . . | . . .' },
  // Respiro: só o começo da célula (Mi – Sol – Lá; Lá – Dó – Ré), e o tung-tung-tung responde
  R: { 0: 'E4 . . | . . G4 | A4 . . | . . .', 2: 'A4 . . | . . C5 | D5 . . | . . .' },
})

const rhodes = (compasso) => {
  const { secao, indice } = COMPASSOS[compasso]
  const entrada = RHODES[secao]?.[indice]
  if (!entrada) return null
  const v = typeof entrada === 'string' && secao !== 'A2' ? VOZ.rhodesResposta : VOZ.rhodes
  return tocar(entrada, v, compasso)
}

// Acordes de duas vozes (terça e sétima): toques curtos no A2, acordes longos no B
const VOICINGS = Object.freeze({
  Am7: [55, 60], Dm7: [53, 60], 'E7#9': [56, 62], Fmaj7: [57, 64],
})

function comping(indiceDaVoz, v) {
  return (compasso) => {
    const { secao, indice, acorde } = COMPASSOS[compasso]
    const nota = VOICINGS[acorde][indiceDaVoz]
    if (secao === 'B') return notas([0, 6].map((passo) => ({ passo, midi: nota })), v, compasso, GRADE)
    if (secao !== 'A2' || [0, 4, 8, 9].includes(indice)) return null
    const passos = TUNG.A2.includes(indice) ? [0] : [0, 8]
    return notas(passos.map((passo) => ({ passo, midi: nota })), v, compasso, GRADE)
  }
}

// --------------------------------------------------
// GUITARRA: o riff uma oitava acima e respostas (A2); o tema B (a célula em valores longos)
// --------------------------------------------------

const GUITARRA = Object.freeze({
  A2: {
    0: cel(57), 1: '. . F5 | . . E5 | D5 . . | . . .', 3: '. . E5 | . . C5 | A4 . . | . . .',
    4: cel(62), 5: '. . A5 | . . G5 | F5 . . | D5 . .', 7: '. . E5 | . . Eb5 | D5 . . | . . .',
    10: '. . G5 | A5! . . | E5 . . | . . .', 11: '. . G#5 | . . F5 | D5 . . | . . .',
  },
  // Tema B: Mi . Sol | Lá . . Sol (a célula alongada); na segunda vez o fim muda (Sol# em vez de Sol)
  B: {
    0: 'E5 . . | . . . | G5 . . | . . .', 1: 'A5 . . | . . . | . . . | G5 . .',
    2: 'F5 . . | . . E5 | D5 . . | . . .', 3: 'E5 . . | . . . | . . . | . . .',
    4: 'E5 . . | . . . | G5 . . | . . .', 5: 'A5 . . | . . . | G#5 . . | . . .',
    6: 'F5 . . | . . E5 | D5 . . | . . C5', 7: 'B4 . . | . . . | G#4 . . | . . .',
  },
})

const guitarra = (compasso) => {
  const { secao, indice } = COMPASSOS[compasso]
  const entrada = GUITARRA[secao]?.[indice]
  if (!entrada) return null
  return tocar(entrada, typeof entrada === 'string' ? VOZ.guitarra : VOZ.guitarraRiff, compasso)
}

// Na segunda metade do B uma segunda guitarra dobra o tema uma oitava abaixo (mais corpo no clímax)
const guitarraDobrada = (compasso) => {
  const { secao, indice } = COMPASSOS[compasso]
  if (secao !== 'B' || indice < 4) return null
  return linha(GUITARRA.B[indice], VOZ.guitarraDobra, compasso, GRADE, -12)
}

// --------------------------------------------------
// BATERIA: um groove por seção, com variação a cada frase e viradas nas passagens
// --------------------------------------------------

// Compassos (dentro da seção) em que o tung-tung-tung fecha a frase; o 4º tempo fica livre para ele
const TUNG = Object.freeze({ A1: [3, 11], A2: [7, 11], B: [7], R: [1, 3] })
const temTung = (compasso) => {
  const { secao, indice } = COMPASSOS[compasso]
  return TUNG[secao].includes(indice)
}

const VASSOURINHA = Object.freeze({ S: 12, s: 12.3, t: 12.58 })
const BUMBO_LEVE = Object.freeze({ K: 12.72, k: 12.8 })
const BUMBO = Object.freeze({ K: 12.42, k: 12.55, l: 19.2, m: 22.25, h: 26.3 })
const RIDE = Object.freeze({ X: 12.05, x: 12.25, s: 12.55, B: 17.1 })
const CAIXA = Object.freeze({ X: 12, x: 12.3, g: 12.7, p: 12.55, q: 12.38 })
const CAIXA_CORPO = Object.freeze({ X: 12, x: 12.3, g: 12.92, p: 12.6, q: 12.45 })
const ARO = Object.freeze({ X: 12.1 })
const PEDAL = Object.freeze({ c: 12.4 })

// Cada groove: (indice, tung) → linha do compasso ou null
const GROOVES = Object.freeze({
  vassourinha: {
    A1: (i, tung) => {
      if (tung) return 's . t | S . t | s . t | . . .'
      if (i === 7) return 's . t | S . t | S t t | S t S' // virada de vassourinha antes do Mi7
      return i >= 4 && i < 8 ? 's t t | S . t | s . t | S t t' : 's . t | S . t | s . t | S . t'
    },
    R: (i, tung) => (tung ? '. . . | S . . | . . . | . . .' : '. . . | S . . | . . . | S . .'),
  },
  bumbo: {
    A1: () => ({ linha: 'K . . | . . . | k . . | . . .', mapa: BUMBO_LEVE }),
    A2: (i) => {
      if (i === 11) return 'K . . | . . . | h m l | . . .' // virada de tons antes do B
      if (i >= 8) return 'K . . | . . . | K . . | . . .'
      return i % 2 === 0 ? 'K . . | . . . | k . . | . . k' : 'K . . | . . k | k . . | . . .'
    },
    B: (i) => {
      if (i === 7) return 'K . . | h . h | m . m | l l l' // tons dobrando o tung-tung-tung
      return i < 4 ? 'K . . | . . . | . . . | . . .' : 'K . . | . . k | . . . | . . k'
    },
  },
  ride: {
    A2: (i, tung) => {
      if (i === 11) return null
      if (tung) return 'x . s | X . s | x . s | . . .'
      if (i >= 8) return 'x . . | B . . | x . . | B . .' // campana no 2 e no 4
      return i >= 4 ? 'x . s | X . s | x s s | X . s' : 'x . s | X . s | x . s | X . s'
    },
    B: (i) => (i < 4 ? 'x . . | x . . | x . . | x . .' : 'x . s | x . . | x . s | x . .'),
  },
  caixa: {
    A2: (i, tung) => {
      if (i === 11) return '. . . | X . . | . . . | . . .'
      if (tung) return '. . . | X . . | . . g | . . .'
      if (i >= 8) return '. . . | X . . | . . . | X . .'
      if (i >= 4) return '. . g | X . g | . . g | X . .'
      return i % 2 === 0 ? '. . . | X . . | . . g | X . .' : '. . g | X . . | . . . | X . g'
    },
    // Meio-tempo: primeiro só o aro no 3; na segunda metade a caixa de verdade (o clímax da faixa)
    B: (i) => {
      if (i === 7) return '. . . | . . . | p q X | . . .'
      return i >= 4 ? '. . . | . . . | X . . | . . g' : null
    },
  },
  aro: {
    B: (i) => (i < 4 ? '. . . | . . . | X . . | . . .' : null),
  },
  pedal: {
    A1: (i, tung) => (tung ? '. . . | c . . | . . . | . . .' : '. . . | c . . | . . . | c . .'),
    A2: (i, tung) => (tung || i === 11 ? '. . . | c . . | . . . | . . .' : '. . . | c . . | . . . | c . .'),
    B: () => '. . . | c . . | . . . | c . .',
  },
})

function peca(nome, mapa) {
  return (compasso) => {
    const { secao, indice } = COMPASSOS[compasso]
    const groove = GROOVES[nome][secao]
    if (!groove) return null
    const resultado = groove(indice, temTung(compasso))
    if (!resultado) return null
    if (typeof resultado === 'string') return bateria(resultado, mapa, GRADE)
    return bateria(resultado.linha, resultado.mapa, GRADE)
  }
}

const ALTURA_DO_TUNG = 69 // Lá4
const madeira = (compasso) => (temTung(compasso) ? tungTungTung(ALTURA_DO_TUNG, compasso, GRADE) : compassoVazio(GRADE))

// --------------------------------------------------
// CANAIS: [instrumento, panorama, gerador de passos]
// --------------------------------------------------

const CANAIS = [
  ['contrabaixo', 0, baixo],
  ['rhodes', 0.12, rhodes],
  ['guitarraJazz', -0.28, guitarra],
  ['guitarraJazz', -0.16, guitarraDobrada],
  ['rhodes', 0.22, comping(0, VOZ.compingGrave)],
  ['rhodes', 0.3, comping(1, VOZ.compingAgudo)],
  ['vassourinha', 0.06, peca('vassourinha', VASSOURINHA)],
  ['bumbo', 0, peca('bumbo', BUMBO)],
  ['chimbal', -0.2, peca('pedal', PEDAL)],
  ['ride', 0.22, peca('ride', RIDE)],
  ['caixa', 0, peca('caixa', CAIXA)],
  ['caixaCorpo', 0, peca('caixa', CAIXA_CORPO)],
  ['caixaAro', 0.04, peca('aro', ARO)],
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

// Onde estão a célula (exata) e o tung-tung-tung (os testes conferem)
export const CANTINA_MOTIVO = Object.freeze({
  riff: [
    { instrumento: 'contrabaixo', compassos: { 0: 33, 4: 38, 8: 28, 9: 26, 20: 28 } },
    { instrumento: 'guitarraJazz', compassos: { 12: 57, 16: 62 } },
  ],
  tung: { compassos: COMPASSOS.map((_, compasso) => compasso).filter(temTung) },
})
