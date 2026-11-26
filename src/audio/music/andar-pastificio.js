// A Ronda: Pastificio. Faixa do andar 4: a fábrica de massa (metal, concreto, amarelo e preto).
//
// ESTILO E ANDAMENTO
//   Rock pesado (metal de groove) em Mi frígio, ♩ = 124. Grade de 16 passos por compasso
//   (semicolcheias retas). bpm do ZzFXM = 124.
//
// HARMONIA (o que é só do Pastificio)
//   Mi frígio: a cor é a segunda menor (Fá). Power chords sobre o pedal de Mi (o palm mute segue no
//   Mi2 enquanto os acordes sobem para F5 e G5) e o trítono (B♭5) de tempero. Cadências: ♭II → i
//   (F5 → E5, a cadência frígia, que também é a emenda do loop) e a queda do trítono (B♭5 → E5). Na
//   ponte, uma descida cromática C5 → B5 → B♭5 → A5 → G5 → F5 → E5.
//
// MATERIAL
//   Tema A (o riff): a célula do Tung (Si – Ré – Mi – Ré – Si em Mi) em power chords, com o ritmo
//   longo-curto da grade reta (passos 0, 3, 4, 7 e 8), como uma prensa; ela sobe para o Lá e volta com
//   outro fim. Os compassos de resposta são galopes no palm mute com os acordes frígios por cima.
//   A guitarra solo (Verso e Riff C): o DNA aprovado antes, o tresillo 3+3+2 em semicolcheias com o
//   cromatismo Mi – Fá e Si♭ – Si; no Riff C, duas guitarras em terças respondem ao riff.
//   Tema B (a ponte): a célula em valores longos no órgão (Si – Ré – Mi – Ré – Si) e o suspiro frígio
//   Dó → Si no fim.
//   A "máquina": palm mute no Mi2 (82 Hz), que liga, galopa, para e volta.
//   O tung-tung-tung (madeira, em Mi, em semicolcheias) aparece em lugares diferentes; na parada, um
//   tom grave (a prensa) responde a ele.
//
// FORMA (50 compassos, ~97 s; editar em FORMA)
//   Partida (4)  a máquina liga sozinha, em crescendo, com o chimbal; virada no fim
//   Riff A  (8)  o riff da célula e as respostas em galope (E5–F5, G5–F5, A5–B♭5); bumbo seguindo a
//                guitarra
//   Verso   (8)  E5 – F5 – G5 – F5 – E5 – F5 – A5 – B♭5 em tresillo (palm mute, baixo e bumbo juntos)
//                e a guitarra solo por cima; prato escuro a cada 4 compassos
//   Riff B  (8)  o riff uma oitava acima, a máquina em semicolcheias; virada grande de tons no fim
//   Ponte   (8)  meio-tempo (caixa no 3): a descida cromática, o órgão canta a célula alongada
//   Parada  (6)  a fábrica para: só o baixo (com o sub), a máquina em marcha lenta e o tung-tung-tung
//                respondido pela prensa; rulo de caixa em crescendo no fim
//   Riff C  (8)  o riff no grave, duas guitarras em terças nas respostas, bumbo duplo: o ponto mais
//                alto; termina em F5 → (E5 da Partida)
//   Energia: Partida baixa → Riff A média → Verso média → Riff B alta → Ponte média → Parada a mais
//   baixa → Riff C a mais alta → (Partida)
//
// GRAVE E AGUDO
//   O baixo distorcido (com harmônicos) toca uma oitava abaixo das guitarras, nunca na mesma nota; o
//   sub só na Parada e no fim da Ponte. A guitarra solo fica entre Si3 e Mi5. O prato escuro só nos
//   começos de frase, a caixa ~2 dB abaixo dos outros andares; o órgão de Leslie no agudo da versão
//   anterior saiu.
//
// LOOP SEM EMENDA
//   O áudio começa na Partida; o fim do Riff C (F5, a cadência frígia) volta à Partida, que é a
//   máquina sozinha no Mi: a queda de energia é a própria emenda.
//
// ONDE AJUSTAR
//   FORMA · RIFF (onde a célula entra e como termina) · RESPOSTAS (acordes das respostas) · MAQUINA ·
//   SOLO e TERCAS (guitarra solo) · CANTO (órgão) · BAIXO · GROOVES · DINAMICA · TUNG

