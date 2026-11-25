// A Ronda: Pastificio. Faixa do andar 4: a fábrica de massa (metal, concreto, amarelo e preto).
//
// ESTILO E ANDAMENTO
//   Blues-rock em colcheias retas, em Mi, ♩ = 124. Grade de 16 passos por compasso (semicolcheias
//   retas). bpm do ZzFXM = 124.
//
// MATERIAL
//   Tema A (o riff): a célula do Tung (Si – Ré – Mi – Ré – Si em Mi) em power chords, com o ritmo
//   longo-curto da grade reta (passos 0, 3, 4, 7 e 8), como uma prensa. Ela sobe para o Lá e volta
//   com outro fim.
//   Tema B (a ponte): a mesma célula em valores longos, no órgão.
//   A "máquina": palm mute no Mi2 (82 Hz), que liga, acelera, para e volta.
//   O tung-tung-tung (madeira, em Mi, em semicolcheias) aparece em lugares diferentes; na ponte e
//   na parada, um tom grave (a prensa) responde a ele.
//
// FORMA (50 compassos, ~97 s; editar em FORMA)
//   Partida (4)  a máquina liga sozinha, em crescendo, com o chimbal; virada no fim
//   Riff A  (8)  o riff (Mi, Mi, Lá, Mi com outro fim), bateria rock
//   Verso   (8)  E5 – A5 – B5 em contratempo (passos 0 e 10), sem a célula; bumbo sincopado e
//                chimbal aberto
//   Riff B  (8)  o riff uma oitava acima, a máquina em semicolcheias, o órgão segura o acorde; virada
//                grande de tons no fim: o ponto mais alto
//   Ponte   (8)  a máquina para: C5 – D5 – E5, meio-tempo, o órgão canta a célula em valores longos
//   Parada  (6)  a fábrica para: só o baixo, a máquina em marcha lenta e o tung-tung-tung respondido
//                pela prensa; rulo de caixa em crescendo no fim
//   Riff C  (8)  o riff no grave com o órgão dobrando no agudo, bateria cheia → volta à Partida
//   Energia: Partida baixa → Riff A média → Verso média → Riff B alta → Ponte média → Parada a mais
//   baixa → Riff C alta → (Partida)
//
// ESPAÇO PARA OS EFEITOS SONOROS (100 a 650 Hz)
//   A máquina e o baixo ficam abaixo de 100 Hz; o riff aparece em metade dos compassos de riff.
//
// LOOP SEM EMENDA
//   O áudio começa na Partida; o fim do Riff C (tung-tung-tung com a prensa) volta à Partida, que é a
//   máquina sozinha: a queda de energia é a própria emenda.
//
// ONDE AJUSTAR
//   FORMA · RIFF (onde a célula entra e como termina) · ACORDES (ritmo dos power chords por seção) ·
//   MAQUINA · GROOVES (bateria e viradas) · DINAMICA · TUNG

import { bateria, celula, comAtenuacao, compassoVazio, criarGrade, expandirForma, montarMusica, notas, secoesDaForma, tungTungTung, voz } from './partitura.js'

const FORMA = Object.freeze([
  { nome: 'Partida', papel: 'a máquina liga sozinha', harmonia: ['E5', 'E5', 'E5', 'E5'] },
  { nome: 'Riff A', papel: 'o riff da célula, bateria rock', harmonia: ['E5', 'E5', 'E5', 'E5', 'A5', 'A5', 'E5', 'E5'] },
  { nome: 'Verso', papel: 'power chords em contratempo', harmonia: ['E5', 'E5', 'A5', 'E5', 'B5', 'A5', 'E5', 'B5'] },
  { nome: 'Riff B', papel: 'o riff uma oitava acima, máquina acelerada', harmonia: ['E5', 'E5', 'E5', 'E5', 'A5', 'A5', 'E5', 'E5'] },
  { nome: 'Ponte', papel: 'a máquina para, a célula em valores longos no órgão', harmonia: ['C5', 'D5', 'E5', 'E5', 'C5', 'D5', 'B5', 'B5'] },
  { nome: 'Parada', papel: 'a fábrica para: tung-tung-tung e a prensa', harmonia: ['E5', 'E5', 'E5', 'E5', 'E5', 'E5'] },
  { nome: 'Riff C', papel: 'o riff no grave com o órgão no agudo', harmonia: ['E5', 'E5', 'E5', 'E5', 'A5', 'A5', 'E5', 'E5'] },
])

