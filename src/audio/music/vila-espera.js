// A Vila Espera — trilha externa de TBOTT (ciclo contínuo, registro mais grave).
// Blues-rock com harmonia jazzística: shuffle real, riffs marcantes e clima noturno.
//
// INTRODUÇÃO E LOOP
//   A faixa começa por uma introdução de VILA_ESPERA_INTRO_COMPASSOS compassos (3 × 2,4 s = 7,2 s a
//   ♩ = 100), que toca uma vez só: órgão sustentado e baixo, depois o vibrafone apresenta a célula
//   do Tung com o ride baixinho, e no último compasso a bateria cresce, o baixo desce até o Ré e o
//   tung-tung-tung e o Dó# do sax levam ao tema. A harmonia é I – IV – V (D9 – G13 – A7#9), no
//   mesmo tom e com os mesmos timbres do corpo. Ela fica no fim deste arquivo.
//   Depois dela, o corpo (compassos 0 a 31) fica em loop. A emenda 31 → 0 é a virada V → I que já
//   faz parte do tema (A7#9 → D7, com o rulo de caixa e o Dó# do sax), e a cauda das notas do
//   compasso 31 volta para o começo do corpo (loop contínuo do ZzFXM): o loop não aparece.
//   A introdução termina no mesmo A7#9 com o mesmo Dó#, então a primeira entrada do tema soa
//   igual a todas as outras voltas.

// Grade rítmica: 12 passos por compasso (tercinas de colcheia).
//   Cada tempo = 3 passos (0, 1, 2). Colcheias com swing caem nos passos 0 e 2.
//   Com bpm 75 no ZzFXM (cada passo = semicolcheia), o andamento percebido é ♩ = 100.
//
// Timbres: todos vêm de instrumentos.js (biblioteca comum da trilha). As linhas são
// escritas em altura real (ex.: 'D4') e convertidas para o número de nota de cada
// instrumento. Vibrafone, clarinete e trompete estão escritos uma oitava acima do que
// soam (oitava: -12 em VOZ), o que deixa a mistura mais grave e encorpada.
//
// Dinâmica: cada nota tem atenuação (parte decimal da nota do ZzFXM). Os tempos 1 e 3
// pesam mais que o 2 e o 4 na melodia e no baixo; a caixa acentua o 2 e o 4 e tem ghost
// notes; o ride acentua o 2 e o 4 e toca a nota "skip" mais fraca. Um desvio pequeno e
// fixo por nota (variacao()) evita que duas notas iguais soem idênticas.
//
// Motivo do Tung (motivos.js): o tung-tung-tung na madeira leva ao tempo forte nos
// compassos 3, 11, 15 e 27 (no lugar do último tempo da caixa).
//
// Pan de banda (nada nos extremos): baixo, bumbo, caixa e sax tenor no centro; chimbal
// à esquerda e ride à direita; guitarra à esquerda; órgão à direita; metais espalhados.
//
// Estrutura (32 compassos, ciclo):
//   0-11  Tema em blues de 12 compassos (riff em uníssono, pergunta/resposta, turnaround)
//   12-15 Interlúdio esparso (órgão, baixo, clarinete e marimba; rim click e ride entram no fim)
//   16-23 Desenvolvimento: C9–G9–D7#9, solo de sax tenor, shouts dos metais, bateria rock
//   24-31 Retorno ao riff e ao tema B; o compasso 31 (A7#9) resolve no compasso 0

import { INSTRUMENTOS, notaDoInstrumento } from './instrumentos.js'
import { celulaDoTung, passosDoTungTungTung, TUNG_TUNG_TUNG_ATENUACAO } from './motivos.js'
import {
  bateria as batidasDaIntro,
  comAtenuacao,
  criarGrade,
  linha as linhaDaIntro,
  montarMusica,
  notas as notasDaIntro,
  voz as vozDaIntro,
} from './partitura.js'

export const VILA_ESPERA_META = Object.freeze({
  id: 'a-vila-espera',
  title: 'A Vila Espera',
  bpm: 75,
  perceivedBpm: 100,
  signature: '4/4 shuffle (12 passos por compasso)',
  stepsPerBar: 12,
  bars: 32,
  // O corpo começa no tema (compasso 0), logo depois da introdução
  loopStart: 0,
  tonalidade: 'Ré blues (D7)',
  estrutura: 'Introdução 3 (uma vez) · Tema blues 12 · Interlúdio 4 · Desenvolvimento 8 · Retorno 8 (em loop)',
  loop: true,
  // Envio para a reverb de sala do master (0 a 1)
  reverb: 0.16,
})

// Instrumentos da faixa, na ordem do array de instrumentos da música
const INSTRUMENTOS_DA_FAIXA = Object.freeze([
  'guitarraJazz', 'vibrafone', 'contrabaixo', 'orgao', 'madeira', 'bumbo', 'caixa', 'ride',
  'chimbal', 'clarinete', 'trombone', 'saxBaritono', 'trompete', 'saxTenor', 'orgao16', 'caixaCorpo',
])

const I = Object.freeze(Object.fromEntries(INSTRUMENTOS_DA_FAIXA.map((nome, indice) => [nome, indice])))

