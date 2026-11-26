// A Ronda: Chefe. A música da sala do chefe (andares 1 a 4) e, com mais camadas, do chefe final
// (andar 5, o Tralalero Tralala): os dois são faixas deste mesmo gerador (FASES_DO_CHEFE), o final com mais
// camadas, mais fases e a vitória maior.
//
// ESTILO E ANDAMENTO
//   Metal-orquestral sem guitarra: metais graves, tímpano, baixo sujo e sub. Sol menor com cor de menor
//   melódico, ♩ = 140 (fase 2: Si♭ menor, ♩ = 152). Grade de 12 passos por tempo (a única das faixas
//   que mistura semicolcheias e tercinas; ver escrita12.js). bpm do ZzFXM = andamento × 3.
//
// HARMONIA (o que é só do Chefe)
//   O ciclo de terças menores: Gm – B♭m – D♭m – Em, dois compassos em cada um, e a volta pela dominante
//   com nona menor (D7♭9). Cada degrau sobe a tensão (as fundamentais Sol, Si♭, Ré♭ e Mi pertencem à
//   mesma escala diminuta). A fase seguinte sobe um degrau do ciclo: a fase 2 é o Si♭ menor, e a fase 3
//   do chefe final, o Ré♭ menor. No Respiro a harmonia fica num pedal de Sol (os acordes de cima
//   passam por Si♭m/Sol e Ré♭m/Sol).
//
// MATERIAL
//   Ostinato (Ameaça): colcheias pontuadas 3+3+3+3+4 (semicolcheias 0, 3, 6, 9 e 12), no baixo, no
//   trombone e no bumbo. É a assinatura rítmica do Chefe.
//   Tema do chefe: a pergunta (Ré – Sol – Si♭ – Lá: um salto de quarta, como um toque de alerta) sobe
//   uma terça menor a cada acorde; a resposta desce pelo Ré♭m e pelo Mi e termina no Fá♯ (a sensível),
//   que resolve no Sol da volta. Na segunda vez ela termina em Mi♮, aberta.
//   A célula do Tung (Ré – Fá – Sol – Fá – Ré) no trombone da Ameaça, no sax barítono do Tema 2 e na
//   Pressão Máxima. O tung-tung-tung (madeira, em tercina de verdade) fecha frases e some da última
//   semínima de todo o resto.
//
// FORMA (chefe comum, fase 1: 52 compassos, ~89 s; editar em FASES)
//   Ameaça 8 · Tema 8 · Pressão 8 · Respiro 8 · Tema 2 8 · Pressão Máxima 8 · Volta 4
//   Energia: Ameaça média → Tema média-alta → Pressão alta → Respiro baixa → Tema 2 alta → Pressão
//   Máxima a mais alta (termina em breque) → Volta cai para o pedal e emenda na Ameaça.
//
// GRAVE E AGUDO
//   O baixo (com harmônicos) fica entre Ré2 e Mi3 e o sub uma oitava abaixo; a melodia vai de Ré♭4 a Mi♭5 e
//   o agudo só aparece em detalhes (chimbal, campana). Quando o tema dobra, a dobra é uma oitava ABAIXO.
//
// LOOP SEM EMENDA
//   A Volta cai para o pedal, o breque da Pressão Máxima deixa só o tung-tung-tung e o corpo recomeça
//   na Ameaça (o baixo sozinho). A introdução toca uma vez antes do corpo.
//
// ONDE AJUSTAR
//   FASES (andamento, tom, forma e camadas de cada faixa) · TEMA · CICLO · GROOVES · DINAMICA · TUNG

import { celula, comAtenuacao, compassoVazio, expandirForma, montarMusica, secoesDaForma, tungTungTung, voz } from './partitura.js'
import { batida, COLCHEIAS, dobrarPara, escrever, escreverMidi, evitarUnissonos, GRADE12, SEMINIMAS } from './escrita12.js'

const GRADE = GRADE12
const ALTURA_DO_TUNG = 76 // Mi5

// --------------------------------------------------
// HARMONIA: graus do ciclo (semitons acima da tônica) e qualidade
// --------------------------------------------------

const GRAUS = Object.freeze({
  i: { semi: 0, tipo: 'm' },
  biii: { semi: 3, tipo: 'm' },
  bv: { semi: 6, tipo: 'm' },
  vi: { semi: 9, tipo: 'm' },
  V: { semi: 7, tipo: 'd' },
})
const NOMES = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B']
export const nomeDoAcorde = (grau, tonica = 0) => `${NOMES[(7 + tonica + GRAUS[grau].semi) % 12]}${GRAUS[grau].tipo === 'm' ? 'm' : '7♭9'}`

const CICLO = Object.freeze(['i', 'i', 'biii', 'biii', 'bv', 'bv', 'vi', 'V'])
const pedal = (n) => Object.freeze([...Array(n - 1).fill('i'), 'V'])

// Seções: papel e harmonia (n = quantos compassos)
const SECOES = Object.freeze({
  Ameaça: { papel: 'o ostinato grave 3+3+3+3+4 cresce sozinho', harmonia: () => CICLO },
  Tema: { papel: 'o tema do chefe nos metais, meio-tempo', harmonia: () => CICLO },
  Pressão: { papel: 'tempo dobrado, síncopes e o tema no sax barítono', harmonia: () => CICLO },
  Respiro: { papel: 'pedal de Sol, órgão e sub, o tema só em pergunta', harmonia: pedal },
  'Tema 2': { papel: 'o tema de novo, com a contramelodia do sax', harmonia: () => CICLO },
  Canto: { papel: 'o "tra-la-lá" por cima do ciclo, meio-tempo', harmonia: () => CICLO },
  'Pressão Máxima': { papel: 'tudo junto, bumbo em galope, termina em breque', harmonia: () => CICLO },
  Volta: { papel: 'a queda para o pedal que emenda no começo', harmonia: () => Object.freeze(['vi', 'vi', 'V', 'V']) },
})

// --------------------------------------------------
// TEMA (em Sol menor; transposto pela tônica da fase)
// --------------------------------------------------

// Um compasso por item, sobre CICLO. Posições em semicolcheias (":6t" seria tercina).
const TEMA = Object.freeze([
  'D4:0 G4:3 Bb4:6 A4:12', // Gm: a pergunta, o salto de quarta
  'G4:0 Bb4:6 D5:12', // Gm: sobe, aberta
  'F4:0 Bb4:3 Db5:6 C5:12', // B♭m: a pergunta uma terça acima
  'Bb4:0 Db5:6 Eb5:12', // B♭m
  'Ab4:0 Gb4:3 E4:6 Eb4:9 Db4:12', // D♭m: a resposta desce
  'E4:0 Ab4:6 Gb4:9 E4:12', // D♭m
  'B4:0 G4:3 E4:6 G4:12', // Em
  'F#4:0 Eb4:6 F#4:12', // D7♭9: a sensível, resolve no Sol
])
const TEMA_FIM_ABERTO = 'F#4:0 Eb4:6 E4:12' // na segunda vez termina em Mi♮
const TEMA_ALTO = 75 // Mi♭5: a nota mais aguda do tema

