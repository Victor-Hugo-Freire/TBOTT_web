// A Ronda: Cucina. Faixa do andar 2: a cozinha agitada (panelas, tampas, pressa).
//
// ESTILO E ANDAMENTO
//   Funk com naipe de metais (soul-jazz dos anos 70) em Fá mixolídio, ♩ = 104. Grade de 16 passos
//   por compasso (semicolcheias retas). bpm do ZzFXM = 104.
//
// HARMONIA (o que é só da Cucina)
//   Fá mixolídio: F9 e B♭13, com a terça blue (Lá♭ subindo para Lá) no baixo e na melodia. Ritmo
//   harmônico lento (blocos de 2 a 4 compassos num acorde só). Cadências: IV → I (B♭13 → F9),
//   ♭VI → ♭VII → I na ponte (D♭maj7 → E♭9 → F9) e o deslize de meio-tom (G♭9 → F9) no fim de cada
//   volta. Nenhum V → I.
//
// MATERIAL (ver MELODIA)
//   Tema A (a cabeça): o sax tenor chama em 2 compassos (a nota repetida da "panela batendo", que
//   sobe Fá → Dó → Mi♭) e o naipe (trompete com surdina e trombone) responde com golpes curtos; as
//   frases terminam antecipadas, na última semicolcheia, ligadas por cima da barra.
//   Tema B (a ponte): o trompete em notas ligadas e colcheias pontuadas, o sax responde embaixo.
//   Shout: o naipe em oitavas (sax e trombone), com a célula do Tung exata duas vezes (Fá – Lá♭ –
//   Si♭ – Lá♭ – Fá sobre B♭13), no ritmo pontuado da grade reta. O tung-tung-tung (madeira, em Fá)
//   fecha algumas frases nas últimas três semicolcheias.
//
// FORMA (42 compassos, ~97 s; editar em FORMA)
//   A1     (8)  a cabeça: baixo funk, clavinete, chimbal em colcheias
//   A2     (8)  a cabeça com outro fim (E♭/F, Cm9): chimbal em semicolcheias e o chimbal aberto no
//               "e" do 4 (a tampa da panela); virada de tons no fim
//   Ponte  (8)  soul: ride em semínimas, o trompete canta, o trombone segura as notas-guia; termina
//               num breque (a banda inteira só no 1)
//   Quebra (6)  a cozinha quebra: só baixo, bumbo e caixa com notas fantasma; o clavinete e os metais
//               voltam aos poucos; rulo de caixa no fim
//   Shout  (8)  o ponto mais alto: o naipe em oitavas, quatro no chão, chimbal aberto em todo "e",
//               prato escuro nos começos de frase; virada de tons
//   Volta  (4)  a cabeça curta, de volta ao A1
//   Energia: A1 média → A2 média-alta → Ponte média → Quebra baixa → Shout a mais alta → Volta média
//
// GRAVE E AGUDO
//   Baixo funk (com harmônicos) entre Fá2 e Fá3; o bumbo fica sozinho abaixo de 80 Hz (sem sub). Os
//   metais ficam entre Fá3 e Mi♭5 (o trompete com surdina, que é mais escuro); o chimbal em
//   semicolcheias tem as notas fracas bem abaixo das colcheias. Sem o piano agudo da versão anterior.
//
// LOOP SEM EMENDA
//   O áudio começa no A1; o fim da Volta (G♭9 com o tung-tung-tung) desliza meio tom para o F9 do A1.
//
// ONDE AJUSTAR
//   FORMA · SAX, PONTE e SHOUT (as frases) · GOLPES (naipe) · BAIXO e RIFFS · CLAV · GROOVES ·
//   DINAMICA · TUNG

import { bateria, comAtenuacao, compassoVazio, criarGrade, expandirForma, linha, montarMusica, notas, secoesDaForma, tokens, tungTungTung, voz } from './partitura.js'