import { bateria, celula, comAtenuacao, compassoVazio, criarGrade, expandirForma, linha, montarMusica, notas, secoesDaForma, tungTungTung, voz } from './partitura.js'

const RIFF_E_RESPOSTAS = ['E5', 'E5 F5', 'E5', 'G5 F5', 'A5', 'A5 Bb5', 'E5', 'F5']

const FORMA = Object.freeze([
  { nome: 'Partida', papel: 'a máquina liga sozinha', harmonia: ['E5', 'E5', 'E5', 'E5'] },
  { nome: 'Riff A', papel: 'o riff da célula e as respostas em galope', harmonia: RIFF_E_RESPOSTAS },
  { nome: 'Verso', papel: 'tresillo e a guitarra solo', harmonia: ['E5', 'F5', 'G5', 'F5', 'E5', 'F5', 'A5', 'Bb5'] },
  { nome: 'Riff B', papel: 'o riff uma oitava acima, máquina em semicolcheias', harmonia: RIFF_E_RESPOSTAS },
  { nome: 'Ponte', papel: 'meio-tempo, a descida cromática e o órgão', harmonia: ['C5', 'B5', 'Bb5', 'A5', 'G5', 'F5', 'E5', 'E5'] },
  { nome: 'Parada', papel: 'a fábrica para: tung-tung-tung e a prensa', harmonia: ['E5', 'E5', 'E5', 'E5', 'E5', 'E5'] },
  { nome: 'Riff C', papel: 'o riff no grave, guitarras em terças, bumbo duplo', harmonia: RIFF_E_RESPOSTAS },
])

const COMPASSOS = expandirForma(FORMA)

export const PASTIFICIO_META = Object.freeze({
  id: 'andar-pastificio',
  titulo: 'A Ronda: Pastificio',
  estilo: 'rock pesado em frígio',
  andamento: 124,
  passosPorTempo: 4,
  temposPorCompasso: 4,
  compassos: COMPASSOS.length,
  inicioDoLoop: 0,
  tonalidade: 'Mi frígio (E5)',
  tonica: 'E',
  modo: 'frigio',
  estrutura: 'Partida 4 · Riff A 8 · Verso 8 · Riff B 8 · Ponte 8 · Parada 6 · Riff C 8',
})

export const PASTIFICIO_SECOES = secoesDaForma(FORMA)
export const PASTIFICIO_HARMONIA = Object.freeze(COMPASSOS.map((c) => c.acorde))

const GRADE = criarGrade(PASTIFICIO_META.passosPorTempo, PASTIFICIO_META.temposPorCompasso)

export const PASTIFICIO_INSTRUMENTOS = Object.freeze([
  'baixoDistorcido', 'sub', 'guitarraPalmMute', 'guitarraCrunch', 'orgaoSustentado',
  'bumboSeco', 'caixa', 'caixaCorpo', 'chimbal', 'pratoEscuro', 'madeira',
])

const VOZ = Object.freeze({
  baixo: voz('baixoDistorcido', 'baixo', { semente: 51 }),
  sub: voz('sub', 'baixo', { semente: 58 }),
  maquina: voz('guitarraPalmMute', 'riff', { semente: 52 }),
  fundamental: voz('guitarraCrunch', 'riff', { semente: 53 }),
  quinta: voz('guitarraCrunch', 'riff', { semente: 54 }),
  solo: voz('guitarraCrunch', 'melodia', { semente: 59 }),
  tercas: voz('guitarraCrunch', 'melodia', { semente: 60 }),
  orgaoCanto: voz('orgaoSustentado', 'melodia', { semente: 56 }),
})

