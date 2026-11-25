// A Ronda: Porto. Faixa do andar 5: tempestade no cais, o clímax dos andares.
//
// ESTILO E ANDAMENTO
//   Swamp blues / rock pesado em Dó menor, ♩ = 136. Grade de 16 passos por compasso (semicolcheias
//   retas). bpm do ZzFXM = 136.
//
// MATERIAL
//   Tema A: a célula do Tung (Sol – Si♭ – Dó – Si♭ – Sol em Dó) em valores longos (cada nota em dois
//   tempos), cantada pelo trombone; volta no trompete uma oitava acima e no fim em dueto, cada vez
//   com outro final.
//   O riff dos metais: a célula em três oitavas (trompete, trombone, sax barítono) na seção B.
//   Tema B: um contracanto agudo do trompete, só no B2.
//   O tung-tung-tung (madeira, em Dó) aparece em lugares diferentes; na tempestade, os tons dobram.
//
// FORMA (52 compassos, ~92 s; editar em FORMA)
//   A1         (8)  meio-tempo (caixa no 3), guitarra com tremolo, baixo palhetado, o trombone no tema A
//   B1         (8)  tempo cheio: a célula nos metais e ataques do naipe; chimbal aberto
//   A2         (8)  meio-tempo com acentos de tom; o trompete no tema A uma oitava acima, outro fim
//   Tempestade (8)  só os tons em ondas, crescendo, o tremolo e o baixo em mínimas
//   B2         (8)  o ponto mais alto: a célula nos metais, o trompete no tema B, bumbo empurrando;
//                   virada grande de tons no fim
//   A3         (8)  meio-tempo mais leve, trombone e trompete em dueto no tema A, outro fim
//   Calmaria   (4)  só o tremolo, o baixo e o tung-tung-tung: a menor energia, antes de voltar ao A1
//   Energia: A1 média → B1 alta → A2 média → Tempestade sobe → B2 a mais alta → A3 média-baixa →
//   Calmaria a mais baixa → (A1)
//
// ESPAÇO PARA OS EFEITOS SONOROS (100 a 650 Hz)
//   O baixo fica abaixo de 100 Hz; o tema A tem uma ou duas notas longas por compasso; a guitarra
//   só ataca quando o acorde muda; os metais atacam curto.
//
// LOOP SEM EMENDA
//   O áudio começa no A1; a Calmaria (G7#9 com o tung-tung-tung) volta ao A1 como uma virada V → i.
//
// ONDE AJUSTAR
//   FORMA · TEMA_A (e os finais de cada volta) · METAIS (célula, ataques e tema B) · GROOVES ·
//   ONDAS (tempestade) · DINAMICA · TUNG

import { bateria, celula, comAtenuacao, compassoVazio, criarGrade, expandirForma, montarMusica, notas, secoesDaForma, tungTungTung, voz } from './partitura.js'

const A = ['Cm', 'Cm', 'Ab', 'G7#9', 'Cm', 'Cm', 'Fm', 'G7#9']
const B = ['Cm', 'Bb', 'Ab', 'G', 'Cm', 'Bb', 'Ab', 'G7#9']

const FORMA = Object.freeze([
  { nome: 'A1', papel: 'meio-tempo, o trombone no tema A', harmonia: A },
  { nome: 'B1', papel: 'tempo cheio, a célula nos metais', harmonia: B },
  { nome: 'A2', papel: 'o trompete no tema A, acentos de tom', harmonia: A },
  { nome: 'Tempestade', papel: 'só os tons em ondas, crescendo', harmonia: ['Cm', 'Cm', 'Cm', 'Cm', 'Cm', 'Cm', 'Ab', 'G7#9'] },
  { nome: 'B2', papel: 'o clímax: a célula e o tema B do trompete', harmonia: B },
  { nome: 'A3', papel: 'dueto no tema A, bateria leve', harmonia: A },
  { nome: 'Calmaria', papel: 'tremolo, baixo e o tung-tung-tung', harmonia: ['Cm', 'Cm', 'Ab', 'G7#9'] },
])

const COMPASSOS = expandirForma(FORMA)

export const PORTO_META = Object.freeze({
  id: 'andar-porto',
  titulo: 'A Ronda: Porto',
  estilo: 'swamp blues / rock pesado',
  andamento: 136,
  passosPorTempo: 4,
  temposPorCompasso: 4,
  compassos: COMPASSOS.length,
  inicioDoLoop: 0,
  tonalidade: 'Dó menor',
  estrutura: 'A1 8 · B1 8 · A2 8 · Tempestade 8 · B2 8 · A3 8 · Calmaria 4',
})