// A quinta de cada acorde do ciclo (classe de altura a partir do Dó, em Sol menor): Ré, Fá, Lá♭, Si e Lá
const CANTO_ACORDES = Object.freeze({ i: 2, biii: 5, bv: 8, vi: 11, V: 9 })

// --------------------------------------------------
// BATERIA: os mapas são os dos andares (dinâmica na parte decimal)
// --------------------------------------------------

const BUMBO = Object.freeze({ K: 12.42, k: 12.55, d: 12.62, l: 19.25, m: 22.3, h: 26.35 })
const CAIXA = Object.freeze({ X: 12.2, x: 12.44, g: 12.8, r: 12.64 })
const CAIXA_CORPO = Object.freeze({ X: 12, x: 12.3, g: 12.9, r: 12.75 })
const CHIMBAL = Object.freeze({ X: 12.3, x: 12.5, s: 12.68 })
const RIDE = Object.freeze({ X: 12.64, x: 12.76 })
const PRATO = Object.freeze({ P: 12.1, p: 12.3 })
const CAMPANA = Object.freeze({ A: 12.35, a: 12.6 })

const TERCINAS = Array.from({ length: 12 }, (_, i) => `${i % 3 === 0 ? 'X' : 'x'}:${i}t`).join(' ')
const ROLO = 'g:0 g:2 g:4 g:6 r:8 r:9 r:10 r:11 x:12 x:13 X:14 X:15'
const VIRADA = 'h:9t m:10t l:11t'

// Intensidade da bateria por seção (atenuação somada; 0 = cheia)
const DINAMICA = Object.freeze({ Ameaça: 0.1, Tema: 0.06, Pressão: 0, Respiro: 0.2, 'Tema 2': 0.04, Canto: 0.06, 'Pressão Máxima': 0, Volta: 0.15 })

// Compassos (índice dentro da seção) que fecham com o tung-tung-tung: nada toca depois da 3ª semínima
const TUNG = Object.freeze({ Ameaça: [3], Tema: [3], Pressão: [3, 5], Respiro: [3, 5], 'Tema 2': [3], Canto: [3, 5], 'Pressão Máxima': [3], Volta: [3] })
// Compassos com a célula do Tung (sobre o Gm): quem toca
const CELULA = Object.freeze({ Ameaça: [1], 'Tema 2': [1], 'Pressão Máxima': [1] })

const GROOVES = Object.freeze({
  bumbo: {
    Ameaça: (i, ultimo) => (ultimo ? `K:0 K:3 K:6 ${VIRADA}` : i % 2 ? 'K:0 K:3 K:6 K:9 K:12 K:14' : 'K:0 K:3 K:6 K:9 K:12'),
    Tema: (i, ultimo) => (ultimo ? `K:0 K:6 K:10 ${VIRADA}` : i % 2 ? 'K:0 K:3 K:6 K:10 K:14' : 'K:0 K:6 K:10'),
    Pressão: (i, ultimo) => (ultimo ? `K:0 K:2 K:4 K:6 K:8 K:10 ${VIRADA}` : 'K:0 d:2 K:4 d:6 K:8 d:10 K:12 d:14'),
    Respiro: (i, ultimo) => (ultimo ? 'l:9t m:10t h:11t' : null),
    'Tema 2': (i, ultimo) => (ultimo ? `K:0 K:6 K:10 ${VIRADA}` : i % 2 ? 'K:0 K:3 K:6 K:10 K:14' : 'K:0 K:6 K:10'),
    Canto: (i, ultimo) => (ultimo ? `K:0 K:6 K:10 ${VIRADA}` : 'K:0 K:6 K:10'),
    'Pressão Máxima': (i, ultimo) => (ultimo ? 'K:0 K:2 d:3 K:4 K:6 d:7' : 'K:0 K:2 d:3 K:4 K:6 d:7 K:8 K:10 d:11 K:12 K:14 d:15'),
    Volta: (i) => (i === 0 ? 'K:0 K:6' : i === 1 ? 'K:0' : null),
  },
  caixa: {
    Ameaça: (i, ultimo) => (ultimo ? 'X:8 r:12 r:13 r:14 r:15' : i >= 2 ? 'X:8' : null),
    Tema: (i, ultimo) => (ultimo ? 'X:8 r:12 r:13 r:14 r:15' : 'X:8 g:14'),
    Pressão: (i, ultimo) => (ultimo ? 'X:4 X:12 r:13 r:14 r:15' : 'X:4 g:10 X:12'),
    Respiro: (i, ultimo) => (ultimo ? ROLO : null),
    'Tema 2': (i, ultimo) => (ultimo ? 'X:8 r:12 r:13 r:14 r:15' : 'X:8 g:14'),
    Canto: (i, ultimo) => (ultimo ? 'X:8 r:12 r:13 r:14 r:15' : 'X:8 g:14'),
    'Pressão Máxima': (i, ultimo) => (ultimo ? 'X:4 X:12' : 'X:4 g:7 X:12 g:15'),
  },
  chimbal: {
    Ameaça: (i) => (i >= 4 ? COLCHEIAS : null),
    Tema: () => COLCHEIAS,
    Pressão: () => COLCHEIAS,
    'Tema 2': () => COLCHEIAS,
    Canto: () => COLCHEIAS,
    'Pressão Máxima': () => TERCINAS,
  },
  ride: {
    Pressão: () => SEMINIMAS,
    'Tema 2': (i) => (i >= 4 ? SEMINIMAS : null),
    'Pressão Máxima': () => SEMINIMAS,
  },
  prato: {
    Ameaça: (i) => (i === 0 ? 'P:0' : null),
    Tema: (i) => (i === 0 ? 'P:0' : null),
    Pressão: (i) => (i % 4 === 0 ? 'P:0' : null),
    'Tema 2': (i) => (i === 0 ? 'P:0' : null),
    Canto: (i) => (i === 0 ? 'P:0' : null),
    'Pressão Máxima': (i) => (i % 2 === 0 ? 'P:0 p:8' : null),
    Volta: (i) => (i === 0 ? 'p:0' : null),
  },
  // O alarme do Respiro: duas batidas da campana no último tempo de compassos alternados
  campana: {
    Respiro: (i) => (i % 2 === 1 ? 'A:12 a:14' : null),
  },
})

