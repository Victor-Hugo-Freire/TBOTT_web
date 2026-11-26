// A Ronda: Porto. Faixa do andar 5: noite no cais, navios, a tempestade chegando; o clímax dos andares.
//
// ESTILO E ANDAMENTO
//   Jazz afro-cubano em 12/8 que vira swing (hard bop), em Dó menor harmônico, ♩ = 136. Grade de 12
//   passos por compasso (4 tempos × 3 tercinas): no afro a tercina é o 12/8 do sino; no swing, a
//   colcheia com swing. bpm do ZzFXM = 136 × 3/4 = 102.
//
// HARMONIA (o que é só do Porto)
//   Dó menor harmônico (o Si natural e a segunda aumentada Lá♭ – Si) com o acorde napolitano (D♭maj7,
//   o "de Nápoles", a cidade do porto). A cadência da casa é ♭II → ♭II/V → i: o napolitano por cima
//   do baixo da dominante (D♭maj7 → D♭maj7/G → Cm), sem ♭VI → V e sem 7#9. No swing, um ciclo de
//   quintas com o napolitano no lugar do meio-diminuto (Fm9 – B♭13 – E♭maj9 – A♭maj7#11 – D♭maj7);
//   na tempestade, diminutos sobre o pedal de Dó (Bdim7/C, F#dim7/C).
//
// MATERIAL (ver MELODIA)
//   Tema A (afro): o trombone salta oitavas como um apito de navio (Sol3 → Sol4, Si♭3 → Si♭4) no pulso
//   de semínima pontuada do 12/8 (a hemíola contra as colcheias do sino: o DNA aprovado antes, com o
//   ♭2 e os saltos largos); a pergunta para no Ré♭ (o napolitano, no ar) e a resposta sobe
//   Lá♭ – Si – Dó (a segunda aumentada) e resolve no Dó. No A2 o sax responde nos buracos do trombone;
//   no A3 o tema passa para o órgão.
//   Tema B (swing): o sax tenor em colcheias com swing e tercinas, o naipe grave (trombone e sax
//   barítono) segurando as notas-guia e, no B2, o trompete com surdina nos golpes do ápice. A célula
//   do Tung (Sol – Si♭ – Dó – Si♭ – Sol em Dó) aparece exata no fim de cada B, no sax e no trombone.
//   O tung-tung-tung (madeira, em Dó) fecha algumas frases no 4º tempo.
//
// FORMA (52 compassos, ~92 s; editar em FORMA)
//   A1          (8)  afro: o sino no padrão de 12/8, bumbo no 1 e no 3, congas (tons) no 2 e no 4,
//                    o baixo antecipando os tempos; termina num breque (só o sino continua)
//   B1          (8)  swing: ride, baixo caminhando, o sax; a célula no fim
//   A2          (8)  afro com o sax respondendo ao trombone; diminuto sobre o pedal
//   Tempestade  (8)  ondas de tons em tercina crescendo, órgão de Leslie rápido nos diminutos, o
//                    trombone subindo em notas longas
//   B2          (8)  o ponto mais alto: o swing com o naipe, o trompete no ápice e a célula; virada
//                    grande de tons no fim
//   A3          (8)  afro mais leve, o tema no órgão
//   Calmaria    (4)  só o sino, o baixo (com o sub), o órgão e a guitarra com tremolo lembrando a
//                    célula; o tung-tung-tung responde; a menor energia, antes de voltar ao A1
//   Energia: A1 média → B1 média-alta → A2 média → Tempestade alta → B2 a mais alta → A3 média →
//   Calmaria a mais baixa → (A1)
//
// GRAVE E AGUDO
//   O baixo (contrabaixoCheio) fica entre Dó2 e Mi♭3, em volta do Sol2; o sub só na Calmaria. O naipe
//   é grave (trombone até Si♭4, barítono, sax tenor com passa-baixa em 1,6 kHz); o trompete só nos
//   golpes do ápice, na região do Fá4; o sino tem passa-baixa em 2,6 kHz. Os acordes do órgão deixam
//   de fora a nota que a melodia está tocando.
//
// LOOP SEM EMENDA
//   O áudio começa no A1; a Calmaria termina no D♭maj7/G (o napolitano sobre a dominante) com o
//   tung-tung-tung e resolve no Cm do A1.
//
// ONDE AJUSTAR
//   FORMA · TEMA_A, CONTRACANTO, SWING e TEMPESTADE (as frases) · FUNDO (notas-guia do naipe) ·
//   ORGAO (acordes) · BAIXO · GROOVES · DINAMICA · TUNG