// Fundamental de cada power chord na guitarra (o baixo toca uma oitava abaixo)
const RAIZ = Object.freeze({ E5: 40, F5: 41, G5: 43, A5: 45, Bb5: 46, B5: 47, C5: 48, D5: 50 })
const COLCHEIAS = Array.from({ length: 8 }, (_, i) => i * 2)
const SEMICOLCHEIAS = Array.from({ length: 16 }, (_, i) => i)
// Galope: colcheia e duas semicolcheias, quatro vezes
const GALOPE = Object.freeze([0, 2, 3, 4, 6, 7, 8, 10, 11, 12, 14, 15])
// Tresillo em semicolcheias (3 + 3 + 2, duas vezes): o DNA rítmico do Pastificio
const TRESILLO = Object.freeze([0, 3, 6, 8, 11, 14])

const SECOES_DE_RIFF = new Set(['Riff A', 'Riff B', 'Riff C'])

// --------------------------------------------------
// TUNG: lugares diferentes em cada seção
// --------------------------------------------------

const TUNG = Object.freeze({ Partida: [], 'Riff A': [3, 7], Verso: [], 'Riff B': [3], Ponte: [7], Parada: [1, 3], 'Riff C': [7] })
const temTung = (compasso) => {
  const { secao, indice } = COMPASSOS[compasso]
  return TUNG[secao].includes(indice)
}
// No fim de frase com tung-tung-tung, nada toca nos passos 13 a 15 (só o bumbo)
const semOFim = (passos, compasso) => (temTung(compasso) ? passos.filter((passo) => passo < 13) : passos)
const zerarOFim = (passos, compasso) => (temTung(compasso) ? passos.map((valor, passo) => (passo >= 13 ? 0 : valor)) : passos)

// --------------------------------------------------
// RIFF: tônica da célula por compasso da seção ('fim' = a célula com o último Si trocado pelo Sol).
// Os outros compassos das seções de riff são respostas: o primeiro acorde no 1 e o segundo no 3,
// com o galope do palm mute por baixo.
// --------------------------------------------------

const RIFF = Object.freeze({
  'Riff A': { 0: 40, 2: 40, 4: 45, 6: 'fim' },
  'Riff B': { 0: 52, 2: 52, 4: 57, 6: 'fim' },
  'Riff C': { 0: 40, 2: 40, 4: 45, 6: 40 },
})

function powerChord(intervalo, v) {
  return (compasso) => {
    const { secao, indice, acorde } = COMPASSOS[compasso]
    const tonica = RIFF[secao]?.[indice]
    const oitava = secao === 'Riff B' ? 12 : 0
    if (tonica === 'fim') {
      // A célula com outro fim: Si – Ré – Mi – Ré – Sol
      const lista = [[0, 47], [3, 50], [4, 52], [7, 50], [8, 43]].map(([passo, midi]) => ({ passo, midi: midi + oitava + intervalo }))
      return notas(lista, v, compasso, GRADE)
    }
    if (tonica) return celula(tonica + intervalo, v, compasso, GRADE)
    const [primeiro, segundo] = acorde.split(' ')
    let lista
    if (SECOES_DE_RIFF.has(secao)) lista = segundo ? [[0, primeiro], [8, segundo]] : [[0, primeiro], [10, primeiro]]
    else if (secao === 'Verso') lista = TRESILLO.filter((passo) => passo % 8 === 0 || passo === 11).map((passo) => [passo, primeiro])
    else if (secao === 'Ponte') lista = indice >= 6 ? [[0, primeiro], [8, primeiro]] : [[0, primeiro]]
    else return null
    // Onde o palm mute segura o Mi2 (respostas e verso), o E5 fica só com a quinta (Si2): os dois não
    // tocam a mesma nota juntos
    const comPalmMute = SECOES_DE_RIFF.has(secao) || secao === 'Verso'
    const passos = lista.filter(([passo, nome]) => (!temTung(compasso) || passo < 13) && !(comPalmMute && intervalo === 0 && nome === 'E5'))
    return notas(passos.map(([passo, nome]) => ({ passo, midi: RAIZ[nome] + oitava + intervalo, atenuacao: passo === 0 ? 0 : 0.08 })), v, compasso, GRADE)
  }
}