export const PORTO_SECOES = secoesDaForma(FORMA)
export const PORTO_HARMONIA = Object.freeze(COMPASSOS.map((c) => c.acorde))

const GRADE = criarGrade(PORTO_META.passosPorTempo, PORTO_META.temposPorCompasso)

export const PORTO_INSTRUMENTOS = Object.freeze([
  'baixoEletrico', 'guitarraTremolo', 'trompete', 'trombone', 'saxBaritono',
  'bumbo', 'caixa', 'caixaCorpo', 'chimbal', 'chimbalAberto', 'madeira',
])

const VOZ = Object.freeze({
  baixo: voz('baixoEletrico', 'baixo', { semente: 61 }),
  guitarraGrave: voz('guitarraTremolo', 'comping', { semente: 62 }),
  guitarraAguda: voz('guitarraTremolo', 'comping', { semente: 63 }),
  trompete: voz('trompete', 'naipe', { semente: 64 }),
  trompeteCanto: voz('trompete', 'melodia', { semente: 67 }),
  trombone: voz('trombone', 'naipe', { semente: 65 }),
  tromboneCanto: voz('trombone', 'melodia', { semente: 68 }),
  baritono: voz('saxBaritono', 'naipe', { semente: 66 }),
})

// --------------------------------------------------
// TUNG: lugares diferentes em cada seção (no B2 o fim é uma virada)
// --------------------------------------------------

const TUNG = Object.freeze({ A1: [3, 7], B1: [7], A2: [3], Tempestade: [7], B2: [], A3: [7], Calmaria: [1, 3] })
const temTung = (compasso) => {
  const { secao, indice } = COMPASSOS[compasso]
  return TUNG[secao].includes(indice)
}
const semOFim = (passos, compasso) => (temTung(compasso) ? passos.filter((passo) => passo < 13) : passos)

// --------------------------------------------------
// BAIXO: colcheias palhetadas; mínimas na tempestade; notas longas na calmaria
// --------------------------------------------------

const RAIZ = Object.freeze({ Cm: 36, Ab: 32, 'G7#9': 31, G: 31, Fm: 29, Bb: 34 })
const COLCHEIAS = Array.from({ length: 8 }, (_, i) => i * 2)

function baixo(compasso) {
  const { secao, acorde } = COMPASSOS[compasso]
  let passos = COLCHEIAS
  if (secao === 'Tempestade') passos = [0, 8]
  if (secao === 'Calmaria') passos = [0]
  return notas(semOFim(passos, compasso).map((passo) => ({ passo, midi: RAIZ[acorde], atenuacao: passo % 8 === 0 ? 0 : 0.14 })), VOZ.baixo, compasso, GRADE)
}

// --------------------------------------------------
// GUITARRA COM TREMOLO: um acorde de duas notas no tempo 1, que fica vibrando. Ela só ataca quando o
// acorde muda (ou no começo da seção), e nunca junto com a célula dos metais.
// --------------------------------------------------

const ACORDES = Object.freeze({
  Cm: [55, 63], Ab: [56, 60], 'G7#9': [59, 65], G: [55, 59], Fm: [53, 60], Bb: [58, 62],
})

function guitarra(indice, v) {
  return (compasso) => {
    const { secao, indice: posicao, acorde, primeiro } = COMPASSOS[compasso]
    const anterior = COMPASSOS[(compasso - 1 + COMPASSOS.length) % COMPASSOS.length].acorde
    if (!primeiro && anterior === acorde) return null
    if ((secao === 'B1' || secao === 'B2') && posicao in CELULA_NOS_METAIS) return null
    return notas([{ passo: 0, midi: ACORDES[acorde][indice] }], v, compasso, GRADE)
  }
}

// --------------------------------------------------
// TEMA A: a célula em valores longos ([passo, midi] por compasso da seção A); cada volta muda o fim
// --------------------------------------------------

const TEMA_A = Object.freeze([
  [[0, 55], [8, 58]], [[0, 60]], [[0, 58], [8, 55]], [[0, 53]],
  [[0, 55], [8, 58]], [[0, 60], [8, 63]], [[0, 62], [8, 60]], [[0, 59]],
])
const FINAIS = Object.freeze({
  A1: TEMA_A.slice(6),
  A2: [[[0, 63], [8, 60]], [[0, 59], [6, 62]]],
  A3: [[[0, 63], [4, 62], [8, 60]], [[0, 55]]],
})
const temaA = (secao, indice) => (indice >= 6 ? FINAIS[secao][indice - 6] : TEMA_A[indice])