export const VILA_ESPERA_INSTRUMENTOS = INSTRUMENTOS_DA_FAIXA

// --------------------------------------------------
// BASE TÉCNICA
// --------------------------------------------------

const STEPS = 12
const BARS = 32
const REST = 0

const PITCH_CLASS = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }

// Perfis de dinâmica: atenuação por posição no compasso (0 = cheio)
const PERFIS = Object.freeze({
  // melodia: tempos 1 e 3 > tempos 2 e 4 > colcheias do meio
  melodia: (step) => (step % 6 === 0 ? 0.04 : step % 3 === 0 ? 0.12 : 0.24),
  baixo: (step) => (step % 6 === 0 ? 0.02 : step % 3 === 0 ? 0.1 : 0.24),
  // acompanhamento: mais baixo que a melodia, com o primeiro ataque do compasso mais firme
  comping: (step) => (step === 0 ? 0.14 : step % 3 === 0 ? 0.24 : 0.3),
  // ataques de conjunto dos metais: acentuados
  naipe: () => 0.06,
})

// Desvio fixo de -0,04 a +0,04 por nota, para nenhuma nota repetida soar igual à outra
function variacao(bar, step, semente) {
  const x = Math.sin(bar * 12.9898 + step * 78.233 + semente * 37.719) * 43758.5453
  return ((x - Math.floor(x)) - 0.5) * 0.08
}

// Cada voz: instrumento da biblioteca, oitava em relação ao escrito e perfil de dinâmica
const voz = (instrumento, perfil, oitava = 0, semente = 0) => Object.freeze({ instrumento, perfil, oitava, semente })

const VOZ = Object.freeze({
  guitar: voz('guitarraJazz', 'comping', 0, 1),
  vibes: voz('vibrafone', 'comping', -12, 2),
  bass: voz('contrabaixo', 'baixo', 0, 3),
  organ: voz('orgao', 'comping', 0, 4),
  organ16: voz('orgao16', 'comping', 0, 5),
  tenor: voz('saxTenor', 'melodia', 0, 6),
  bari: voz('saxBaritono', 'melodia', 0, 7),
  trumpet: voz('trompete', 'melodia', -12, 8),
  trombone: voz('trombone', 'naipe', 0, 9),
  clarinet: voz('clarinete', 'comping', -12, 10),
})

function emptySlots() {
  return Array(STEPS).fill(REST)
}

function buildChannel(instrumentIndex, panning, slots) {
  return [instrumentIndex, panning, ...slots]
}

