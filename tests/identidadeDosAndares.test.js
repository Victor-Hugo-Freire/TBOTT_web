import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import {
  HARMONIAS_DAS_MUSICAS, INSTRUMENTOS_DAS_MUSICAS, MELODIAS_DAS_MUSICAS, METAS_DAS_MUSICAS, MUSICAS, SECOES_DAS_MUSICAS,
} from '../src/audio/music/musicas.js'
import {
  distanciaDeLevada, distanciaHarmonica, estatisticasDoBaixo, impressaoDaLevada, impressaoHarmonica, metricaDe, perfilDaMelodia,
  unissonosPorMinuto, viradasNasPassagens,
} from '../src/audio/music/analiseDosAndares.js'

// O pedido: cada andar com harmonia, melodia, levada e baixo próprios, sem perder o "mesmo jogo" (o
// motivo do Tung, conferido em motivoNasFaixas.test.js). Estes testes conferem o que dá para medir
// na partitura; o equilíbrio do som (grave, agudo, volume) fica em equilibrioDaTrilha.test.js.

const ANDARES = Object.keys(METAS_DAS_MUSICAS)
const pares = ANDARES.flatMap((a, i) => ANDARES.slice(i + 1).map((b) => [a, b]))
const metrica = (id) => metricaDe(MUSICAS[id], METAS_DAS_MUSICAS[id])
const harmonia = Object.fromEntries(ANDARES.map((id) => [id, impressaoHarmonica(HARMONIAS_DAS_MUSICAS[id])]))
const levada = Object.fromEntries(ANDARES.map((id) => [id, impressaoDaLevada(MUSICAS[id], INSTRUMENTOS_DAS_MUSICAS[id], metrica(id))]))
const melodia = Object.fromEntries(ANDARES.map((id) => [id, perfilDaMelodia(MUSICAS[id], INSTRUMENTOS_DAS_MUSICAS[id], MELODIAS_DAS_MUSICAS[id], metrica(id), METAS_DAS_MUSICAS[id])]))
const baixo = Object.fromEntries(ANDARES.map((id) => [id, estatisticasDoBaixo(MUSICAS[id], INSTRUMENTOS_DAS_MUSICAS[id])]))
const pct = (valor) => `${(100 * valor).toFixed(0)}%`

describe('cada andar tem harmonia própria', () => {
  test('tônica e modo diferentes em cada andar', () => {
    const chaves = ANDARES.map((id) => `${METAS_DAS_MUSICAS[id].tonica} ${METAS_DAS_MUSICAS[id].modo}`)
    assert.equal(new Set(chaves).size, ANDARES.length, chaves.join(', '))
    assert.equal(new Set(ANDARES.map((id) => METAS_DAS_MUSICAS[id].modo)).size, ANDARES.length)
  })

  test('as harmonias ficam a pelo menos 0,40 umas das outras (acordes, movimento e ritmo harmônico)', () => {
    for (const [a, b] of pares) {
      const distancia = distanciaHarmonica(harmonia[a], harmonia[b])
      assert.ok(distancia >= 0.4, `${a} × ${b}: ${distancia.toFixed(2)}`)
    }
  })

  test('nenhum andar repete a cadência ♭VI → V7 → i nem o acorde 7#9 (o que três andares tinham em comum)', () => {
    for (const id of ANDARES) {
      assert.equal(harmonia[id].cadencias.sextaQuintaPrimeira, 0, id)
      assert.equal(harmonia[id].cadencias.setimaSustenidoNove, 0, id)
    }
  })
})

describe('cada andar tem levada própria', () => {
  test('as levadas de bateria ficam a pelo menos 0,35 umas das outras', () => {
    for (const [a, b] of pares) {
      const distancia = distanciaDeLevada(levada[a], levada[b])
      assert.ok(distancia >= 0.35, `${a} × ${b}: ${distancia.toFixed(2)}`)
    }
  })

  test('toda seção termina com uma virada ou um breque', () => {
    for (const id of ANDARES) {
      assert.equal(viradasNasPassagens(MUSICAS[id], INSTRUMENTOS_DAS_MUSICAS[id], SECOES_DAS_MUSICAS[id]), 1, id)
    }
  })
})

describe('a melodia de cada andar mostra o modo e fica no médio', () => {
  test('as notas que dão a cor do modo aparecem (pelo menos 5% da melodia)', () => {
    for (const id of ANDARES) assert.ok(melodia[id].notasDoModo >= 0.05, `${id}: ${pct(melodia[id].notasDoModo)}`)
  })

  test('a melodia não fica presa na pentatônica menor (o blues da Cantina pode mais)', () => {
    for (const id of ANDARES) {
      const limite = id === 'andar-cantina' ? 0.85 : 0.78
      assert.ok(melodia[id].pentatonica <= limite, `${id}: ${pct(melodia[id].pentatonica)}`)
    }
  })

  test('nenhuma nota de melodia acima de 880 Hz e no máximo 10% acima de 660 Hz', () => {
    for (const id of ANDARES) {
      assert.equal(melodia[id].acimaDe880, 0, id)
      assert.ok(melodia[id].acimaDe660 <= 0.1, `${id}: ${pct(melodia[id].acimaDe660)}`)
    }
  })

  // "Evite melodia densa entre 100 e 650 Hz, porque os efeitos sonoros vão ficar nessa região"
  test('a melodia fica esparsa na região dos efeitos sonoros (menos de 2,5 ataques por segundo)', () => {
    for (const id of ANDARES) assert.ok(melodia[id].regiaoDosEfeitos < 2.5, `${id}: ${melodia[id].regiaoDosEfeitos.toFixed(2)}/s`)
  })
})

describe('o baixo está presente e se move', () => {
  // O Pastificio é a exceção de propósito: no rock pesado o baixo fica uma oitava abaixo das
  // guitarras (Mi1); lá a presença vem dos harmônicos (equilibrioDaTrilha.test.js)
  const comBaixoNoMedio = ANDARES.filter((id) => id !== 'andar-pastificio')

  test('a linha do baixo fica em volta do Lá2 (mediana de 90 Hz ou mais, até 30% abaixo de 80 Hz)', () => {
    for (const id of comBaixoNoMedio) {
      assert.ok(baixo[id].medianaHz >= 90, `${id}: ${baixo[id].medianaHz.toFixed(0)} Hz`)
      assert.ok(baixo[id].abaixoDe80 <= 0.3, `${id}: ${pct(baixo[id].abaixoDe80)} abaixo de 80 Hz`)
    }
  })

  test('o baixo muda de nota (não fica parado numa só)', () => {
    for (const id of ANDARES) assert.ok(baixo[id].movimento >= 0.4, `${id}: ${pct(baixo[id].movimento)}`)
  })

  test('sem dois instrumentos na mesma nota e oitava ao mesmo tempo (no máximo 1,5 por minuto)', () => {
    for (const id of ANDARES) {
      const valor = unissonosPorMinuto(MUSICAS[id], INSTRUMENTOS_DAS_MUSICAS[id])
      assert.ok(valor <= 1.5, `${id}: ${valor.toFixed(1)}/min`)
    }
  })
})