import { bateria, celula, comAtenuacao, compassoVazio, criarGrade, expandirForma, linha, lerNota, montarMusica, notas, secoesDaForma, tokens, tungTungTung, voz } from './partitura.js'

const AFRO = ['Cm', 'Cm', 'Dbmaj7', 'Dbmaj7', 'Cm', 'Fm/Ab', 'Dbmaj7', 'Dbmaj7/G']
const AFRO_2 = ['Cm', 'Bdim7/C', 'Cm', 'Dbmaj7', 'Cm', 'Fm/Ab', 'Dbmaj7', 'Dbmaj7/G']
const SWING = ['Fm9', 'Bb13', 'Ebmaj9', 'Abmaj7#11', 'Dbmaj7', 'Dbmaj7/G', 'Cm9', 'Cm9']
const SWING_2 = ['Fm9', 'Bb13', 'Ebmaj9', 'Abmaj7#11', 'Dbmaj7', 'Dbmaj7/G', 'Cm9', 'Dbmaj7/G']

const FORMA = Object.freeze([
  { nome: 'A1', papel: 'afro: o sino em 12/8 e o tema no trombone', harmonia: AFRO },
  { nome: 'B1', papel: 'swing: o sax, o baixo caminhando', harmonia: SWING },
  { nome: 'A2', papel: 'afro: o sax responde ao trombone', harmonia: AFRO_2 },
  { nome: 'Tempestade', papel: 'ondas de tons, diminutos no Leslie rápido', harmonia: ['Cm', 'Bdim7/C', 'Cm', 'Bdim7/C', 'Fm/C', 'F#dim7/C', 'Dbmaj7', 'Dbmaj7/G'] },
  { nome: 'B2', papel: 'o clímax: swing com o naipe e o trompete', harmonia: SWING_2 },
  { nome: 'A3', papel: 'afro mais leve, o tema no órgão', harmonia: AFRO },
  { nome: 'Calmaria', papel: 'sino, baixo com sub e o tung-tung-tung', harmonia: ['Cm(add9)', 'Fm9/C', 'Cm(add9)', 'Dbmaj7/G'] },
])

const COMPASSOS = expandirForma(FORMA)

export const PORTO_META = Object.freeze({
  id: 'andar-porto',
  titulo: 'A Ronda: Porto',
  estilo: 'jazz afro-cubano e swing',
  andamento: 136,
  passosPorTempo: 3,
  temposPorCompasso: 4,
  compassos: COMPASSOS.length,
  inicioDoLoop: 0,
  tonalidade: 'Dó menor harmônico',
  tonica: 'C',
  modo: 'menorHarmonico',
  estrutura: 'A1 8 · B1 8 · A2 8 · Tempestade 8 · B2 8 · A3 8 · Calmaria 4',
})

export const PORTO_SECOES = secoesDaForma(FORMA)
export const PORTO_HARMONIA = Object.freeze(COMPASSOS.map((c) => c.acorde))

const GRADE = criarGrade(PORTO_META.passosPorTempo, PORTO_META.temposPorCompasso)

export const PORTO_INSTRUMENTOS = Object.freeze([
  'contrabaixoCheio', 'sub', 'trombone', 'tromboneLongo', 'saxTenorCurto', 'saxTenorLongo', 'saxBaritono', 'trompeteSurdina',
  'orgao', 'orgaoLongo', 'orgaoLeslieLento', 'orgaoLeslieRapido', 'guitarraTremolo',
  'campana', 'bumbo', 'caixa', 'caixaCorpo', 'ride', 'chimbal', 'pratoEscuro', 'madeira',
])

const VOZ = Object.freeze({
  baixo: voz('contrabaixoCheio', 'baixo', { semente: 61 }),
  sub: voz('sub', 'baixo', { semente: 62 }),
  trombone: voz('trombone', 'melodia', { semente: 63 }),
  tromboneLongo: voz('tromboneLongo', 'melodia', { semente: 64 }),
  tromboneCelula: voz('trombone', 'riff', { semente: 65 }),
  fundo: voz('tromboneLongo', 'comping', { semente: 66 }),
  sax: voz('saxTenorCurto', 'melodia', { semente: 67 }),
  saxLongo: voz('saxTenorLongo', 'melodia', { semente: 68 }),
  saxCelula: voz('saxTenorCurto', 'riff', { semente: 69 }),
  baritono: voz('saxBaritono', 'comping', { semente: 70 }),
  trompete: voz('trompeteSurdina', 'naipe', { semente: 71 }),
  orgaoTema: voz('orgao', 'melodia', { semente: 72 }),
  orgaoTemaLongo: voz('orgaoLongo', 'melodia', { semente: 73 }),
  orgaoComping: voz('orgao', 'comping', { semente: 74 }),
  orgaoAfro: voz('orgaoLeslieLento', 'comping', { semente: 75 }),
  orgaoTempestade: voz('orgaoLeslieRapido', 'comping', { semente: 76 }),
  guitarra: voz('guitarraTremolo', 'melodia', { semente: 77 }),
})

