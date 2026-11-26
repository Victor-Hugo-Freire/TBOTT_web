// Escrita na grade de 12 passos por tempo (48 por compasso de 4 tempos), usada pelo chefe e pelo palco.
//
// Nessa grade cabem, no mesmo compasso, as semicolcheias (3 passos), as colcheias (6), as tercinas
// de colcheia (4) e de semicolcheia (2), e o tung-tung-tung e a célula do Tung caem exatamente nos
// passos da tercina (os andares usam 12 passos com tercinas ou 16 com semicolcheias, nunca os dois).
//
// POSIÇÕES (um número por nota, dentro do compasso)
//   "5"   semicolcheia nº 5 (0 a 15; a colcheia é par: 0, 2, 4…)
//   "3t"  tercina de colcheia nº 3 (0 a 11; 0, 3, 6 e 9 caem nos tempos)
//   "7q"  tercina de semicolcheia nº 7 (0 a 23)
//   "13s" passo cru da grade (0 a 47)
// NOTAS   "Bb4:6" é um Si♭4 na semicolcheia 6; "Bb4!:6" acentua, "Bb4_:6" suaviza.
// BATERIA "K:0 d:3": cada letra é uma chave do mapa da peça.

import { criarGrade, lerNota, notas, compassoVazio } from './partitura.js'
import { INSTRUMENTOS, alturaDaNota } from './instrumentos.js'

export const GRADE12 = criarGrade(12, 4)

const UNIDADE = Object.freeze({ '': 3, t: 4, q: 2, s: 1 })

export function lerPosicao(texto) {
  const encontrada = /^(\d+)([tqs]?)$/.exec(texto)
  if (!encontrada) throw new Error(`Posição inválida "${texto}"`)
  const passo = Number(encontrada[1]) * UNIDADE[encontrada[2]]
  if (passo >= GRADE12.passos) throw new Error(`Posição "${texto}" fora do compasso`)
  return passo
}

const partes = (texto) => String(texto ?? '').replace(/\|/g, ' ').trim().split(/\s+/).filter(Boolean)

// Notas de uma voz: "G4:0 Bb4:6 A4:3t". Texto vazio → pausa (null, o canal fica vazio).
export function escrever(texto, v, compasso, extra = 0, transpor = 0) {
  const lista = partes(texto).map((token) => {
    const [nome, posicao] = token.split(':')
    const nota = lerNota(nome)
    if (!nota || posicao === undefined) throw new Error(`Token inválido "${token}" em "${texto}"`)
    const marca = nota.marca === '!' ? -0.12 : nota.marca === '_' ? 0.25 : 0
    return { passo: lerPosicao(posicao), midi: nota.midi + transpor, atenuacao: extra + marca }
  })
  return lista.length > 0 ? notas(lista, v, compasso, GRADE12) : null
}

// Notas avulsas em MIDI: [[posicao, midi, atenuacao?]]
export function escreverMidi(lista, v, compasso) {
  if (lista.length === 0) return null
  return notas(lista.map(([posicao, midi, extra = 0]) => ({ passo: lerPosicao(String(posicao)), midi, atenuacao: extra })), v, compasso, GRADE12)
}

// Bateria: "K:0 d:3 h:9t" com o mapa da peça (o valor já traz a dinâmica na parte decimal)
export function batida(texto, mapa) {
  const lista = partes(texto)
  if (lista.length === 0) return null
  const passos = compassoVazio(GRADE12)
  for (const token of lista) {
    const [chave, posicao] = token.split(':')
    if (!(chave in mapa) || posicao === undefined) throw new Error(`Batida inválida "${token}" em "${texto}"`)
    passos[lerPosicao(posicao)] = mapa[chave]
  }
  return passos
}

// Soma silêncio: o primeiro canal que tocar no passo vale
export function juntarPassos(...listas) {
  const validas = listas.filter(Boolean)
  if (validas.length === 0) return null
  return validas[0].map((_, passo) => validas.find((lista) => lista[passo])?.[passo] ?? 0)
}

// Colcheias de uma peça: "X:0 x:2 x:4 …" (a primeira de cada tempo é a letra forte)
export const COLCHEIAS = Array.from({ length: 8 }, (_, i) => `${i % 2 === 0 ? 'X' : 'x'}:${i * 2}`).join(' ')
export const SEMINIMAS = 'X:0 X:4 X:8 X:12'
export const SEMICOLCHEIAS = Array.from({ length: 16 }, (_, i) => `${i % 4 === 0 ? 'X' : 'x'}:${i}`).join(' ')

// Dobra uma nota para dentro de uma faixa de alturas (de oitava em oitava)
export function dobrarPara(midi, minimo, maximo) {
  let nota = midi
  while (nota > maximo) nota -= 12
  while (nota < minimo) nota += 12
  return nota
}

// Sem dois instrumentos na mesma nota e oitava ao mesmo tempo (o que embola: os andares ficam em até 1,5 por
// minuto). Quando dois canais de instrumentos diferentes atacam a mesma altura no mesmo passo, a nota do
// instrumento que vem depois na lista de prioridade (a melodia primeiro, o acompanhamento por último) some.
// A bateria e o sub (que dobra o baixo de propósito) ficam de fora. Devolve os canais com as mesmas assinaturas.
export function evitarUnissonos(canais, prioridade) {
  const cache = new Map()
  const ordem = (nome) => {
    const indice = prioridade.indexOf(nome)
    return indice < 0 ? prioridade.length : indice
  }

  function resolver(compasso) {
    if (cache.has(compasso)) return cache.get(compasso)
    const resultado = canais.map(([, , fn]) => {
      const passos = fn(compasso)
      return passos ? [...passos] : null
    })
    for (let passo = 0; passo < GRADE12.passos; passo++) {
      const entradas = []
      canais.forEach(([nome], indice) => {
        const nota = resultado[indice]?.[passo]
        if (!(nota > 0) || INSTRUMENTOS[nome].percussao || nome === 'sub') return
        entradas.push({ indice, nome, altura: alturaDaNota(nota, nome) })
      })
      entradas.sort((a, b) => ordem(a.nome) - ordem(b.nome))
      const donos = new Map() // altura → nome do instrumento que ficou com ela
      for (const { indice, nome, altura } of entradas) {
        if (donos.has(altura) && donos.get(altura) !== nome) resultado[indice][passo] = 0
        else donos.set(altura, nome)
      }
    }
    cache.set(compasso, resultado)
    return resultado
  }

  return canais.map(([nome, pan], indice) => [nome, pan, (compasso) => resolver(compasso)[indice]])
}