const FORMA = Object.freeze([
  { nome: 'A1', papel: 'a cabeça: o sax chama, o naipe responde', harmonia: ['F9', 'F9', 'F9', 'F9', 'Bb13', 'Bb13', 'F9', 'Gb9'] },
  { nome: 'A2', papel: 'a cabeça com outro fim, chimbal em semicolcheias', harmonia: ['F9', 'F9', 'Eb/F', 'F9', 'Bb13', 'Bb13', 'Cm9', 'Gb9'] },
  { nome: 'Ponte', papel: 'soul: o trompete canta, ride, breque no fim', harmonia: ['Dbmaj7', 'Eb9', 'F9', 'F9', 'Dbmaj7', 'Eb9', 'Gm9', 'C13sus4'] },
  { nome: 'Quebra', papel: 'a cozinha quebra: baixo, bumbo e caixa', harmonia: ['F9', 'F9', 'F9', 'F9', 'Bb13', 'Gb9'] },
  { nome: 'Shout', papel: 'o naipe em oitavas, a célula, quatro no chão', harmonia: ['Bb13', 'Bb13', 'F9', 'F9', 'Dbmaj7', 'Eb9', 'F9', 'Gb9'] },
  { nome: 'Volta', papel: 'a cabeça curta, de volta ao A1', harmonia: ['F9', 'F9', 'Bb13', 'Gb9'] },
])

const COMPASSOS = expandirForma(FORMA)

export const CUCINA_META = Object.freeze({
  id: 'andar-cucina',
  titulo: 'A Ronda: Cucina',
  estilo: 'funk com naipe de metais',
  andamento: 104,
  passosPorTempo: 4,
  temposPorCompasso: 4,
  compassos: COMPASSOS.length,
  inicioDoLoop: 0,
  tonalidade: 'Fá mixolídio (F9)',
  tonica: 'F',
  modo: 'mixolidio',
  estrutura: 'A1 8 · A2 8 · Ponte 8 · Quebra 6 · Shout 8 · Volta 4',
})

export const CUCINA_SECOES = secoesDaForma(FORMA)
export const CUCINA_HARMONIA = Object.freeze(COMPASSOS.map((c) => c.acorde))

const GRADE = criarGrade(CUCINA_META.passosPorTempo, CUCINA_META.temposPorCompasso)

export const CUCINA_INSTRUMENTOS = Object.freeze([
  'baixoFunk', 'clavinete', 'saxTenorCurto', 'saxTenorLongo', 'trompeteSurdina', 'trombone', 'tromboneLongo',
  'bumboSeco', 'caixa', 'caixaCorpo', 'chimbal', 'chimbalAberto', 'ride', 'pratoEscuro', 'madeira',
])

const VOZ = Object.freeze({
  baixo: voz('baixoFunk', 'baixo', { semente: 31 }),
  clav: voz('clavinete', 'riff', { semente: 32 }),
  sax: voz('saxTenorCurto', 'melodia', { semente: 33 }),
  saxLongo: voz('saxTenorLongo', 'melodia', { semente: 34 }),
  celula: voz('saxTenorCurto', 'riff', { semente: 35 }),
  trompete: voz('trompeteSurdina', 'melodia', { semente: 36 }),
  golpe: voz('trompeteSurdina', 'naipe', { semente: 37 }),
  trombone: voz('trombone', 'naipe', { semente: 38 }),
  tromboneShout: voz('trombone', 'riff', { semente: 39 }),
  notaGuia: voz('tromboneLongo', 'comping', { semente: 40 }),
})

// --------------------------------------------------
// TUNG: compassos (dentro da seção) que fecham com o tung-tung-tung nas três últimas semicolcheias;
// nesses compassos só o bumbo continua nos passos 13 a 15
// --------------------------------------------------

const TUNG = Object.freeze({ A1: [3], A2: [7], Ponte: [3], Quebra: [1, 3], Shout: [], Volta: [3] })
const temTung = (compasso) => {
  const { secao, indice } = COMPASSOS[compasso]
  return TUNG[secao].includes(indice)
}
const FIM_DO_TUNG = 13
const semOFim = (passos, compasso) => (temTung(compasso) ? passos.map((valor, passo) => (passo >= FIM_DO_TUNG ? 0 : valor)) : passos)

// --------------------------------------------------
// BAIXO: riffs de funk (o "um" acentuado, a oitava, notas fantasma e a aproximação cromática para o
// acorde seguinte)
// --------------------------------------------------