// --------------------------------------------------
// As faixas: cada uma é uma fase de um chefe
// --------------------------------------------------

// camadas: onde cada camada extra toca (por nome de seção; 'todas' = em todas)
//   orgao      colchão de órgão (terça e quinta do acorde, um acorde por compasso)
//   dobra      o trombone longo dobra o tema uma oitava abaixo
//   timpDuplo  segundo tímpano na quinta
//   canto      o "tra-la-lá" do clarinete (só no chefe final)
const secao = (nome, compassos) => (compassos ? { nome, compassos } : { nome })

export const FASES_DO_CHEFE = Object.freeze({
  chefe: {
    id: 'chefe', titulo: 'A Ronda: Chefe', andamento: 140, tonica: 0,
    forma: [secao('Ameaça'), secao('Tema'), secao('Pressão'), secao('Respiro'), secao('Tema 2'), secao('Pressão Máxima'), secao('Volta')],
    camadas: { orgao: ['Respiro', 'Tema 2'], dobra: ['Pressão Máxima'], timpDuplo: [], canto: [] },
    estilo: 'metal-orquestral em Sol menor, ciclo de terças menores',
  },
  'chefe-fase2': {
    id: 'chefe-fase2', titulo: 'A Ronda: Chefe (fase 2)', andamento: 152, tonica: 3,
    forma: [secao('Tema'), secao('Pressão'), secao('Pressão Máxima'), secao('Respiro', 4), secao('Tema 2')],
    camadas: { orgao: ['Tema', 'Pressão', 'Respiro', 'Tema 2', 'Pressão Máxima'], dobra: ['Tema 2', 'Pressão', 'Pressão Máxima'], timpDuplo: ['Pressão', 'Pressão Máxima'], canto: [] },
    estilo: 'metal-orquestral em Si♭ menor, mais cheio e mais rápido',
  },
  'chefe-final': {
    id: 'chefe-final', titulo: 'A Ronda: Tralalero', andamento: 144, tonica: 0,
    forma: [secao('Ameaça'), secao('Tema'), secao('Pressão'), secao('Respiro'), secao('Tema 2'), secao('Pressão Máxima'), secao('Volta')],
    camadas: { orgao: ['todas'], dobra: ['Pressão', 'Tema 2', 'Pressão Máxima'], timpDuplo: ['Tema', 'Pressão', 'Tema 2', 'Pressão Máxima'], canto: ['Tema 2', 'Pressão Máxima'] },
    estilo: 'metal-orquestral épico em Sol menor: o chefe final',
  },
  'chefe-final-fase2': {
    id: 'chefe-final-fase2', titulo: 'A Ronda: Tralalero (fase 2)', andamento: 156, tonica: 3,
    forma: [secao('Tema'), secao('Pressão'), secao('Canto'), secao('Pressão Máxima'), secao('Respiro', 4), secao('Tema 2')],
    camadas: { orgao: ['todas'], dobra: ['Tema', 'Pressão', 'Tema 2', 'Pressão Máxima'], timpDuplo: ['Tema', 'Pressão', 'Tema 2', 'Pressão Máxima'], canto: ['Canto', 'Tema 2', 'Pressão Máxima'] },
    estilo: 'metal-orquestral épico em Si♭ menor, o canto do Tralalero',
  },
  'chefe-final-fase3': {
    id: 'chefe-final-fase3', titulo: 'A Ronda: Tralalero (fase 3)', andamento: 168, tonica: 6,
    forma: [secao('Pressão'), secao('Tema'), secao('Canto'), secao('Pressão Máxima'), secao('Volta')],
    camadas: { orgao: ['todas'], dobra: ['todas'], timpDuplo: ['todas'], canto: ['Tema', 'Canto', 'Pressão Máxima'] },
    estilo: 'metal-orquestral épico em Ré♭ menor, a última fase',
  },
})

const VOZ = Object.freeze({
  baixo: voz('baixoDistorcido', 'baixo', { semente: 71 }),
  sub: voz('sub', 'baixo', { semente: 72 }),
  ostinato: voz('trombone', 'riff', { semente: 73 }),
  longo: voz('tromboneLongo', 'naipe', { semente: 74 }),
  dobra: voz('tromboneLongo', 'melodia', { semente: 75 }),
  tema: voz('trompete', 'melodia', { semente: 76 }),
  stab1: voz('trompeteSurdina', 'naipe', { semente: 77 }),
  stab2: voz('trompeteSurdina', 'naipe', { semente: 78 }),
  stab3: voz('trompeteSurdina', 'naipe', { semente: 79 }),
  sax: voz('saxBaritono', 'melodia', { semente: 80 }),
  orgao1: voz('orgaoSustentado', 'comping', { semente: 81 }),
  orgao2: voz('orgaoSustentado', 'comping', { semente: 82 }),
  canto: voz('clarinete', 'melodia', { semente: 83 }),
  timpano: voz('timpano', 'riff', { semente: 84 }),
  timpano2: voz('timpano', 'riff', { semente: 85 }),
})

// Quem fica com a nota quando dois instrumentos caem na mesma altura (do mais para o menos importante)
const PRIORIDADE = Object.freeze(['trompete', 'clarinete', 'saxBaritono', 'trombone', 'tromboneLongo', 'baixoDistorcido', 'orgaoSustentado', 'trompeteSurdina'])

