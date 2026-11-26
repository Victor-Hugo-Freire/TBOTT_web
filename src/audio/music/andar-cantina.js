// A Ronda: Cantina. Faixa do andar 1 e tema da gameplay (é a faixa que todo jogador ouve em toda run).
//
// ESTILO E ANDAMENTO
//   Blues menor lento, de fim de noite, em Lá menor, ♩ = 88. Grade de 12 passos por compasso
//   (colcheias em tercina; o swing cai nos passos 0 e 2 de cada tempo). bpm do ZzFXM = 88 × 3/4 = 66.
//
// HARMONIA (o que é só da Cantina)
//   Lá eólio com a blue note (Mi♭); a dominante vem do menor harmônico (Sol#): E7♭9. Acordes com
//   nona (Am9, Dm9), meio-diminuto na volta (Bm7♭5 – E7♭9) e, no A2, o clichê do baixo (Lá – Sol# –
//   Sol – Fá# – Fá … Mi) com os acordes invertidos por cima. A cadência da casa é V7♭9 → iv → i
//   (E7♭9 → Dm9 → Am9, o blues "de trás para frente"). A ponte entra por engano (E7♭9 → Fmaj7),
//   passa pelo relativo maior e volta pelo pedal de dominante.
//
// MATERIAL (ver MELODIA: as figuras rítmicas e as notas próprias da Cantina)
//   Tema A: a célula do Tung (5 – ♭7 – 1' – ♭7 – 5, motivos.js) como riff do baixo, com respostas no
//   "lamento" (nota longa e corrida em tercina, com a blue note).
//   Tema B: a mesma célula em valores longos, na guitarra; na segunda metade ela volta em sequência,
//   uma quarta acima (sobre Ré), e o Rhodes responde nos buracos. O tung-tung-tung (madeira, em Lá)
//   fecha algumas frases, nunca todas.
//
// FORMA (36 compassos, ~98 s; editar em FORMA)
//   A1 (12)  exposição: vassourinha em 12/8; o riff no baixo e no Rhodes, o Rhodes responde
//   A2 (12)  variação: baquetas; a guitarra pega o riff e responde; o baixo caminha e desce no clichê;
//            virada de tons no fim
//   B  (8)   segundo tema em meio-tempo (aro no 3, ride em semínimas), o Rhodes em acordes longos;
//            na segunda metade a caixa entra no 3 e o tema sobe em sequência: o ponto mais alto
//   R  (4)   respiro: só baixo (com o sub embaixo), vassourinha e o tung-tung-tung respondendo
//            fragmentos da célula no Rhodes; a menor energia da faixa, antes de voltar ao A1
//   Energia: A1 média-baixa → A2 média-alta → B alta → R baixa → (A1)
//
// GRAVE E AGUDO
//   O baixo (contrabaixoCheio, com harmônicos) fica em volta do Lá2 (110 Hz); o Lá1 só nos começos
//   de seção e no respiro. Acordes de duas notas entre Fá3 e Mi4; melodia entre Lá3 e Ré5 (as frases
//   que passavam de Mi5 desceram uma oitava). Vassourinha, ride e chimbal 3 dB mais baixos.
//
// ESPAÇO PARA OS EFEITOS SONOROS (100 a 650 Hz)
//   A melodia é esparsa (o lamento sempre deixa um tempo de silêncio) e o Rhodes acompanha com toques
//   curtos.
//
// LOOP SEM EMENDA
//   O áudio começa no A1. O fim do respiro (tung-tung-tung sobre E7♭9) leva ao riff do A1 como uma
//   virada V → i; a cauda das notas do fim volta para o começo (loop contínuo do ZzFXM).
//
// ONDE AJUSTAR
//   FORMA (seções e harmonia) · FIGURAS (ritmos da melodia) · BAIXO (linhas por seção) · RHODES e
//   GUITARRA (temas e respostas) · VOICINGS (acordes) · GROOVES (bateria por seção) · TUNG

import { aplicarFigura, bateria, celula, compassoVazio, criarGrade, expandirForma, linha, montarMusica, notas, secoesDaForma, tungTungTung, voz } from './partitura.js'

