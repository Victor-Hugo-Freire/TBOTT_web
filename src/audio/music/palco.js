// A Ronda: Palco. A sala do palco (andares 2 a 5): um desafio de quatro ondas num teatro de cortinas
// de veludo, com a Batuta do Maestro de recompensa. Três peças:
//   palco-show   a abertura de ópera-bufa que toca durante as ondas (começa por uma introdução, a "abertura")
//   palco        os bastidores: a sala aberta, antes de pegar a Batuta e depois da vitória
//   palco-fim    o final de espetáculo, uma vez só, quando a última onda cai
//
// ESTILO E ANDAMENTO
//   Ópera-bufa com cara de pit orchestra: Ré maior, ♩ = 152 contado em dois (galope), oom-pah de
//   contrabaixo e órgão de salão. É o único lugar do jogo em modo maior (os andares são menores e
//   modais), e é isso que diz ao jogador que ele entrou num lugar especial. Grade de 12 passos por tempo
//   (escrita12.js): semicolcheias nos galopes e tercinas no cabaret, no mesmo compasso se preciso.
//
// HARMONIA (o que é só do Palco)
//   Dominantes secundárias (B7 → Em, E7 → A7) e o "sorriso torto": o IV maior vira IV menor (G → Gm6)
//   por um instante e volta. No Cabaret a casa vira Ré menor, com o engano V7 → ♭VI (A7 → B♭), e a volta
//   para o Ré maior é a surpresa. O Crescendo é a escada de Rossini: I – V7 repetido, com uma camada nova
//   a cada vez.
//
// MATERIAL
//   Tema: a fanfarra em arpejo de semicolcheias até o Ré5 e o "tra-la-lá" (volta em tercinas); a resposta
//   termina na pausa do aplauso. A célula do Tung (Lá – Dó – Ré – Dó – Lá) aparece no clarinete, em cima
//   do Ré/Fá♯, como uma piada. O tung-tung-tung (madeira, em tercina) fecha frases.
//
// FORMA (palco-show: 48 compassos, ~76 s; editar em FORMAS)
//   Abertura (introdução, 4)  Tema 8 · Crescendo 8 · Cabaret 8 · Aplauso 4 · Tema 2 8 · Galope 8 · Volta 4
//   Os bastidores (palco): Foyer A 8 · Foyer B 8 · Foyer C 8, ♩ = 96, sem bateria.
//
// GRAVE E AGUDO
//   O contrabaixo (com harmônicos) faz o oom (Ré2 a Si2) e o sub só entra nos tuttis; a melodia fica entre
//   Si♭3 e Mi5; o agudo só no vibrafone e na campana, em detalhes. O órgão de salão toca uma oitava
//   abaixo do escrito (orgao16), no meio.
//
// LOOP SEM EMENDA
//   O show termina na Volta (D – B7 – E7 – A7, o A7 em crescendo de caixa) e o corpo recomeça no Tema.
//
// ONDE AJUSTAR
//   FORMAS · ACORDES · TEMA · CRESCENDO · CABARET · GALOPE · DINAMICA · TUNG

import { celula, comAtenuacao, compassoVazio, expandirForma, montarMusica, secoesDaForma, tungTungTung, voz } from './partitura.js'
import { batida, COLCHEIAS, escrever, escreverMidi, evitarUnissonos, GRADE12, SEMICOLCHEIAS } from './escrita12.js'

const GRADE = GRADE12
const ALTURA_DO_TUNG = 76 // Mi5

// --------------------------------------------------
// ACORDES: baixo (fundamental e quinta) e as três notas do "pah" (escritas; o órgão soa uma oitava abaixo)
// --------------------------------------------------

const ACORDES = Object.freeze({
  D: { raiz: 38, quinta: 45, tons: [57, 62, 66] },
  'D/F#': { raiz: 42, quinta: 38, tons: [57, 62, 66] },
  'D/A': { raiz: 45, quinta: 40, tons: [57, 62, 66] },
  B7: { raiz: 47, quinta: 42, tons: [57, 63, 66] },
  Em: { raiz: 40, quinta: 47, tons: [59, 64, 67] },
  A7: { raiz: 45, quinta: 40, tons: [55, 61, 64] },
  E7: { raiz: 40, quinta: 47, tons: [56, 62, 64] },
  G: { raiz: 43, quinta: 38, tons: [59, 62, 67] },
  Gm6: { raiz: 43, quinta: 38, tons: [58, 62, 64] },
  Gm: { raiz: 43, quinta: 38, tons: [58, 62, 67] },
  Dm: { raiz: 38, quinta: 45, tons: [57, 62, 65] },
  Bb: { raiz: 46, quinta: 41, tons: [58, 62, 65] },
})

// Um compasso pode ter dois acordes ("D/A A7": o primeiro nos tempos 1 e 2, o segundo nos tempos 3 e 4)
const acordesDoCompasso = (nome) => nome.split(' ')

// --------------------------------------------------
// MELODIAS (posições em semicolcheias; "t" = tercina de colcheia)
// --------------------------------------------------

const TEMA = Object.freeze([
  'D4:0 F#4:1 A4:2 D5:3 A4:6 F#4:8 A4:10 D5:12', // D: a fanfarra em arpejo
  'B4:0t C#5:1t B4:2t D#5:3t B4:6t F#4:9t', // B7: o "tra-la-lá" (volta em tercinas)
  'G4:0 B4:2 E5:4 D5:8 B4:10 G4:12', // Em
  'E4:0 G4:2 A4:4 C#5:6 E5:8 D5:14', // A7: sobe até o Mi5 e fica
  null, // D/F#: a célula do Tung (veja CELULA)
  'B4:0 D5:3 E5:6 D5:8 B4:12', // G
  'Bb4:0t D5:1t E5:2t D5:3t Bb4:5t G4:6t', // Gm6: o sorriso torto
  'F#4:0 A4:3 D5:6 C#5:12', // D/A A7: resolve e pergunta
])
const CELULA_NO_TEMA = 4 // índice do compasso da célula dentro do Tema