// --------------------------------------------------
// MÁQUINA: palm mute no Mi2 (o pedal do frígio)
// --------------------------------------------------

function maquina(compasso) {
  const { secao, indice } = COMPASSOS[compasso]
  const temCelula = Boolean(RIFF[secao]?.[indice])
  let passos
  let extra = 0
  if (secao === 'Partida') {
    passos = COLCHEIAS
    extra = 0.45 * (1 - indice / 3) // liga aos poucos
  } else if (secao === 'Parada') {
    if (indice >= 4) return null
    passos = [0, 4, 8, 12] // marcha lenta
    extra = 0.3
  } else if (secao === 'Ponte') {
    return null
  } else if (secao === 'Verso') {
    passos = TRESILLO
  } else if (temCelula) {
    passos = (secao === 'Riff B' ? SEMICOLCHEIAS : COLCHEIAS).filter((passo) => passo >= 10)
  } else {
    // Resposta: o galope (no Riff B, semicolcheias cheias)
    passos = secao === 'Riff B' ? SEMICOLCHEIAS : GALOPE
  }
  return notas(semOFim(passos, compasso).map((passo) => ({ passo, midi: 40, atenuacao: extra + (passo % 4 === 0 ? 0 : 0.15) })), VOZ.maquina, compasso, GRADE)
}

// --------------------------------------------------
// GUITARRA SOLO: o tresillo com cromatismo no Verso; as terças do Riff C (duas guitarras respondendo
// ao riff nos compassos sem a célula)
// --------------------------------------------------

const SOLO = Object.freeze([
  'E4 . . F4 | . . E4 . | B3 . . . | . . . .',
  'F4 . . G4 | . . F4 . | C4 . . . | . . . .',
  'G4 . . A4 | . . B4 . | D5 . . . | . . . .',
  'C5 . . B4 | . . A4 . | F4 . . . | . . . .',
  'E4 . . F4 | . . E4 . | B3 . . . | . . . B3',
  'F4 . . E4 | . . F4 . | A4 . . . | . . . .',
  'A4 . . B4 | . . C5 . | E5 . . . | . . . .',
  'D5 . . C5 | . . Bb4 . | . . B4 . | . . . .',
])

// Riff C: [guitarra de cima, guitarra de baixo (uma terça abaixo, no frígio)] por compasso de resposta
const TERCAS = Object.freeze({
  1: ['E4 . . F4 | . . G4 . | F4 . . E4 | . . . .', 'C4 . . D4 | . . E4 . | D4 . . C4 | . . . .'],
  3: ['G4 . . A4 | . . B4 . | A4 . . G4 | . . . .', 'E4 . . F4 | . . G4 . | F4 . . E4 | . . . .'],
  5: ['A4 . . B4 | . . C5 . | D5 . . . | . . . .', 'F4 . . G4 | . . A4 . | Bb4 . . . | . . . .'],
  7: ['C5 . . B4 | . . A4 . | G4 . . F4 | . . . .', 'A4 . . G4 | . . F4 . | E4 . . D4 | . . . .'],
})

function solo(indiceDaVoz) {
  return (compasso) => {
    const { secao, indice } = COMPASSOS[compasso]
    let texto = null
    if (secao === 'Verso' && indiceDaVoz === 0) texto = SOLO[indice]
    if (secao === 'Riff C' && TERCAS[indice]) texto = TERCAS[indice][indiceDaVoz]
    if (!texto) return null
    return zerarOFim(linha(texto, indiceDaVoz === 0 ? VOZ.solo : VOZ.tercas, compasso, GRADE), compasso)
  }
}

// --------------------------------------------------
// BAIXO: uma oitava abaixo das guitarras (a célula, o galope e o tresillo junto com o palm mute);
// mínimas na ponte; notas longas com o sub na parada
// --------------------------------------------------