const RIFFS = Object.freeze({
  F9a: 'F2! . . F2_ | . . F3 . | Eb3 . C3 . | . Ab2 A2 E2',
  F9b: 'F2! . . . | . F2_ F3 . | . . C3 . | Eb3 . . E2',
  F9c: 'F2! . . F2_ | . . F3 . | Eb3 . C3 . | A2 . B2 .', // → B♭
  F9d: 'F2! . . F2_ | . . F3 . | Eb3 . C3 . | . A2 . F2', // → G♭
  F9e: 'F2! . . . | . F2_ F3 . | . . C3 . | Eb3 . . C2', // → D♭
  EbF: 'F2! . . F2_ | . . Eb3 . | . . Bb2 . | G2 . F2 .',
  Bb13a: 'Bb1! . . Bb1_ | . . Bb2 . | Ab2 . F2 . | . Db2 D2 A1', // → B♭
  Bb13b: 'Bb1! . . . | . Bb1_ Bb2 . | . . F2 . | Ab2 . . E2', // → F
  Bb13c: 'Bb1! . . . | . Bb1_ Bb2 . | . . F2 . | Ab2 . . B2', // → C
  Bb13d: 'Bb1! . . Bb1_ | . . Bb2 . | Ab2 . F2 . | . . . G2', // → G♭
  Gb9a: 'Gb2! . . . | . . Gb2 . | . . . . | . . . E2', // → F
  Gb9b: 'Gb2! . . . | . . Gb2 . | . . . . | . . . C2', // → D♭
  Gb9c: 'Gb2! . . . | . . Gb2 . | . . . . | . . . A1', // → B♭
  Cm9: 'C3! . . C3_ | . . G2 . | Bb2 . C3 . | . . . G2', // → G♭
  Dbmaj7: 'Db2! . . . | . . Ab2 . | C3 . Db3 . | . Ab2 . D2', // → E♭
  Eb9a: 'Eb2! . . . | . . Bb2 . | Db3 . Eb3 . | . Bb2 . E2', // → F
  Eb9b: 'Eb2! . . . | . . Bb2 . | Db3 . Eb3 . | . Bb2 . F#2', // → G
  Gm9: 'G2! . . G2_ | . . D3 . | F3 . G2 . | . . . B2', // → C
  C13breque: 'C3! . . . | . . . . | . . . . | . . . .',
  // Ponte (soul): fundamental e quinta, mais espaço
  F9soul: 'F2! . . . | . . . . | C3 . . . | . . E2 .',
  F9soulFim: 'F2! . . . | . . . . | A2 . . . | C3 . . C2',
})

const BAIXO = Object.freeze({
  A1: ['F9a', 'F9b', 'F9a', 'F9c', 'Bb13a', 'Bb13b', 'F9d', 'Gb9a'],
  A2: ['F9b', 'F9a', 'EbF', 'F9c', 'Bb13a', 'Bb13c', 'Cm9', 'Gb9b'],
  Ponte: ['Dbmaj7', 'Eb9a', 'F9soul', 'F9soulFim', 'Dbmaj7', 'Eb9b', 'Gm9', 'C13breque'],
  Quebra: ['F9a', 'F9b', 'F9a', 'F9c', 'Bb13d', 'Gb9c'],
  Shout: ['Bb13a', 'Bb13b', 'F9a', 'F9e', 'Dbmaj7', 'Eb9a', 'F9d', 'Gb9a'],
  Volta: ['F9a', 'F9c', 'Bb13d', 'Gb9a'],
})

function baixo(compasso) {
  const { secao, indice } = COMPASSOS[compasso]
  return semOFim(linha(RIFFS[BAIXO[secao][indice]], VOZ.baixo, compasso, GRADE), compasso)
}

// --------------------------------------------------
// MELODIA: o que distingue a Cucina dos outros andares
//   Figuras rítmicas: a nota repetida ("panela batendo") em semicolcheias, a antecipação (a nota entra
//   na última semicolcheia; fica soando por cima da barra, '~', só quando a nota seguinte não bate
//   contra ela) e o salto (Fá → Mi♭, quase oitava).
//   Notas: Fá mixolídio com a terça blue (Lá♭ → Lá), no médio do sax (Fá4 a Mi♭5).
//   A célula do Tung aparece exata só no Shout, como citação.
// --------------------------------------------------