const SECOES_AFRO = new Set(['A1', 'A2', 'A3', 'Tempestade', 'Calmaria'])
const SECOES_SWING = new Set(['B1', 'B2'])

// --------------------------------------------------
// TUNG: compassos (dentro da seção) que fecham com o tung-tung-tung no 4º tempo; nesses compassos
// os passos 9 a 11 ficam livres para ele
// --------------------------------------------------

const TUNG = Object.freeze({ A1: [3], B1: [], A2: [7], Tempestade: [7], B2: [], A3: [7], Calmaria: [1, 3] })
const temTung = (compasso) => {
  const { secao, indice } = COMPASSOS[compasso]
  return TUNG[secao].includes(indice)
}
const INICIO_DO_TUNG = 9
const semOFim = (passos, compasso) => (temTung(compasso) ? passos.map((valor, passo) => (passo >= INICIO_DO_TUNG ? 0 : valor)) : passos)

// --------------------------------------------------
// MELODIA: o que distingue o Porto dos outros andares
//   Figuras rítmicas: o pulso de semínima pontuada do 12/8 (uma nota por tempo, contra as colcheias
//   do sino), a nota longa de dois tempos e, no swing, colcheias com swing.
//   Notas: Dó menor harmônico (Si natural, Lá♭ – Si), o Ré♭ do napolitano e saltos largos: oitavas
//   (o apito de navio), sétimas e sextas.
// --------------------------------------------------

// Tema A no trombone (Sol3 a Si♭4): o salto de oitava do apito de navio, notas no pulso de semínima
// pontuada do 12/8 e o fim Lá♭ – Si – Dó. 'x~' = nota longa (trombone longo).
const TEMA_A = Object.freeze([
  'G3 . . | G4 . . | Eb4~ . . | . . .',
  'Bb3 . . | Bb4 . . | Ab4 . . | G4 . .',
  'F4~ . . | . . . | Ab3 . . | Ab4 . .',
  'Db4~ . . | . . . | . . . | . . .',
  'G3 . . | G4 . . | Eb4~ . . | . . .',
  'C4 . . | Ab4 . . | F4 . . | Eb4 . .',
  'Db4 . . | Ab4 . . | F4 . . | Bb4 . .',
  'Ab3 . . | . . . | B3 . . | C4~ . .',
])

// A2: o tema com o diminuto no 2º compasso e outro fim
const TEMA_A2 = Object.freeze([
  'G3 . . | G4 . . | Eb4~ . . | . . .',
  'D4 . . | F4 . . | Ab4 . . | B3 . .',
  'C4~ . . | . . . | G4 . . | G3 . .',
  'Ab3 . . | Ab4 . . | F4~ . . | . . .',
  'G3 . . | G4 . . | Eb4~ . . | . . .',
  'C4 . . | Ab4 . . | F4 . . | Eb4 . .',
  'Db4 . . | Ab4 . . | F4 . . | Bb4 . .',
  'F4~ . . | . . . | Db4 . . | . . .',
])

// A2: o sax responde nos buracos das notas longas do trombone
const CONTRACANTO = Object.freeze([
  '. . . | . . . | . . . | C5 . G4',
  null,
  '. . . | Eb5 . . | . . . | . . .',
  '. . . | . . . | . . . | C5 . Ab4',
  '. . . | . . . | . . . | Bb4 . Eb5',
  null,
  null,
  '. . . | Ab4 . . | . . . | . . .',
])

// Tempestade: o trombone em notas longas (duas por compasso) que saltam quintas, trítonos e oitavas e
// sobem até o Si♭4
const TEMPESTADE = Object.freeze([
  'G3~ . . | . . . | G4~ . . | . . .',
  'D4~ . . | . . . | Ab4~ . . | . . .',
  'Eb4~ . . | . . . | C4~ . . | . . .',
  'B3~ . . | . . . | F4~ . . | . . .',
  'C4~ . . | . . . | Ab4~ . . | . . .',
  'A3~ . . | . . . | Eb4~ . . | . . .',
  'Db4~ . . | . . . | Ab4~ . . | . . .',
  'Bb4~ . . | . . . | G4 . . | . . .',
])