// A escada de Rossini: dois compassos que se repetem, a cada vez com mais camadas
const CRESCENDO = Object.freeze([
  'A4:0 A4:2 A4:4 B4:6 C#5:8 B4:10 A4:12 F#4:14', // D
  'G4:0 G4:2 G4:4 A4:6 B4:8 A4:10 G4:12 E4:14', // A7
])

const CABARET = Object.freeze([
  'F4:0t A4:1t D5:2t C5:3t A4:5t F4:6t E4:9t', // Dm
  'G4:0t Bb4:1t D5:2t Bb4:3t G4:5t F#4:9t', // Gm
  'A4:0t F4:1t D4:2t E4:3t F4:4t A4:6t', // Dm
  'E4:0t G4:1t C#5:2t E5:3t D5:6t C#5:9t', // A7
  'F4:0t Bb4:1t D5:2t C5:3t Bb4:5t A4:6t', // B♭ (o engano)
  'G4:0t Bb4:1t E5:2t D5:3t Bb4:5t G4:6t', // Gm6
  'A4:0t C#5:1t E5:2t G4:3t E4:6t C#4:9t', // A7
  'C#5:0t A4:3t', // A7: a pausa, a dominante em suspenso
])

// Galope: arpejos em semicolcheias, a mesma figura sobre cada acorde
const GALOPE = Object.freeze([
  'D4:0 F#4:1 A4:2 D5:3 E5:4 D5:5 A4:6 F#4:7 D4:8 F#4:9 A4:10 D5:11 A4:12 F#4:14', // D
  'E4:0 G4:1 A4:2 C#5:3 E5:4 C#5:5 A4:6 G4:7 E4:8 G4:9 A4:10 C#5:11 A4:12 E4:14', // A7
  'D4:0 F#4:1 A4:2 D5:3 E5:4 D5:5 A4:6 F#4:7 D4:8 F#4:9 A4:10 D5:11 A4:12 F#4:14', // D
  'E4:0 G4:1 A4:2 C#5:3 E5:4 C#5:5 A4:6 G4:7 C#5:8 A4:9 G4:10 E4:11 A4:12 C#5:14', // A7
  'G4:0 B4:1 D5:2 B4:3 G4:4 B4:5 D5:6 E5:7 D5:8 B4:9 G4:10 B4:11 D5:12 B4:14', // G
  'F#4:0 A4:1 D5:2 A4:3 F#4:4 A4:5 D5:6 E5:7 D5:8 A4:9 F#4:10 A4:11 D5:12 A4:14', // D/F#
  'E4:0 G#4:1 B4:2 D5:3 E5:4 D5:5 B4:6 G#4:7 E4:8 G#4:9 B4:10 D5:11 B4:12 G#4:14', // E7
  'E4:0 G4:1 A4:2 C#5:3 E5:4 C#5:5 A4:6 G4:7 C#5:8 A4:9 G4:10 E4:11 A4:12 C#5:14', // A7
])

// --------------------------------------------------
// BATERIA (os mapas são os dos andares)
// --------------------------------------------------

const BUMBO = Object.freeze({ K: 12.42, k: 12.55, d: 12.62, l: 19.25, m: 22.3, h: 26.35 })
const CAIXA = Object.freeze({ X: 12.2, x: 12.44, g: 12.8, r: 12.64 })
const CAIXA_CORPO = Object.freeze({ X: 12, x: 12.3, g: 12.9, r: 12.75 })
const CHIMBAL = Object.freeze({ X: 12.3, x: 12.5, s: 12.68 })
const PRATO = Object.freeze({ P: 12.1, p: 12.3 })
const PALMAS = Object.freeze({ A: 12.25, a: 12.5, b: 12.72 })
const CAMPANA = Object.freeze({ A: 12.35, a: 12.6 })

// O shuffle do cabaret: longa e curta de cada tempo
const SHUFFLE = '0t 3t 6t 9t'.split(' ').map((p, i) => `X:${p} x:${[2, 5, 8, 11][i]}t`).join(' ')
const ROLO = 'g:0 g:2 g:4 g:6 r:8 r:9 r:10 r:11 x:12 x:13 X:14 X:15'
const APLAUSO = [
  'a:0 b:2 a:3 b:5 a:6 b:8 a:9 b:11 a:12 b:13 a:15',
  'b:1 a:4 b:7 a:10 b:13',
  'b:2 b:9 b:14',
  null,
]

const DINAMICA = Object.freeze({ Tema: 0.08, Crescendo: 0.1, Cabaret: 0.1, Aplauso: 0.15, 'Tema 2': 0.04, Galope: 0, Volta: 0.06 })
// Compassos (índice dentro da seção) que fecham com o tung-tung-tung
const TUNG = Object.freeze({ Tema: [3], Crescendo: [3], Cabaret: [3], Aplauso: [3], 'Tema 2': [3], Galope: [3], Volta: [2] })

// --------------------------------------------------
// O SHOW
// --------------------------------------------------