function criarFase(config) {
  const { tonica, andamento, camadas } = config
  const forma = config.forma.map(({ nome, compassos = 8 }) => ({ nome, papel: SECOES[nome].papel, harmonia: SECOES[nome].harmonia(compassos) }))
  const COMPASSOS = expandirForma(forma)

  const ativa = (camada, nome) => camadas[camada].includes('todas') || camadas[camada].includes(nome)
  const temTung = (compasso) => TUNG[COMPASSOS[compasso].secao]?.includes(COMPASSOS[compasso].indice) ?? false
  const temCelula = (compasso) => CELULA[COMPASSOS[compasso].secao]?.includes(COMPASSOS[compasso].indice) ?? false
  // A madeira fecha a frase: do último tempo em diante só ela toca
  const semOFim = (fn) => (compasso) => {
    const passos = fn(compasso)
    if (!passos || !temTung(compasso)) return passos
    return passos.map((valor, passo) => (passo >= 34 ? 0 : valor))
  }

  // Alturas
  const raizDoBaixo = (grau) => dobrarPara(43 + tonica + GRAUS[grau].semi, 38, 52)
  const quintaAbaixo = (grau) => raizDoBaixo(grau) - 5
  const tons = (grau) => {
    const raiz = dobrarPara(55 + tonica + GRAUS[grau].semi, 57, 68)
    return [raiz, raiz + (GRAUS[grau].tipo === 'm' ? 3 : 4), raiz + 7]
  }
  // O tema inteiro desloca junto (o contorno não muda): fase acima do alcance do trompete cai uma oitava
  const deslocamentoDoTema = tonica + (TEMA_ALTO + tonica > 76 ? -12 : 0)
  const temaDoCompasso = (c) => (c.secao === 'Tema 2' && c.ultimo ? TEMA_FIM_ABERTO : TEMA[c.indice % 8])
  const tonicaDaCelula = dobrarPara(55 + tonica, 47, 58)

  // ---------------- baixo, sub e tímpano ----------------
  function baixo(compasso) {
    const c = COMPASSOS[compasso]
    const raiz = raizDoBaixo(c.acorde)
    const quinta = quintaAbaixo(c.acorde)
    let lista
    switch (c.secao) {
      case 'Ameaça': lista = [[0, raiz], [3, raiz], [6, raiz], [9, raiz], [12, quinta]]; break
      case 'Tema': case 'Tema 2': case 'Canto': lista = [[0, raiz], [6, raiz], [10, raiz], [14, quinta]]; break
      case 'Pressão': lista = [0, 2, 4, 6, 8, 10, 12, 14].map((p) => [p, p === 14 ? quinta : raiz]); break
      case 'Respiro': lista = c.acorde === 'V' ? [[0, raiz], [8, raiz]] : [[0, raiz]]; break
      case 'Pressão Máxima': lista = [0, 2, 3, 4, 6, 7, 8, 10, 11, 12, 14, 15].map((p) => [p, p === 15 ? quinta : raiz]); break
      default: lista = c.indice === 0 ? [[0, raiz], [3, raiz], [6, raiz]] : c.indice === 1 ? [[0, raiz], [3, raiz]] : c.indice === 2 ? [[0, raiz], [6, raiz]] : []
    }
    if (c.secao === 'Pressão Máxima' && c.ultimo) lista = lista.filter(([p]) => p < 8)
    if (temCelula(compasso) && c.secao === 'Pressão Máxima') return celulaNoBaixo(compasso)
    return escreverMidi(lista.map(([p, midi], i) => [p, midi, p % 4 === 0 ? 0 : 0.1 + (i % 2) * 0.03]), VOZ.baixo, compasso)
  }

  // Na Pressão Máxima o baixo dobra a célula do Tung (duas oitavas abaixo do trombone)
  const celulaNoBaixo = (compasso) => celula(dobrarPara(55 + tonica, 31, 42), VOZ.baixo, compasso, GRADE)

  function sub(compasso) {
    const c = COMPASSOS[compasso]
    if (c.secao === 'Volta' && c.indice >= 2) return null
    const raiz = raizDoBaixo(c.secao === 'Respiro' && c.acorde !== 'V' ? 'i' : c.acorde) - 12
    const lista = c.secao === 'Pressão Máxima' ? [[0, raiz], [8, raiz]] : [[0, raiz, 0.12]]
    return escreverMidi(lista, VOZ.sub, compasso)
  }

  function timpano(segundo) {
    const v = segundo ? VOZ.timpano2 : VOZ.timpano
    return (compasso) => {
      const c = COMPASSOS[compasso]
      if (segundo && !ativa('timpDuplo', c.secao)) return null
      const raiz = raizDoBaixo(c.acorde)
      const nota = segundo ? (raiz + 7 <= 55 ? raiz + 7 : raiz - 5) : raiz
      const rolo = [[0, nota], ['9t', nota, 0.3], ['10t', nota, 0.15], ['11t', nota]]
      switch (c.secao) {
        case 'Volta': return c.indice <= 1 && !segundo ? escreverMidi([[0, raiz], [3, raiz, 0.2]], v, compasso) : null
        case 'Respiro': {
          if (segundo) return null
          const pedalI = raizDoBaixo('i')
          return escreverMidi(c.ultimo ? rolo : [[0, pedalI], [3, pedalI, 0.22]], v, compasso) // o coração: duas batidas
        }
        case 'Pressão Máxima': return escreverMidi(c.ultimo ? [[0, nota]] : [[0, nota], [8, nota, 0.12]], v, compasso)
        case 'Pressão': return escreverMidi(c.ultimo ? rolo : [[0, nota], [8, nota, 0.18]], v, compasso)
        default: return escreverMidi(c.ultimo ? rolo : c.indice % 2 === 0 ? [[0, nota]] : [], v, compasso)
      }
    }
  }

  // ---------------- metais ----------------
  // O ostinato do trombone (Ameaça, Pressão e Pressão Máxima); a célula do Tung toma o compasso dela
  function ostinato(compasso) {
    const c = COMPASSOS[compasso]
    if (temCelula(compasso) && c.secao === 'Ameaça') return celula(tonicaDaCelula, VOZ.ostinato, compasso, GRADE)
    if (c.secao === 'Ameaça' && c.indice < 2) return null
    const raiz = raizDoBaixo(c.acorde) + 12
    if (c.secao === 'Ameaça') return escreverMidi([0, 3, 6, 9, 12].map((p) => [p, raiz, p % 4 === 0 ? 0 : 0.08]), VOZ.ostinato, compasso)
    if (c.secao === 'Pressão') return escreverMidi([0, 2, 4, 6, 8, 10, 12, 14].map((p) => [p, raiz, p % 4 === 0 ? 0.05 : 0.15]), VOZ.ostinato, compasso)
    if (c.secao === 'Pressão Máxima') {
      if (temCelula(compasso)) return celula(tonicaDaCelula, VOZ.ostinato, compasso, GRADE)
      return escreverMidi([0, 2, 3, 4, 6, 7, 8, 10, 11, 12, 14, 15].map((p) => [p, raiz, p % 4 === 0 ? 0 : 0.1]), VOZ.ostinato, compasso)
    }
    return null
  }

  // Notas longas de apoio: a fundamental na Ameaça (a partir do 5º compasso) e no Tema; no Canto, a quinta
  function longo(compasso) {
    const c = COMPASSOS[compasso]
    if (c.secao === 'Tema' || c.secao === 'Tema 2' || c.secao === 'Canto' || (c.secao === 'Ameaça' && c.indice >= 4)) {
      return escreverMidi([[0, raizDoBaixo(c.acorde) + 12, 0.1]], VOZ.longo, compasso)
    }
    return null
  }

  // O tema no trompete (Tema, Tema 2 e Pressão Máxima; no Respiro só a pergunta, baixinho)
  function tema(compasso) {
    const c = COMPASSOS[compasso]
    if (c.secao === 'Respiro') return c.indice < 4 ? escrever(TEMA[c.indice], VOZ.tema, compasso, 0.3, deslocamentoDoTema) : null
    if (!['Tema', 'Tema 2', 'Pressão Máxima'].includes(c.secao)) return null
    if (temCelula(compasso) && c.secao === 'Pressão Máxima') return null
    return escrever(temaDoCompasso(c), VOZ.tema, compasso, c.secao === 'Pressão Máxima' ? -0.04 : 0, deslocamentoDoTema)
  }

  // A dobra uma oitava abaixo (trombone longo)
  function dobra(compasso) {
    const c = COMPASSOS[compasso]
    if (!['Tema', 'Tema 2', 'Pressão Máxima'].includes(c.secao) || !ativa('dobra', c.secao)) return null
    if (temCelula(compasso) && c.secao === 'Pressão Máxima') return null
    return escrever(temaDoCompasso(c), VOZ.dobra, compasso, 0.1, deslocamentoDoTema - 12)
  }

  // Pressão: o sax barítono toca o tema (grave, uma oitava abaixo do trompete); Tema 2: a contramelodia
  function sax(compasso) {
    const c = COMPASSOS[compasso]
    if (c.secao === 'Pressão') return escrever(TEMA[c.indice % 8], VOZ.sax, compasso, 0, deslocamentoDoTema - 12)
    if (c.secao === 'Tema 2' && temCelula(compasso)) return celula(dobrarPara(55 + tonica, 41, 52), VOZ.sax, compasso, GRADE)
    if (c.secao === 'Tema 2' || c.secao === 'Canto') {
      const [raiz, terca] = tons(c.acorde).map((m) => m - 12)
      return escreverMidi(c.indice % 2 ? [[2, terca], [10, raiz, 0.08]] : [[0, raiz], [10, terca, 0.08]], VOZ.sax, compasso)
    }
    return null
  }

  // Síncopes do naipe com surdina: o acorde nas colcheias fracas (o "e" do 2 e o "e" do 4)
  function stabs(indiceDaVoz) {
    const v = [VOZ.stab1, VOZ.stab2, VOZ.stab3][indiceDaVoz]
    return (compasso) => {
      const c = COMPASSOS[compasso]
      let posicoes
      if (c.secao === 'Ameaça') posicoes = c.indice >= 4 ? [6, 14] : []
      else if (c.secao === 'Tema' || c.secao === 'Tema 2') posicoes = [6, 14]
      else if (c.secao === 'Pressão') posicoes = [2, 6, 10, 14]
      else if (c.secao === 'Pressão Máxima') posicoes = c.ultimo ? [6] : [3, 6, 10, 14]
      else if (c.secao === 'Canto') posicoes = [6]
      else posicoes = []
      if (posicoes.length === 0) return null
      return escreverMidi(posicoes.map((p) => [p, tons(c.acorde)[indiceDaVoz], p === 6 ? 0.05 : 0.14]), v, compasso)
    }
  }

  // Colchão de órgão: a terça e a quinta do acorde, um acorde por compasso
  function orgao(indiceDaVoz) {
    return (compasso) => {
      const c = COMPASSOS[compasso]
      if (!ativa('orgao', c.secao) || c.secao === 'Volta' || c.secao === 'Ameaça') return null
      const grau = c.secao === 'Respiro' && c.acorde !== 'V' ? 'i' : c.acorde
      const nota = tons(grau)[indiceDaVoz + 1]
      return escreverMidi([[0, nota, 0.2]], indiceDaVoz ? VOZ.orgao2 : VOZ.orgao1, compasso)
    }
  }

  // O "tra-la-lá" do Tralalero: a quinta do acorde em tercinas rápidas e o salto de sexta
  function canto(compasso) {
    const c = COMPASSOS[compasso]
    if (!ativa('canto', c.secao) || !['Tema', 'Tema 2', 'Canto', 'Pressão Máxima'].includes(c.secao)) return null
    if (c.secao === 'Pressão Máxima' && c.ultimo) return null
    const raiz = dobrarPara(CANTO_ACORDES[c.acorde] + tonica, 60, 71)
    if (c.indice % 2 === 0) return escreverMidi([['0t', raiz, 0.1], ['1t', raiz, 0.16], ['2t', raiz, 0.1], ['3t', raiz + 9, 0.02], ['6t', raiz + 7, 0.1]], VOZ.canto, compasso)
    return escreverMidi([['0t', raiz + 9, 0.1], ['3t', raiz + 7, 0.1], ['6t', raiz + 3, 0.14]], VOZ.canto, compasso)
  }

  // ---------------- bateria ----------------
  const peca = (nome, mapa) => (compasso) => {
    const c = COMPASSOS[compasso]
    const groove = GROOVES[nome][c.secao]
    const texto = groove ? groove(c.indice, c.ultimo) : null
    if (!texto) return null
    return batida(texto, comAtenuacao(mapa, DINAMICA[c.secao]))
  }
  const madeira = (compasso) => (temTung(compasso) ? tungTungTung(ALTURA_DO_TUNG, compasso, GRADE) : compassoVazio(GRADE))

  const CANAIS = [
    ['baixoDistorcido', 0, semOFim(baixo)],
    ['sub', 0, semOFim(sub)],
    ['trombone', -0.22, semOFim(ostinato)],
    ['tromboneLongo', 0.2, semOFim(longo)],
    ['tromboneLongo', 0.1, semOFim(dobra)],
    ['trompete', 0.08, semOFim(tema)],
    ['trompeteSurdina', -0.2, semOFim(stabs(0))],
    ['trompeteSurdina', 0.2, semOFim(stabs(1))],
    ['trompeteSurdina', 0.05, semOFim(stabs(2))],
    ['saxBaritono', -0.12, semOFim(sax)],
    ['orgaoSustentado', -0.1, semOFim(orgao(0))],
    ['orgaoSustentado', 0.1, semOFim(orgao(1))],
    ['clarinete', 0.18, semOFim(canto)],
    ['timpano', -0.08, semOFim(timpano(false))],
    ['timpano', 0.08, semOFim(timpano(true))],
    ['bumboSeco', 0, semOFim(peca('bumbo', BUMBO))],
    ['caixa', 0, semOFim(peca('caixa', CAIXA))],
    ['caixaCorpo', 0, semOFim(peca('caixa', CAIXA_CORPO))],
    ['chimbal', -0.18, semOFim(peca('chimbal', CHIMBAL))],
    ['ride', 0.22, semOFim(peca('ride', RIDE))],
    ['pratoEscuro', 0.2, semOFim(peca('prato', PRATO))],
    ['campana', 0.15, semOFim(peca('campana', CAMPANA))],
    ['madeira', 0.08, madeira],
  ]

  // A melodia manda: o acompanhamento que cairia na mesma nota e oitava dela (ou do ostinato) some
  const canais = evitarUnissonos(CANAIS, PRIORIDADE)
  const instrumentos = [...new Set(CANAIS.map(([nome]) => nome))]

  const meta = Object.freeze({
    id: config.id,
    titulo: config.titulo,
    estilo: config.estilo,
    andamento,
    passosPorTempo: GRADE.passosPorTempo,
    temposPorCompasso: GRADE.temposPorCompasso,
    compassos: COMPASSOS.length,
    inicioDoLoop: 0,
    tonalidade: `${NOMES[(7 + tonica) % 12]} menor`,
    tonica: NOMES[(7 + tonica) % 12],
    modo: 'menor',
    estrutura: forma.map((item) => `${item.nome} ${item.harmonia.length}`).join(' · '),
  })

  const song = montarMusica({ instrumentos, canais, compassos: COMPASSOS.length, inicioDoLoop: 0, grade: GRADE, andamento })

  const comTung = COMPASSOS.map((_, compasso) => compasso).filter(temTung)
  const comCelula = COMPASSOS.map((_, compasso) => compasso).filter(temCelula)

  return Object.freeze({
    id: config.id,
    song,
    meta,
    instrumentos: Object.freeze(instrumentos),
    secoes: secoesDaForma(forma),
    harmonia: Object.freeze(COMPASSOS.map((c) => nomeDoAcorde(c.acorde, tonica))),
    motivo: Object.freeze({ tung: { compassos: comTung }, celula: { compassos: comCelula, tonica: tonicaDaCelula } }),
    // Para quem monta introduções e vitórias na mesma tonalidade
    tonica,
  })
}

