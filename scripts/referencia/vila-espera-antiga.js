// CÓPIA CONGELADA da "A Vila Espera" antes da Fase 1 (timbres antigos), usada só pelo
// scripts/render-trilha.mjs para comparar o som antigo com o novo. Não é carregada pelo jogo.
//
// A Vila Espera — trilha externa de TBOTT (ciclo contínuo, registro mais grave).
// Blues-rock com harmonia jazzística: shuffle real, riffs marcantes e clima noturno.
//
// LOOP SEM EMENDA
//   A música não tem introdução nem final, e o áudio também não começa nem termina
//   numa fronteira de seção. A sequência é girada: toca do compasso 5 ao 31, depois
//   do 0 ao 4, e volta ao compasso 5.
//   - O ponto de loop (compasso 4 → 5) é uma passagem que já existia no meio do tema
//     (G7 → G#dim7), com baixo caminhando, ride em shuffle e órgão: a mesma textura
//     dos dois lados.
//   - A virada V→I (compasso 31 → 0) e o rulo de caixa ficam no meio do áudio,
//     onde as notas longas soam inteiras.
//   - O compasso 4 (último do áudio) não tem notas longas passando do fim, e o
//     compasso 5 (primeiro) não depende de nenhuma nota anterior.
//   - O trecho esparso (compassos 12–15) fica no meio do ciclo, como interlúdio.
//
// Grade rítmica: 12 passos por compasso (tercinas de colcheia).
//   Cada tempo = 3 passos (0, 1, 2). Colcheias com swing caem nos passos 0 e 2.
//   Com bpm 75 no ZzFXM (cada passo = semicolcheia), o andamento percebido é ♩ = 100.
//
// Afinação: todos os instrumentos melódicos têm frequência-base em Dó (a nota 12
// de cada instrumento é um Dó). Assim, o mesmo nome de nota soa na mesma altura
// em todos os canais. As linhas são escritas em altura real (ex.: 'D4') e
// convertidas automaticamente para o número de nota de cada instrumento.
// Marimba, clarinete e trompete soam uma oitava abaixo da altura escrita (ver BASE),
// o que deixa a mistura mais grave e encorpada.
//
// Instrumentos (índices no array de instrumentos da música):
//  0 pizzicato (guitarra rítmica)   1 marimba      2 contrabaixo   3 órgão
//  4 madeira (rim click)            5 kick/tons    6 caixa         7 ride
//  8 chimbal                        9 clarinete   10 trombone     11 sax barítono
// 12 trompete                      13 sax tenor
//
// Estrutura (32 compassos, ciclo):
//   0-11  Tema em blues de 12 compassos (riff em uníssono, pergunta/resposta, turnaround)
//   12-15 Interlúdio esparso (órgão, baixo, clarinete e marimba; rim click e ride entram no fim)
//   16-23 Desenvolvimento: C9–G9–D7#9, solo de sax tenor, shouts dos metais, bateria rock
//   24-31 Retorno ao riff e ao tema B; o compasso 31 (A7#9) resolve no compasso 0

export const VILA_ESPERA_META = Object.freeze({
  id: 'a-vila-espera',
  title: 'A Vila Espera',
  bpm: 75,
  perceivedBpm: 100,
  signature: '4/4 shuffle (12 passos por compasso)',
  stepsPerBar: 12,
  bars: 32,
  loopStart: 5,
  tonalidade: 'Ré blues (D7)',
  estrutura: 'Tema blues 12 · Interlúdio 4 · Desenvolvimento 8 · Retorno 8 (ciclo contínuo, áudio gira a partir do compasso 5)',
  loop: true,
})