// Swing: o sax em colcheias com swing (passos 0 e 2 de cada tempo) e saltos de sexta, sétima e
// oitava entre as notas-guia
const SWING_B1 = Object.freeze([
  'C4 . . | Ab4 . . | G4 . F4 | Eb5 . C5',
  'D5 . . | Ab4 . . | F4 . D4 | . . G4',
  'Bb4~ . . | . . . | D4 . . | F4 . G4',
  'C5 . . | D5 . . | G4 . . | Eb4 . .',
  'Db4 . . | C5 . . | Ab4 . F4 | . . Ab4',
  'Db5~ . . | . . . | F4 . . | G4 . .',
  'C4 . . | G4 . . | Eb5 . . | D5 . .',
  null,
])
const SWING_B2 = Object.freeze([
  'Ab4 . C5 | Eb5 . . | F4 . . | Ab4 . C5',
  'D5 . . | Ab4 . G4 | F4 . . | D4 . G4',
  'G4~ . . | . . . | Bb3 . . | Bb4 . D5',
  'Eb5 . . | C5 . . | G4 . . | D5 . .',
  'Db5 . . | Ab4 . . | F4 . . | C5 . .',
  'Db5~ . . | . . . | Ab4 . . | F4 . .',
  null,
  null,
])
// Compasso (da seção) com a célula exata no sax (tônica Dó4) e no trombone (uma oitava abaixo)
const CELULA_NO_B = Object.freeze({ B1: 7, B2: 6 })

function temaDoTrombone(secao, indice) {
  if (secao === 'A1') return TEMA_A[indice]
  if (secao === 'A2') return TEMA_A2[indice]
  if (secao === 'Tempestade') return TEMPESTADE[indice]
  return null
}

function linhaDoSax(secao, indice) {
  if (secao === 'A2') return CONTRACANTO[indice]
  if (secao === 'B1') return SWING_B1[indice]
  if (secao === 'B2') return SWING_B2[indice]
  return null
}

// Notas-guia do naipe grave no swing: [trombone, barítono], uma por compasso
const FUNDO = Object.freeze({
  Fm9: [56, 51], Bb13: [56, 50], Ebmaj9: [55, 50], 'Abmaj7#11': [55, 48], Dbmaj7: [53, 48], 'Dbmaj7/G': [53, 49], Cm9: [51, 46],
})

// O fundo do naipe: uma nota por compasso no B1, duas no B2 (no 1 e no 3: o ápice)
const passosDoFundo = (secao) => (secao === 'B2' ? [0, 6] : [0])

// O trombone: o tema (A1, A2), a linha da tempestade, a célula e o fundo do swing. Curtas no
// trombone, longas ('~') no trombone longo.
function trombone(articulacao) {
  return (compasso) => {
    const { secao, indice, acorde } = COMPASSOS[compasso]
    if (SECOES_SWING.has(secao)) {
      if (CELULA_NO_B[secao] === indice) return articulacao === 'curta' ? celula(48, VOZ.tromboneCelula, compasso, GRADE) : null
      if (articulacao !== 'longa' || (secao === 'B2' && indice === 7)) return null
      return notas(passosDoFundo(secao).map((passo) => ({ passo, midi: FUNDO[acorde][0] })), VOZ.fundo, compasso, GRADE)
    }
    const texto = temaDoTrombone(secao, indice)
    if (!texto) return null
    return semOFim(linha(texto, articulacao === 'longa' ? VOZ.tromboneLongo : VOZ.trombone, compasso, GRADE, 0, 0, articulacao), compasso)
  }
}

function sax(articulacao) {
  return (compasso) => {
    const { secao, indice } = COMPASSOS[compasso]
    if (CELULA_NO_B[secao] === indice) return articulacao === 'curta' ? celula(60, VOZ.saxCelula, compasso, GRADE) : null
    const texto = linhaDoSax(secao, indice)
    if (!texto) return null
    const extra = secao === 'B1' ? 0.1 : 0
    return semOFim(linha(texto, articulacao === 'longa' ? VOZ.saxLongo : VOZ.sax, compasso, GRADE, 0, extra, articulacao), compasso)
  }
}

function baritono(compasso) {
  const { secao, indice, acorde } = COMPASSOS[compasso]
  if (!SECOES_SWING.has(secao) || CELULA_NO_B[secao] === indice || (secao === 'B2' && indice === 7)) return null
  return notas(passosDoFundo(secao).map((passo) => ({ passo, midi: FUNDO[acorde][1] })), VOZ.baritono, compasso, GRADE)
}