const SECOES = Object.freeze({
  Tema: { papel: 'a fanfarra e o tra-la-lá, oom-pah', harmonia: ['D', 'B7', 'Em', 'A7', 'D/F#', 'G', 'Gm6', 'D/A A7'] },
  Crescendo: { papel: 'a escada de Rossini: uma camada nova a cada repetição', harmonia: ['D', 'A7', 'D', 'A7', 'D', 'A7', 'G', 'A7'] },
  Cabaret: { papel: 'Ré menor em tercinas, solo de clarinete e o engano V7 → ♭VI', harmonia: ['Dm', 'Gm', 'Dm', 'A7', 'Bb', 'Gm6', 'A7', 'A7'] },
  Aplauso: { papel: 'a pausa do aplauso: o vibrafone, as palmas e o contrabaixo', harmonia: ['D', 'D', 'G', 'A7'] },
  'Tema 2': { papel: 'o tema de novo, com contramelodia e bateria cheia', harmonia: ['D', 'B7', 'Em', 'A7', 'D/F#', 'G', 'Gm6', 'D/A A7'] },
  Galope: { papel: 'semicolcheias a toda: arpejos em galope', harmonia: ['D', 'A7', 'D', 'A7', 'G', 'D/F#', 'E7', 'A7'] },
  Volta: { papel: 'D – B7 – E7 – A7: a dominante em crescendo emenda no Tema', harmonia: ['D', 'B7', 'E7', 'A7'] },
})
export const FORMA_DO_SHOW = Object.freeze(['Tema', 'Crescendo', 'Cabaret', 'Aplauso', 'Tema 2', 'Galope', 'Volta'])

const VOZ = Object.freeze({
  baixo: voz('contrabaixoCheio', 'baixo', { semente: 111 }),
  sub: voz('sub', 'baixo', { semente: 112 }),
  pah1: voz('orgao16', 'comping', { semente: 113 }),
  pah2: voz('orgao16', 'comping', { semente: 114 }),
  pah3: voz('orgao16', 'comping', { semente: 115 }),
  tuba: voz('tromboneLongo', 'naipe', { semente: 116 }),
  clarinete: voz('clarinete', 'melodia', { semente: 117 }),
  clarineteLongo: voz('clarineteLongo', 'naipe', { semente: 118 }),
  trompete: voz('trompete', 'melodia', { semente: 119 }),
  trompeteLongo: voz('trompeteLongo', 'naipe', { semente: 120 }),
  vibra: voz('vibrafone', 'melodia', { semente: 121 }),
})

// A fundamental seguinte do baixo (para a nota de aproximação, um semitom abaixo dela)
function aproximacao(COMPASSOS, compasso) {
  const proximo = COMPASSOS[(compasso + 1) % COMPASSOS.length]
  const raiz = ACORDES[acordesDoCompasso(proximo.acorde)[0]].raiz
  return raiz > 38 ? raiz - 1 : raiz + 1
}

// Quem fica com a nota quando dois instrumentos caem na mesma altura (a melodia primeiro, o pah por último)
const PRIORIDADE = Object.freeze(['clarinete', 'trompete', 'trompeteLongo', 'vibrafone', 'tromboneLongo', 'contrabaixoCheio', 'orgao16'])

