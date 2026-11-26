import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { INSTRUMENTOS } from '../src/audio/music/instrumentos.js'
import { FAIXAS, FAIXAS_COMPOSTAS } from '../src/audio/music/faixas.js'
import { INSTRUMENTOS_DAS_MUSICAS, MUSICAS } from '../src/audio/music/musicas.js'
import { CANTINA_INSTRUMENTOS, CANTINA_MELODIA, CANTINA_META, CANTINA_SECOES, CANTINA_SONG } from '../src/audio/music/andar-cantina.js'
import { perfilDaMelodia } from '../src/audio/music/analiseDosAndares.js'
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
  const tocaEm = (nome, compassos) => compassos.some((compasso) => notasDoCanal(padroes[compasso][canalDe(nome)]).length > 0)
  const faixa = (de, ate) => Array.from({ length: ate - de }, (_, i) => de + i)
  const [A1, A2, B, R] = CANTINA_SECOES

  test('36 compassos de 12 passos em quatro seções (A1 12, A2 12, B 8, respiro 4), ♩ = 88', () => {
    assert.equal(padroes.length, 36)
    assert.equal(padroes[0][0].length - 2, 12)
    assert.equal(bpm, bpmDoZzfxm(88, 3))
    assert.equal(bpm, 66)
    assert.equal(sequencia[0], CANTINA_META.inicioDoLoop)
    assert.deepEqual(CANTINA_SECOES.map(({ nome, compassos }) => [nome, compassos]), [['A1', 12], ['A2', 12], ['B', 8], ['R', 4]])
  })

  test('o riff é a célula do Tung, que passa do baixo (A1) para a guitarra (A2)', () => {
    const passos = [0, 2, 3, 5, 6]
    const confere = (nome, tonicas) => {
      for (const [compasso, tonica] of Object.entries(tonicas)) {
        const tocadas = notasDoCanal(padroes[Number(compasso)][canalDe(nome)]).slice(0, 5)
        assert.deepEqual(tocadas.map(({ passo }) => passo), passos, `${nome} ${compasso}`)
        assert.deepEqual(tocadas.map(({ nota }) => alturaEscrita(nota, nome) - tonica), [...CELULA_DO_TUNG_GRAUS], `${nome} ${compasso}`)
      }
    }
    confere('contrabaixoCheio', { 0: 33, 4: 38, 8: 28, 9: 26 })
    confere('guitarraJazz', { 12: 57, 16: 62 })
  })

  test('o tung-tung-tung fecha só algumas frases, em lugares diferentes em cada seção, e a caixa sai do caminho', () => {
    const madeira = canalDe('madeira')
    const caixa = canalDe('caixa')
    const passos = passosDoTungTungTung(3)
    const comTung = padroes.flatMap((padrao, compasso) => (notasDoCanal(padrao[madeira]).length ? [compasso] : []))
    assert.deepEqual(comTung, [3, 11, 19, 23, 31, 33, 35])
    for (const compasso of comTung) {
      const tocadas = notasDoCanal(padroes[compasso][madeira])
      assert.deepEqual(tocadas.map(({ passo }) => passo), passos)
      const atenuacoes = tocadas.map(({ nota }) => nota % 1)
      assert.ok(atenuacoes[0] > atenuacoes[2], 'crescendo')
      assert.deepEqual(notasDoCanal(padroes[compasso][caixa]).filter(({ passo }) => passo >= 9), [])
    }
  })

  test('cada seção tem a sua cara: vassourinha no A1, baquetas e guitarra no A2, aro no B, quase nada no respiro', () => {
    const a1 = faixa(A1.inicio, A1.inicio + A1.compassos)
    const a2 = faixa(A2.inicio, A2.inicio + A2.compassos)
    const b = faixa(B.inicio, B.inicio + B.compassos)
    const r = faixa(R.inicio, R.inicio + R.compassos)
    assert.equal(tocaEm('vassourinha', a1), true)
    for (const nome of ['ride', 'caixa', 'guitarraJazz']) {
      assert.equal(tocaEm(nome, a1), false, `${nome} no A1`)
      assert.equal(tocaEm(nome, a2), true, `${nome} no A2`)
    }
    assert.equal(tocaEm('vassourinha', a2), false)
    assert.equal(tocaEm('caixaAro', b), true)
    for (const nome of ['ride', 'caixa', 'guitarraJazz', 'bumbo']) assert.equal(tocaEm(nome, r), false, `${nome} no respiro`)
  })

  // A regra do pedido original: "evite melodia densa entre 100 e 650 Hz, porque os efeitos sonoros
  // vão ficar nessa região". Conta as vozes de melodia; o baixo e os acordes curtos ficam de fora.
  test('a melodia fica esparsa na região dos efeitos sonoros (100 a 650 Hz)', () => {
    const { regiaoDosEfeitos } = perfilDaMelodia(CANTINA_SONG, CANTINA_INSTRUMENTOS, CANTINA_MELODIA, CANTINA_META, CANTINA_META)
    assert.ok(regiaoDosEfeitos < 2.5, `${regiaoDosEfeitos.toFixed(2)} ataques por segundo`)
  })
})