// O trompete com surdina só no ápice do B2: golpes curtos no contratempo do swing (Lá♭4, Fá4)
const GOLPES_DO_TROMPETE = Object.freeze({ 4: [[2, 68], [8, 68]], 5: [[2, 65]] })
function trompete(compasso) {
  const { secao, indice } = COMPASSOS[compasso]
  if (secao !== 'B2' || !GOLPES_DO_TROMPETE[indice]) return null
  return notas(GOLPES_DO_TROMPETE[indice].map(([passo, midi]) => ({ passo, midi })), VOZ.trompete, compasso, GRADE)
}

// A3: o tema A no órgão (curtas no órgão, longas no órgão longo)
function orgaoTema(articulacao) {
  return (compasso) => {
    const { secao, indice } = COMPASSOS[compasso]
    if (secao !== 'A3') return null
    return semOFim(linha(TEMA_A[indice], articulacao === 'longa' ? VOZ.orgaoTemaLongo : VOZ.orgaoTema, compasso, GRADE, 0, 0, articulacao), compasso)
  }
}

// --------------------------------------------------
// ÓRGÃO: acordes de três notas no 2 e no 4 no afro (Leslie lento), no 1 e no 3 na tempestade (Leslie
// rápido), golpes no contratempo no swing; a nota que a melodia toca no compasso fica de fora
// --------------------------------------------------

const ACORDES = Object.freeze({
  Cm: [55, 60, 63], Dbmaj7: [53, 56, 60], 'Fm/Ab': [56, 60, 65], 'Dbmaj7/G': [56, 61, 65], 'Bdim7/C': [59, 62, 65],
  'Fm/C': [56, 60, 65], 'F#dim7/C': [57, 60, 63], 'Cm(add9)': [55, 60, 62], 'Fm9/C': [56, 63, 67],
  Fm9: [56, 63], Bb13: [56, 62], Ebmaj9: [55, 62], 'Abmaj7#11': [55, 60], Cm9: [51, 58],
})

// Alturas que a melodia toca no compasso (o tema, o contracanto, o swing ou a linha da tempestade)
function alturasDaMelodia(compasso) {
  const { secao, indice } = COMPASSOS[compasso]
  const textos = [temaDoTrombone(secao, indice), linhaDoSax(secao, indice), secao === 'A3' ? TEMA_A[indice] : null]
  const alturas = new Set()
  for (const texto of textos) {
    if (!texto) continue
    for (const token of tokens(texto)) {
      const nota = lerNota(token)
      if (nota) alturas.add(nota.midi)
    }
  }
  return alturas
}

function orgao(tipo, indiceDaVoz) {
  return (compasso) => {
    const { secao, indice, acorde } = COMPASSOS[compasso]
    let passos
    let v
    let extra = 0
    if (tipo === 'afro' && SECOES_AFRO.has(secao) && secao !== 'Tempestade') {
      passos = secao === 'Calmaria' ? [0] : [3, 9]
      v = VOZ.orgaoAfro
      extra = secao === 'Calmaria' ? 0.25 : 0
    } else if (tipo === 'tempestade' && secao === 'Tempestade') {
      passos = [0, 3, 6, 9]
      v = VOZ.orgaoTempestade
    } else if (tipo === 'swing' && SECOES_SWING.has(secao) && CELULA_NO_B[secao] !== indice && !(secao === 'B2' && indice === 7)) {
      passos = secao === 'B2' ? [2, 5, 8, 11] : [2, 8]
      v = VOZ.orgaoComping
    } else {
      return null
    }
    const nota = ACORDES[acorde][indiceDaVoz]
    if (nota === undefined || alturasDaMelodia(compasso).has(nota)) return null
    const lista = passos.filter((passo) => !temTung(compasso) || passo < INICIO_DO_TUNG)
    return notas(lista.map((passo) => ({ passo, midi: nota, atenuacao: extra })), v, compasso, GRADE)
  }
}

// Calmaria: a guitarra com tremolo lembra a célula (Sol – Si♭ – Dó) em semínimas
const LEMBRANCA = Object.freeze({ 0: 'G4 . . | Bb4 . . | C5 . . | . . .', 2: 'G4 . . | Bb4 . . | . . . | . . .', 3: 'Ab4 . . | . . . | . . . | . . .' })
function guitarra(compasso) {
  const { secao, indice } = COMPASSOS[compasso]
  if (secao !== 'Calmaria' || !LEMBRANCA[indice]) return null
  return semOFim(linha(LEMBRANCA[indice], VOZ.guitarra, compasso, GRADE), compasso)
}