const BLUES = ['Am9', 'Dm9', 'Am9', 'Am9', 'Dm9', 'Dm9', 'Am9', 'Am9', 'E7b9', 'Dm9', 'Am9', 'Bm7b5 E7b9']
// O mesmo blues com o clichê do baixo (compassos 3 a 7) e inversões: a parte de cima dos acordes fica
// parada enquanto o baixo desce
const BLUES_DO_A2 = ['Am9', 'Dm9', 'Am9 Am(maj7)/G#', 'Am7/G D9/F#', 'Dm9/F', 'Dm9', 'Am9/E', 'Am9', 'E7b9', 'Dm9', 'Am9', 'Bm7b5 E7b9']

const FORMA = Object.freeze([
  { nome: 'A1', papel: 'exposição: vassourinha e o riff no baixo e no Rhodes', harmonia: BLUES },
  { nome: 'A2', papel: 'variação: baquetas, a guitarra pega o riff, o baixo desce no clichê', harmonia: BLUES_DO_A2 },
  { nome: 'B', papel: 'segundo tema: a célula em valores longos, meio-tempo, relativo maior', harmonia: ['Fmaj7', 'G13', 'Cmaj9', 'Am9', 'Dm9', 'G13', 'E7sus4', 'E7b9'] },
  { nome: 'R', papel: 'respiro: baixo com sub, vassourinha e o tung-tung-tung', harmonia: ['Am9', 'Am9', 'Dm9', 'E7b9'] },
])

const COMPASSOS = expandirForma(FORMA)

export const CANTINA_META = Object.freeze({
  id: 'andar-cantina',
  titulo: 'A Ronda: Cantina',
  estilo: 'blues menor lento',
  andamento: 88,
  passosPorTempo: 3,
  temposPorCompasso: 4,
  compassos: COMPASSOS.length,
  inicioDoLoop: 0,
  tonalidade: 'Lá menor',
  tonica: 'A',
  modo: 'eolio',
  estrutura: 'A1 12 · A2 12 · B 8 · Respiro 4',
})

export const CANTINA_SECOES = secoesDaForma(FORMA)
export const CANTINA_HARMONIA = Object.freeze(COMPASSOS.map((c) => c.acorde))

const GRADE = criarGrade(CANTINA_META.passosPorTempo, CANTINA_META.temposPorCompasso)

export const CANTINA_INSTRUMENTOS = Object.freeze([
  'contrabaixoCheio', 'sub', 'rhodes', 'guitarraJazz', 'guitarraJazzLonga', 'vassourinha', 'bumbo', 'chimbal', 'ride', 'caixa', 'caixaCorpo', 'caixaAro', 'madeira',
])

const VOZ = Object.freeze({
  baixo: voz('contrabaixoCheio', 'baixo', { semente: 1 }),
  sub: voz('sub', 'baixo', { semente: 11 }),
  rhodes: voz('rhodes', 'riff', { semente: 2 }),
  rhodesResposta: voz('rhodes', 'melodia', { semente: 7 }),
  guitarra: voz('guitarraJazz', 'melodia', { semente: 3 }),
  guitarraRiff: voz('guitarraJazz', 'riff', { semente: 8 }),
  guitarraLonga: voz('guitarraJazzLonga', 'melodia', { semente: 10 }),
  compingGrave: voz('rhodes', 'comping', { semente: 4 }),
  compingAgudo: voz('rhodes', 'comping', { semente: 5 }),
  compingCor: voz('rhodes', 'comping', { semente: 6 }),
})

// --------------------------------------------------
// BAIXO: célula (tônica e aproximação em MIDI) ou linha escrita
// --------------------------------------------------

const cel = (tonica, aproximacao) => ({ celula: tonica, aproximacao })