export const VILA_ESPERA_INSTRUMENTS = Object.freeze({
  pizzicato: [
    0.2, 0.008, 130.81, 0.002, 0.03, 0.2,
    1, 0.8, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0.7, 0.012, 0, 0,
  ],

  marimba: [
    0.09, 0.006, 261.63, 0.002, 0.025, 0.22,
    0, 1.2, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0.42, 0.025, 0, 0,
  ],

  contrabaixo: [
    0.4, 0.004, 65.41, 0.012, 0.24, 0.24,
    1, 0.85, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0.82, 0.02, 0, 0,
  ],

  orgao: [
    0.06, 0.004, 130.81, 0.03, 0.3, 0.25,
    2, 0.8, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0.82, 0.018, 0.15, 0,
  ],

  madeira: [
    0.08, 0.025, 180, 0.004, 0.012, 0.075,
    3, 1.1, 0, 0, 0, 0, 1.2, 0.45, 0, 0, 0,
    0.35, 0.012, 0, 0,
  ],

  tuba: [
    0.105, 0.008, 65.41, 0.045, 0.28, 0.40,
    2, 0.55, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0.86, 0.045, 0, 0,
  ],

  kick: [
    0.36, 0.015, 68, 0.001, 0.045, 0.22,
    0, 0.5, -0.35, 0, 0, 0, 0, 0, 0, 0, 0,
    0.4, 0.015, 0, 0,
  ],

  snare: [
    0.12, 0.04, 150, 0.001, 0.03, 0.14,
    3, 1.1, 0, 0, 0, 0, 1.5, 0.35, 0, 0, 0,
    0.3, 0.012, 0, 0,
  ],

  ride: [
    0.03, 0.025, 3000, 0.001, 0.02, 0.11,
    3, 1.3, 0, 0, 0, 0, 1.8, 0.4, 0, 0, 0,
    0.25, 0.01, 0, 0,
  ],

  hat: [
    0.022, 0.02, 5000, 0.001, 0.008, 0.045,
    3, 1.3, 0, 0, 0, 0, 1.8, 0.5, 0, 0, 0,
    0.25, 0.006, 0, 0,
  ],

  clarinete: [
    0.09, 0.012, 261.63, 0.035, 0.14, 0.3,
    1, 0.75, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0.65, 0.025, 0.06, 0,
  ],

  trombone: [
    0.17, 0.012, 130.81, 0.04, 0.2, 0.3,
    1, 0.65, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0.8, 0.035, 0, 0,
  ],

  saxBaritono: [
    0.18, 0.015, 65.41, 0.03, 0.2, 0.3,
    1, 0.72, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0.72, 0.03, 0.06, 0,
  ],

  trompete: [
    0.065, 0.008, 261.63, 0.02, 0.12, 0.26,
    2, 0.8, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0.65, 0.025, 0, 0,
  ],

  saxTenor: [
    0.12, 0.012, 130.81, 0.03, 0.2, 0.3,
    1, 0.9, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0.72, 0.025, 0.08, 0,
  ],

  tromboneBaixo: [
    0.19, 0.012, 55, 0.055, 0.30, 0.42,
    0, 0.58, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0.84, 0.04, 0, 0,
  ],
})

export const VILA_ESPERA_EXTRA_INSTRUMENTS = Object.freeze({
  tuba2: VILA_ESPERA_INSTRUMENTS.tuba,

  trombone2: VILA_ESPERA_INSTRUMENTS.trombone,
  trombone3: VILA_ESPERA_INSTRUMENTS.trombone,
  trombone4: VILA_ESPERA_INSTRUMENTS.trombone,

  trompete2: VILA_ESPERA_INSTRUMENTS.trompete,
  trompete3: VILA_ESPERA_INSTRUMENTS.trompete,
  trompete4: VILA_ESPERA_INSTRUMENTS.trompete,

  flauta: [
    0.065, 0.008, 880, 0.035, 0.10, 0.28,
    0, 0.8, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0.58, 0.02, 0, 0,
  ],
})

// --------------------------------------------------
// BASE TÉCNICA
// --------------------------------------------------

const STEPS = 12
const BARS = 32
const REST = 0