const COMPASSOS = expandirForma(FORMA)

export const PASTIFICIO_META = Object.freeze({
  id: 'andar-pastificio',
  titulo: 'A Ronda: Pastificio',
  estilo: 'blues-rock reto',
  andamento: 124,
  passosPorTempo: 4,
  temposPorCompasso: 4,
  compassos: COMPASSOS.length,
  inicioDoLoop: 0,
  tonalidade: 'Mi (E5)',
  estrutura: 'Partida 4 · Riff A 8 · Verso 8 · Riff B 8 · Ponte 8 · Parada 6 · Riff C 8',
})

export const PASTIFICIO_SECOES = secoesDaForma(FORMA)
export const PASTIFICIO_HARMONIA = Object.freeze(COMPASSOS.map((c) => c.acorde))

const GRADE = criarGrade(PASTIFICIO_META.passosPorTempo, PASTIFICIO_META.temposPorCompasso)

export const PASTIFICIO_INSTRUMENTOS = Object.freeze([
  'baixoEletrico', 'guitarraPalmMute', 'guitarraCrunch', 'orgaoSustentado', 'orgaoLeslieRapido',
  'bumbo', 'caixa', 'caixaCorpo', 'chimbal', 'chimbalAberto', 'madeira',
])

const VOZ = Object.freeze({
  baixo: voz('baixoEletrico', 'baixo', { semente: 51 }),
  maquina: voz('guitarraPalmMute', 'riff', { semente: 52 }),
  fundamental: voz('guitarraCrunch', 'riff', { semente: 53 }),
  quinta: voz('guitarraCrunch', 'riff', { semente: 54 }),
  orgao: voz('orgaoSustentado', 'comping', { semente: 55 }),
  orgaoCanto: voz('orgaoSustentado', 'melodia', { semente: 56 }),
  orgaoRiff: voz('orgaoLeslieRapido', 'riff', { semente: 57 }),
})

// Fundamental de cada power chord na guitarra (o baixo toca uma oitava abaixo)
const RAIZ = Object.freeze({ E5: 40, A5: 45, B5: 47, C5: 48, D5: 50 })
const COLCHEIAS = Array.from({ length: 8 }, (_, i) => i * 2)
const SEMICOLCHEIAS = Array.from({ length: 16 }, (_, i) => i)

// --------------------------------------------------
// TUNG: lugares diferentes em cada seção
// --------------------------------------------------

const TUNG = Object.freeze({ Partida: [], 'Riff A': [3, 7], Verso: [], 'Riff B': [3], Ponte: [7], Parada: [1, 3], 'Riff C': [7] })
const temTung = (compasso) => {
  const { secao, indice } = COMPASSOS[compasso]
  return TUNG[secao].includes(indice)
}
// No fim de frase com tung-tung-tung, nada toca nos passos 13 a 15
const semOFim = (passos, compasso) => (temTung(compasso) ? passos.filter((passo) => passo < 13) : passos)

// --------------------------------------------------
// RIFF: tônica da célula por compasso da seção ('fim' = a célula com o último Si trocado pelo Sol)
// --------------------------------------------------

const RIFF = Object.freeze({
  'Riff A': { 0: 40, 2: 40, 4: 45, 6: 'fim' },
  'Riff B': { 0: 52, 2: 52, 4: 57, 6: 'fim' },
  'Riff C': { 0: 40, 2: 40, 4: 45, 6: 40 },
})

// Ritmo dos power chords fora do riff, por seção
const ACORDES = Object.freeze({
  'Riff A': [0],
  Verso: [0, 10],
  'Riff B': [0],
  Ponte: [0],
  'Riff C': [0],
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
    const ritmo = ACORDES[secao]
    if (!ritmo) return null
    const passos = secao === 'Ponte' && indice >= 6 ? [0, 8] : ritmo
    return notas(semOFim(passos, compasso).map((passo) => ({ passo, midi: RAIZ[acorde] + oitava + intervalo })), v, compasso, GRADE)
  }
}

// --------------------------------------------------
// MÁQUINA: palm mute no Mi2
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
  } else if (secao === 'Riff B') {
    passos = temCelula ? SEMICOLCHEIAS.filter((passo) => passo >= 10) : SEMICOLCHEIAS
  } else {
    passos = temCelula ? COLCHEIAS.filter((passo) => passo >= 10) : COLCHEIAS.filter((passo) => secao !== 'Riff A' || passo > 0)
  }
  return notas(semOFim(passos, compasso).map((passo) => ({ passo, midi: 40, atenuacao: extra + (passo % 4 === 0 ? 0 : 0.15) })), VOZ.maquina, compasso, GRADE)
}