export const CHEFE_FASES = Object.freeze(Object.fromEntries(Object.entries(FASES_DO_CHEFE).map(([id, config]) => [id, criarFase(config)])))

// --------------------------------------------------
// INTRODUÇÕES (tocam uma vez antes do corpo) e TRANSIÇÕES DE FASE
// --------------------------------------------------

const NOME_DA_INTRO = Object.freeze([
  'sub', 'baixoDistorcido', 'trombone', 'tromboneLongo', 'orgaoSustentado', 'timpano',
  'bumboSeco', 'caixa', 'caixaCorpo', 'pratoEscuro', 'madeira',
])

const VOZ_INTRO = Object.freeze({
  sub: voz('sub', 'baixo', { semente: 91 }),
  baixo: voz('baixoDistorcido', 'baixo', { semente: 92 }),
  subida: voz('trombone', 'melodia', { semente: 93 }),
  longo: voz('tromboneLongo', 'melodia', { semente: 94 }),
  orgao: voz('orgaoSustentado', 'comping', { semente: 95 }),
  timpano: voz('timpano', 'riff', { semente: 96 }),
})

// Introdução da fase 1: o pedal de Sol cresce sob o tímpano, o trombone sobe cromaticamente e a
// dominante (Ré) fica no ar; a madeira fecha em tercina e o corpo entra no tempo forte.
// compassos = 4 (chefe) ou 6 (chefe final, que ganha dois compassos de órgão antes)
export function criarIntroducao({ andamento, tonica = 0, compassos = 4 }) {
  const raiz = dobrarPara(43 + tonica, 38, 52)
  const quinta = raiz + 7
  const antes = compassos - 4 // compassos extras, só de pedal
  const dinamica = (extra) => comAtenuacao(CAIXA, extra)

  const canais = [
    ['sub', 0, (c) => escreverMidi([[0, raiz - 12, c < antes ? 0.3 : 0.1]], VOZ_INTRO.sub, c)],
    ['baixoDistorcido', 0, (c) => {
      if (c < antes + 1) return null
      return escreverMidi(c === antes + 1 ? [[0, raiz, 0.2], [6, raiz, 0.25], [9, raiz, 0.2]] : [[0, raiz, 0.1], [6, raiz, 0.15], [12, raiz, 0.1]], VOZ_INTRO.baixo, c)
    }],
    ['trombone', -0.2, (c) => {
      if (c !== antes + 2) return null
      return escreverMidi([0, 4, 8, 12].map((p, i) => [p, raiz + 12 + i, 0.3 - i * 0.08]), VOZ_INTRO.subida, c)
    }],
    ['tromboneLongo', 0.2, (c) => (c === antes + 3 ? escreverMidi([[0, quinta + 12, 0.1]], VOZ_INTRO.longo, c) : null)],
    ['orgaoSustentado', 0, (c) => (antes > 0 && c < antes + 2 ? escreverMidi([[0, raiz + 15, 0.2]], VOZ_INTRO.orgao, c) : null)],
    ['timpano', -0.1, (c) => {
      if (c < antes) return escreverMidi([[0, raiz, 0.2]], VOZ_INTRO.timpano, c)
      if (c === antes) return escreverMidi([[0, raiz, 0.15], [3, raiz, 0.35]], VOZ_INTRO.timpano, c)
      if (c === antes + 1) return escreverMidi([0, 3, 6, 9, 12].map((p, i) => [p, raiz, 0.5 - i * 0.1]), VOZ_INTRO.timpano, c)
      if (c === antes + 2) return escreverMidi([0, 6, 12, 15].map((p, i) => [p, raiz, 0.22 - i * 0.05]), VOZ_INTRO.timpano, c)
      return escreverMidi(Array.from({ length: 9 }, (_, i) => [`${i}t`, quinta - 12, 0.5 - i * 0.055]), VOZ_INTRO.timpano, c)
    }],
    ['bumboSeco', 0, (c) => (c === antes + 2 ? batida('K:0 K:6 K:12', comAtenuacao(BUMBO, 0.18)) : null)],
    ['caixa', 0, (c) => (c === antes + 3 ? batida('g:6 g:8 r:10 r:11 r:12 r:13 x:14 X:15', dinamica(0.1)) : c === antes + 2 ? batida('g:12 g:14', dinamica(0.3)) : null)],
    ['caixaCorpo', 0, (c) => (c === antes + 3 ? batida('g:6 g:8 r:10 r:11 r:12 r:13 x:14 X:15', comAtenuacao(CAIXA_CORPO, 0.1)) : null)],
    ['pratoEscuro', 0.2, (c) => (c === antes + 1 ? batida('p:0', comAtenuacao(PRATO, 0.3)) : null)],
    ['madeira', 0.08, (c) => (c === compassos - 1 ? tungTungTung(ALTURA_DO_TUNG, c, GRADE) : compassoVazio(GRADE))],
  ]
  // O tung-tung-tung é a última coisa do último compasso: o resto cala a partir da 4ª semínima
  const calados = canais.map(([nome, pan, fn]) => [nome, pan, (c) => {
    const passos = fn(c)
    if (!passos || nome === 'madeira' || c !== compassos - 1) return passos
    return passos.map((valor, passo) => (passo >= 34 && nome !== 'timpano' ? 0 : valor))
  }])

  return Object.freeze({
    song: montarMusica({ instrumentos: NOME_DA_INTRO, canais: calados, compassos, inicioDoLoop: 0, grade: GRADE, andamento }),
    instrumentos: NOME_DA_INTRO,
    compassos,
  })
}