const PITCH_CLASS = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }

// Nota MIDI correspondente à nota 12 (frequência-base) de cada instrumento.
// Marimba, clarinete e trompete usam base uma oitava acima da frequência real do
// instrumento (72 em vez de 60): soam uma oitava abaixo da altura escrita.
const BASE = Object.freeze({
  guitar: 48,    // Dó3
  marimba: 72,   // soa uma oitava abaixo do escrito
  bass: 36,      // Dó2
  organ: 48,     // Dó3
  tenor: 48,     // Dó3
  bari: 36,      // Dó2
  trumpet: 72,   // soa uma oitava abaixo do escrito
  trombone: 48,  // Dó3
  clarinet: 72,  // soa uma oitava abaixo do escrito
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

// Converte altura MIDI em número de nota do instrumento (nota 12 = frequência-base).
function toNote(midi, base) {
  let note = midi - base + 12
  while (note < 1) note += 12
  return note
}

function tokensOf(line) {
  return String(line).replace(/\|/g, ' ').trim().split(/\s+/)
}

function parseLine(line, base, shift = 0) {
  const tokens = tokensOf(line)
  const slots = emptySlots()

  for (let step = 0; step < STEPS; step += 1) {
    const midi = midiOf(tokens[step])
    if (midi !== null) slots[step] = toNote(midi + shift, base)
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

function midiSlots(list, base) {
  return list.map(midi => (midi === null ? REST : toNote(midi, base)))
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
export const VILA_ESPERA_MELODY_A = Object.freeze(parseLine(HEAD_1, BASE.tenor))
export const VILA_ESPERA_MELODY_B = Object.freeze(parseLine(P2_1, BASE.tenor))
export const VILA_ESPERA_MELODY_RETURN = Object.freeze(parseLine(P3_1, BASE.tenor))

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

function organVoice(voice) {
  return bar => {
    const slots = emptySlots()

    for (const step of organSteps(bar)) {
      const voicing = VOICINGS[chordAt(bar, step).sym]
      if (voicing) slots[step] = toNote(voicing[voice], BASE.organ)
    }

    return slots
  }
}

// Acentos de conjunto: tocam a voz do voicing indicada nos passos indicados.
function hitSlots(bar, steps, voice, shift, base) {
  const slots = emptySlots()

  for (const step of steps) {
    const voicing = VOICINGS[chordAt(bar, step).sym]
    if (!voicing) continue

    let midi = voicing[voice] + shift
    while (midi > 79) midi -= 12
    slots[step] = toNote(midi, base)
  }

  return slots
}

function entrySlots(entry, bar, base) {
  if (!entry) return emptySlots()
  if (typeof entry === 'string') return parseLine(entry, base, 0)
  if (entry.hit) return hitSlots(bar, entry.hit, entry.voice, entry.shift || 0, base)
  if (entry.midi) return midiSlots(entry.midi, base)

  return parseLine(entry.line, base, entry.shift || 0)
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

const KICK_MAP = { k: 12, l: 19, m: 22, h: 26 } // k = bumbo; l/m/h = tons grave/médio/agudo
const HIT_MAP = { x: 12 }
const RIDE_MAP = { x: 12, b: 17 }               // b = ride na campana

const KICK_FILL = 'k . . | . . . | k . . | h m l'

function kickLine(bar) {
  if (bar === 15 || bar === 23) return KICK_FILL
  if (bar >= 12 && bar < 15) return null

  if (bar >= 16 && bar < 23) {
    return bar % 2 === 0
      ? 'k . . | k . . | k . k | k . .'
      : 'k . . | k . . | k . . | k . .'
  }

  return [
    'k . . | . . . | k . . | . . .',
    'k . . | . . k | k . . | . . .',
    'k . . | . . . | k . . | . . k',
    'k . . | . . . | k . . | . k k',
  ][bar % 4]
}

function snareLine(bar) {
  if (bar >= 12 && bar < 16) return null
  if (bar === 23) return '. . . | x . . | . . x | . . .'

  if (bar >= 16 && bar < 23) {
    return bar % 2 === 0
      ? '. . . | x . . | . . x | x . .'
      : '. . . | x . . | . . . | x . x'
  }

  // Rulo de tercinas no fim de cada frase de 4 compassos (3, 7, 11, 27 e 31).
  if (bar % 4 === 3) return '. . . | x . . | . . . | x x x'

  return '. . . | x . . | . . . | x . .'
}

function rideLine(bar) {
  if (bar === 15) return 'x . . | x . . | x . . | x . .'
  if (bar >= 12 && bar < 16) return null
  if (bar >= 16 && bar < 24) return 'b . . | b . . | b . . | b . .'

  return 'x . x | x . x | x . x | x . x'
}

function hatLine(bar) {
  return bar >= 16 && bar < 23 ? 'x . x | x . x | x . x | x . x' : null
}

function woodLine(bar) {
  return bar === 14 || bar === 15 ? '. . . | x . . | . . . | x . .' : null
}

const fromTrack = (list, base) => bar => entrySlots(list[bar], bar, base)

const fromDrums = (lineFor, map) => bar => {
  const line = lineFor(bar)
  return line ? parseDrums(line, map) : emptySlots()
}

// --------------------------------------------------
// CANAIS: [índice do instrumento, panorama, gerador de passos]
// --------------------------------------------------

const CHANNELS = [
  [0, -0.30, fromTrack(GUITAR_TRACK, BASE.guitar)],
  [1, 0.30, fromTrack(MARIMBA_TRACK, BASE.marimba)],
  [2, 0, fromTrack(BASS_TRACK, BASE.bass)],
  [3, -0.12, organVoice(0)],
  [3, 0.12, organVoice(1)],
  [3, 0, organVoice(2)],
  [5, 0, fromDrums(kickLine, KICK_MAP)],
  [6, 0.05, fromDrums(snareLine, HIT_MAP)],
  [7, 0.28, fromDrums(rideLine, RIDE_MAP)],
  [8, -0.22, fromDrums(hatLine, HIT_MAP)],
  [4, 0.25, fromDrums(woodLine, HIT_MAP)],
  [13, -0.15, fromTrack(TENOR_TRACK, BASE.tenor)],
  [11, -0.32, fromTrack(BARI_TRACK, BASE.bari)],
  [12, 0.25, fromTrack(TRUMPET_TRACK, BASE.trumpet)],
  [10, 0.20, fromTrack(TROMBONE_TRACK, BASE.trombone)],
  [10, -0.20, fromTrack(TROMBONE_LOW_TRACK, BASE.trombone)],
  [9, 0.35, fromTrack(CLARINET_TRACK, BASE.clarinet)],
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
  const instruments = [
    VILA_ESPERA_INSTRUMENTS.pizzicato,     // 0
    VILA_ESPERA_INSTRUMENTS.marimba,       // 1
    VILA_ESPERA_INSTRUMENTS.contrabaixo,   // 2
    VILA_ESPERA_INSTRUMENTS.orgao,         // 3
    VILA_ESPERA_INSTRUMENTS.madeira,       // 4
    VILA_ESPERA_INSTRUMENTS.kick,          // 5
    VILA_ESPERA_INSTRUMENTS.snare,         // 6
    VILA_ESPERA_INSTRUMENTS.ride,          // 7
    VILA_ESPERA_INSTRUMENTS.hat,           // 8
    VILA_ESPERA_INSTRUMENTS.clarinete,     // 9
    VILA_ESPERA_INSTRUMENTS.trombone,      // 10
    VILA_ESPERA_INSTRUMENTS.saxBaritono,   // 11
    VILA_ESPERA_INSTRUMENTS.trompete,      // 12
    VILA_ESPERA_INSTRUMENTS.saxTenor,      // 13
  ]

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