// --------------------------------------------------
// BAIXO: colcheias na fundamental; mínimas na ponte; notas longas na parada
// --------------------------------------------------

function baixo(compasso) {
  const { secao, acorde } = COMPASSOS[compasso]
  const raiz = RAIZ[acorde] - 12
  if (secao === 'Partida') return null
  let passos = COLCHEIAS
  if (secao === 'Ponte') passos = [0, 8]
  if (secao === 'Parada') passos = [0]
  return notas(semOFim(passos, compasso).map((passo) => ({ passo, midi: raiz, atenuacao: passo % 4 === 0 ? 0 : 0.12 })), VOZ.baixo, compasso, GRADE)
}

// --------------------------------------------------
// ÓRGÃO: acorde segurado no Riff B, tríades e o canto da célula alongada na ponte, a célula no agudo no Riff C
// --------------------------------------------------

const TRIADES = Object.freeze({ E5: [64, 68, 71], A5: [64, 69, 73], B5: [63, 66, 71], C5: [60, 64, 67], D5: [62, 66, 69] })

function orgao(indiceDaVoz) {
  return (compasso) => {
    const { secao, indice, acorde } = COMPASSOS[compasso]
    if (secao === 'Ponte' || (secao === 'Riff B' && indice % 2 === 0)) {
      return notas([{ passo: 0, midi: TRIADES[acorde][indiceDaVoz] }], VOZ.orgao, compasso, GRADE)
    }
    return null
  }
}

// Ponte: Si . . . Ré . . . | Mi (longo) | Ré . . . Si (a célula, cada nota em dois tempos)
const CANTO = Object.freeze({
  0: [[0, 71], [8, 74]], 1: [[0, 76]], 2: [[0, 74], [8, 71]], 3: [],
  4: [[0, 71], [8, 74]], 5: [[0, 76], [8, 78]], 6: [[0, 75]], 7: [],
})

function orgaoCanto(compasso) {
  const { secao, indice } = COMPASSOS[compasso]
  if (secao !== 'Ponte' || !CANTO[indice].length) return null
  return notas(CANTO[indice].map(([passo, midi]) => ({ passo, midi })), VOZ.orgaoCanto, compasso, GRADE)
}

// Riff C: o órgão dobra a célula duas oitavas acima da guitarra
function orgaoRiff(compasso) {
  const { secao, indice } = COMPASSOS[compasso]
  const tonica = RIFF[secao]?.[indice]
  if (secao !== 'Riff C' || typeof tonica !== 'number') return null
  return celula(tonica + 24, VOZ.orgaoRiff, compasso, GRADE)
}

// --------------------------------------------------
// BATERIA: um groove por seção e viradas nas passagens
// --------------------------------------------------

const BUMBO = Object.freeze({ K: 12.42, k: 12.55, l: 19.2, m: 22.25, h: 26.3 })
const CAIXA = Object.freeze({ X: 12, x: 12.3, g: 12.7, r: 12.55 })
const CAIXA_CORPO = Object.freeze({ X: 12, x: 12.3, g: 12.9, r: 12.75 })
const CHIMBAL = Object.freeze({ X: 12.1, x: 12.35, s: 12.55 })
const ABERTO = Object.freeze({ o: 12.25 })

// Intensidade da bateria por seção (atenuação somada; 0 = cheia)
const DINAMICA = Object.freeze({ Partida: 0.2, 'Riff A': 0.05, Verso: 0.06, 'Riff B': 0, Ponte: 0.08, Parada: 0.1, 'Riff C': 0 })