const BAIXO = Object.freeze({
  // A1: "em dois" (fundamental e quinta, na região do Lá2) e a célula nos compassos 1, 5, 9 e 10
  A1: [
    cel(33, 49), 'D3 . . | . . . | A2 . . | . . G#2', 'A2 . . | . . . | E2 . . | . . .', 'A2 . . | . . . | C3 . . | . . .',
    cel(38, 49), 'D3 . . | . . . | F2 . . | . . G#2', 'A2 . . | . . . | E2 . . | . . .', 'A2 . . | . . . | E2 . . | . . C2',
    cel(28, 34), cel(26, 44), 'A2 . . | . . . | E2 . . | . . C3', 'B2 . . | . . . | E2 . . | . . .',
  ],
  // A2: o baixo caminha em semínimas, com aproximação cromática e o clichê descendente (Lá – Sol# –
  // Sol – Fá# – Fá … Mi) por baixo dos acordes invertidos; no compasso 9 a célula sobre Mi
  A2: [
    'A2 . . | C3 . . | E3 . . | G3 . C#3', 'D3 . . | F3 . . | E3 . . | C3 . Bb2', 'A2 . . | E3 . . | G#2 . . | E3 . .', 'G2 . . | E3 . . | F#2 . . | D3 . .',
    'F2 . . | A2 . . | C3 . . | E3 . Eb3', 'D3 . . | C3 . . | A2 . . | F2 . .', 'E2 . . | A2 . . | C3 . . | E3 . .', 'A2 . . | G2 . . | E2 . . | . . .',
    cel(28, 34), 'A1 . C2 | D2 . C2 | E2 . . | . . G#1', 'A2 . . | C3 . . | E3 . . | G3 . C3', 'B2 . . | D3 . . | E2 . . | . . .',
  ],
  // B: meio-tempo, fundamental e quinta com a nota de passagem para o acorde seguinte; pedal de Mi
  B: [
    'F2 . . | . . . | C3 . . | . . F#2', 'G2 . . | . . . | D3 . . | . . B2', 'C3 . . | . . . | G2 . . | . . G#2', 'A2 . . | . . . | E2 . . | . . C#3',
    'D3 . . | . . . | A2 . . | . . F#2', 'G2 . . | . . . | D3 . . | . . F2', 'E2 . . | . . . | E2 . . | . . .', 'E2 . . | . . . | B1 . . | . . .',
  ],
  // R: notas longas e graves (o sub vai embaixo delas)
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

// Sub: seno na fundamental das notas longas do respiro (no 1 e no 3), longe do bumbo
const SUB = Object.freeze({ 0: 33, 1: 33, 2: 38, 3: 40 })
const sub = (compasso) => {
  const { secao, indice } = COMPASSOS[compasso]
  if (secao !== 'R') return null
  return notas([{ passo: 0, midi: SUB[indice] }, { passo: 6, midi: SUB[indice], atenuacao: 0.25 }], VOZ.sub, compasso, GRADE)
}

// --------------------------------------------------
// MELODIA: o que distingue a Cantina dos outros andares
//   Figura rítmica: o lamento, uma nota longa seguida de uma corrida em tercina (três notas num tempo,
//   passando pela tercina do meio) e um tempo inteiro de silêncio; quase nunca nota repetida.
//   Notas: Lá menor com a blue note (Mi♭), em graus e cromatismo. A célula do Tung é o riff: a
//   Cantina é a casa dela.
// --------------------------------------------------

// 'x' = nota curta, 'X' = nota longa
const FIGURAS = Object.freeze({
  lamento: 'X . . | . . . | x x x | . . .', // longa no 1, corrida no 3
  lamentoNo4: 'X . . | . . . | . . . | x x x', // longa no 1, corrida no 4
  corridaELonga: '. . . | x x x | X . . | . . .', // corrida no 2, longa no 3
  lamentoComFim: 'X . . | . . . | x x x | x . .', // longa, corrida e mais uma nota no 4
  lamentoDuplo: 'X . . | . x x | x x x | . . .', // longa e uma corrida de cinco notas (2 e 3)
  corridaDupla: '. . . | . x x | x x x | . . .', // só a corrida de cinco notas
  corridaNo3: '. . . | . . . | x x x | . . .', // só três notas em tercina no 3
  corridaNo4: '. . . | . . . | . . . | x x x', // só três notas em tercina no 4 (a resposta do Rhodes no B)
})

const f = (nome, ...notasDaFrase) => aplicarFigura(FIGURAS[nome], notasDaFrase)

// RHODES: o riff (A1, em oitava com o baixo), respostas no lamento (A1), a célula e uma linha grave
// (A2), o contracanto nos buracos do tema B e os fragmentos da célula no respiro
const RHODES = Object.freeze({
  A1: {
    0: cel(45), 1: f('lamento', 'D4', 'E4', 'F4', 'E4'), 2: f('corridaDupla', 'A4', 'C5', 'D5', 'Eb5', 'E5'),
    4: cel(50), 5: f('lamentoNo4', 'F4', 'E4', 'Eb4', 'D4'), 6: f('lamentoNo4', 'E4', 'G4', 'E4', 'D4'),
    8: cel(40), 9: cel(38), 10: f('lamentoDuplo', 'C5', 'B4', 'C5', 'D5', 'Eb5', 'E5'),
  },
  A2: { 8: cel(40), 9: 'A2 . C3 | D3 . C3 | E3 . . | . . .' },
  // B: o contracanto responde quando a guitarra segura a nota (sobre Dm9 desce; sobre G13 sobe)
  B: { 4: f('corridaNo4', 'F4', 'E4', 'D4'), 5: f('corridaNo4', 'B3', 'D4', 'F4') },
  // Respiro: só o começo da célula (Mi – Sol – Lá; Lá – Dó – Ré), e o tung-tung-tung responde
  R: { 0: f('corridaNo3', 'E4', 'G4', 'A4'), 2: f('corridaNo3', 'A4', 'C5', 'D5') },
})

const rhodes = (compasso) => {
  const { secao, indice } = COMPASSOS[compasso]
  const entrada = RHODES[secao]?.[indice]
  if (!entrada) return null
  const v = typeof entrada === 'string' && secao !== 'A2' ? VOZ.rhodesResposta : VOZ.rhodes
  return tocar(entrada, v, compasso)
}

// Acordes de duas notas (as notas-guia: terça e sétima, ou sétima e nona); o G13 ganha a 13ª nos
// acordes longos do B. Nas inversões do clichê a parte de cima fica parada (Dó e Mi) e o baixo anda.
const VOICINGS = Object.freeze({
  Am9: [55, 60], Dm9: [53, 60], E7b9: [56, 62], Bm7b5: [57, 62],
  'Am(maj7)/G#': [60, 64], 'Am7/G': [60, 64], 'D9/F#': [60, 64], 'Dm9/F': [60, 64], 'Am9/E': [55, 60],
  Fmaj7: [57, 60], G13: [53, 59, 64], Cmaj9: [52, 59], E7sus4: [57, 62],
})

// Toques curtos no A2 (dois por compasso; no compasso com dois acordes, um em cada metade), acordes
// longos no B (um por compasso, no meio-tempo)
function comping(indiceDaVoz, v) {
  return (compasso) => {
    const { secao, indice, acorde } = COMPASSOS[compasso]
    const [primeiro, segundo] = acorde.split(' ')
    const nota = (simbolo) => VOICINGS[simbolo][indiceDaVoz]
    if (secao === 'B') return nota(primeiro) === undefined ? null : notas([{ passo: 0, midi: nota(primeiro) }], v, compasso, GRADE)
    if (secao !== 'A2' || [0, 4, 8, 9].includes(indice) || nota(primeiro) === undefined) return null
    if (segundo) return notas([{ passo: 0, midi: nota(primeiro) }, { passo: 9, midi: nota(segundo) }], v, compasso, GRADE)
    const passos = TUNG.A2.includes(indice) ? [0] : [0, 8]
    return notas(passos.map((passo) => ({ passo, midi: nota(primeiro) })), v, compasso, GRADE)
  }
}

// --------------------------------------------------
// GUITARRA: o riff uma oitava acima do baixo e respostas (A2); o tema B (a célula em valores longos)
// --------------------------------------------------

const GUITARRA = Object.freeze({
  // A2: o riff e respostas no lamento, entre Lá3 e Lá4 (o pico é a célula sobre Ré, no compasso 5)
  A2: {
    0: cel(57), 1: f('lamento', 'F4', 'E4', 'Eb4', 'D4'), 2: f('corridaDupla', 'E4', 'D4', 'C4', 'B3', 'A3'),
    3: f('corridaELonga', 'C4', 'D4', 'E4', 'A4'),
    4: cel(62), 5: f('lamentoDuplo', 'A4', 'G4', 'F4', 'E4', 'Eb4', 'D4'), 6: f('corridaDupla', 'C4', 'D4', 'Eb4', 'E4', 'G4'),
    7: f('lamento', 'E4', 'D4', 'Eb4', 'E4'),
    10: f('corridaELonga', 'G4', 'A4', 'G4', 'E4'), 11: f('lamento', 'A4', 'F4', 'E4', 'D4'),
  },
  // Tema B: a célula alongada (Mi . Sol | Lá . . Sol) em notas seguradas; na segunda metade ela volta
  // uma quarta acima (Lá . Dó | Ré . Si, a célula sobre Ré) e desce no lamento até a sensível (Sol#)
  B: {
    0: 'E4~ . . | . . . | G4~ . . | . . .', 1: 'A4~ . . | . . . | . . . | G4 . .',
    2: 'F4~ . . | . . E4 | D4~ . . | . . .', 3: 'E4~ . . | . . . | . . . | D4 E4 G4',
    4: 'A4~ . . | . . . | C5~ . . | . . .', 5: 'D5~ . . | . . . | B4~ . . | . . .',
    6: 'A4~ . . | . . G4 | F4~ . . | . . E4', 7: 'B3~ . . | . . . | G#3~ . . | . . .',
  },
})

// A guitarra em dois canais: as notas curtas na guitarraJazz e as longas ('~') na guitarraJazzLonga
function guitarra(articulacao) {
  return (compasso) => {
    const { secao, indice } = COMPASSOS[compasso]
    const entrada = GUITARRA[secao]?.[indice]
    if (!entrada) return null
    if (typeof entrada !== 'string') return articulacao === 'curta' ? celula(entrada.celula, VOZ.guitarraRiff, compasso, GRADE) : null
    return linha(entrada, articulacao === 'longa' ? VOZ.guitarraLonga : VOZ.guitarra, compasso, GRADE, 0, 0, articulacao)
  }
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

// Vassourinha, ride e chimbal 3 dB abaixo da versão anterior (o agudo fica como detalhe)
const VASSOURINHA = Object.freeze({ S: 12.29, s: 12.5, t: 12.7 })
const BUMBO_LEVE = Object.freeze({ K: 12.72, k: 12.8 })
const BUMBO = Object.freeze({ K: 12.42, k: 12.55, l: 19.2, m: 22.25, h: 26.3 })
const RIDE = Object.freeze({ X: 12.33, x: 12.47, s: 12.68, B: 17.36 })
const CAIXA = Object.freeze({ X: 12, x: 12.3, g: 12.7, p: 12.55, q: 12.38 })
const CAIXA_CORPO = Object.freeze({ X: 12, x: 12.3, g: 12.92, p: 12.6, q: 12.45 })
const ARO = Object.freeze({ X: 12.1 })
const PEDAL = Object.freeze({ c: 12.58 })

// Cada groove: (indice, tung) → linha do compasso ou null
const GROOVES = Object.freeze({
  vassourinha: {
    // A1: a vassourinha varre as três tercinas de cada tempo (12/8 lento), com acento no 2 e no 4
    A1: (i, tung) => {
      if (tung) return 's t t | S t t | s . t | . . .'
      if (i === 7) return 's . t | S . t | S t t | S t S' // virada de vassourinha antes do Mi7
      return i >= 4 && i < 8 ? 's . t | S . t | s t t | S . t' : 's t t | S t t | s t t | S t t'
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
  ['contrabaixoCheio', 0, baixo],
  ['sub', 0, sub],
  ['rhodes', 0.12, rhodes],
  ['guitarraJazz', -0.28, guitarra('curta')],
  ['guitarraJazzLonga', -0.28, guitarra('longa')],
  ['rhodes', 0.22, comping(0, VOZ.compingGrave)],
  ['rhodes', 0.3, comping(1, VOZ.compingAgudo)],
  ['rhodes', 0.26, comping(2, VOZ.compingCor)],
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
    { instrumento: 'contrabaixoCheio', compassos: { 0: 33, 4: 38, 8: 28, 9: 26, 20: 28 } },
    { instrumento: 'guitarraJazz', compassos: { 12: 57, 16: 62 } },
  ],
  tung: { compassos: COMPASSOS.map((_, compasso) => compasso).filter(temTung) },
})

// Vozes de melodia (cada voz: os canais [instrumento, ordem] que formam uma linha), para a análise
// melódica (analiseMelodica.js)
export const CANTINA_MELODIA = Object.freeze([[['rhodes', 0]], [['guitarraJazz', 0], ['guitarraJazzLonga', 0]]])