function trombone(compasso) {
  const { secao, indice } = COMPASSOS[compasso]
  if (secao === 'A1' || secao === 'A3') return notas(temaA(secao, indice).map(([passo, midi]) => ({ passo, midi })), VOZ.tromboneCanto, compasso, GRADE)
  return metal(-12, 1, VOZ.trombone)(compasso)
}

function trompete(compasso) {
  const { secao, indice } = COMPASSOS[compasso]
  if (secao === 'A2' || secao === 'A3') return notas(temaA(secao, indice).map(([passo, midi]) => ({ passo, midi: midi + 12 })), VOZ.trompeteCanto, compasso, GRADE)
  if (secao === 'B2' && TEMA_B[indice]) return notas(TEMA_B[indice].map(([passo, midi]) => ({ passo, midi })), VOZ.trompeteCanto, compasso, GRADE)
  return metal(0, 0, VOZ.trompete)(compasso)
}

// --------------------------------------------------
// METAIS (B1 e B2): a célula em três oitavas, ataques do naipe e o tema B do trompete
// --------------------------------------------------

// Compassos (da seção B) com a célula e a tônica do trompete (Dó, e Sol no último)
const CELULA_NOS_METAIS = Object.freeze({ 0: 60, 4: 60, 7: 55 })
// Ataques no tempo 1: [trompete, trombone, barítono]
const ATAQUES = Object.freeze({ 1: [74, 62, 46], 2: [72, 60, 44], 3: [71, 59, 43], 5: [74, 62, 46], 6: [72, 60, 44] })
// Tema B (só no B2): o trompete canta no lugar dos ataques
const TEMA_B = Object.freeze({
  1: [[4, 74], [6, 72], [8, 70]],
  2: [[0, 72], [8, 75]],
  5: [[4, 77], [6, 75], [8, 74]],
  6: [[0, 72], [4, 70], [8, 68], [12, 67]],
})

function metal(oitava, indiceDoAtaque, v) {
  return (compasso) => {
    const { secao, indice } = COMPASSOS[compasso]
    if (secao !== 'B1' && secao !== 'B2') return null
    if (indice in CELULA_NOS_METAIS) return celula(CELULA_NOS_METAIS[indice] + oitava, v, compasso, GRADE)
    if (indice in ATAQUES) return notas([{ passo: 0, midi: ATAQUES[indice][indiceDoAtaque] }], v, compasso, GRADE)
    return null
  }
}

const baritono = metal(-24, 2, VOZ.baritono)

// --------------------------------------------------
// BATERIA
// --------------------------------------------------

// Bumbo e tons no mesmo canal: K/k = bumbo; l/m/h = tons grave, médio e agudo
const BUMBO = Object.freeze({ K: 12.42, k: 12.55, l: 19.28, m: 22.32, h: 26.38 })
const CAIXA = Object.freeze({ X: 12, x: 12.3, g: 12.7 })
const CAIXA_CORPO = Object.freeze({ X: 12, x: 12.3, g: 12.9 })
const CHIMBAL = Object.freeze({ X: 12.12, x: 12.38 })
const ABERTO = Object.freeze({ o: 12.3 })

// Intensidade da bateria por seção (atenuação somada; 0 = cheia)
const DINAMICA = Object.freeze({ A1: 0.06, B1: 0.02, A2: 0.06, Tempestade: 0, B2: 0, A3: 0.14, Calmaria: 0 })

// Ondas de tons na tempestade: cada compasso um pouco mais cheio (e mais forte, ver bumbo())
const ONDAS = Object.freeze([
  'l . . . | m . . . | l . . . | . . . .',
  'l . . . | m . . . | l . m . | . . . .',
  'l . m . | h . m . | l . . . | m . l .',
  'l . m . | h . m . | l . m . | h . . .',
  'l . m . | h . m . | l . m . | h . m .',
  'l . m . | h . m . | l . m . | h . m l',
  'l m h . | m h l . | m h l . | m h . .',
  'K . . . | l . m . | h . m . | . l l l',
])