// Sax tenor: a cabeça (A1, A2 e Volta) e a resposta grave na ponte. 'x~' = nota longa (sax longo).
const SAX = Object.freeze({
  A1: [
    'F4 . F4 F4 | . F4 . . | C5 . Eb5 C5 | . . . .',
    'Ab4 . A4 . | F4 . . . | . . . . | . . . F4~',
    '. . F4 F4 | . F4 . . | A4 . C5 . | Eb5 . . .',
    'D5 . C5 C5 | . A4 A4 . | F4 . . . | . . . .',
    'Bb4 . Bb4 Bb4 | . Bb4 . . | Ab4 . G4 F4 | . . . .',
    '. . F4 . | G4 . Ab4 A4 | . . . . | . . . C5~',
    '. . . . | . . C5 C5 | . Eb5 . C5 | Ab4 Ab4 A4 .',
    '. . . . | . . . . | . . . . | . Eb4 E4 F4~',
  ],
  A2: [
    '. . F4 F4 | . F4 . . | C5 . Eb5 C5 | . . . Ab4',
    '. . A4 . | F4 . . . | . . . . | . . . F4~',
    '. . Bb4 Bb4 | . G4 . . | Eb5 . . . | . . . Bb4',
    '. . A4 A4 | C5 . A4 . | F4 F4 . . | . . . C5',
    'Bb4 . Bb4 Bb4 | . Bb4 . . | Ab4 . G4 F4 | . . . Ab4',
    '. . G4 . | F4 . Eb4 . | F4 . . . | . . . G4~',
    '. . . . | Bb4 Bb4 G4 . | Eb4 . . . | . . . Gb4',
    'Ab4~ . . . | . . . . | . . . . | . . . .',
  ],
  // Ponte: o sax só responde ao trompete no 4º compasso, embaixo
  Ponte: { 3: '. . . . | F3 . A3 . | C4 . Eb4 . | . . . .' },
  Volta: [
    'F4 . F4 F4 | . F4 . . | C5 . Eb5 C5 | . . . .',
    'Ab4 . A4 . | F4 . . . | . . . . | . . . Bb4~',
    '. . Bb4 Bb4 | . Ab4 Ab4 G4 | F4 . . . | . . . .',
    null,
  ],
})

// Shout: a linha do naipe (sax; o trombone toca a mesma uma oitava abaixo). Nos dois primeiros
// compassos, a célula do Tung exata sobre Si♭ (passos 0, 3, 4, 7 e 8) e um fim diferente em cada um.
const SHOUT = Object.freeze([
  'F4 . . Ab4 | Bb4 . . Ab4 | F4 . D5 . | C5 . . .',
  'F4 . . Ab4 | Bb4 . . Ab4 | F4 . Bb4 . | Ab4 . . C5~',
  '. . C5 C5 | . C5 . C5 | . . Eb5 . | C5 . A4 A4~',
  'F4 . . Eb5 | . . C5 . | A4 . . . | . . . Ab4~',
  '. . Ab4 Ab4 | . F4 . Ab4 | . . C5 . | Ab4 . F4 .',
  'G4 . G4 G4 | . Eb4 . G4 | . . Bb4 . | Db5 . . C5~',
  '. . C5 . | C5 . C5 Eb5 | . . C5 . | A4 . F4 F4',
  null,
])
const CELULA_NO_SHOUT = Object.freeze({ 0: 58, 1: 58 }) // tônica da célula (Si♭3) no sax
// O sax é o timbre mais cheio da banda: fica ~2,5 dB abaixo do perfil de melodia para não cobrir o resto
const ATENUACAO_DO_SAX = 0.25

function linhaDoSax(compasso) {
  const { secao, indice } = COMPASSOS[compasso]
  if (secao === 'Shout') return SHOUT[indice]
  const tabela = SAX[secao]
  return tabela ? tabela[indice] ?? null : null
}

// O sax em dois canais: as notas curtas no saxTenorCurto e as longas ('~') no saxTenorLongo
function sax(articulacao) {
  return (compasso) => {
    const { secao, indice } = COMPASSOS[compasso]
    const texto = linhaDoSax(compasso)
    if (!texto) return null
    const v = articulacao === 'longa' ? VOZ.saxLongo : secao === 'Shout' && indice in CELULA_NO_SHOUT ? VOZ.celula : VOZ.sax
    return semOFim(linha(texto, v, compasso, GRADE, 0, ATENUACAO_DO_SAX, articulacao), compasso)
  }
}