// 'D4' -> 62, 'Bb3' -> 58, 'F#4' -> 66. Retorna null para pausa ou token inválido.
function midiOf(name) {
  const match = /^([A-G])([#b]?)(\d)$/.exec(String(name))
  if (!match) return null

  const accidental = match[2] === '#' ? 1 : match[2] === 'b' ? -1 : 0
  return 12 * (Number(match[3]) + 1) + PITCH_CLASS[match[1]] + accidental
}

// Converte altura MIDI em número de nota do instrumento da voz, com a dinâmica do passo.
// `perfil` troca o perfil da voz (os ataques de conjunto usam 'naipe').
function toNote(midi, v, bar, step, perfil = v.perfil) {
  const atenuacao = PERFIS[perfil](step) + variacao(bar, step, v.semente)
  return notaDoInstrumento(midi + v.oitava, v.instrumento, atenuacao)
}

function tokensOf(line) {
  return String(line).replace(/\|/g, ' ').trim().split(/\s+/)
}

function parseLine(line, v, bar, shift = 0) {
  const tokens = tokensOf(line)
  const slots = emptySlots()

  for (let step = 0; step < STEPS; step += 1) {
    const midi = midiOf(tokens[step])
    if (midi !== null) slots[step] = toNote(midi + shift, v, bar, step)
  }

  return slots
}

function parseDrums(line, map) {
  const tokens = tokensOf(line)
  const slots = emptySlots()

  for (let step = 0; step < STEPS; step += 1) {
    const value = map[tokens[step]]
    if (value) slots[step] = value
  }

  return slots
}

function midiSlots(list, v, bar) {
  return list.map((midi, step) => (midi === null ? REST : toNote(midi, v, bar, step)))
}

const shiftMidi = (list, amount) =>
  list.map(midi => (midi === null ? null : midi + amount))

// --------------------------------------------------
// HARMONIA
// --------------------------------------------------

const chord = (sym, r) => ({ sym, r }) // r = fundamental MIDI para o contrabaixo

const BAR_CHORDS = Object.freeze([
  // 0–11: tema — blues de 12 compassos com turnaround jazzístico
  [chord('D7', 38)], [chord('G7', 43)], [chord('D7', 38)], [chord('Am7', 45), chord('D7', 38)],
  [chord('G7', 43)], [chord('G#dim7', 44)], [chord('D7', 38)], [chord('B7', 35)],
  [chord('Em7', 40), chord('A7', 45)], [chord('D7', 38), chord('B7', 35)],
  [chord('Em7', 40), chord('A7', 45)], [chord('D7', 38), chord('A7#9', 45)],
  // 12–15: interlúdio esparso
  [chord('D9', 38)], [chord('D9', 38)], [chord('G13', 43)], [chord('A7#9', 45)],
  // 16–23: desenvolvimento
  [chord('C9', 36)], [chord('G9', 43)], [chord('D7#9', 38)], [chord('B7#9', 35)],
  [chord('Em9', 40)], [chord('A7b13', 45)], [chord('Bb7', 46), chord('A7', 45)], [chord('A7#9', 45)],
  // 24–31: retorno (o compasso 31 é a dominante que leva ao compasso 0)
  [chord('D7', 38)], [chord('G7', 43)], [chord('D7', 38)], [chord('Am7', 45), chord('D7', 38)],
  [chord('G7', 43)], [chord('G#dim7', 44)], [chord('D7', 38)], [chord('A7#9', 45)],
])

export const VILA_ESPERA_HARMONY = Object.freeze(
  BAR_CHORDS.map(chords => chords.map(item => item.sym).join(' '))
)

// Voicings sem fundamental (terça, sétima, nona/extensões), do grave ao agudo, em MIDI.
const VOICINGS = Object.freeze({
  D9: [54, 60, 64],        // F#3 C4 E4
  D7: [54, 60, 64],
  G13: [59, 64, 65],       // B3 E4 F4
  G7: [59, 65, 69],        // B3 F4 A4
  G9: [59, 65, 69],
  'A7#9': [55, 61, 72],    // G3 C#4 C5
  Am7: [55, 60, 64],       // G3 C4 E4
  'G#dim7': [59, 62, 65],  // B3 D4 F4
  B7: [54, 57, 63],        // F#3 A3 D#4
  Em7: [55, 59, 62],       // G3 B3 D4
  A7: [55, 61, 64],        // G3 C#4 E4
  'D7#9': [54, 60, 65],    // F#3 C4 F4
  C9: [52, 58, 62],        // E3 Bb3 D4
  'B7#9': [51, 57, 62],    // D#3 A3 D4
  Em9: [55, 62, 66],       // G3 D4 F#4
  A7b13: [55, 61, 65],     // G3 C#4 F4
  Bb7: [50, 56, 60],       // D3 Ab3 C4
})

function chordAt(bar, step) {
  const chords = BAR_CHORDS[bar]
  return chords[1] && step >= 6 ? chords[1] : chords[0]
}

const isMinor = item => /^[A-G][#b]?m/.test(item.sym) && !/^[A-G][#b]?maj/.test(item.sym)
const thirdOf = item => (isMinor(item) || item.sym.includes('dim') ? 3 : 4)

// Mantém as linhas de baixo numa região confortável (Ré1–Mi3).
function fold(midi) {
  let note = midi
  while (note > 52) note -= 12
  while (note < 34) note += 12
  return note
}

// --------------------------------------------------
// LINHAS MELÓDICAS (altura real; 12 posições por compasso, 3 por tempo)
// --------------------------------------------------

// Riff do tema (sax tenor, guitarra, barítono): evolução da escala de blues original.
const HEAD_1 = 'D4 . . | . . F4 | G4 . Ab4 | A4 . .'
const HEAD_2 = 'C5 . . | Bb4 . A4 | G4 . . | . . F4'
const HEAD_3 = 'D4 . . | . . F4 | G4 . Ab4 | A4 . Bb4'
const HEAD_4 = 'C5 . . | A4 . . | F#4 . . | D4 . .'

// Contrabaixo em riff (versão com fundamental firme sobre o IV grau).
const BASS_RIFF_1 = 'D2 . . | . . F2 | G2 . Ab2 | A2 . .'
const BASS_RIFF_2 = 'G2 . . | . . F2 | G2 . . | . . F2'
const BASS_RIFF_3 = 'D2 . . | . . F2 | G2 . Ab2 | A2 . Bb2'
const BASS_RIFF_4 = 'A2 . . | . . G2 | D2 . F#2 | A2 . .'

// Segunda frase (pergunta/resposta entre trompete e sax tenor).
const P2_1 = 'G4 . . | B4 . D5 | C5 . Bb4 | A4 . .'
const P2_2 = 'Ab4 . . | . . . | B4 . . | . . D5'
const P2_3 = 'A4 . . | . . D5 | F5 . E5 | D5 . A4'
const P2_4 = 'F#4 . . | . . A4 | B4 . D#5 | C#5 . A4'

// Terceira frase (turnaround).
const P3_1 = 'G4 . B4 | D5 . . | C#5 . . | A4 . .'
const P3_2 = 'A4 . . | F#4 . . | D#4 . F#4 | A4 . .'
const P3_3 = 'G4 . B4 | D5 . . | E5 . . | C#5 . A4'
const P3_4 = 'D5 . . | A4 . F#4 | C5 . . | . . .'

// Solo de sax tenor no desenvolvimento (compassos 16–23).
const SOLO = [
  'G4 . . | Bb4 . C5 | E5 . D5 | C5 . Bb4',
  'A4 . . | B4 . D5 | F5 . E5 | D5 . B4',
  'F4 . . | F#4 . A4 | C5 . . | A4 . F4',
  'D4 . . | D#4 . F#4 | A4 . . | D5 . B4',
  'G4 . B4 | D5 . . | B4 . . | G4 . F#4',
  'C#4 . E4 | F4 . G4 | A4 . . | G4 . F4',
  'D5 . . | Bb4 . . | C#5 . . | A4 . .',
  'C5 . . | C#5 . . | . . . | . . .',
]

const RETURN_END = 'D5 . . | . . A4 | F#4 . . | . . .'

// Pickup do compasso 31: C#4 (terça de A7) resolve em Ré no compasso 0.
const LOOP_PICKUP = '. . . | . . . | . . . | . . C#4'

// Interlúdio (compassos 12–15).
const BREAK_BASS = [
  'D2 . . | . . . | A2 . . | . . .',
  'G2 . . | . . . | D3 . . | . . .',
  'A2 . . | . . . | G2 . . | E2 . D2', // desce para o Dó do compasso 16
]
const BREAK_CLARINET = ['D5 . . | . . . | F5 . . | . . .', 'G5 . . | . . . | Ab5 . . | A5 . .']
const BREAK_MARIMBA_1 = 'A4 . . | . . . | F#5 . . | . . .'
const BREAK_MARIMBA_2 = 'B4 . . | . . . | E5 . . | . . .'

// Baixo do compasso 31: resolve em Ré no compasso 0 (E → D).
const LOOP_BASS = 'A2 . . | . . . | G2 . . | F#2 . E2'

// Temas exportados (altura do sax tenor).
export const VILA_ESPERA_MELODY_A = Object.freeze(parseLine(HEAD_1, VOZ.tenor, 0))
export const VILA_ESPERA_MELODY_B = Object.freeze(parseLine(P2_1, VOZ.tenor, 4))
export const VILA_ESPERA_MELODY_RETURN = Object.freeze(parseLine(P3_1, VOZ.tenor, 8))

// --------------------------------------------------
// GERADORES (baixo caminhando, baixo rock, órgão e metais por voicing)
// --------------------------------------------------

// Contrabaixo caminhando em colcheias ternárias: fundamental, terça, quinta, sexta/sétima
// e nota de aproximação cromática para o próximo compasso.
function walkMidi(bar) {
  const [a, b] = BAR_CHORDS[bar]
  const nextRoot = BAR_CHORDS[(bar + 1) % BARS][0].r
  const line = Array(STEPS).fill(null)
  const put = (step, midi) => { line[step] = fold(midi) }

  if (b) {
    put(0, a.r)
    put(3, a.r + 7)
    put(6, b.r)
    put(9, b.r + thirdOf(b))
  } else {
    put(0, a.r)
    put(3, a.r + thirdOf(a))
    put(6, a.r + 7)
    put(9, a.r + (isMinor(a) ? 10 : 9))
  }

  const last = b || a
  if (nextRoot !== last.r) {
    put(11, nextRoot + (nextRoot > last.r ? -1 : 1))
  }

  return line
}

// Baixo rock do desenvolvimento: fundamental pulsante, quinta e aproximação.
const DRIVE = Object.freeze([[0, 0], [2, 0], [3, 0], [5, 7], [6, 0], [8, 0], [9, 7]])

function driveMidi(bar) {
  const [a, b] = BAR_CHORDS[bar]
  const nextRoot = BAR_CHORDS[(bar + 1) % BARS][0].r
  const line = Array(STEPS).fill(null)

  for (const [step, interval] of DRIVE) {
    const current = b && step >= 6 ? b : a
    line[step] = fold(current.r + interval)
  }

  const last = b || a
  line[11] = fold(
    nextRoot !== last.r
      ? nextRoot + (nextRoot > last.r ? -1 : 1)
      : last.r + 10
  )

  return line
}

// Passos de ataque do órgão.
function organSteps(bar) {
  if (bar === 12 || bar === 13) return [0, 6]
  if (bar === 14 || bar === 15) return [0, 3, 6, 9]
  if (bar >= 16 && bar < 23) return [0, 3, 6, 9]
  if (bar === 23) return [0, 6, 9, 11]

  return [[2, 8], [2, 5, 8, 11], [2, 8, 11], [5, 8]][bar % 4]
}

// `camada` = VOZ.organ (8') ou VOZ.organ16 (a mesma nota, uma oitava abaixo)
function organVoice(voice, camada = VOZ.organ) {
  return bar => {
    const slots = emptySlots()

    for (const step of organSteps(bar)) {
      const voicing = VOICINGS[chordAt(bar, step).sym]
      if (voicing) slots[step] = toNote(voicing[voice], camada, bar, step)
    }

    return slots
  }
}

// Acentos de conjunto: tocam a voz do voicing indicada nos passos indicados.
function hitSlots(bar, steps, voice, shift, v) {
  const slots = emptySlots()
  // Melodia tocando acorde vira ataque de conjunto; acompanhamento continua acompanhamento
  const perfil = v.perfil === 'melodia' ? 'naipe' : v.perfil

  for (const step of steps) {
    const voicing = VOICINGS[chordAt(bar, step).sym]
    if (!voicing) continue

    let midi = voicing[voice] + shift
    while (midi > 79) midi -= 12
    slots[step] = toNote(midi, v, bar, step, perfil)
  }

  return slots
}

function entrySlots(entry, bar, v) {
  if (!entry) return emptySlots()
  if (typeof entry === 'string') return parseLine(entry, v, bar, 0)
  if (entry.hit) return hitSlots(bar, entry.hit, entry.voice, entry.shift || 0, v)
  if (entry.midi) return midiSlots(entry.midi, v, bar)

  return parseLine(entry.line, v, bar, entry.shift || 0)
}

// --------------------------------------------------
// TRILHAS POR CANAL
// --------------------------------------------------

const rep = (count, entry) => Array(count).fill(entry)
const shifted = (line, shift) => ({ line, shift })
const hits = (steps, voice, shift = 0) => ({ hit: steps, voice, shift })

// track([compassoInicial, entrada, entrada, ...], ...) -> lista de 32 entradas
function track(...segments) {
  const list = Array(BARS).fill(null)

  for (const [from, ...entries] of segments) {
    entries.forEach((entry, offset) => {
      if (from + offset < BARS) list[from + offset] = entry
    })
  }

  return list
}

const headsAt = (shift) => [
  shifted(HEAD_1, shift), shifted(HEAD_2, shift),
  shifted(HEAD_3, shift), shifted(HEAD_4, shift),
]

// Intervenções de conjunto dos metais (compasso -> passos).
const BRASS_HITS = Object.freeze({
  7: [9], 8: [8], 9: [5], 10: [8], 11: [9],
  16: [9], 17: [6], 18: [9], 19: [6, 9], 20: [9], 21: [6, 9], 22: [3, 9], 23: [6, 9, 11],
})

const brassSegments = (voice, shift) =>
  Object.entries(BRASS_HITS).map(([bar, steps]) => [Number(bar), hits(steps, voice, shift)])

const TENOR_TRACK = track(
  [0, HEAD_1, HEAD_2, HEAD_3, HEAD_4],
  [5, P2_2],
  [7, P2_4, P3_1, P3_2, P3_3, P3_4],
  [16, ...SOLO],
  [24, HEAD_1, HEAD_2, HEAD_3, HEAD_4, P2_1, P2_2, RETURN_END, LOOP_PICKUP]
)

// Trompete: base uma oitava acima, então as linhas escritas soam uma oitava abaixo.
// No retorno do riff (24–27) ele dobra o sax tenor em uníssono (shift +12 compensa a base).
const TRUMPET_TRACK = track(
  [4, P2_1],
  [6, P2_3],
  ...brassSegments(2, 12),
  [24, shifted(HEAD_1, 12), shifted(HEAD_2, 12), shifted(HEAD_3, 12), shifted(HEAD_4, 12)]
)

const TROMBONE_TRACK = track(
  ...brassSegments(1, 0),
  [24, ...headsAt(-12)]
)

const TROMBONE_LOW_TRACK = track(...brassSegments(0, -12))

// Barítono: dobra o riff no início do tema e no retorno, e reforça o baixo no desenvolvimento.
const BARI_TRACK = track(
  [0, ...headsAt(-12)],
  [8, ...rep(4, hits([0], 0, -12))],
  [16, ...Array.from({ length: 8 }, (_, i) => ({ midi: driveMidi(16 + i) }))],
  [24, ...headsAt(-12), ...rep(3, hits([0], 0, -12))]
)

// O compasso 4 é o último do áudio: guitarra sem toque no último passo, para nada ser cortado.
const GUITAR_TRACK = track(
  [0, ...headsAt(-12)],
  [4, hits([5, 8], 1), ...rep(3, hits([5, 11], 1)), ...rep(4, hits([2, 8], 1))],
  [16, ...Array.from({ length: 8 }, (_, i) => ({ midi: shiftMidi(driveMidi(16 + i), 12) }))],
  [24, ...headsAt(-12)],
  [28, hits([5], 1), null, hits([8], 1)]
)

const BASS_TRACK = track(
  [0, BASS_RIFF_1, BASS_RIFF_2, BASS_RIFF_3, BASS_RIFF_4],
  [4, ...Array.from({ length: 8 }, (_, i) => ({ midi: walkMidi(4 + i) }))],
  [13, ...BREAK_BASS],
  [16, ...Array.from({ length: 8 }, (_, i) => ({ midi: driveMidi(16 + i) }))],
  [24, BASS_RIFF_1, BASS_RIFF_2, BASS_RIFF_3, BASS_RIFF_4],
  [28, ...Array.from({ length: 3 }, (_, i) => ({ midi: walkMidi(28 + i) })), LOOP_BASS]
)

const MARIMBA_TRACK = track(
  [8, ...rep(3, hits([11], 2, 12))],
  [12, BREAK_MARIMBA_1, null, BREAK_MARIMBA_2],
  [28, ...rep(3, hits([5, 11], 2, 12))]
)

const CLARINET_TRACK = track(
  [8, ...rep(4, hits([0, 6], 2))],
  [13, ...BREAK_CLARINET],
  [28, ...rep(3, hits([0, 6], 2))]
)

// --------------------------------------------------
// BATERIA (o groove é contínuo; o ponto de loop 4 → 5 mantém o mesmo padrão)
// --------------------------------------------------

// Na bateria a parte decimal é a dinâmica: K = bumbo no tempo forte, k = bumbo de apoio;
// l/m/h = tons grave/médio/agudo (soam no mesmo canal do bumbo).
const KICK_MAP = { K: 12, k: 12.22, l: 19.12, m: 22.12, h: 26.08 }
// Caixa: X = backbeat acentuado, x = toque normal, g = ghost note, p/q = começo do rulo
const SNARE_MAP = { X: 12, x: 12.3, g: 12.7, p: 12.55, q: 12.38 }
// Corpo da caixa: segue a caixa, mas some nas ghost notes (nelas só a esteira soa)
const SNARE_BODY_MAP = { X: 12, x: 12.3, g: 12.9, p: 12.6, q: 12.45 }
// Ride: X = 2 e 4 (acento), x = 1 e 3, s = nota "skip" do shuffle; B/b = campana
const RIDE_MAP = { X: 12.05, x: 12.25, s: 12.55, B: 17.05, b: 17.25 }
const HAT_MAP = { X: 12.1, x: 12.3, s: 12.55, c: 12.4 }  // c = pedal no 2 e no 4

const KICK_FILL = 'K . . | . . . | k . . | h m l'

// Compassos em que o tung-tung-tung (madeira) leva ao tempo forte seguinte
const TUNG_BARS = Object.freeze([3, 11, 15, 27])

function kickLine(bar) {
  if (bar === 15 || bar === 23) return KICK_FILL
  if (bar >= 12 && bar < 15) return null

  if (bar >= 16 && bar < 23) {
    return bar % 2 === 0
      ? 'K . . | k . . | k . k | k . .'
      : 'K . . | k . . | k . . | k . .'
  }

  return [
    'K . . | . . . | k . . | . . .',
    'K . . | . . k | k . . | . . .',
    'K . . | . . . | k . . | . . k',
    'K . . | . . . | k . . | . k k',
  ][bar % 4]
}

function snareLine(bar) {
  if (bar >= 12 && bar < 16) return null
  if (bar === 23) return '. . . | X . . | . . X | . . .'

  if (bar >= 16 && bar < 23) {
    return bar % 2 === 0
      ? '. . . | X . . | . . x | X . g'
      : '. . g | X . . | . . . | X . x'
  }

  // Nos compassos do tung-tung-tung a caixa deixa o quarto tempo para a madeira
  if (TUNG_BARS.includes(bar)) return '. . . | X . . | . . g | . . .'

  // Rulo de tercinas em crescendo no fim das outras frases de 4 compassos (7 e 31)
  if (bar % 4 === 3) return '. . . | X . . | . . g | p q X'

  return [
    '. . . | X . . | . . g | X . .',
    '. . g | X . . | . . . | X . g',
    '. . . | X . . | . . g | X . .',
  ][bar % 4]
}

function rideLine(bar) {
  if (bar === 15) return 'x . . | X . . | x . . | X . .'
  if (bar >= 12 && bar < 16) return null
  if (bar >= 16 && bar < 24) return 'b . . | B . . | b . . | B . .'

  return 'x . s | X . s | x . s | X . s'
}

function hatLine(bar) {
  if (bar >= 16 && bar < 23) return 'x . s | X . s | x . s | X . s'
  if (bar >= 12 && bar < 16) return null
  return '. . . | c . . | . . . | c . .'
}

function woodLine(bar) {
  if (bar === 14) return '. . . | x . . | . . . | x . .'
  if (bar === 15) return '. . . | x . . | . . . | . . .'
  return null
}

// Madeira: batidas do interlúdio + o tung-tung-tung em crescendo
function woodSlots(bar) {
  const line = woodLine(bar)
  const slots = line ? parseDrums(line, { x: 12.3 }) : emptySlots()

  if (TUNG_BARS.includes(bar)) {
    passosDoTungTungTung(3).forEach((step, indice) => {
      slots[step] = notaDoInstrumento(INSTRUMENTOS.madeira.baseMidi, 'madeira', TUNG_TUNG_TUNG_ATENUACAO[indice])
    })
  }

  return slots
}

const fromTrack = (list, v) => bar => entrySlots(list[bar], bar, v)

const fromDrums = (lineFor, map) => bar => {
  const line = lineFor(bar)
  return line ? parseDrums(line, map) : emptySlots()
}

// --------------------------------------------------
// CANAIS: [índice do instrumento, panorama, gerador de passos]
// --------------------------------------------------

const CHANNELS = [
  [I.guitarraJazz, -0.32, fromTrack(GUITAR_TRACK, VOZ.guitar)],
  [I.vibrafone, -0.12, fromTrack(MARIMBA_TRACK, VOZ.vibes)],
  [I.contrabaixo, 0, fromTrack(BASS_TRACK, VOZ.bass)],
  [I.orgao, 0.18, organVoice(0)],
  [I.orgao, 0.32, organVoice(1)],
  [I.orgao, 0.25, organVoice(2)],
  [I.orgao16, 0.22, organVoice(0, VOZ.organ16)],
  [I.bumbo, 0, fromDrums(kickLine, KICK_MAP)],
  [I.caixa, 0, fromDrums(snareLine, SNARE_MAP)],
  [I.caixaCorpo, 0, fromDrums(snareLine, SNARE_BODY_MAP)],
  [I.ride, 0.22, fromDrums(rideLine, RIDE_MAP)],
  [I.chimbal, -0.2, fromDrums(hatLine, HAT_MAP)],
  [I.madeira, 0.08, woodSlots],
  [I.saxTenor, 0, fromTrack(TENOR_TRACK, VOZ.tenor)],
  [I.saxBaritono, -0.22, fromTrack(BARI_TRACK, VOZ.bari)],
  [I.trompete, 0.15, fromTrack(TRUMPET_TRACK, VOZ.trumpet)],
  [I.trombone, 0.1, fromTrack(TROMBONE_TRACK, VOZ.trombone)],
  [I.trombone, -0.12, fromTrack(TROMBONE_LOW_TRACK, VOZ.trombone)],
  [I.clarinete, -0.25, fromTrack(CLARINET_TRACK, VOZ.clarinet)],
]

// --------------------------------------------------
// CONSTRUÇÃO DA MÚSICA
// --------------------------------------------------

// Ordem de execução: começa no compasso 5 e dá a volta (5…31, 0…4).
// A ordem cíclica dos compassos é a mesma de antes; só muda onde o áudio começa e termina.
export const VILA_ESPERA_SEQUENCE = Object.freeze(
  Array.from(
    { length: VILA_ESPERA_META.bars },
    (_, index) => (VILA_ESPERA_META.loopStart + index) % VILA_ESPERA_META.bars
  )
)

export function buildVilaEsperaSong() {
  const instruments = INSTRUMENTOS_DA_FAIXA.map(nome => INSTRUMENTOS[nome].parametros)

  const patterns = []

  for (let bar = 0; bar < VILA_ESPERA_META.bars; bar += 1) {
    patterns.push(
      CHANNELS.map(([instrument, panning, slotsFor]) =>
        buildChannel(instrument, panning, slotsFor(bar))
      )
    )
  }

  return [
    instruments,
    patterns,
    [...VILA_ESPERA_SEQUENCE],
    VILA_ESPERA_META.bpm,
  ]
}

export const VILA_ESPERA_SONG = buildVilaEsperaSong()
// --------------------------------------------------
// INTRODUÇÃO (toca uma vez antes do corpo; ver o topo do arquivo)
// --------------------------------------------------

// Duração da introdução em compassos. Cada compasso dura 2,4 s (♩ = 100): 2 = 4,8 s, 3 = 7,2 s.
// Com 2, ela vai direto do órgão para a virada; com 4 ou mais, o órgão fica mais tempo sozinho.
export const VILA_ESPERA_INTRO_COMPASSOS = 3

const GRADE_DA_INTRO = criarGrade(3, 4)

export const VILA_ESPERA_INTRO_INSTRUMENTOS = Object.freeze([
  'orgaoSustentado', 'contrabaixo', 'vibrafone', 'ride', 'chimbal', 'bumbo', 'caixa', 'caixaCorpo', 'madeira', 'saxTenor',
])

// O papel de cada compasso: o último é a virada, o penúltimo apresenta a célula (com 3 ou mais) e o
// resto é o órgão com o baixo
function secaoDaIntro(compasso, total) {
  if (compasso === total - 1) return 'virada'
  if (total >= 3 && compasso === total - 2) return 'celula'
  return 'pad'
}

// Crescendo: atenuação somada a tudo, de 0,4 no primeiro compasso até 0 no último
const crescendo = (compasso, total) => (total <= 1 ? 0 : 0.4 * (1 - compasso / (total - 1)))

// Acordes sustentados (do grave ao agudo), os mesmos voicings do corpo
const ACORDE_DA_SECAO = Object.freeze({ pad: VOICINGS.D9, celula: VOICINGS.G13, virada: VOICINGS['A7#9'] })

const BAIXO_DA_SECAO = Object.freeze({
  pad: 'D2 . . | . . . | A1 . . | . . .',
  celula: 'G2 . . | . . . | D2 . . | . . G#2',
  // A mesma descida do compasso 31 (LOOP_BASS): Lá, Sol, Fá#, Mi → Ré no tema
  virada: 'A2 . . | . . . | G2 . . | F#2 . E2',
})

const VOZ_DA_INTRO = Object.freeze({
  orgao: vozDaIntro('orgaoSustentado', 'comping', { semente: 21 }),
  baixo: vozDaIntro('contrabaixo', 'baixo', { semente: 22 }),
  vibrafone: vozDaIntro('vibrafone', 'melodia', { semente: 23 }),
  sax: vozDaIntro('saxTenor', 'melodia', { semente: 24 }),
})

function canalDaIntro(gerar) {
  return (compasso) => gerar(secaoDaIntro(compasso, VILA_ESPERA_INTRO_COMPASSOS), crescendo(compasso, VILA_ESPERA_INTRO_COMPASSOS), compasso)
}

// Órgão: um acorde por compasso, no tempo 1 (o ataque lento faz o acorde crescer sozinho)
const orgaoDaIntro = (voice) => canalDaIntro((secao, extra, compasso) => (
  notasDaIntro([{ passo: 0, midi: ACORDE_DA_SECAO[secao][voice], atenuacao: extra }], VOZ_DA_INTRO.orgao, compasso, GRADE_DA_INTRO)
))

const baixoDaIntro = canalDaIntro((secao, extra, compasso) => (
  linhaDaIntro(BAIXO_DA_SECAO[secao], VOZ_DA_INTRO.baixo, compasso, GRADE_DA_INTRO, 0, extra)
))

// Vibrafone: a célula do Tung em Ré (Lá – Dó – Ré – Dó – Lá), leve, no compasso da célula
const vibrafoneDaIntro = canalDaIntro((secao, extra, compasso) => {
  if (secao !== 'celula') return null
  const lista = celulaDoTung(62, GRADE_DA_INTRO.passosPorTempo).map((nota) => ({ ...nota, atenuacao: nota.atenuacao + extra }))
  return notasDaIntro(lista, VOZ_DA_INTRO.vibrafone, compasso, GRADE_DA_INTRO)
})

const rideDaIntro = canalDaIntro((secao, extra) => {
  if (secao === 'pad') return null
  const texto = secao === 'virada' ? 'x . s | X . s | x . s | . . .' : 'x . s | x . s | x . s | x . s'
  return batidasDaIntro(texto, comAtenuacao(RIDE_MAP, extra + (secao === 'celula' ? 0.15 : 0)), GRADE_DA_INTRO)
})

const pedalDaIntro = canalDaIntro((secao, extra) => {
  if (secao === 'pad') return null
  const texto = secao === 'virada' ? '. . . | c . . | . . . | . . .' : '. . . | c . . | . . . | c . .'
  return batidasDaIntro(texto, comAtenuacao(HAT_MAP, extra), GRADE_DA_INTRO)
})

const bumboDaIntro = canalDaIntro((secao, extra) => (
  secao === 'virada' ? batidasDaIntro('K . . | . . . | k . . | . . .', comAtenuacao(KICK_MAP, extra + 0.15), GRADE_DA_INTRO) : null
))

// Caixa: um toque no 2 e o rulo em crescendo no 3; o 4 é do tung-tung-tung
const caixaDaIntro = (mapa) => canalDaIntro((secao, extra) => (
  secao === 'virada' ? batidasDaIntro('. . . | x . . | p q X | . . .', comAtenuacao(mapa, extra), GRADE_DA_INTRO) : null
))

// Madeira: o tung-tung-tung no último tempo, na mesma altura do corpo, levando ao tema
const madeiraDaIntro = canalDaIntro((secao) => {
  if (secao !== 'virada') return null
  const passos = Array(GRADE_DA_INTRO.passos).fill(0)
  passosDoTungTungTung(GRADE_DA_INTRO.passosPorTempo).forEach((passo, indice) => {
    passos[passo] = notaDoInstrumento(INSTRUMENTOS.madeira.baseMidi, 'madeira', TUNG_TUNG_TUNG_ATENUACAO[indice])
  })
  return passos
})

// Sax: o Dó# do fim do compasso 31 (LOOP_PICKUP), que resolve no Ré do tema
const saxDaIntro = canalDaIntro((secao, extra, compasso) => (
  secao === 'virada' ? linhaDaIntro(LOOP_PICKUP, VOZ_DA_INTRO.sax, compasso, GRADE_DA_INTRO, 0, extra) : null
))

export const VILA_ESPERA_INTRO_SONG = montarMusica({
  instrumentos: VILA_ESPERA_INTRO_INSTRUMENTOS,
  canais: [
    ['orgaoSustentado', 0.18, orgaoDaIntro(0)],
    ['orgaoSustentado', 0.32, orgaoDaIntro(1)],
    ['orgaoSustentado', 0.25, orgaoDaIntro(2)],
    ['contrabaixo', 0, baixoDaIntro],
    ['vibrafone', -0.12, vibrafoneDaIntro],
    ['ride', 0.22, rideDaIntro],
    ['chimbal', -0.2, pedalDaIntro],
    ['bumbo', 0, bumboDaIntro],
    ['caixa', 0, caixaDaIntro(SNARE_MAP)],
    ['caixaCorpo', 0, caixaDaIntro(SNARE_BODY_MAP)],
    ['madeira', 0.08, madeiraDaIntro],
    ['saxTenor', 0, saxDaIntro],
  ],
  compassos: VILA_ESPERA_INTRO_COMPASSOS,
  grade: GRADE_DA_INTRO,
  andamento: VILA_ESPERA_META.perceivedBpm,
})

export const VILA_ESPERA_INTRO_META = Object.freeze({
  compassos: VILA_ESPERA_INTRO_COMPASSOS,
  // segundos: compassos × 4 tempos × 60 / ♩
  duracao: (VILA_ESPERA_INTRO_COMPASSOS * 4 * 60) / VILA_ESPERA_META.perceivedBpm,
})