// Transição de fase (2 compassos): o tímpano rola na nova tônica, o trombone sobe em semitons até a quinta
// dela, a caixa rufa e as tercinas da madeira levam ao tempo forte da fase nova.
export function criarTransicao({ andamento, tonica }) {
  const raiz = dobrarPara(43 + tonica, 38, 52)
  const quinta = raiz + 7
  const canais = [
    ['sub', 0, (c) => (c === 0 ? escreverMidi([[0, raiz - 12, 0.1]], VOZ_INTRO.sub, c) : null)],
    ['trombone', -0.2, (c) => (c === 0 ? escreverMidi([0, 4, 8, 12].map((p, i) => [p, quinta + 9 + i, 0.25 - i * 0.07]), VOZ_INTRO.subida, c) : null)],
    ['tromboneLongo', 0.2, (c) => (c === 1 ? escreverMidi([[0, quinta + 12, 0.08]], VOZ_INTRO.longo, c) : null)],
    ['timpano', -0.1, (c) => (c === 0
      ? escreverMidi(Array.from({ length: 12 }, (_, i) => [`${i}t`, raiz, 0.6 - i * 0.04]), VOZ_INTRO.timpano, c)
      : escreverMidi([[0, raiz, 0.1], [6, raiz, 0.2], [12, raiz, 0.1]], VOZ_INTRO.timpano, c))],
    ['bumboSeco', 0, (c) => (c === 1 ? batida('K:0 K:3 K:6 K:9', comAtenuacao(BUMBO, 0.15)) : null)],
    ['caixa', 0, (c) => (c === 1 ? batida('g:8 g:10 r:11 r:12 r:13 x:14 X:15', comAtenuacao(CAIXA, 0.1)) : c === 0 ? batida('g:4 g:8 g:12', comAtenuacao(CAIXA, 0.4)) : null)],
    ['pratoEscuro', 0.2, (c) => (c === 0 ? batida('P:0', comAtenuacao(PRATO, 0.15)) : null)],
    ['madeira', 0.08, (c) => (c === 1 ? tungTungTung(ALTURA_DO_TUNG, c, GRADE) : compassoVazio(GRADE))],
  ]
  const calados = canais.map(([nome, pan, fn]) => [nome, pan, (c) => {
    const passos = fn(c)
    if (!passos || nome === 'madeira' || c !== 1) return passos
    return passos.map((valor, passo) => (passo >= 34 && nome !== 'timpano' ? 0 : valor))
  }])
  const instrumentos = ['sub', 'trombone', 'tromboneLongo', 'timpano', 'bumboSeco', 'caixa', 'pratoEscuro', 'madeira']
  return Object.freeze({ song: montarMusica({ instrumentos, canais: calados, compassos: 2, inicioDoLoop: 0, grade: GRADE, andamento }), instrumentos: Object.freeze(instrumentos), compassos: 2 })
}