// --------------------------------------------------
// BAIXO: no afro, um ostinato que antecipa os tempos (a nota entra no último passo do compasso e
// substitui o 1 do compasso seguinte); no swing, caminhando em semínimas; pedal de Dó na tempestade
// --------------------------------------------------

const BAIXO = Object.freeze({
  A1: [
    'C3 . . | . . G2 | . . . | . . C3', '. . . | . . G2 | . . . | . . Db3', '. . . | . . Ab2 | . . . | . . Db3', '. . . | . . Ab2 | . . . | . . .',
    'C3 . . | . . G2 | . . . | . . Ab2', '. . . | . . C3 | . . . | . . Db3', '. . . | . . Ab2 | . . . | . . G2', '. . . | . . . | . . . | . . .',
  ],
  B1: [
    'F2 . . | Ab2 . . | C3 . . | B2 . .', 'Bb2 . . | D3 . . | F2 . . | E2 . .', 'Eb2 . . | G2 . . | Bb2 . . | A2 . .', 'Ab2 . . | C3 . . | Eb3 . . | D3 . .',
    'Db3 . . | C3 . . | Ab2 . . | F2 . F#2', 'G2 . . | Ab2 . . | F2 . . | Db3 . .', 'C3 . . | G2 . . | Bb2 . . | B2 . .', 'C3 . . | Eb3 . . | G2 . . | B2 . .',
  ],
  A2: [
    'C3 . . | . . G2 | . . . | . . C3', '. . . | . . B2 | . . . | . . C3', '. . . | . . G2 | . . . | . . Db3', '. . . | . . Ab2 | . . . | . . C3',
    '. . . | . . G2 | . . . | . . Ab2', '. . . | . . C3 | . . . | . . Db3', '. . . | . . Ab2 | . . . | . . G2', '. . . | . . Db3 | . . . | . . .',
  ],
  Tempestade: [
    'C2 . . | . . . | G2 . . | . . .', 'C2 . . | . . . | B1 . . | . . .', 'C3 . . | . . . | G2 . . | . . .', 'C3 . . | . . . | B2 . . | . . .',
    'C2 . . | . . . | F2 . . | . . .', 'C2 . . | . . . | F#2 . . | . . .', 'Db2 . . | . . . | Ab2 . . | . . .', 'G2 . . | . . . | Db3 . . | . . .',
  ],
  B2: [
    'F2 . . | Ab2 . . | C3 . . | B2 . .', 'Bb2 . . | D3 . . | F2 . . | E2 . .', 'Eb2 . . | G2 . . | Bb2 . . | A2 . .', 'Ab2 . . | C3 . . | Eb3 . . | D3 . .',
    'Db3 . . | C3 . . | Ab2 . . | F2 . F#2', 'G2 . . | Ab2 . . | F2 . . | Db3 . .', 'C3 . . | Eb3 . . | G2 . . | A2 . Ab2', 'G2 . . | . . . | G2 . . | . . .',
  ],
  A3: [
    'C3 . . | . . G2 | . . . | . . C3', '. . . | . . G2 | . . . | . . Db3', '. . . | . . Ab2 | . . . | . . Db3', '. . . | . . Ab2 | . . . | . . C3',
    '. . . | . . G2 | . . . | . . Ab2', '. . . | . . C3 | . . . | . . Db3', '. . . | . . Ab2 | . . . | . . G2', '. . . | . . Db3 | . . . | . . .',
  ],
  Calmaria: ['C2 . . | . . . | . . . | . . .', 'C2 . . | . . . | G2 . . | . . .', 'C2 . . | . . . | Eb2 . . | . . .', 'G2 . . | . . . | . . . | . . .'],
})

function baixo(compasso) {
  const { secao, indice } = COMPASSOS[compasso]
  return semOFim(linha(BAIXO[secao][indice], VOZ.baixo, compasso, GRADE), compasso)
}

// Sub: embaixo das notas longas da Calmaria
const SUB = Object.freeze({ 0: 36, 1: 36, 2: 36, 3: 31 })
const sub = (compasso) => {
  const { secao, indice } = COMPASSOS[compasso]
  return secao === 'Calmaria' ? notas([{ passo: 0, midi: SUB[indice], atenuacao: 0.15 }], VOZ.sub, compasso, GRADE) : null
}