const GROOVES = Object.freeze({
  bumbo: {
    Partida: (i) => (i < 2 ? null : i === 3 ? 'K . . . | . . . . | K . . . | h h m l' : 'K . . . | . . . . | K . . . | . . . .'),
    'Riff A': () => 'K . . . | . . . . | K . k . | . . . .',
    Verso: (i) => (i === 7 ? 'K . . . | . . k . | h . h . | m . l .' : 'K . . . | . . k . | K . k . | . . . .'),
    'Riff B': (i) => (i === 7 ? 'K . . . | h . h . | m . m . | l l l l' : 'K . . . | . . . . | K . K . | . . . .'),
    Ponte: (i) => (i === 7 ? 'K . . . | . . . . | . . . . | . l l l' : 'K . . . | . . . . | . . . . | . . . .'),
    // A prensa (tom grave) responde ao tung-tung-tung nos compassos sem ele
    Parada: (i) => (i === 0 || i === 2 ? '. . . . | . . . . | . . . . | . l l l' : null),
    'Riff C': (i) => (i === 7 ? 'K . . . | . . . . | K . K . | . l l l' : 'K . . . | . . k . | K . k . | . . . .'),
  },
  caixa: {
    Partida: (i) => (i === 3 ? '. . . . | X . . . | . . . . | X . . .' : null),
    'Riff A': () => '. . . . | X . . . | . . . . | X . . .',
    Verso: (i) => (i === 7 ? '. . . . | X . . . | . . . . | . . . .' : '. . . . | X . . . | . . . g | X . . .'),
    'Riff B': (i) => (i === 7 ? '. . . . | X . . . | . . . . | . . . .' : '. . . . | X . . g | . . . . | X . . g'),
    Ponte: (i) => (i === 6 ? '. . . . | . . . . | X . . . | r . r .' : '. . . . | . . . . | X . . . | . . . .'),
    Parada: (i) => (i === 5 ? 'r . r . | r . r . | r r x x | X X X X' : i === 4 ? '. . . . | . . . . | r . . . | r . r .' : null),
    'Riff C': () => '. . . . | X . . . | . . . . | X . . .',
  },
  chimbal: {
    Partida: () => 'X . x . | X . x . | X . x . | X . x .',
    'Riff A': () => 'X . x . | X . x . | X . x . | X . x .',
    Verso: () => 'X . x . | X . x . | X . x . | X . . .',
    'Riff B': () => 'X s x s | X s x s | X s x s | X s x s',
    Ponte: () => 'X . . . | x . . . | X . . . | x . . .',
    'Riff C': () => 'X . x . | X . x . | X . x . | X . x .',
  },
  aberto: {
    // Chimbal aberto no "e" do 4: no Verso a cada dois compassos, no Riff C em todos
    Verso: (i) => (i % 2 === 1 && i !== 7 ? '. . . . | . . . . | . . . . | . . o .' : null),
    'Riff C': (i) => (i === 7 ? null : '. . . . | . . . . | . . . . | . . o .'),
  },
})

function peca(nome, mapa) {
  return (compasso) => {
    const { secao, indice } = COMPASSOS[compasso]
    const groove = GROOVES[nome][secao]
    const texto = groove ? groove(indice, temTung(compasso)) : null
    if (!texto) return null
    // No fim de frase com tung-tung-tung, o chimbal deixa os passos 13 a 15 livres
    const final = nome === 'chimbal' && temTung(compasso) ? texto.replace(/(\S+ \S+ \S+)$/, (fim) => fim.replace(/[Xxs]/g, '.')) : texto
    return bateria(final, comAtenuacao(mapa, DINAMICA[secao]), GRADE)
  }
}

const ALTURA_DO_TUNG = 76 // Mi5
const madeira = (compasso) => (temTung(compasso) ? tungTungTung(ALTURA_DO_TUNG, compasso, GRADE) : compassoVazio(GRADE))

// --------------------------------------------------
// CANAIS
// --------------------------------------------------

const CANAIS = [
  ['baixoEletrico', 0, baixo],
  ['guitarraPalmMute', -0.25, maquina],
  ['guitarraCrunch', -0.3, powerChord(0, VOZ.fundamental)],
  ['guitarraCrunch', 0.3, powerChord(7, VOZ.quinta)],
  ['orgaoSustentado', 0.2, orgao(0)],
  ['orgaoSustentado', 0.28, orgao(1)],
  ['orgaoSustentado', 0.24, orgao(2)],
  ['orgaoSustentado', 0.12, orgaoCanto],
  ['orgaoLeslieRapido', 0.18, orgaoRiff],
  ['bumbo', 0, peca('bumbo', BUMBO)],
  ['caixa', 0, peca('caixa', CAIXA)],
  ['caixaCorpo', 0, peca('caixa', CAIXA_CORPO)],
  ['chimbal', -0.18, peca('chimbal', CHIMBAL)],
  ['chimbalAberto', -0.22, peca('aberto', ABERTO)],
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
    { instrumento: 'orgaoLeslieRapido', compassos: Object.fromEntries(riffExato('Riff C').map(([compasso, tonica]) => [compasso, tonica + 24])) },
  ],
  tung: { compassos: COMPASSOS.map((_, compasso) => compasso).filter(temTung) },
})