// Ponte: o trompete com surdina canta em notas ligadas e colcheias pontuadas; cada frase empurra a
// nota do acorde seguinte para a última semicolcheia
const PONTE = Object.freeze([
  'C5 . . . | . . . . | Bb4 . . Ab4 | . . . .',
  'G4 . . . | . . . . | F4 . . G4 | . . . Ab4',
  '. . A4 . | . . . . | G4 . . F4 | . . Eb4 .',
  'C4 . . . | . . . . | . . . . | . . . .',
  'Ab4 . . . | . . . . | C5 . . Db5 | . . . .',
  'Eb5 . . . | . . . . | Db5 . . Bb4 | . . . D5',
  '. . . . | . . . . | Bb4 . . A4 | . . . G4',
  '. . . . | . . . . | . . . . | . . . .',
])

function trompete(compasso) {
  const { secao, indice } = COMPASSOS[compasso]
  if (secao !== 'Ponte') return null
  return semOFim(linha(PONTE[indice], VOZ.trompete, compasso, GRADE), compasso)
}

// --------------------------------------------------
// NAIPE: golpes curtos de duas notas (as notas-guia: terça e sétima) nos buracos do sax
// --------------------------------------------------

// [trombone, trompete] por acorde
const NOTAS_GUIA = Object.freeze({
  F9: [57, 63], Bb13: [56, 62], Gb9: [52, 58], 'Eb/F': [55, 58], Cm9: [51, 58],
  Dbmaj7: [53, 60], Eb9: [55, 61], Gm9: [58, 65], C13sus4: [58, 62],
})

// Passos dos golpes por seção e compasso
const GOLPES = Object.freeze({
  A1: { 1: [10, 13], 3: [9, 12], 5: [10, 12], 7: [0, 3, 6] },
  A2: { 1: [10, 13], 3: [9, 12], 5: [10], 7: [0, 3, 6] },
  Ponte: { 7: [0] },
  Quebra: { 4: [0, 3, 6, 10], 5: [0, 3, 6] },
  Shout: { 2: [6, 14], 3: [6], 6: [6, 14], 7: [0, 3, 6] },
  Volta: { 1: [10, 13], 3: [0, 3, 6] },
})

function golpes(indiceDaVoz, v) {
  return (compasso) => {
    const { secao, indice, acorde } = COMPASSOS[compasso]
    const passos = GOLPES[secao]?.[indice]
    if (!passos) return null
    return notas(passos.map((passo) => ({ passo, midi: NOTAS_GUIA[acorde][indiceDaVoz] })), v, compasso, GRADE)
  }
}

const golpeDoTrompete = golpes(1, VOZ.golpe)
const golpeDoTrombone = golpes(0, VOZ.trombone)

// O trombone: golpes nas seções da cabeça e na quebra; no Shout, a linha do sax uma oitava abaixo
// (no último compasso, o golpe junto com o naipe)
function trombone(compasso) {
  const { secao, indice } = COMPASSOS[compasso]
  if (secao === 'Shout' && SHOUT[indice]) return linha(SHOUT[indice].replace(/~/g, ''), VOZ.tromboneShout, compasso, GRADE, -12)
  return golpeDoTrombone(compasso)
}

// Ponte: o trombone longo segura a nota-guia de cada acorde (a terça ou a sétima), uma por compasso
function notaGuia(compasso) {
  const { secao, indice, acorde } = COMPASSOS[compasso]
  if (secao !== 'Ponte' || indice === 7) return null
  return notas([{ passo: 0, midi: NOTAS_GUIA[acorde][0] }], VOZ.notaGuia, compasso, GRADE)
}

// --------------------------------------------------
// CLAVINETE: acordes de duas notas em contratempo de semicolcheia
// --------------------------------------------------

const CLAV = Object.freeze({
  F9: [57, 63], Bb13: [56, 62], Gb9: [52, 58], 'Eb/F': [55, 63], Cm9: [58, 63],
  Dbmaj7: [53, 60], Eb9: [55, 61], Gm9: [58, 65], C13sus4: [58, 62],
})
const RITMOS_DO_CLAV = Object.freeze({
  a: [2, 7, 10, 13],
  b: [2, 5, 10, 12],
  shout: [4, 12],
  ponte: [4, 12],
  quebra: [2, 10],
})

function ritmoDoClav(secao, indice) {
  if (secao === 'A1') return indice < 2 ? null : indice % 2 === 0 ? 'a' : 'b'
  if (secao === 'A2' || secao === 'Volta') return indice % 2 === 0 ? 'b' : 'a'
  if (secao === 'Ponte') return indice === 7 ? null : 'ponte'
  if (secao === 'Quebra') return indice < 2 ? null : 'quebra'
  if (secao === 'Shout') return indice === 7 ? null : 'shout'
  return null
}