// --------------------------------------------------
// VITÓRIA: a música termina de verdade (a faixa toca uma vez e o resto é silêncio para a cauda soar)
// --------------------------------------------------

const NOME_DA_VITORIA = Object.freeze([
  'sub', 'baixoDistorcido', 'tromboneLongo', 'trompeteLongo', 'trompeteSurdina', 'trompete', 'orgaoSustentado', 'clarinete',
  'timpano', 'bumboSeco', 'caixa', 'caixaCorpo', 'pratoEscuro', 'campana', 'madeira',
])

// grande = o chefe final (mais compassos, o órgão e o clarinete na fanfarra)
export function criarVitoria({ andamento, grande = false }) {
  // 0: a dominante (Ré7♭9) em batidas e o rufo; 1: o Sol maior, de verdade (o Si natural é a terça de
  // Picardy); [grande: 2 e 3: a fanfarra]; depois a célula do Tung com o tung-tung-tung; o acorde final;
  // e dois compassos de silêncio para a cauda das notas soar (a faixa toca uma vez só)
  const celulaEm = grande ? 4 : 2
  const finalEm = celulaEm + 1
  const total = finalEm + 3
  const G = 43 // Sol2
  const v = {
    sub: voz('sub', 'baixo', { semente: 101 }),
    baixo: voz('baixoDistorcido', 'baixo', { semente: 102 }),
    longo: voz('tromboneLongo', 'naipe', { semente: 103 }),
    tromp: voz('trompeteLongo', 'naipe', { semente: 104 }),
    stab: voz('trompeteSurdina', 'naipe', { semente: 105 }),
    fan: voz('trompete', 'melodia', { semente: 106 }),
    orgao: voz('orgaoSustentado', 'comping', { semente: 107 }),
    clar: voz('clarinete', 'melodia', { semente: 108 }),
    timp: voz('timpano', 'riff', { semente: 109 }),
  }
  const acorde = (c) => c === 1 || c === finalEm // os dois compassos do Sol maior
  const fanfarra = (c) => grande && (c === 2 || c === 3)

  const canais = [
    ['sub', 0, (c) => (acorde(c) ? escreverMidi([[0, G - 12]], v.sub, c) : null)],
    ['baixoDistorcido', 0, (c) => {
      if (c === 0) return escreverMidi([[0, G + 7], [3, G + 7, 0.1], [6, G + 7, 0.1]], v.baixo, c)
      if (acorde(c)) return escreverMidi([[0, G]], v.baixo, c)
      if (fanfarra(c) || c === celulaEm) return escreverMidi([[0, G], [8, G + 7, 0.1]], v.baixo, c)
      return null
    }],
    ['tromboneLongo', 0.2, (c) => (acorde(c) ? escreverMidi([[0, 55, 0.05]], v.longo, c) : null)],
    ['trompeteLongo', -0.2, (c) => (acorde(c) ? escreverMidi([[0, 59, 0.05]], v.tromp, c) : null)],
    ['trompeteSurdina', 0.1, (c) => {
      if (c === 0) return escreverMidi([[0, 62], [3, 62, 0.1], [6, 62, 0.1]], v.stab, c)
      return acorde(c) ? escreverMidi([[0, 62, 0.05]], v.stab, c) : null
    }],
    ['trompete', 0.08, (c) => {
      if (c === 2 && grande) return escreverMidi([[0, 55], [3, 59], [6, 62], [9, 67], [12, 71, 0.05]], v.fan, c) // Sol – Si – Ré – Sol – Si
      if (c === 3 && grande) return escreverMidi([[0, 74, 0.05], [12, 71, 0.15]], v.fan, c)
      return c === celulaEm ? celula(55, v.fan, c, GRADE) : null
    }],
    ['orgaoSustentado', 0, (c) => (grande && (acorde(c) || fanfarra(c)) ? escreverMidi([[0, 59, 0.18]], v.orgao, c) : null)],
    ['clarinete', 0.18, (c) => (grande && c === 3 ? escreverMidi([['0t', 67, 0.1], ['1t', 67, 0.16], ['2t', 67, 0.1], ['3t', 74, 0.02]], v.clar, c) : null)],
    ['timpano', -0.1, (c) => {
      if (c === 0) return escreverMidi(Array.from({ length: 9 }, (_, i) => [`${i}t`, G + 7, 0.5 - i * 0.05]), v.timp, c)
      return acorde(c) ? escreverMidi([[0, G], [6, G, 0.25]], v.timp, c) : null
    }],
    ['bumboSeco', 0, (c) => (acorde(c) ? batida('K:0', BUMBO) : c === 0 ? batida('K:9 K:12', comAtenuacao(BUMBO, 0.2)) : null)],
    ['caixa', 0, (c) => {
      if (c === 0) return batida('g:2 g:4 r:6 r:7 r:8 r:9 x:10 x:11 X:12 X:13 X:14 X:15', comAtenuacao(CAIXA, 0.05))
      return acorde(c) ? batida('X:0', CAIXA) : null
    }],
    ['caixaCorpo', 0, (c) => (acorde(c) ? batida('X:0', CAIXA_CORPO) : null)],
    ['pratoEscuro', 0.2, (c) => (acorde(c) ? batida('P:0', PRATO) : null)],
    ['campana', 0.15, (c) => (c === finalEm ? batida('A:6', CAMPANA) : null)],
    ['madeira', 0.08, (c) => (c === celulaEm ? tungTungTung(ALTURA_DO_TUNG, c, GRADE) : compassoVazio(GRADE))],
  ]
  // A célula do Tung fecha no tung-tung-tung: a partir da 4ª semínima só a madeira toca
  const calados = canais.map(([nome, pan, fn]) => [nome, pan, (c) => {
    const passos = fn(c)
    if (!passos || nome === 'madeira' || c !== celulaEm) return passos
    return passos.map((valor, passo) => (passo >= 34 ? 0 : valor))
  }])
  return Object.freeze({
    song: montarMusica({ instrumentos: NOME_DA_VITORIA, canais: evitarUnissonos(calados, PRIORIDADE), compassos: total, inicioDoLoop: 0, grade: GRADE, andamento }),
    instrumentos: NOME_DA_VITORIA,
    compassos: total,
  })
}