function baixo(compasso) {
  const { secao, indice, acorde } = COMPASSOS[compasso]
  if (secao === 'Partida') return null
  const tonica = RIFF[secao]?.[indice]
  if (typeof tonica === 'number') return celula(tonica - (secao === 'Riff B' ? 24 : 12), VOZ.baixo, compasso, GRADE)
  if (tonica === 'fim') return notas([[0, 35], [3, 38], [4, 40], [7, 38], [8, 31]].map(([passo, midi]) => ({ passo, midi })), VOZ.baixo, compasso, GRADE)
  const [primeiro, segundo] = acorde.split(' ')
  const raiz = (nome) => RAIZ[nome] - 12
  let lista
  if (SECOES_DE_RIFF.has(secao)) {
    const passos = secao === 'Riff C' ? GALOPE : [0, 3, 4, 8, 11, 12]
    lista = passos.map((passo) => [passo, segundo && passo >= 8 ? raiz(segundo) : raiz(primeiro)])
  } else if (secao === 'Verso') {
    lista = TRESILLO.map((passo) => [passo, raiz(primeiro)])
  } else if (secao === 'Ponte') {
    lista = [[0, raiz(primeiro)], [8, raiz(primeiro)]]
  } else {
    lista = PARADA[indice]
  }
  return notas(semOFim(lista.map(([passo]) => passo), compasso).map((passo) => ({ passo, midi: lista.find(([p]) => p === passo)[1], atenuacao: passo % 4 === 0 ? 0 : 0.12 })), VOZ.baixo, compasso, GRADE)
}

// Parada: o Mi1 segurado, com a quinta ou a oitava respondendo, e o pulso que volta antes do Riff C
const PARADA = Object.freeze([[[0, 28]], [[0, 28], [8, 35]], [[0, 28]], [[0, 28], [8, 35]], [[0, 28], [8, 40]], [[0, 28], [6, 28], [12, 28]]])

// Sub: o Mi1 embaixo das notas longas da Parada e do fim da Ponte
function sub(compasso) {
  const { secao, indice } = COMPASSOS[compasso]
  if ((secao === 'Parada' && indice < 4) || (secao === 'Ponte' && indice >= 6)) return notas([{ passo: 0, midi: 28, atenuacao: 0.15 }], VOZ.sub, compasso, GRADE)
  return null
}

// --------------------------------------------------
// ÓRGÃO (só na ponte): a célula em valores longos (Si – Ré – Mi – Ré – Si) sobre a descida cromática,
// e o suspiro frígio (Dó → Si) no fim
// --------------------------------------------------

const CANTO = Object.freeze({ 0: 71, 1: 74, 2: 76, 3: 74, 4: 71, 5: 72, 6: 71 })

function orgaoCanto(compasso) {
  const { secao, indice } = COMPASSOS[compasso]
  if (secao !== 'Ponte' || !(indice in CANTO)) return null
  return notas([{ passo: 0, midi: CANTO[indice] }], VOZ.orgaoCanto, compasso, GRADE)
}

// --------------------------------------------------
// BATERIA: o bumbo segue a guitarra (célula, galope, tresillo), bumbo duplo no Riff C, meio-tempo
// na ponte, prato escuro nos começos de frase
// --------------------------------------------------

const BUMBO = Object.freeze({ K: 12.42, k: 12.55, d: 12.62, l: 19.25, m: 22.3, h: 26.35 })
// A caixa ~2 dB abaixo dos outros andares (no rock pesado ela era o que mais pesava no agudo)
const CAIXA = Object.freeze({ X: 12.2, x: 12.44, g: 12.8, r: 12.64 })
const CAIXA_CORPO = Object.freeze({ X: 12, x: 12.3, g: 12.9, r: 12.75 })
const CHIMBAL = Object.freeze({ X: 12.3, x: 12.5, s: 12.68 })
const PRATO = Object.freeze({ P: 12.1, p: 12.3 })

