import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { INSTRUMENTOS } from '../src/audio/music/instrumentos.js'
import { INSTRUMENTOS_DAS_MUSICAS, METAS_DAS_MUSICAS, MOTIVOS_DAS_MUSICAS, MUSICAS, SECOES_DAS_MUSICAS } from '../src/audio/music/musicas.js'
import { CELULA_DO_TUNG_GRAUS, CELULA_DO_TUNG_TEMPOS, passosDoTungTungTung, temposParaPassos } from '../src/audio/music/motivos.js'
import { FAIXAS_DOS_ANDARES, getTrackForContext } from '../src/audio/music/trackSelection.js'
import { FAIXAS_COMPOSTAS } from '../src/audio/music/faixas.js'

const alturaEscrita = (nota, nome) => (nota | 0) - 12 + INSTRUMENTOS[nome].baseMidi
const tocadas = (canal) => canal.slice(2).flatMap((nota, passo) => (nota > 0 ? [{ passo, nota }] : []))

describe('o motivo do Tung em cada faixa', () => {
  for (const [id, motivo] of Object.entries(MOTIVOS_DAS_MUSICAS)) {
    const [, padroes] = MUSICAS[id]
    const nomes = INSTRUMENTOS_DAS_MUSICAS[id]
    // A grade vem da META da faixa (a valsa tem 3 tempos por compasso)
    const { passosPorTempo, temposPorCompasso } = METAS_DAS_MUSICAS[id]
    const canaisDe = (nome) => padroes[0].flatMap((canal, indice) => (nomes[canal[0]] === nome ? [indice] : []))

    test(`${id}: a célula (5 – ♭7 – 1' – ♭7 – 5) com o ritmo fixo, em pelo menos dois compassos`, () => {
      // riff: um { instrumento, compassos } ou uma lista deles (a célula passa de um instrumento a outro)
      const entradas = Array.isArray(motivo.riff) ? motivo.riff : [motivo.riff]
      const passos = temposParaPassos(CELULA_DO_TUNG_TEMPOS, passosPorTempo)
      let total = 0
      for (const entrada of entradas) {
        // ordem: qual dos canais desse instrumento (quando a faixa tem mais de um)
        const canal = canaisDe(entrada.instrumento)[entrada.ordem ?? 0]
        for (const [compasso, tonica] of Object.entries(entrada.compassos)) {
          const notas = tocadas(padroes[Number(compasso)][canal]).slice(0, 5)
          assert.deepEqual(notas.map(({ passo }) => passo), passos, `${entrada.instrumento}, compasso ${compasso}`)
          assert.deepEqual(notas.map(({ nota }) => alturaEscrita(nota, entrada.instrumento) - tonica), [...CELULA_DO_TUNG_GRAUS], `${entrada.instrumento}, compasso ${compasso}`)
          total += 1
        }
      }
      assert.ok(total >= 2)
    })

    test(`${id}: o tung-tung-tung no último tempo, em crescendo, e só nos compassos marcados`, () => {
      const [canal] = canaisDe('madeira')
      const passos = passosDoTungTungTung(passosPorTempo, temposPorCompasso)
      assert.ok(motivo.tung.compassos.length >= 2)
      padroes.forEach((padrao, compasso) => {
        const batidas = tocadas(padrao[canal])
        if (!motivo.tung.compassos.includes(compasso)) {
          assert.deepEqual(batidas, [], `compasso ${compasso}`)
          return
        }
        assert.deepEqual(batidas.map(({ passo }) => passo), passos, `compasso ${compasso}`)
        const atenuacoes = batidas.map(({ nota }) => nota % 1)
        assert.ok(atenuacoes[0] > atenuacoes[2], `crescendo no compasso ${compasso}`)
      })
    })
  }
})