function criarShow() {
  const forma = FORMA_DO_SHOW.map((nome) => ({ nome, papel: SECOES[nome].papel, harmonia: SECOES[nome].harmonia }))
  const COMPASSOS = expandirForma(forma)
  const temTung = (c) => TUNG[COMPASSOS[c].secao]?.includes(COMPASSOS[c].indice) ?? false
  const semOFim = (fn) => (c) => {
    const passos = fn(c)
    return passos && temTung(c) ? passos.map((valor, passo) => (passo >= 34 ? 0 : valor)) : passos
  }
  // Camada do Crescendo: 0 a 3 (a cada dois compassos entra mais um instrumento)
  const camada = (c) => (COMPASSOS[c].secao === 'Crescendo' ? Math.floor(COMPASSOS[c].indice / 2) : 3)

  // ---------------- baixo, sub e tuba ----------------
  function baixo(c) {
    const { secao, indice, acorde } = COMPASSOS[c]
    const [primeiro, segundo] = acordesDoCompasso(acorde).map((a) => ACORDES[a])
    const duplo = Boolean(segundo)
    let lista
    if (secao === 'Cabaret') {
      lista = [['0t', primeiro.raiz], ['3t', primeiro.quinta + 12 <= 55 ? primeiro.quinta + 12 : primeiro.quinta], ['6t', primeiro.raiz + 12 <= 55 ? primeiro.raiz + 12 : primeiro.raiz], ['9t', aproximacao(COMPASSOS, c)]]
    } else if (secao === 'Aplauso') {
      lista = indice < 2 ? [[0, primeiro.raiz]] : [[0, primeiro.raiz], [8, primeiro.quinta], [14, aproximacao(COMPASSOS, c)]]
    } else if (secao === 'Galope') {
      lista = Array.from({ length: 8 }, (_, i) => [i * 2, i % 4 === 2 ? primeiro.quinta : primeiro.raiz])
    } else if (secao === 'Volta') {
      lista = [[0, primeiro.raiz], [4, primeiro.quinta], [8, primeiro.raiz], [12, aproximacao(COMPASSOS, c)]]
    } else if (secao === 'Crescendo' && camada(c) >= 2) {
      lista = [0, 2, 4, 6, 8, 10, 12, 14].map((p) => [p, p % 8 === 4 ? primeiro.quinta : primeiro.raiz])
    } else if (duplo) {
      lista = [[0, primeiro.raiz], [4, primeiro.quinta], [8, segundo.raiz], [12, segundo.quinta], [14, aproximacao(COMPASSOS, c)]]
    } else {
      lista = [[0, primeiro.raiz], [8, primeiro.quinta], [14, aproximacao(COMPASSOS, c)]]
    }
    return escreverMidi(lista.map(([p, midi], i) => [p, midi, i === 0 ? 0 : 0.1 + (i % 2) * 0.04]), VOZ.baixo, c)
  }

  function sub(c) {
    const { secao, indice, acorde } = COMPASSOS[c]
    const raiz = ACORDES[acordesDoCompasso(acorde)[0]].raiz
    const toca = secao === 'Galope' || secao === 'Volta' || (secao === 'Crescendo' && camada(c) === 3) || (secao === 'Tema 2' && indice === 0)
    return toca ? escreverMidi([[0, raiz, 0.12]], VOZ.sub, c) : null
  }

  // A tuba (o trombone longo) dobra a fundamental nos tempos fortes onde o show está cheio
  function tuba(c) {
    const { secao, acorde } = COMPASSOS[c]
    const raiz = ACORDES[acordesDoCompasso(acorde)[0]].raiz
    const cheio = secao === 'Galope' || secao === 'Tema 2' || (secao === 'Crescendo' && camada(c) === 3) || secao === 'Volta'
    return cheio ? escreverMidi([[0, raiz + 12, 0.1]], VOZ.tuba, c) : null
  }

  // ---------------- o "pah": três notas de órgão, nos tempos 2 e 4 ----------------
  function pah(indiceDaNota) {
    const v = [VOZ.pah1, VOZ.pah2, VOZ.pah3][indiceDaNota]
    return (c) => {
      const { secao, acorde } = COMPASSOS[c]
      if (secao === 'Aplauso') return null
      const acordes = acordesDoCompasso(acorde).map((a) => ACORDES[a])
      const primeiro = acordes[0]
      const segundo = acordes[1] ?? primeiro
      const posicoes = secao === 'Cabaret' ? ['3t', '9t'] : secao === 'Galope' ? [4, 6, 12, 14] : [4, 12]
      return escreverMidi(posicoes.map((p, i) => [p, (i >= posicoes.length / 2 ? segundo : primeiro).tons[indiceDaNota] + 12, i % 2 ? 0.16 : 0.1]), v, c)
    }
  }

  // ---------------- melodia ----------------
  function clarinete(c) {
    const { secao, indice } = COMPASSOS[c]
    if (secao === 'Tema' || secao === 'Tema 2') {
      if (indice === CELULA_NO_TEMA) return celula(62, VOZ.clarinete, c, GRADE)
      return escrever(TEMA[indice], VOZ.clarinete, c, 0.02)
    }
    if (secao === 'Crescendo') return camada(c) >= 1 ? escrever(CRESCENDO[indice % 2], VOZ.clarinete, c, 0.04 - camada(c) * 0.02) : null
    if (secao === 'Cabaret') return escrever(CABARET[indice], VOZ.clarinete, c, 0.04)
    if (secao === 'Galope') return escrever(GALOPE[indice], VOZ.clarinete, c, 0.04)
    if (secao === 'Aplauso' && indice >= 2) return escrever(indice === 2 ? 'D4:0 F#4:1 A4:2 D5:3' : 'A4:0 C#5:3', VOZ.clarinete, c, 0.2)
    return null
  }

  // Trompete (curto): dobra o Crescendo uma oitava abaixo do clarinete
  function trompete(c) {
    const { secao, indice } = COMPASSOS[c]
    return secao === 'Crescendo' && camada(c) >= 2 ? escrever(CRESCENDO[indice % 2], VOZ.trompete, c, 0.08, -12) : null
  }

  // Trompete longo: a contramelodia do Tema 2 (a terça do acorde) e os acordes do Galope (fundamental e terça)
  function trompeteLongo(c) {
    const { secao, acorde } = COMPASSOS[c]
    const acordes = acordesDoCompasso(acorde).map((a) => ACORDES[a])
    if (secao === 'Tema 2') return escreverMidi([[0, acordes[0].tons[1], 0.12], ...(acordes[1] ? [[12, acordes[1].tons[1], 0.12]] : [])], VOZ.trompeteLongo, c)
    if (secao === 'Galope') return escreverMidi([[0, acordes[0].tons[0], 0.1], [8, acordes[acordes.length - 1].tons[1], 0.14]], VOZ.trompeteLongo, c)
    return null
  }

  // Vibrafone: brilho no fim das frases do Tema e a pausa do aplauso
  function vibra(c) {
    const { secao, indice } = COMPASSOS[c]
    if (secao === 'Aplauso' && indice < 2) return escreverMidi([[0, 74, 0.05], [12, 81, 0.25]], VOZ.vibra, c)
    if ((secao === 'Tema' || secao === 'Tema 2') && indice % 2 === 1) return escreverMidi([['9t', 74, 0.2], ['10t', 78, 0.28], ['11t', 81, 0.34]], VOZ.vibra, c)
    if (secao === 'Crescendo' && camada(c) >= 2) return escreverMidi([[0, 81, 0.3]], VOZ.vibra, c)
    return null
  }

  // ---------------- bateria ----------------
  const GROOVES = {
    bumbo: {
      Tema: (i) => (i === 7 ? 'K:0 K:8 h:9t m:10t l:11t' : 'K:0 K:8'),
      Crescendo: (i) => (i === 7 ? 'K:0 K:4 K:8 K:12' : 'K:0 K:8'),
      Cabaret: (i) => (i === 7 ? 'K:0' : 'K:0 K:6'),
      Aplauso: (i) => (i >= 2 ? 'K:0' : null),
      'Tema 2': (i) => (i === 7 ? 'K:0 K:8 h:9t m:10t l:11t' : 'K:0 K:8'),
      Galope: (i) => (i === 7 ? 'K:0 K:2 K:4 K:6 K:8 K:10 h:9t m:10t l:11t' : 'K:0 K:2 K:4 K:6 K:8 K:10 K:12 K:14'),
      Volta: (i) => (i === 3 ? 'K:0 K:4 K:8' : 'K:0 K:8'),
    },
    caixa: {
      Tema: (i) => (i === 7 ? 'X:4 X:12 r:13 r:14 r:15' : 'x:4 x:12'),
      Crescendo: (i) => (Math.floor(i / 2) === 3 ? (i === 7 ? ROLO : COLCHEIAS) : 'x:4 x:12'),
      Cabaret: (i) => (i === 7 ? 'X:3t g:5t r:8t r:9t r:10t r:11t' : 'X:3t X:9t g:5t g:11t'),
      'Tema 2': (i) => (i === 7 ? 'X:4 X:12 r:13 r:14 r:15' : 'x:4 x:12'),
      Galope: (i) => (i === 7 ? 'X:4 X:12 r:13 r:14 r:15' : 'X:4 g:6 X:12 g:14'),
      Volta: (i) => (i === 3 ? ROLO : 'x:4 x:12'),
    },
    chimbal: {
      Crescendo: (i) => (Math.floor(i / 2) >= 1 ? COLCHEIAS : null),
      Cabaret: (i) => (i === 7 ? null : SHUFFLE), // o breque: o chimbal para na dominante
      'Tema 2': () => COLCHEIAS,
      Galope: () => SEMICOLCHEIAS,
    },
    palmas: {
      Tema: () => 'a:4 a:12',
      Crescendo: (i) => (Math.floor(i / 2) >= 3 ? 'a:4 a:12 b:6 b:14' : null),
      Aplauso: (i) => APLAUSO[i],
      'Tema 2': () => 'a:4 a:12',
    },
    prato: {
      Tema: (i) => (i === 0 ? 'P:0' : null),
      Crescendo: (i) => (i % 2 === 0 && i >= 4 ? 'P:0' : null),
      Cabaret: (i) => (i === 0 ? 'p:0' : null),
      'Tema 2': (i) => (i === 0 ? 'P:0' : null),
      Galope: (i) => (i % 4 === 0 ? 'P:0' : null),
      Volta: (i) => (i === 3 ? 'p:0' : null),
    },
    campana: {
      Tema: (i) => (i === 7 ? 'A:6' : null),
      'Tema 2': (i) => (i % 2 === 1 ? 'a:2' : null),
    },
  }

  const peca = (grupo, mapa) => (c) => {
    const { secao, indice } = COMPASSOS[c]
    const groove = GROOVES[grupo][secao]
    const texto = groove ? groove(indice) : null
    return texto ? batida(texto, comAtenuacao(mapa, DINAMICA[secao])) : null
  }
  const madeira = (c) => (temTung(c) ? tungTungTung(ALTURA_DO_TUNG, c, GRADE) : compassoVazio(GRADE))

  const CANAIS = [
    ['contrabaixoCheio', 0, semOFim(baixo)],
    ['sub', 0, semOFim(sub)],
    ['tromboneLongo', 0.2, semOFim(tuba)],
    ['orgao16', -0.2, semOFim(pah(0))],
    ['orgao16', 0.2, semOFim(pah(1))],
    ['orgao16', 0, semOFim(pah(2))],
    ['clarinete', 0.12, semOFim(clarinete)],
    ['trompete', -0.14, semOFim(trompete)],
    ['trompeteLongo', -0.2, semOFim(trompeteLongo)],
    ['vibrafone', 0.22, semOFim(vibra)],
    ['bumboSeco', 0, semOFim(peca('bumbo', BUMBO))],
    ['caixa', 0, semOFim(peca('caixa', CAIXA))],
    ['caixaCorpo', 0, semOFim(peca('caixa', CAIXA_CORPO))],
    ['chimbal', -0.18, semOFim(peca('chimbal', CHIMBAL))],
    ['palmas', 0.18, semOFim(peca('palmas', PALMAS))],
    ['pratoEscuro', 0.2, semOFim(peca('prato', PRATO))],
    ['campana', 0.15, semOFim(peca('campana', CAMPANA))],
    ['madeira', 0.08, madeira],
  ]
  const instrumentos = [...new Set(CANAIS.map(([n]) => n))]
  const andamento = 152
  const meta = Object.freeze({
    id: 'palco-show', titulo: 'A Ronda: Palco', estilo: 'abertura de ópera-bufa em Ré maior', andamento,
    passosPorTempo: GRADE.passosPorTempo, temposPorCompasso: GRADE.temposPorCompasso, compassos: COMPASSOS.length, inicioDoLoop: 0,
    tonalidade: 'Ré maior', tonica: 'D', modo: 'maior',
    estrutura: forma.map((item) => `${item.nome} ${item.harmonia.length}`).join(' · '),
  })
  return Object.freeze({
    song: montarMusica({ instrumentos, canais: evitarUnissonos(CANAIS, PRIORIDADE), compassos: COMPASSOS.length, inicioDoLoop: 0, grade: GRADE, andamento }),
    meta,
    instrumentos: Object.freeze(instrumentos),
    secoes: secoesDaForma(forma),
    harmonia: Object.freeze(COMPASSOS.map((c) => c.acorde)),
    motivo: Object.freeze({
      tung: { compassos: COMPASSOS.map((_, c) => c).filter(temTung) },
      celula: { compassos: COMPASSOS.map((_, c) => c).filter((c) => (nomeDaSecao(COMPASSOS, c) === 'Tema' || nomeDaSecao(COMPASSOS, c) === 'Tema 2') && COMPASSOS[c].indice === CELULA_NO_TEMA), tonica: 62 },
    }),
  })
}
const nomeDaSecao = (COMPASSOS, c) => COMPASSOS[c].secao