function clav(indiceDaVoz) {
  return (compasso) => {
    const { secao, indice, acorde } = COMPASSOS[compasso]
    const ritmo = ritmoDoClav(secao, indice)
    if (!ritmo) return null
    const extra = secao === 'Quebra' ? 0.25 : 0
    // Clavinete e naipe se encaixam: nos passos dos golpes (e da linha do trombone no Shout), o
    // clavinete não ataca, para os dois não tocarem a mesma nota juntos
    const ocupados = new Set(GOLPES[secao]?.[indice] ?? [])
    if (secao === 'Shout' && SHOUT[indice]) tokens(SHOUT[indice]).forEach((token, passo) => { if (token !== '.') ocupados.add(passo) })
    const lista = RITMOS_DO_CLAV[ritmo].filter((passo) => (!temTung(compasso) || passo < FIM_DO_TUNG) && !ocupados.has(passo))
    return notas(lista.map((passo) => ({ passo, midi: CLAV[acorde][indiceDaVoz], atenuacao: extra })), VOZ.clav, compasso, GRADE)
  }
}

// --------------------------------------------------
// BATERIA: o funk da panela, um groove por seção e viradas nas passagens
// --------------------------------------------------

// Bumbo e tons no mesmo canal: K/k = bumbo; l/m/h = tons grave, médio e agudo
const BUMBO = Object.freeze({ K: 12.38, k: 12.55, l: 19.25, m: 22.3, h: 26.35 })
const CAIXA = Object.freeze({ X: 12.16, x: 12.4, g: 12.82, r: 12.58 })
const CAIXA_CORPO = Object.freeze({ X: 12, x: 12.3, g: 12.95, r: 12.7 })
// Chimbal: colcheias fortes e semicolcheias quase sumindo (o agudo fica como detalhe)
const CHIMBAL = Object.freeze({ X: 12.3, x: 12.66 })
const ABERTO = Object.freeze({ o: 12.4 })
const RIDE = Object.freeze({ X: 12.45, x: 12.62 })
const PRATO = Object.freeze({ P: 12.15 })

const BUMBO_A = 'K . . . | . . . k | . . K . | . . . .'
const BUMBO_B = 'K . . k | . . . . | . . K . | . k . .'
const CAIXA_A = '. . . . | X . . g | . g . . | X . . g'
const CAIXA_B = '. . g . | X . . g | . g . . | X . g .'

const GROOVES = Object.freeze({
  bumbo: {
    A1: (i) => (i % 2 === 0 ? BUMBO_A : BUMBO_B),
    A2: (i) => (i === 7 ? 'K . . . | . . . . | h . h . | m . l .' : i % 2 === 0 ? BUMBO_B : BUMBO_A), // tons para a ponte
    Ponte: (i) => (i === 7 ? 'K . . . | . . . . | . . . . | . . . .' : 'K . . . | . . . . | K . . . | . . . .'),
    Quebra: (i) => (i === 5 ? 'K . . . | . . . . | K . K . | K . K K' : 'K . . . | . . . . | . . K . | . . . .'),
    Shout: (i) => (i === 7 ? 'K . . K | . . K . | h h m m | l l . .' : 'K . . . | K . . . | K . . . | K . . .'),
    Volta: (i) => (i % 2 === 0 ? BUMBO_A : BUMBO_B),
  },
  caixa: {
    A1: (i) => (i === 7 ? '. . . . | X . . g | . g . . | r r r X' : CAIXA_A),
    A2: (i) => (i === 7 ? null : i % 2 === 0 ? CAIXA_A : CAIXA_B),
    Ponte: (i) => (i === 7 ? 'X . . . | . . . . | . . . . | . . . .' : '. . . . | X . . . | . . . . | X . . .'),
    Quebra: (i) => (i === 5 ? '. . . . | X . . . | r r r r | r r X .' : CAIXA_B),
    Shout: (i) => (i === 7 ? 'X . . X | . . X . | . . . . | . . . .' : '. . . . | X . . . | . . . . | X . . .'),
    Volta: (i) => (i % 2 === 0 ? CAIXA_A : CAIXA_B),
  },
  chimbal: {
    A1: () => 'X . X . | X . X . | X . X . | X . X .',
    A2: () => 'X x X x | X x X x | X x X x | X x . x',
    Quebra: (i) => (i >= 4 ? 'X x X x | X x X x | X x X x | X x X x' : null),
    Shout: (i) => (i === 7 ? null : 'X . . . | X . . . | X . . . | X . . .'),
    Volta: () => 'X . X . | X . X . | X . X . | X . X .',
  },
  aberto: {
    // A tampa da panela: o chimbal aberto no "e" do 4; no Shout, em todo "e"
    A2: (i) => (i === 7 ? null : '. . . . | . . . . | . . . . | . . o .'),
    Shout: (i) => (i === 7 ? null : '. . o . | . . o . | . . o . | . . o .'),
  },
  ride: {
    Ponte: (i) => (i === 7 ? null : 'X . . . | X . . . | X . x . | X . . .'),
  },
  prato: {
    Ponte: (i) => (i === 0 || i === 7 ? 'P . . . | . . . . | . . . . | . . . .' : null),
    Shout: (i) => (i === 0 || i === 4 ? 'P . . . | . . . . | . . . . | . . . .' : null),
  },
})