describe('uma faixa diferente em cada andar', () => {
  test('os cinco andares estão compostos e cada um toca a sua faixa', () => {
    for (const faixa of FAIXAS_DOS_ANDARES) assert.ok(FAIXAS_COMPOSTAS.includes(faixa), faixa)
    const tocam = [1, 2, 3, 4, 5].map((floorNumber) => getTrackForContext({ floorNumber, roomType: 'comum' }))
    assert.deepEqual(tocam, FAIXAS_DOS_ANDARES)
    assert.equal(new Set(tocam).size, 5)
  })

  test('o andamento sobe a cada andar', () => {
    const andamentos = FAIXAS_DOS_ANDARES.map((id) => {
      const [, padroes, , bpm] = MUSICAS[id]
      const { andamento, passosPorTempo, temposPorCompasso } = METAS_DAS_MUSICAS[id]
      // A grade declarada bate com a música: passos por compasso e o bpm do ZzFXM
      assert.equal(padroes[0][0].length - 2, passosPorTempo * temposPorCompasso, id)
      assert.equal((bpm * 4) / passosPorTempo, andamento, id)
      return andamento
    })
    assert.deepEqual(andamentos, [88, 104, 112, 124, 136])
  })
})

// O pedido: menos repetição. Estes testes conferem a estrutura que garante isso em cada andar.
describe('variação dentro de cada faixa de andar', () => {
  for (const id of FAIXAS_DOS_ANDARES) {
    const [, padroes, , bpm] = MUSICAS[id]
    const nomes = INSTRUMENTOS_DAS_MUSICAS[id]
    const secoes = SECOES_DAS_MUSICAS[id]
    const passosPorCompasso = padroes[0][0].length - 2
    const segundosPorCompasso = passosPorCompasso * (60 / bpm / 4)

    test(`${id}: loop de mais de 85 s, em pelo menos quatro seções de tamanhos que não são todos múltiplos de 8`, () => {
      assert.ok(padroes.length * segundosPorCompasso > 85, `${(padroes.length * segundosPorCompasso).toFixed(1)} s`)
      assert.ok(secoes.length >= 4)
      assert.equal(secoes.reduce((total, secao) => total + secao.compassos, 0), padroes.length)
      assert.ok(secoes.some((secao) => secao.compassos % 8 !== 0), 'pelo menos uma seção fora do múltiplo de 8')
    })

    test(`${id}: nenhuma frase do riff ou do tema se repete idêntica três compassos seguidos`, () => {
      const entradas = Array.isArray(MOTIVOS_DAS_MUSICAS[id].riff) ? MOTIVOS_DAS_MUSICAS[id].riff : [MOTIVOS_DAS_MUSICAS[id].riff]
      for (const { instrumento, ordem = 0 } of entradas) {
        const canal = padroes[0].flatMap((c, indice) => (nomes[c[0]] === instrumento ? [indice] : []))[ordem]
        let seguidas = 1
        for (let compasso = 1; compasso < padroes.length; compasso++) {
          const atual = padroes[compasso][canal].slice(2).map((nota) => nota | 0).join(',')
          const antes = padroes[compasso - 1][canal].slice(2).map((nota) => nota | 0).join(',')
          const tocou = padroes[compasso][canal].slice(2).some((nota) => nota > 0)
          seguidas = tocou && atual === antes ? seguidas + 1 : 1
          assert.ok(seguidas < 3, `${instrumento} repete o compasso ${compasso} três vezes`)
        }
      }
    })

    test(`${id}: a bateria muda ao longo da faixa (vários padrões e viradas)`, () => {
      for (const peca of ['bumbo', 'caixa']) {
        const canal = padroes[0].findIndex((c) => nomes[c[0]] === peca)
        if (canal < 0) continue
        const padroesDistintos = new Set(padroes.map((padrao) => padrao[canal].slice(2).map((nota) => (nota > 0 ? Math.floor(nota) : 0)).join(',')))
        assert.ok(padroesDistintos.size >= 4, `${peca}: ${padroesDistintos.size} padrões`)
      }
    })

    test(`${id}: tem subida e descida (a seção mais vazia tem menos da metade da atividade da mais cheia)`, () => {
      const atividade = secoes.map((secao) => {
        let ataques = 0
        for (let compasso = secao.inicio; compasso < secao.inicio + secao.compassos; compasso++) {
          for (const canal of padroes[compasso]) ataques += canal.slice(2).filter((nota) => nota > 0).length
        }
        return ataques / secao.compassos
      })
      assert.ok(Math.min(...atividade) < Math.max(...atividade) / 2, atividade.map((valor) => valor.toFixed(1)).join(' → '))
    })
  }
})
