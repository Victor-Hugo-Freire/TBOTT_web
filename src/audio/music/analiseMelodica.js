// Impressão digital das melodias de uma faixa: onde as notas caem no tempo, a distância de uma nota
// até a seguinte, os intervalos e quanto da melodia é a célula do Tung. Serve para comparar os andares
// entre si (testes e npm run trilha:render); o jogo não usa este arquivo.
//
// Uma faixa declara as vozes de melodia: cada voz é uma lista de canais [instrumento, ordem] (por
// exemplo o sax curto e o sax longo), que se juntam no tempo como uma linha só.

import { INSTRUMENTOS } from './instrumentos.js'

const altura = (nota, nome) => (nota | 0) - 12 + INSTRUMENTOS[nome].baseMidi

function indiceDoCanal(padrao, nomes, instrumento, ordem) {
  return padrao.flatMap((canal, indice) => (nomes[canal[0]] === instrumento ? [indice] : []))[ordem]
}

// Notas de cada voz, em ordem de tempo: { tempo (em tempos), midi, passo, compasso, chave }
export function notasDasVozes([, padroes], nomes, vozes) {
  const passosPorCompasso = padroes[0][0].length - 2
  const passosPorTempo = passosPorCompasso / 4
  return vozes.map((voz) => {
    const notas = []
    for (const [instrumento, ordem] of voz) {
      const canal = indiceDoCanal(padroes[0], nomes, instrumento, ordem)
      if (canal === undefined) throw new Error(`A faixa não tem o canal ${instrumento} (${ordem}).`)
      padroes.forEach((padrao, compasso) => {
        padrao[canal].slice(2).forEach((nota, passo) => {
          if (!(nota > 0)) return
          notas.push({
            tempo: (compasso * passosPorCompasso + passo) / passosPorTempo,
            midi: altura(nota, instrumento),
            passo,
            compasso,
            chave: `${instrumento}:${ordem}:${compasso}`,
          })
        })
      })
    }
    return notas.sort((a, b) => a.tempo - b.tempo)
  })
}

const somar = (mapa, chave) => { mapa[chave] = (mapa[chave] || 0) + 1 }
const fracao = (valor, total) => (total > 0 ? valor / total : 0)

// celulas: Set de chaves `${instrumento}:${ordem}:${compasso}` em que a voz toca a célula exata
export function impressaoMelodica(song, nomes, vozes, celulas = new Set()) {
  const passosPorCompasso = song[1][0][0].length - 2
  const passosPorTempo = passosPorCompasso / 4
  const swing = passosPorTempo === 3
  const pos = {}
  const ioi = {}
  const intervalo = {}
  const contar = { tercinaDoMeio: 0, foraDoTempo: 0, semicolcheias: 0, antecipacoes: 0, celula: 0 }
  const contarPares = { repetidas: 0, semitons: 0, quartaSexta: 0, saltos: 0, longas: 0, hemiola: 0 }
  let total = 0
  let pares = 0

  for (const notas of notasDasVozes(song, nomes, vozes)) {
    notas.forEach((nota, indice) => {
      total += 1
      const noTempo = nota.passo % passosPorTempo
      if (noTempo === 0) somar(pos, 'tempo')
      else if (swing ? noTempo === 2 : noTempo === 2) somar(pos, 'colcheia')
      else somar(pos, 'outra')
      if (noTempo !== 0) contar.foraDoTempo += 1
      if (swing && noTempo === 1) contar.tercinaDoMeio += 1
      if (!swing && noTempo % 2 === 1) contar.semicolcheias += 1
      if (nota.passo === passosPorCompasso - 1) contar.antecipacoes += 1
      if (celulas.has(nota.chave)) contar.celula += 1

      const proxima = notas[indice + 1]
      if (!proxima) return
      pares += 1
      const distancia = proxima.tempo - nota.tempo
      somar(ioi, distancia < 0.4 ? 'curta' : distancia < 0.8 ? 'media' : distancia <= 1.05 ? 'um tempo' : distancia <= 1.6 ? 'tempo e meio' : distancia < 2 ? 'dois tempos' : 'longa')
      if (distancia >= 1.4 && distancia <= 1.6) contarPares.hemiola += 1
      if (distancia >= 2) contarPares.longas += 1
      const salto = Math.abs(proxima.midi - nota.midi)
      somar(intervalo, salto === 0 ? 'repete' : salto === 1 ? 'semitom' : salto === 2 ? 'tom' : salto <= 4 ? 'terça' : salto <= 9 ? 'quarta a sexta' : 'salto grande')
      if (salto === 0) contarPares.repetidas += 1
      if (salto === 1) contarPares.semitons += 1
      if (salto >= 5 && salto <= 9) contarPares.quartaSexta += 1
      if (salto >= 8) contarPares.saltos += 1
    })
  }

  const medidas = {}
  for (const [nome, valor] of Object.entries(contar)) medidas[nome] = fracao(valor, total)
  for (const [nome, valor] of Object.entries(contarPares)) medidas[nome] = fracao(valor, pares)
  return { total, pos, ioi, intervalo, medidas }
}

function distanciaEntreHistogramas(a, b) {
  const totalA = Object.values(a).reduce((x, y) => x + y, 0)
  const totalB = Object.values(b).reduce((x, y) => x + y, 0)
  let soma = 0
  for (const chave of new Set([...Object.keys(a), ...Object.keys(b)])) {
    soma += Math.abs(fracao(a[chave] || 0, totalA) - fracao(b[chave] || 0, totalB))
  }
  return soma / 2
}

// 0 = melodias com o mesmo perfil, 1 = nada em comum. Média de três comparações: onde as notas
// caem no tempo, a distância entre as notas e os intervalos.
export function distanciaMelodica(a, b) {
  return (distanciaEntreHistogramas(a.pos, b.pos) + distanciaEntreHistogramas(a.ioi, b.ioi) + distanciaEntreHistogramas(a.intervalo, b.intervalo)) / 3
}

// Chaves das células exatas a partir do descritor MOTIVO de uma faixa
export function chavesDaCelula(motivo) {
  const entradas = Array.isArray(motivo.riff) ? motivo.riff : [motivo.riff]
  return new Set(entradas.flatMap((entrada) => Object.keys(entrada.compassos).map((compasso) => `${entrada.instrumento}:${entrada.ordem ?? 0}:${compasso}`)))
}