export const PALCO_SHOW = criarShow()

// --------------------------------------------------
// A ABERTURA (introdução do show, 4 compassos): a afinação em Lá, o rufo, a fanfarra e a cortina
// --------------------------------------------------

const NOME_DA_ABERTURA = Object.freeze([
  'sub', 'contrabaixoCheio', 'clarineteLongo', 'trompeteLongo', 'trompete', 'vibrafone',
  'bumboSeco', 'caixa', 'caixaCorpo', 'pratoEscuro', 'palmas', 'madeira',
])

export function criarAbertura(andamento = 152) {
  const v = {
    sub: voz('sub', 'baixo', { semente: 131 }),
    baixo: voz('contrabaixoCheio', 'baixo', { semente: 132 }),
    afina: voz('clarineteLongo', 'naipe', { semente: 133 }),
    tromp: voz('trompeteLongo', 'naipe', { semente: 134 }),
    fan: voz('trompete', 'melodia', { semente: 135 }),
    vibra: voz('vibrafone', 'melodia', { semente: 136 }),
  }
  const canais = [
    ['sub', 0, (c) => (c === 3 ? escreverMidi([[0, 45, 0.1]], v.sub, c) : null)],
    ['contrabaixoCheio', 0, (c) => (c === 1 ? escreverMidi([[0, 38, 0.2], [8, 45, 0.3]], v.baixo, c) : c === 2 ? escreverMidi([[0, 38, 0.1], [4, 45, 0.15], [8, 38, 0.1], [12, 45, 0.15]], v.baixo, c) : c === 3 ? escreverMidi([[0, 45]], v.baixo, c) : null)],
    ['clarineteLongo', 0.12, (c) => (c === 0 ? escreverMidi([[0, 69, 0.15]], v.afina, c) : null)], // a afinação: o Lá
    ['trompeteLongo', -0.14, (c) => (c === 0 ? escreverMidi([[0, 57, 0.3]], v.tromp, c) : c === 3 ? escreverMidi([[0, 61, 0.05]], v.tromp, c) : null)],
    ['trompete', 0.1, (c) => (c === 2 ? escreverMidi([[0, 62], [1, 66], [2, 69], [3, 74], [4, 76], [5, 74], [6, 69], [7, 66], [8, 62, 0.1], [10, 69, 0.1], [12, 74, 0.05]], v.fan, c) : null)],
    ['vibrafone', 0.22, (c) => (c === 0 ? escreverMidi([[12, 81, 0.35]], v.vibra, c) : c === 3 ? escreverMidi([[0, 85, 0.1]], v.vibra, c) : null)],
    ['bumboSeco', 0, (c) => (c === 2 ? batida('K:0 K:8', comAtenuacao(BUMBO, 0.2)) : c === 3 ? batida('K:0', BUMBO) : null)],
    ['caixa', 0, (c) => (c === 1 ? batida('g:4 g:8 g:12', comAtenuacao(CAIXA, 0.4)) : c === 2 ? batida('g:8 g:10 r:11 r:12 r:13 x:14 x:15', comAtenuacao(CAIXA, 0.2)) : c === 3 ? batida('X:0 g:6 r:10 r:11 r:12 r:13 X:14 X:15', CAIXA) : null)],
    ['caixaCorpo', 0, (c) => (c === 3 ? batida('X:0 r:10 r:11 r:12 r:13 X:14 X:15', CAIXA_CORPO) : null)],
    ['pratoEscuro', 0.2, (c) => (c === 3 ? batida('P:0', PRATO) : c === 1 ? batida('p:8', comAtenuacao(PRATO, 0.4)) : null)],
    ['palmas', 0.18, (c) => (c === 3 ? batida('a:0', PALMAS) : null)],
    ['madeira', 0.08, (c) => (c === 3 ? tungTungTung(ALTURA_DO_TUNG, c, GRADE) : compassoVazio(GRADE))],
  ]
  // O tung-tung-tung é a última coisa: do 4º tempo do último compasso só a madeira e o rufo da caixa
  const calados = canais.map(([nome, pan, fn]) => [nome, pan, (c) => {
    const passos = fn(c)
    if (!passos || c !== 3 || nome === 'madeira' || nome === 'caixa' || nome === 'caixaCorpo') return passos
    return passos.map((valor, passo) => (passo >= 34 ? 0 : valor))
  }])
  return Object.freeze({ song: montarMusica({ instrumentos: NOME_DA_ABERTURA, canais: evitarUnissonos(calados, PRIORIDADE), compassos: 4, inicioDoLoop: 0, grade: GRADE, andamento }), instrumentos: NOME_DA_ABERTURA, compassos: 4 })
}

