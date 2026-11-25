// Ferramentas comuns para escrever as faixas da trilha (A Ronda e as salas): leitura das linhas em
// altura real, dinâmica por posição no compasso e montagem da música no formato do ZzFXM.
//
// LINHAS
//   Uma linha é um compasso: um token por passo da grade, separados por espaço ('|' só organiza a
//   leitura). Nota em altura real ('E3', 'Bb4', 'F#2'), '.' é pausa. Um '!' no fim acentua a nota e
//   um '_' deixa a nota mais suave. A linha precisa ter exatamente o número de passos da grade.
//
// DINÂMICA
//   A atenuação de cada nota (parte decimal da nota do ZzFXM) vem do perfil da voz e da posição no
//   compasso: tempo forte (1 e 3 no compasso de 4; só o 1 no de 3), tempo fraco e contratempo. Um
//   desvio pequeno e fixo por nota (variacao) evita que duas notas iguais soem idênticas.

import { INSTRUMENTOS, notaDoInstrumento } from './instrumentos.js'
import { celulaDoTung, passosDoTungTungTung, TUNG_TUNG_TUNG_ATENUACAO } from './motivos.js'

export const PAUSA = 0

const CLASSE = Object.freeze({ C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 })

// 'D4' → { midi: 62, marca: '' }, 'Bb3!' → { midi: 58, marca: '!' }. Pausa ou token inválido → null.
export function lerNota(token) {
  const encontrada = /^([A-G])([#b]?)(\d)([!_]?)$/.exec(String(token))
  if (!encontrada) return null
  const acidente = encontrada[2] === '#' ? 1 : encontrada[2] === 'b' ? -1 : 0
  return { midi: 12 * (Number(encontrada[3]) + 1) + CLASSE[encontrada[1]] + acidente, marca: encontrada[4] || '' }
}

export function tokens(texto) {
  return String(texto).replace(/\|/g, ' ').trim().split(/\s+/)
}

// Grade rítmica: passos por tempo (3 = colcheias em tercina, para shuffle e swing; 4 = semicolcheias
// retas) e tempos por compasso
export function criarGrade(passosPorTempo, temposPorCompasso = 4) {
  return Object.freeze({ passosPorTempo, temposPorCompasso, passos: passosPorTempo * temposPorCompasso })
}

// O bpm do ZzFXM conta semicolcheias (4 passos por tempo). Com outra grade, o bpm muda para o
// andamento percebido continuar o mesmo: 12 passos por compasso → bpm = andamento × 3/4.
export const bpmDoZzfxm = (andamento, passosPorTempo) => (andamento * passosPorTempo) / 4

function posicaoNoCompasso(passo, grade) {
  if (passo % grade.passosPorTempo !== 0) return 'contratempo'
  const tempo = passo / grade.passosPorTempo
  const forte = grade.temposPorCompasso === 4 ? tempo % 2 === 0 : tempo === 0
  return forte ? 'forte' : 'fraco'
}

// Atenuação por posição (0 = volume cheio)
export const PERFIS = Object.freeze({
  melodia: Object.freeze({ forte: 0.04, fraco: 0.12, contratempo: 0.24 }),
  baixo: Object.freeze({ forte: 0.02, fraco: 0.1, contratempo: 0.24 }),
  // riff: firme e regular, para o motivo soar igual a cada vez
  riff: Object.freeze({ forte: 0.02, fraco: 0.06, contratempo: 0.12 }),
  // acompanhamento: sempre abaixo da melodia
  comping: Object.freeze({ forte: 0.18, fraco: 0.24, contratempo: 0.3 }),
  naipe: Object.freeze({ forte: 0.06, fraco: 0.06, contratempo: 0.06 }),
})

// Desvio fixo de -0,04 a +0,04 por nota
export function variacao(compasso, passo, semente) {
  const x = Math.sin(compasso * 12.9898 + passo * 78.233 + semente * 37.719) * 43758.5453
  return ((x - Math.floor(x)) - 0.5) * 0.08
}

// Uma voz: instrumento da biblioteca, perfil de dinâmica, oitava em relação ao escrito e semente
// do desvio (vozes diferentes não variam juntas)
export function voz(instrumento, perfil, { oitava = 0, semente = 0 } = {}) {
  if (!INSTRUMENTOS[instrumento]) throw new Error(`Instrumento desconhecido: ${instrumento}`)
  if (!PERFIS[perfil]) throw new Error(`Perfil de dinâmica desconhecido: ${perfil}`)
  return Object.freeze({ instrumento, perfil, oitava, semente })
}

function atenuacao(v, compasso, passo, grade, marca, extra = 0) {
  const base = PERFIS[v.perfil][posicaoNoCompasso(passo, grade)] + extra
  const ajustada = marca === '!' ? base - 0.12 : marca === '_' ? base + 0.25 : base
  return Math.max(0, ajustada + variacao(compasso, passo, v.semente))
}

export function compassoVazio(grade) {
  return Array(grade.passos).fill(PAUSA)
}

// Uma linha de notas → passos do compasso (números de nota do instrumento da voz).
// extra: atenuação somada a todas as notas (crescendos de uma introdução, por exemplo).
export function linha(texto, v, compasso, grade, transpor = 0, extra = 0) {
  const lista = tokens(texto)
  if (lista.length !== grade.passos) {
    throw new Error(`A linha tem ${lista.length} passos, mas a grade tem ${grade.passos}: "${texto}"`)
  }
  return lista.map((token, passo) => {
    if (token === '.') return PAUSA
    const nota = lerNota(token)
    if (!nota) throw new Error(`Token inválido "${token}" na linha "${texto}"`)
    return notaDoInstrumento(nota.midi + transpor + v.oitava, v.instrumento, atenuacao(v, compasso, passo, grade, nota.marca, extra))
  })
}

// O mesmo mapa de bateria com mais atenuação em todas as batidas (sem passar da nota seguinte)
export function comAtenuacao(mapa, extra) {
  return Object.freeze(Object.fromEntries(Object.entries(mapa).map(([token, valor]) => {
    const nota = Math.floor(valor)
    return [token, nota + Math.min(0.95, valor - nota + extra)]
  })))
}

// Notas avulsas: [{ passo, midi, atenuacao? }] (atenuacao soma à do perfil)
export function notas(lista, v, compasso, grade) {
  const passos = compassoVazio(grade)
  for (const { passo, midi, atenuacao: extra = 0 } of lista) {
    passos[passo] = notaDoInstrumento(midi + v.oitava, v.instrumento, atenuacao(v, compasso, passo, grade, '', extra))
  }
  return passos
}

// Bateria: cada token é uma chave do mapa (o valor já traz a dinâmica na parte decimal)
export function bateria(texto, mapa, grade) {
  const lista = tokens(texto)
  if (lista.length !== grade.passos) {
    throw new Error(`A linha de bateria tem ${lista.length} passos, mas a grade tem ${grade.passos}: "${texto}"`)
  }
  return lista.map((token) => {
    if (token === '.') return PAUSA
    if (!(token in mapa)) throw new Error(`Batida "${token}" fora do mapa na linha "${texto}"`)
    return mapa[token]
  })
}

// Monta a música no formato do ZzFXM: [instrumentos, padrões, sequência, bpm].
// canais: [nomeDoInstrumento, panorama, (compasso) => passos | null]
// A sequência começa em inicioDoLoop e dá a volta (a mesma rotação da "A Vila Espera"): o áudio
// começa e termina no meio de uma textura, e as mudanças grandes ficam no meio do ciclo.
export function montarMusica({ instrumentos, canais, compassos, inicioDoLoop = 0, grade, andamento }) {
  const indices = new Map(instrumentos.map((nome, indice) => [nome, indice]))
  const parametros = instrumentos.map((nome) => {
    if (!INSTRUMENTOS[nome]) throw new Error(`Instrumento desconhecido: ${nome}`)
    return INSTRUMENTOS[nome].parametros
  })

  const padroes = Array.from({ length: compassos }, (_, compasso) => canais.map(([nome, pan, gerar]) => {
    if (!indices.has(nome)) throw new Error(`O canal usa "${nome}", que não está na lista de instrumentos.`)
    const passos = gerar(compasso) ?? compassoVazio(grade)
    if (passos.length !== grade.passos) {
      throw new Error(`O canal "${nome}" gerou ${passos.length} passos no compasso ${compasso} (esperado ${grade.passos}).`)
    }
    return [indices.get(nome), pan, ...passos]
  }))

  const sequencia = Array.from({ length: compassos }, (_, indice) => (inicioDoLoop + indice) % compassos)
  return [parametros, padroes, sequencia, bpmDoZzfxm(andamento, grade.passosPorTempo)]
}

// --------------------------------------------------
// O motivo do Tung em qualquer faixa (motivos.js)
// --------------------------------------------------

// A célula do Tung (5 – ♭7 – 1' – ♭7 – 5) a partir de uma tônica, na grade da faixa.
// mais: notas avulsas no mesmo compasso ({ passo, midi, atenuacao? }), como uma aproximação do baixo.
export function celula(tonicaMidi, v, compasso, grade, { extra = 0, mais = [] } = {}) {
  const lista = celulaDoTung(tonicaMidi, grade.passosPorTempo).map((nota) => ({ ...nota, atenuacao: nota.atenuacao + extra }))
  return notas([...lista, ...mais], v, compasso, grade)
}

// O tung-tung-tung no último tempo do compasso, em crescendo
export function tungTungTung(altura, compasso, grade, { instrumento = 'madeira', extra = 0 } = {}) {
  const passos = compassoVazio(grade)
  passosDoTungTungTung(grade.passosPorTempo, grade.temposPorCompasso).forEach((passo, indice) => {
    const desvio = variacao(compasso, passo, 9) / 2
    passos[passo] = notaDoInstrumento(altura, instrumento, Math.max(0, TUNG_TUNG_TUNG_ATENUACAO[indice] + extra + desvio))
  })
  return passos
}

// Junta canais de bateria de um mesmo instrumento num compasso (o primeiro que tocar no passo vale)
export function juntar(...listas) {
  const validas = listas.filter(Boolean)
  if (validas.length === 0) return null
  return validas[0].map((_, passo) => validas.find((lista) => lista[passo])?.[passo] ?? PAUSA)
}

// --------------------------------------------------
// Forma da faixa em seções
// --------------------------------------------------

// Uma faixa é uma lista de seções: { nome, harmonia: [um acorde por compasso], ...o que a faixa quiser
// (groove, virada, camadas) }. expandirForma devolve um item por compasso, com a seção inteira e mais
// indice (compasso dentro da seção), tamanho, acorde, inicio (compasso em que a seção começa),
// primeiro e ultimo.
export function expandirForma(forma) {
  const compassos = []
  for (const secao of forma) {
    const inicio = compassos.length
    const tamanho = secao.harmonia.length
    secao.harmonia.forEach((acorde, indice) => {
      compassos.push(Object.freeze({
        ...secao,
        secao: secao.nome,
        indice,
        tamanho,
        acorde,
        inicio,
        primeiro: indice === 0,
        ultimo: indice === tamanho - 1,
      }))
    })
  }
  return Object.freeze(compassos)
}

// Onde cada seção começa e quantos compassos tem (para as medições e os testes)
export function secoesDaForma(forma) {
  let inicio = 0
  return Object.freeze(forma.map((secao) => {
    const item = Object.freeze({ nome: secao.nome, papel: secao.papel ?? '', inicio, compassos: secao.harmonia.length })
    inicio += secao.harmonia.length
    return item
  }))
}