// Intensidade da bateria por seção (atenuação somada; 0 = cheia)
const DINAMICA = Object.freeze({ Partida: 0.2, 'Riff A': 0.05, Verso: 0.06, 'Riff B': 0, Ponte: 0.08, Parada: 0.1, 'Riff C': 0 })

const ehCelula = (secao, i) => Boolean(RIFF[secao]?.[i])

const GROOVES = Object.freeze({
  bumbo: {
    Partida: (i) => (i < 2 ? null : i === 3 ? 'K . . . | . . . . | K . . . | h h m l' : 'K . . . | . . . . | K . . . | . . . .'),
    // Na célula o bumbo dobra o ritmo da prensa; nas respostas, o galope
    'Riff A': (i) => {
      if (ehCelula('Riff A', i)) return 'K . . K | K . . K | K . . . | . . . .'
      return i === 7 ? 'K . K K | K . . . | h h m m | l l l l' : 'K . K K | K . . . | K . K K | K . . .'
    },
    Verso: (i) => (i === 7 ? 'K . . K | . . K . | h . h . | m . l .' : 'K . . K | . . K . | K . . K | . . K .'),
    'Riff B': (i) => {
      if (i === 7) return 'K . . . | h . h . | m . m . | l l l l'
      return ehCelula('Riff B', i) ? 'K . . K | K . . K | K . . . | . . . .' : 'K . K K | K . K K | K . K K | K . . .'
    },
    Ponte: (i) => (i === 7 ? 'K . . . | . . . . | . . . . | . l l l' : i % 2 === 0 ? 'K . . . | . . . . | . . . . | . . . .' : 'K . . . | . . K . | . . . . | . . . .'),
    // A prensa (tom grave) responde ao tung-tung-tung nos compassos sem ele
    Parada: (i) => (i === 0 || i === 2 ? '. . . . | . . . . | . . . . | . l l l' : null),
    // Riff C: bumbo duplo em semicolcheias nas respostas
    'Riff C': (i) => {
      if (ehCelula('Riff C', i)) return 'K . . K | K . . K | K . . . | K d K d'
      return i === 7 ? 'K d K d | K d K d | K . K . | l l l l' : 'K d K d | K d K d | K d K d | K d K d'
    },
  },
  caixa: {
    Partida: (i) => (i === 3 ? '. . . . | X . . . | . . . . | X . . .' : null),
    'Riff A': (i) => (i === 7 ? '. . . . | X . . . | . . . . | . . . .' : '. . . . | X . . . | . . . . | X . . .'),
    Verso: (i) => (i === 7 ? '. . . . | X . . . | . . . . | . . . .' : '. . . . | X . . . | . . . g | X . . .'),
    'Riff B': (i) => (i === 7 ? '. . . . | X . . . | . . . . | . . . .' : '. . . . | X . . g | . . . . | X . . g'),
    Ponte: (i) => (i === 6 ? '. . . . | . . . . | X . . . | r . r .' : '. . . . | . . . . | X . . . | . . . .'),
    Parada: (i) => (i === 5 ? 'r . r . | r . r . | r r x x | X X X X' : i === 4 ? '. . . . | . . . . | r . . . | r . r .' : null),
    'Riff C': (i) => (i === 7 ? '. . . . | X . . . | . . . . | . . . .' : '. . . . | X . . . | . . . . | X . . .'),
  },
  chimbal: {
    Partida: () => 'X . x . | X . x . | X . x . | X . x .',
    'Riff A': () => 'X . x . | X . x . | X . x . | X . x .',
    Verso: () => 'X . . . | X . . . | X . . . | X . . .',
    'Riff B': () => 'X s x s | X s x s | X s x s | X s x s',
    'Riff C': () => 'X . x . | X . x . | X . x . | X . x .',
  },
  prato: {
    'Riff A': (i) => (i === 0 ? 'P . . . | . . . . | . . . . | . . . .' : null),
    Verso: (i) => (i % 4 === 0 ? 'P . . . | . . . . | . . . . | . . . .' : null),
    'Riff B': (i) => (i === 0 || i === 4 ? 'P . . . | . . . . | . . . . | . . . .' : null),
    Ponte: (i) => (i % 2 === 0 ? 'P . . . | . . . . | . . . . | . . . .' : null),
    'Riff C': (i) => (i % 2 === 0 ? 'P . . . | . . . . | p . . . | . . . .' : null),
  },
})