const GROOVES = Object.freeze({
  bumbo: {
    A1: () => 'K . . . | . . . . | . . k . | . . . .',
    B1: () => 'K . . . | . . . . | K . k . | . . . .',
    // A2: o mesmo meio-tempo com um tom grave no "e" do 4 nos compassos pares
    A2: (i, tung) => (i % 2 === 0 && !tung ? 'K . . . | . . . . | . . k . | . . l .' : 'K . . . | . . . . | . . k . | . . . .'),
    Tempestade: (i) => ONDAS[i],
    B2: (i) => (i === 7 ? 'h h m m | l l h h | m m l l | K . . .' : 'K . . . | . . k . | K . k . | . . k .'),
    A3: () => 'K . . . | . . . . | . . . . | . . . .',
  },
  caixa: {
    A1: () => '. . . . | . . . . | X . . . | . . . .',
    B1: () => '. . . . | X . . . | . . . . | X . . .',
    A2: () => '. . . . | . . . . | X . . . | . . . g',
    B2: (i) => (i === 7 ? null : '. . . . | X . . g | . . . . | X . . g'),
    A3: () => '. . . . | . . . . | X . . . | . . . .',
  },
  chimbal: {
    A1: () => 'X . x . | X . x . | X . x . | X . x .',
    B1: () => 'X . x . | X . x . | X . x . | X . . .',
    A2: () => 'X . x . | X . x . | X . x . | X . x .',
    B2: (i) => (i === 7 ? null : 'X . x . | X . . . | X . x . | X . . .'),
    A3: () => 'X . . . | x . . . | X . . . | x . . .',
  },
  aberto: {
    B1: (i, tung) => (tung ? null : '. . . . | . . . . | . . . . | . . o .'),
    // B2: aberto no "e" do 2 e no "e" do 4
    B2: (i) => (i === 7 ? null : '. . . . | . . o . | . . . . | . . o .'),
  },
})

function peca(nome, mapa) {
  return (compasso) => {
    const { secao, indice } = COMPASSOS[compasso]
    const groove = GROOVES[nome][secao]
    let texto = groove ? groove(indice, temTung(compasso)) : null
    if (!texto) return null
    // No fim de frase com tung-tung-tung, os passos 13 a 15 ficam livres (menos na tempestade, onde
    // os tons dobram o tung-tung-tung)
    if (temTung(compasso) && secao !== 'Tempestade') texto = texto.replace(/(\S+ \S+ \S+)$/, (fim) => fim.replace(/[^.\s]/g, '.'))
    let mapaDaSecao = comAtenuacao(mapa, DINAMICA[secao])
    if (secao === 'Tempestade' && nome === 'bumbo') mapaDaSecao = comAtenuacao(mapa, (7 - indice) * 0.05)
    return bateria(texto, mapaDaSecao, GRADE)
  }
}

const ALTURA_DO_TUNG = 72 // Dó5
const madeira = (compasso) => (temTung(compasso) ? tungTungTung(ALTURA_DO_TUNG, compasso, GRADE) : compassoVazio(GRADE))

// --------------------------------------------------
// CANAIS
// --------------------------------------------------

const CANAIS = [
  ['baixoEletrico', 0, baixo],
  ['guitarraTremolo', -0.3, guitarra(0, VOZ.guitarraGrave)],
  ['guitarraTremolo', -0.18, guitarra(1, VOZ.guitarraAguda)],
  ['trompete', 0.22, trompete],
  ['trombone', 0.12, trombone],
  ['saxBaritono', 0.05, baritono],
  ['bumbo', 0, peca('bumbo', BUMBO)],
  ['caixa', 0, peca('caixa', CAIXA)],
  ['caixaCorpo', 0, peca('caixa', CAIXA_CORPO)],
  ['chimbal', -0.2, peca('chimbal', CHIMBAL)],
  ['chimbalAberto', -0.24, peca('aberto', ABERTO)],
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

const celulasDoB = (nome) => {
  const secao = PORTO_SECOES.find((item) => item.nome === nome)
  return Object.entries(CELULA_NOS_METAIS).map(([indice, tonica]) => [secao.inicio + Number(indice), tonica])
}

export const PORTO_MOTIVO = Object.freeze({
  riff: [
    { instrumento: 'trompete', compassos: Object.fromEntries([...celulasDoB('B1'), ...celulasDoB('B2')]) },
    { instrumento: 'trombone', compassos: Object.fromEntries([...celulasDoB('B1'), ...celulasDoB('B2')].map(([compasso, tonica]) => [compasso, tonica - 12])) },
  ],
  tung: { compassos: COMPASSOS.map((_, compasso) => compasso).filter(temTung) },
})

// Vozes de melodia (cada voz: os canais [instrumento, ordem] que formam uma linha), para a análise
// melódica (analiseMelodica.js)
export const PORTO_MELODIA = Object.freeze([[['trompete', 0]], [['trombone', 0]]])