// --------------------------------------------------
// BATERIA: o sino do 12/8 afro e as congas (tons) ↔ o ride do swing; ondas de tons na tempestade
// --------------------------------------------------

// Sino: o padrão de sete batidas do 12/8 (passos 0, 2, 4, 5, 7, 9 e 11), acentuado no 1
const SINO = Object.freeze({ X: 12.12, x: 12.32 })
const SINO_12_8 = 'X . x | . x x | . x . | x . x'
// Bumbo e tons no mesmo canal: K/k = bumbo; l/m/h = tons grave, médio e agudo (as congas no afro)
const BUMBO = Object.freeze({ K: 12.42, k: 12.62, f: 12.78, l: 19.28, m: 22.32, h: 26.38 })
const CAIXA = Object.freeze({ X: 12.1, x: 12.35, g: 12.75, p: 12.55, q: 12.4 })
const CAIXA_CORPO = Object.freeze({ X: 12, x: 12.3, g: 12.92, p: 12.6, q: 12.45 })
const RIDE = Object.freeze({ X: 12.3, x: 12.45, s: 12.66 })
const PEDAL = Object.freeze({ c: 12.55 })
const PRATO = Object.freeze({ P: 12.12 })

// Ondas de tons na tempestade: cada compasso mais cheio (e mais forte, ver peca())
const ONDAS = Object.freeze([
  'K . . | . . . | K . . | l . m',
  'K . . | . . l | K . . | l . m',
  'K . . | l . m | K . . | l m h',
  'K . l | m . h | K . l | m . h',
  'K l m | h . . | K l m | h m l',
  'K l m | h m l | K l m | h m l',
  'h m l | h m l | h m l | h m l',
  'K . . | h h m | m l l | . . .',
])

const GROOVES = Object.freeze({
  sino: {
    A1: (i) => (i === 7 ? 'X . x | . x x | . x . | x . x' : SINO_12_8),
    A2: () => SINO_12_8,
    Tempestade: () => SINO_12_8,
    A3: () => SINO_12_8,
    Calmaria: () => SINO_12_8,
  },
  bumbo: {
    // Afro: bumbo no 1 e no 3, congas (tons) no 2 e no 4; o A1 termina num breque (só o sino)
    A1: (i) => (i === 7 ? 'K . . | . . . | . . . | . . .' : i % 2 === 0 ? 'K . . | m . . | K . . | h . m' : 'K . . | m . h | K . . | h . m'),
    B1: (i) => (i % 2 === 0 ? 'f . . | f . . | f . k | f . .' : 'f . . | f . . | f . . | f . k'),
    A2: (i) => (i % 2 === 0 ? 'K . . | m . h | K . . | h . m' : 'K . . | m . . | K . h | h . m'),
    Tempestade: (i) => ONDAS[i],
    B2: (i) => (i === 7 ? 'K . . | h h m | m l l | K . .' : i % 2 === 0 ? 'f . . | f . k | f . . | f . k' : 'f . . | f . . | f . k | f . k'),
    A3: (i) => (i % 2 === 0 ? 'K . . | m . . | K . . | h . .' : 'K . . | . . . | K . . | h . m'),
  },
  caixa: {
    A1: (i) => (i === 7 ? 'X . . | . . . | . . . | . . .' : null), // o breque
    B1: (i) => (i === 7 ? '. . . | . . . | . . . | p q X' : i % 2 === 0 ? '. . g | . . . | . . g | . . .' : '. . . | . . g | . . . | . . g'),
    A2: (i) => (i === 6 ? '. . . | . . . | . . . | p q X' : null),
    Tempestade: (i) => (i === 6 ? '. . . | . . . | p q x | p q X' : null),
    B2: (i) => (i === 7 ? 'X . . | . . . | . . . | . . .' : i % 2 === 0 ? '. . g | . . g | . . g | . . .' : '. . . | . . g | . . g | . . g'),
  },
  ride: {
    // "1, 2-a, 3, 4-a": o swing
    B1: () => 'X . . | x . s | X . . | x . s',
    B2: (i) => (i === 7 ? null : 'X . . | x . s | X . . | x . s'),
  },
  pedal: {
    A1: (i) => (i === 7 ? null : '. . . | c . . | . . . | c . .'),
    B1: () => '. . . | c . . | . . . | c . .',
    A2: () => '. . . | c . . | . . . | c . .',
    B2: (i) => (i === 7 ? null : '. . . | c . . | . . . | c . .'),
    A3: () => '. . . | c . . | . . . | c . .',
  },
  prato: {
    A1: (i) => (i === 0 ? 'P . . | . . . | . . . | . . .' : null),
    Tempestade: (i) => (i === 6 || i === 7 ? 'P . . | . . . | . . . | . . .' : null),
    B2: (i) => (i === 0 || i === 4 ? 'P . . | . . . | . . . | . . .' : null),
  },
})