function peca(nome, mapa) {
  return (compasso) => {
    const { secao, indice } = COMPASSOS[compasso]
    const groove = GROOVES[nome][secao]
    const texto = groove ? groove(indice) : null
    if (!texto) return null
    const passos = bateria(texto, comAtenuacao(mapa, DINAMICA[secao]), GRADE)
    // No fim de frase com tung-tung-tung, só o bumbo continua nos passos 13 a 15
    return nome === 'bumbo' ? passos : zerarOFim(passos, compasso)
  }
}

const ALTURA_DO_TUNG = 76 // Mi5
const madeira = (compasso) => (temTung(compasso) ? tungTungTung(ALTURA_DO_TUNG, compasso, GRADE) : compassoVazio(GRADE))

// --------------------------------------------------
// CANAIS
// --------------------------------------------------

const CANAIS = [
  ['baixoDistorcido', 0, baixo],
  ['sub', 0, sub],
  ['guitarraPalmMute', -0.25, maquina],
  ['guitarraCrunch', -0.3, powerChord(0, VOZ.fundamental)],
  ['guitarraCrunch', 0.3, powerChord(7, VOZ.quinta)],
  ['guitarraCrunch', 0.16, solo(0)],
  ['guitarraCrunch', -0.16, solo(1)],
  ['orgaoSustentado', 0.12, orgaoCanto],
  ['bumboSeco', 0, peca('bumbo', BUMBO)],
  ['caixa', 0, peca('caixa', CAIXA)],
  ['caixaCorpo', 0, peca('caixa', CAIXA_CORPO)],
  ['chimbal', -0.18, peca('chimbal', CHIMBAL)],
  ['pratoEscuro', 0.2, peca('prato', PRATO)],
  ['madeira', 0.08, madeira],
]

export const PASTIFICIO_SONG = montarMusica({
  instrumentos: PASTIFICIO_INSTRUMENTOS,
  canais: CANAIS,
  compassos: PASTIFICIO_META.compassos,
  inicioDoLoop: PASTIFICIO_META.inicioDoLoop,
  grade: GRADE,
  andamento: PASTIFICIO_META.andamento,
})

const riffExato = (nomeDaSecao) => {
  const secao = PASTIFICIO_SECOES.find((item) => item.nome === nomeDaSecao)
  return Object.entries(RIFF[nomeDaSecao]).filter(([, tonica]) => typeof tonica === 'number').map(([indice, tonica]) => [secao.inicio + Number(indice), tonica])
}

export const PASTIFICIO_MOTIVO = Object.freeze({
  riff: [
    { instrumento: 'guitarraCrunch', compassos: Object.fromEntries([...riffExato('Riff A'), ...riffExato('Riff B'), ...riffExato('Riff C')]) },
    { instrumento: 'baixoDistorcido', compassos: Object.fromEntries([...riffExato('Riff A'), ...riffExato('Riff C')].map(([compasso, tonica]) => [compasso, tonica - 12])) },
  ],
  tung: { compassos: COMPASSOS.map((_, compasso) => compasso).filter(temTung) },
})

// Vozes de melodia (cada voz: os canais [instrumento, ordem] que formam uma linha), para a análise
// melódica (analiseMelodica.js): o riff, a guitarra solo, as terças e o órgão da ponte
export const PASTIFICIO_MELODIA = Object.freeze([[['guitarraCrunch', 0]], [['guitarraCrunch', 2]], [['guitarraCrunch', 3]], [['orgaoSustentado', 0]]])