// Intensidade da bateria por seção (atenuação somada a todas as batidas; 0 = cheia)
const DINAMICA = Object.freeze({ A1: 0.08, A2: 0.03, Ponte: 0.06, Quebra: 0.1, Shout: 0, Volta: 0.06 })

function peca(nome, mapa) {
  return (compasso) => {
    const { secao, indice } = COMPASSOS[compasso]
    const groove = GROOVES[nome][secao]
    const texto = groove ? groove(indice) : null
    if (!texto) return null
    const passos = bateria(texto, comAtenuacao(mapa, DINAMICA[secao]), GRADE)
    // No compasso do tung-tung-tung, só o bumbo continua nas três últimas semicolcheias
    return nome === 'bumbo' ? passos : semOFim(passos, compasso)
  }
}

const ALTURA_DO_TUNG = 65 // Fá4
const madeira = (compasso) => (temTung(compasso) ? tungTungTung(ALTURA_DO_TUNG, compasso, GRADE) : compassoVazio(GRADE))

// --------------------------------------------------
// CANAIS
// --------------------------------------------------

const CANAIS = [
  ['baixoFunk', 0, baixo],
  ['clavinete', -0.22, clav(0)],
  ['clavinete', -0.3, clav(1)],
  ['saxTenorCurto', 0.06, sax('curta')],
  ['saxTenorLongo', 0.06, sax('longa')],
  ['trompeteSurdina', 0.2, trompete],
  ['trompeteSurdina', 0.26, golpeDoTrompete],
  ['trombone', -0.12, trombone],
  ['tromboneLongo', -0.16, notaGuia],
  ['bumboSeco', 0, peca('bumbo', BUMBO)],
  ['caixa', 0, peca('caixa', CAIXA)],
  ['caixaCorpo', 0, peca('caixa', CAIXA_CORPO)],
  ['chimbal', -0.2, peca('chimbal', CHIMBAL)],
  ['chimbalAberto', -0.24, peca('aberto', ABERTO)],
  ['ride', 0.22, peca('ride', RIDE)],
  ['pratoEscuro', 0.18, peca('prato', PRATO)],
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

const inicioDoShout = CUCINA_SECOES.find((secao) => secao.nome === 'Shout').inicio

// Onde estão a célula (exata) e o tung-tung-tung (os testes conferem)
export const CUCINA_MOTIVO = Object.freeze({
  riff: [
    { instrumento: 'saxTenorCurto', compassos: Object.fromEntries(Object.entries(CELULA_NO_SHOUT).map(([indice, tonica]) => [inicioDoShout + Number(indice), tonica])) },
    { instrumento: 'trombone', compassos: Object.fromEntries(Object.entries(CELULA_NO_SHOUT).map(([indice, tonica]) => [inicioDoShout + Number(indice), tonica - 12])) },
  ],
  tung: { compassos: COMPASSOS.map((_, compasso) => compasso).filter(temTung) },
})

// Vozes de melodia (analiseMelodica.js): o sax (curto e longo) e o trompete da ponte
export const CUCINA_MELODIA = Object.freeze([[['saxTenorCurto', 0], ['saxTenorLongo', 0]], [['trompeteSurdina', 0]]])