// Intensidade da bateria por seção (atenuação somada; 0 = cheia)
const DINAMICA = Object.freeze({ A1: 0.06, B1: 0.1, A2: 0.08, Tempestade: 0, B2: 0, A3: 0.16, Calmaria: 0.35 })

function peca(nome, mapa) {
  return (compasso) => {
    const { secao, indice } = COMPASSOS[compasso]
    const groove = GROOVES[nome][secao]
    const texto = groove ? groove(indice) : null
    if (!texto) return null
    // Tempestade: as ondas crescem compasso a compasso
    const extra = secao === 'Tempestade' && nome === 'bumbo' ? (7 - indice) * 0.05 : DINAMICA[secao]
    return semOFim(bateria(texto, comAtenuacao(mapa, extra), GRADE), compasso)
  }
}

const ALTURA_DO_TUNG = 72 // Dó5
const madeira = (compasso) => (temTung(compasso) ? tungTungTung(ALTURA_DO_TUNG, compasso, GRADE) : compassoVazio(GRADE))

// --------------------------------------------------
// CANAIS
// --------------------------------------------------

const CANAIS = [
  ['contrabaixoCheio', 0, baixo],
  ['sub', 0, sub],
  ['trombone', 0.1, trombone('curta')],
  ['tromboneLongo', 0.1, trombone('longa')],
  ['saxTenorCurto', -0.12, sax('curta')],
  ['saxTenorLongo', -0.12, sax('longa')],
  ['saxBaritono', 0.04, baritono],
  ['trompeteSurdina', 0.24, trompete],
  ['orgao', -0.06, orgaoTema('curta')],
  ['orgaoLongo', -0.06, orgaoTema('longa')],
  ['orgao', -0.26, orgao('swing', 0)],
  ['orgao', -0.32, orgao('swing', 1)],
  ['orgaoLeslieLento', -0.24, orgao('afro', 0)],
  ['orgaoLeslieLento', -0.3, orgao('afro', 1)],
  ['orgaoLeslieLento', -0.2, orgao('afro', 2)],
  ['orgaoLeslieRapido', -0.24, orgao('tempestade', 0)],
  ['orgaoLeslieRapido', -0.3, orgao('tempestade', 1)],
  ['orgaoLeslieRapido', -0.2, orgao('tempestade', 2)],
  ['guitarraTremolo', 0.28, guitarra],
  ['campana', 0.2, peca('sino', SINO)],
  ['bumbo', 0, peca('bumbo', BUMBO)],
  ['caixa', 0, peca('caixa', CAIXA)],
  ['caixaCorpo', 0, peca('caixa', CAIXA_CORPO)],
  ['ride', 0.22, peca('ride', RIDE)],
  ['chimbal', -0.2, peca('pedal', PEDAL)],
  ['pratoEscuro', 0.18, peca('prato', PRATO)],
  ['madeira', 0.08, madeira],
]

export const PORTO_SONG = montarMusica({
  instrumentos: PORTO_INSTRUMENTOS,
  canais: CANAIS,
  compassos: PORTO_META.compassos,
  inicioDoLoop: PORTO_META.inicioDoLoop,
  grade: GRADE,
  andamento: PORTO_META.andamento,
})

const compassoDaCelula = (nome) => PORTO_SECOES.find((secao) => secao.nome === nome).inicio + CELULA_NO_B[nome]

export const PORTO_MOTIVO = Object.freeze({
  riff: [
    { instrumento: 'saxTenorCurto', compassos: { [compassoDaCelula('B1')]: 60, [compassoDaCelula('B2')]: 60 } },
    { instrumento: 'trombone', compassos: { [compassoDaCelula('B1')]: 48, [compassoDaCelula('B2')]: 48 } },
  ],
  tung: { compassos: COMPASSOS.map((_, compasso) => compasso).filter(temTung) },
})

// Vozes de melodia (cada voz: os canais [instrumento, ordem] que formam uma linha), para a análise
// melódica (analiseMelodica.js): o trombone, o sax e o tema no órgão
export const PORTO_MELODIA = Object.freeze([
  [['trombone', 0], ['tromboneLongo', 0]],
  [['saxTenorCurto', 0], ['saxTenorLongo', 0]],
  [['orgao', 0], ['orgaoLongo', 0]],
])