// --------------------------------------------------
// DERROTA: o final de quando o Tung morre (toca uma vez; depois a música fica em silêncio até o jogador sair da run)
// --------------------------------------------------

const NOME_DA_DERROTA = Object.freeze([
  'sub', 'baixoDistorcido', 'orgaoSustentado', 'trompeteSurdina', 'timpano', 'pratoEscuro', 'campana', 'madeira',
])

// Quatro compassos de Sol menor caindo (Gm – E♭ – Cm – Gm) e dois de silêncio para a cauda soar. O baixo e a
// melodia descem de grau em grau, cada compasso um pouco mais baixo que o anterior, e o tung-tung-tung fecha
// o último, como a madeira que fecha as frases do chefe. Mais devagar que tudo (andamento 84).
export function criarDerrota({ andamento }) {
  const total = 6
  const ultimo = 3
  const v = {
    sub: voz('sub', 'baixo', { semente: 111 }),
    baixo: voz('baixoDistorcido', 'baixo', { semente: 112 }),
    orgao: voz('orgaoSustentado', 'comping', { semente: 113 }),
    surdina: voz('trompeteSurdina', 'melodia', { semente: 114 }),
    timp: voz('timpano', 'riff', { semente: 115 }),
  }
  const baixos = [43, 39, 48, 43] // Sol2, Mi♭2, Dó3, Sol2
  const orgao = [58, 55, 63, 58] // a terça de cada acorde
  const melodia = [[[0, 67], [8, 65]], [[0, 63], [8, 62]], [[0, 60], [8, 58]], [[0, 55]]] // Sol4 desce até o Sol3
  const queda = [0, 0.1, 0.2, 0.15] // cada compasso um pouco mais baixo (maior = mais fraco)

  const canais = [
    ['sub', 0, (c) => (c === 0 || c === ultimo ? escreverMidi([[0, baixos[c] - 12, queda[c] + 0.3]], v.sub, c) : null)],
    ['baixoDistorcido', 0, (c) => (c <= ultimo ? escreverMidi([[0, baixos[c], queda[c]]], v.baixo, c) : null)],
    ['orgaoSustentado', 0, (c) => (c <= ultimo ? escreverMidi([[0, orgao[c], 0.15 + queda[c]]], v.orgao, c) : null)],
    ['trompeteSurdina', 0.1, (c) => (c <= ultimo ? escreverMidi(melodia[c].map(([passo, midi]) => [passo, midi, queda[c]]), v.surdina, c) : null)],
    ['timpano', -0.1, (c) => (c <= ultimo ? escreverMidi([[0, dobrarPara(baixos[c], 38, 52), queda[c] + 0.1], [8, dobrarPara(baixos[c], 38, 52), queda[c] + 0.25]], v.timp, c) : null)],
    ['pratoEscuro', 0.2, (c) => (c === 0 ? batida('P:0', comAtenuacao(PRATO, 0.15)) : null)],
    ['campana', 0.15, (c) => (c === ultimo ? batida('A:0', CAMPANA) : null)],
    ['madeira', 0.08, (c) => (c === ultimo ? tungTungTung(ALTURA_DO_TUNG, c, GRADE) : compassoVazio(GRADE))],
  ]
  // O tung-tung-tung é a última coisa do último compasso: a partir da 4ª semínima só a madeira (e o tímpano) toca
  const calados = canais.map(([nome, pan, fn]) => [nome, pan, (c) => {
    const passos = fn(c)
    if (!passos || nome === 'madeira' || c !== ultimo) return passos
    return passos.map((valor, passo) => (passo >= 34 && nome !== 'timpano' ? 0 : valor))
  }])
  return Object.freeze({
    song: montarMusica({ instrumentos: NOME_DA_DERROTA, canais: evitarUnissonos(calados, PRIORIDADE), compassos: total, inicioDoLoop: 0, grade: GRADE, andamento }),
    instrumentos: NOME_DA_DERROTA,
    compassos: total,
  })
}