// --------------------------------------------------
// O FINAL DO ESPETÁCULO (palco-fim): a dominante, o Ré maior de verdade, a célula, o acorde e o aplauso
// --------------------------------------------------

const NOME_DO_FIM = Object.freeze([
  'sub', 'contrabaixoCheio', 'tromboneLongo', 'trompeteLongo', 'clarinete', 'orgao16', 'vibrafone',
  'bumboSeco', 'caixa', 'caixaCorpo', 'pratoEscuro', 'palmas', 'campana', 'madeira',
])

export function criarFinal(andamento = 152) {
  const v = {
    sub: voz('sub', 'baixo', { semente: 141 }),
    baixo: voz('contrabaixoCheio', 'baixo', { semente: 142 }),
    tuba: voz('tromboneLongo', 'naipe', { semente: 143 }),
    tromp: voz('trompeteLongo', 'naipe', { semente: 144 }),
    clar: voz('clarinete', 'melodia', { semente: 145 }),
    pah: voz('orgao16', 'comping', { semente: 146 }),
    vibra: voz('vibrafone', 'melodia', { semente: 147 }),
  }
  const acorde = (c) => c === 1 || c === 3
  const canais = [
    ['sub', 0, (c) => (acorde(c) ? escreverMidi([[0, 38]], v.sub, c) : null)],
    ['contrabaixoCheio', 0, (c) => (c === 0 ? escreverMidi([[0, 45], [3, 45, 0.1], [6, 45, 0.1]], v.baixo, c) : acorde(c) ? escreverMidi([[0, 38]], v.baixo, c) : c === 2 ? escreverMidi([[0, 38], [8, 45, 0.1]], v.baixo, c) : null)],
    ['tromboneLongo', 0.2, (c) => (acorde(c) ? escreverMidi([[0, 50, 0.05]], v.tuba, c) : null)],
    ['trompeteLongo', -0.14, (c) => (acorde(c) ? escreverMidi([[0, 62, 0.05]], v.tromp, c) : null)],
    ['clarinete', 0.12, (c) => (c === 2 ? celula(62, v.clar, c, GRADE) : c === 1 ? escreverMidi([[0, 74, 0.05]], v.clar, c) : null)],
    ['orgao16', 0, (c) => (acorde(c) ? escreverMidi([[0, 74, 0.1]], v.pah, c) : null)],
    ['vibrafone', 0.22, (c) => (c === 3 ? escreverMidi([[0, 81, 0.05], [6, 86, 0.2]], v.vibra, c) : null)],
    ['bumboSeco', 0, (c) => (acorde(c) ? batida('K:0', BUMBO) : c === 0 ? batida('K:9 K:12', comAtenuacao(BUMBO, 0.2)) : null)],
    ['caixa', 0, (c) => (c === 0 ? batida('g:2 g:4 r:6 r:7 r:8 r:9 x:10 x:11 X:12 X:13 X:14 X:15', comAtenuacao(CAIXA, 0.05)) : acorde(c) ? batida('X:0', CAIXA) : null)],
    ['caixaCorpo', 0, (c) => (acorde(c) ? batida('X:0', CAIXA_CORPO) : null)],
    ['pratoEscuro', 0.2, (c) => (acorde(c) ? batida('P:0', PRATO) : null)],
    ['palmas', 0.18, (c) => (c === 1 ? batida(APLAUSO[0], comAtenuacao(PALMAS, 0.15)) : c === 3 ? batida(APLAUSO[0], comAtenuacao(PALMAS, 0.15)) : c === 4 ? batida(APLAUSO[1], comAtenuacao(PALMAS, 0.1)) : c === 5 ? batida(APLAUSO[2], comAtenuacao(PALMAS, 0.2)) : null)],
    ['campana', 0.15, (c) => (c === 3 ? batida('A:6', CAMPANA) : null)],
    ['madeira', 0.08, (c) => (c === 2 ? tungTungTung(ALTURA_DO_TUNG, c, GRADE) : compassoVazio(GRADE))],
  ]
  const calados = canais.map(([nome, pan, fn]) => [nome, pan, (c) => {
    const passos = fn(c)
    if (!passos || c !== 2 || nome === 'madeira') return passos
    return passos.map((valor, passo) => (passo >= 34 ? 0 : valor))
  }])
  // 0: a dominante; 1: Ré maior; 2: a célula e o tung-tung-tung; 3: o acorde final; 4 e 5: o aplauso que some
  return Object.freeze({ song: montarMusica({ instrumentos: NOME_DO_FIM, canais: evitarUnissonos(calados, PRIORIDADE), compassos: 6, inicioDoLoop: 0, grade: GRADE, andamento }), instrumentos: NOME_DO_FIM, compassos: 6 })
}

