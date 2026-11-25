import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { INSTRUMENTOS } from '../src/audio/music/instrumentos.js'
import { FAIXAS, FAIXAS_COMPOSTAS } from '../src/audio/music/faixas.js'
import { INSTRUMENTOS_DAS_MUSICAS, MUSICAS } from '../src/audio/music/musicas.js'
import { CANTINA_INSTRUMENTOS, CANTINA_META, CANTINA_SONG } from '../src/audio/music/andar-cantina.js'
import { CELULA_DO_TUNG_GRAUS, passosDoTungTungTung } from '../src/audio/music/motivos.js'
import { bpmDoZzfxm } from '../src/audio/music/partitura.js'

// Altura escrita (MIDI) de uma nota do ZzFXM num instrumento da biblioteca
const alturaEscrita = (nota, nome) => (nota | 0) - 12 + INSTRUMENTOS[nome].baseMidi

// Canal de um compasso → [{ passo, nota }] com as notas tocadas
function notasDoCanal(canal) {
  return canal.slice(2).flatMap((nota, passo) => (nota > 0 ? [{ passo, nota }] : []))
}

describe('músicas da trilha: estrutura', () => {
  test('toda faixa composta do registro tem música, e toda música está no registro', () => {
    assert.deepEqual([...FAIXAS_COMPOSTAS].sort(), Object.keys(MUSICAS).sort())
    for (const id of Object.keys(MUSICAS)) assert.ok(FAIXAS[id], id)
  })

  for (const [id, musica] of Object.entries(MUSICAS)) {
    test(`${id}: instrumentos, compassos, passos e sequência consistentes`, () => {
      const [instrumentos, padroes, sequencia, bpm] = musica
      const nomes = INSTRUMENTOS_DAS_MUSICAS[id]
      assert.equal(instrumentos.length, nomes.length)
      nomes.forEach((nome, indice) => assert.deepEqual(instrumentos[indice], INSTRUMENTOS[nome].parametros, nome))
      assert.ok(bpm > 0)

      const passos = padroes[0][0].length - 2
      const canais = padroes[0].length
      for (const padrao of padroes) {
        assert.equal(padrao.length, canais)
        for (const canal of padrao) {
          assert.equal(canal.length - 2, passos)
          assert.ok(Number.isInteger(canal[0]) && canal[0] >= 0 && canal[0] < instrumentos.length)
          assert.ok(Math.abs(canal[1]) <= 0.35, 'nenhum canal nos extremos do pan')
        }
      }

      // A sequência passa por todos os compassos uma vez (o loop é uma rotação)
      assert.deepEqual([...sequencia].sort((a, b) => a - b), padroes.map((_, indice) => indice))
      for (let i = 1; i < sequencia.length; i++) assert.equal(sequencia[i], (sequencia[i - 1] + 1) % padroes.length)
    })

    test(`${id}: toda nota está no registro do instrumento e tem atenuação válida`, () => {
      const [, padroes] = musica
      const nomes = INSTRUMENTOS_DAS_MUSICAS[id]
      for (const padrao of padroes) {
        for (const canal of padrao) {
          const nome = nomes[canal[0]]
          const [minimo, maximo] = INSTRUMENTOS[nome].registro
          for (const { nota } of notasDoCanal(canal)) {
            const altura = alturaEscrita(nota, nome)
            assert.ok(altura >= minimo && altura <= maximo, `${nome}: altura ${altura} fora de ${minimo}–${maximo}`)
            assert.ok(nota % 1 < 1 && nota % 1 >= 0)
          }
        }
      }
    })
  }
})

describe('A Ronda: Cantina', () => {
  const [, padroes, sequencia, bpm] = CANTINA_SONG
  const canalDe = (nome, ordem = 0) => {
    const indices = padroes[0].flatMap((canal, indice) => (CANTINA_INSTRUMENTOS[canal[0]] === nome ? [indice] : []))
    return indices[ordem]
  }

  test('24 compassos de 12 passos, ♩ = 88 e áudio começando no compasso 2', () => {
    assert.equal(padroes.length, 24)
    assert.equal(padroes[0][0].length - 2, 12)
    assert.equal(bpm, bpmDoZzfxm(88, 3))
    assert.equal(bpm, 66)
    assert.equal(sequencia[0], CANTINA_META.inicioDoLoop)
    assert.equal(sequencia[0], 2)
  })

  test('o riff é a célula do Tung no baixo (5 – ♭7 – 1\' – ♭7 – 5)', () => {
    const baixo = canalDe('contrabaixo')
    const tonicas = { 0: 33, 2: 33, 4: 38, 6: 33, 8: 28, 9: 26 }
    for (const volta of [0, 12]) {
      for (const [posicao, tonica] of Object.entries(tonicas)) {
        const tocadas = notasDoCanal(padroes[volta + Number(posicao)][baixo]).slice(0, 5)
        assert.deepEqual(tocadas.map(({ passo }) => passo), [0, 2, 3, 5, 6])
        assert.deepEqual(tocadas.map(({ nota }) => alturaEscrita(nota, 'contrabaixo') - tonica), [...CELULA_DO_TUNG_GRAUS])
      }
    }
  })

  test('o tung-tung-tung fecha cada frase de 4 compassos, em crescendo e sem a caixa por cima', () => {
    const madeira = canalDe('madeira')
    const caixa = canalDe('caixa')
    const passos = passosDoTungTungTung(3)
    for (let compasso = 0; compasso < 24; compasso++) {
      const tocadas = notasDoCanal(padroes[compasso][madeira])
      if ([3, 7, 11].includes(compasso % 12)) {
        assert.deepEqual(tocadas.map(({ passo }) => passo), passos)
        const atenuacoes = tocadas.map(({ nota }) => nota % 1)
        assert.ok(atenuacoes[0] > atenuacoes[1] && atenuacoes[1] > atenuacoes[2], 'crescendo')
        assert.deepEqual(notasDoCanal(padroes[compasso][caixa]).filter(({ passo }) => passo >= 9), [])
      } else {
        assert.deepEqual(tocadas, [])
      }
    }
  })

  test('primeira volta só com vassourinha; segunda com baquetas e a guitarra respondendo', () => {
    const tocaEm = (nome, compassos) => compassos.some((compasso) => notasDoCanal(padroes[compasso][canalDe(nome)]).length > 0)
    const volta1 = Array.from({ length: 12 }, (_, i) => i)
    const volta2 = volta1.map((i) => i + 12)
    assert.equal(tocaEm('vassourinha', volta1), true)
    assert.equal(tocaEm('vassourinha', volta2), false)
    for (const nome of ['ride', 'caixa', 'guitarraJazz']) {
      assert.equal(tocaEm(nome, volta1), false, nome)
      assert.equal(tocaEm(nome, volta2), true, nome)
    }
  })

  test('a melodia fica esparsa na região dos efeitos sonoros (100 a 650 Hz)', () => {
    const [instrumentos] = CANTINA_SONG
    let ataques = 0
    for (const padrao of padroes) {
      for (const canal of padrao) {
        const nome = CANTINA_INSTRUMENTOS[canal[0]]
        if (INSTRUMENTOS[nome].percussao) continue
        for (const { nota } of notasDoCanal(canal)) {
          const frequencia = instrumentos[canal[0]][2] * 2 ** (((nota | 0) - 12) / 12)
          if (frequencia >= 100 && frequencia <= 650) ataques++
        }
      }
    }
    const segundos = 24 * 4 * (60 / 88)
    assert.ok(ataques / segundos < 2.5, `${(ataques / segundos).toFixed(2)} ataques por segundo`)
  })
})