// --------------------------------------------------
// OS BASTIDORES (palco): a sala aberta, sem bateria, ♩ = 96
// --------------------------------------------------

const BASTIDORES = Object.freeze([
  { nome: 'Foyer A', papel: 'o vibrafone em tercinas e o contrabaixo; a pergunta do tema, baixinho', harmonia: ['D', 'D/F#', 'G', 'A7', 'D', 'B7', 'Em', 'A7'] },
  { nome: 'Foyer B', papel: 'a afinação em Lá e o sorriso torto (G → Gm6)', harmonia: ['G', 'Gm6', 'D/F#', 'B7', 'Em', 'A7', 'D/A', 'A7'] },
  { nome: 'Foyer C', papel: 'o tema em fragmentos e o tung-tung-tung, voltando ao começo', harmonia: ['D', 'D/F#', 'G', 'Gm6', 'D/A', 'B7', 'E7', 'A7'] },
])

function criarBastidores() {
  const COMPASSOS = expandirForma(BASTIDORES)
  const andamento = 96
  const v = {
    baixo: voz('contrabaixoCheio', 'baixo', { semente: 151 }),
    vibra: voz('vibrafone', 'melodia', { semente: 152 }),
    clar: voz('clarinete', 'melodia', { semente: 153 }),
    afina: voz('clarineteLongo', 'naipe', { semente: 154 }),
    pah: voz('orgao16', 'comping', { semente: 155 }),
    pah2: voz('orgao16', 'comping', { semente: 156 }),
  }
  const TUNGS = { 'Foyer A': [], 'Foyer B': [], 'Foyer C': [7] }
  const temTung = (c) => TUNGS[COMPASSOS[c].secao].includes(COMPASSOS[c].indice)
  const semOFim = (fn) => (c) => {
    const passos = fn(c)
    return passos && temTung(c) ? passos.map((valor, passo) => (passo >= 34 ? 0 : valor)) : passos
  }
  const chord = (c) => acordesDoCompasso(COMPASSOS[c].acorde).map((a) => ACORDES[a])

  const baixo = (c) => {
    const [a, b] = chord(c)
    const proximo = ACORDES[acordesDoCompasso(COMPASSOS[(c + 1) % COMPASSOS.length].acorde)[0]].raiz
    const aproximacao = proximo > 38 ? proximo - 1 : proximo + 1
    return escreverMidi(b
      ? [[0, a.raiz], [4, a.quinta, 0.1], [8, b.raiz, 0.05], [12, b.quinta, 0.12]]
      : [[0, a.raiz], [8, a.quinta, 0.14], [14, aproximacao, 0.22]], v.baixo, c)
  }

  // O vibrafone: o arpejo do acorde em tercinas (a cada tempo), bem suave
  const vibra = (c) => {
    const { secao } = COMPASSOS[c]
    const [a, b] = chord(c)
    const tons = (b ?? a).tons
    const notas = [a.tons[0] + 12, a.tons[1] + 12, a.tons[2] + 12]
    const lista = []
    ;['0t', '1t', '2t', '3t', '5t', '6t', '7t', '8t'].forEach((p, i) => lista.push([p, i < 5 ? notas[i % 3] : tons[(i + 1) % 3] + 12, 0.28 + (i % 3 === 0 ? 0 : 0.12)]))
    return secao === 'Foyer B' ? escreverMidi(lista.filter((_, i) => i % 2 === 0), v.vibra, c) : escreverMidi(lista, v.vibra, c)
  }

  // O clarinete: a pergunta do tema (A), a afinação em Lá (B), fragmentos (C), tudo esparso
  const clarinete = (c) => {
    const { secao, indice } = COMPASSOS[c]
    if (secao === 'Foyer A' && indice === 2) return escrever('D4:0 F#4:1 A4:2 D5:3', v.clar, c, 0.3)
    if (secao === 'Foyer A' && indice === 6) return escrever('G4:0 B4:2 E5:4', v.clar, c, 0.3)
    if (secao === 'Foyer C' && indice % 2 === 0) return escrever(['D4:0 F#4:1 A4:2 D5:3', 'B4:0 D5:3 E5:6', 'F#4:0 A4:3 D5:6 C#5:12', 'E4:0 G4:3 A4:6'][Math.floor(indice / 2)], v.clar, c, 0.25)
    if (secao === 'Foyer C' && indice === 7) return null
    return null
  }
  const afina = (c) => (COMPASSOS[c].secao === 'Foyer B' && COMPASSOS[c].indice === 0 ? escreverMidi([[0, 69, 0.3]], v.afina, c) : null)

  // O pah, bem suave, só no tempo 2
  const pah = (i) => (c) => {
    if (COMPASSOS[c].secao === 'Foyer A' && COMPASSOS[c].indice < 2) return null
    const [a] = chord(c)
    return escreverMidi([[4, a.tons[i] + 12, 0.45]], i ? v.pah2 : v.pah, c)
  }

  const CANAIS = [
    ['contrabaixoCheio', 0, semOFim(baixo)],
    ['vibrafone', 0.2, semOFim(vibra)],
    ['clarinete', 0.12, semOFim(clarinete)],
    ['clarineteLongo', 0.12, semOFim(afina)],
    ['orgao16', -0.18, semOFim(pah(0))],
    ['orgao16', 0.18, semOFim(pah(2))],
    ['madeira', 0.08, (c) => (temTung(c) ? tungTungTung(ALTURA_DO_TUNG, c, GRADE) : compassoVazio(GRADE))],
  ]
  const instrumentos = [...new Set(CANAIS.map(([n]) => n))]
  return Object.freeze({
    song: montarMusica({ instrumentos, canais: CANAIS, compassos: COMPASSOS.length, inicioDoLoop: 0, grade: GRADE, andamento }),
    meta: Object.freeze({
      id: 'palco', titulo: 'A Ronda: Palco (bastidores)', estilo: 'bastidores de teatro em Ré maior, sem bateria', andamento,
      passosPorTempo: 12, temposPorCompasso: 4, compassos: COMPASSOS.length, inicioDoLoop: 0,
      tonalidade: 'Ré maior', tonica: 'D', modo: 'maior', estrutura: BASTIDORES.map((s) => `${s.nome} ${s.harmonia.length}`).join(' · '),
    }),
    instrumentos: Object.freeze(instrumentos),
    secoes: secoesDaForma(BASTIDORES),
    harmonia: Object.freeze(COMPASSOS.map((c) => c.acorde)),
    motivo: Object.freeze({ tung: { compassos: COMPASSOS.map((_, c) => c).filter(temTung) }, celula: { compassos: [], tonica: 62 } }),
  })
}

export const PALCO_BASTIDORES = criarBastidores()
