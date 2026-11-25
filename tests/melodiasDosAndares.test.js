import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { INSTRUMENTOS_DAS_MUSICAS, MELODIAS_DAS_MUSICAS, METAS_DAS_MUSICAS, MOTIVOS_DAS_MUSICAS, MUSICAS } from '../src/audio/music/musicas.js'
import { chavesDaCelula, distanciaMelodica, impressaoMelodica } from '../src/audio/music/analiseMelodica.js'

const impressao = (id) => impressaoMelodica(MUSICAS[id], INSTRUMENTOS_DAS_MUSICAS[id], MELODIAS_DAS_MUSICAS[id], chavesDaCelula(MOTIVOS_DAS_MUSICAS[id]), METAS_DAS_MUSICAS[id])

// A assinatura melódica de cada andar já reescrito: [medida, 'min' ou 'max', valor]
const ASSINATURAS = Object.freeze({
  'andar-cantina': [['tercinaDoMeio', 'min', 0.15], ['longas', 'min', 0.25]],
  'andar-cucina': [['repetidas', 'min', 0.25], ['antecipacoes', 'min', 0.1], ['celula', 'max', 0.1]],
  'andar-piazza': [['tercinaDoMeio', 'min', 0.2], ['quartaSexta', 'min', 0.3], ['celula', 'max', 0.1]],
})

const NOMES = Object.freeze({
  tercinaDoMeio: 'notas na tercina do meio',
  longas: 'notas longas (dois tempos ou mais até a próxima)',
  repetidas: 'notas repetidas',
  antecipacoes: 'antecipações (no último passo do compasso)',
  celula: 'notas da célula do Tung',
  quartaSexta: 'intervalos de quarta a sexta',
})

describe('cada andar tem melodia própria (figuras rítmicas e notas)', () => {
  for (const [id, metas] of Object.entries(ASSINATURAS)) {
    test(`${id}: a assinatura melódica`, () => {
      const { medidas } = impressao(id)
      for (const [medida, sentido, valor] of metas) {
        const atual = medidas[medida]
        const ok = sentido === 'min' ? atual >= valor : atual <= valor
        assert.ok(ok, `${NOMES[medida]}: ${(atual * 100).toFixed(1)}% (${sentido === 'min' ? 'mínimo' : 'máximo'} ${valor * 100}%)`)
      }
    })
  }

  test('as melodias dos andares reescritos ficam a pelo menos 0,30 umas das outras', () => {
    const ids = Object.keys(ASSINATURAS)
    const impressoes = Object.fromEntries(ids.map((id) => [id, impressao(id)]))
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const distancia = distanciaMelodica(impressoes[ids[i]], impressoes[ids[j]])
        assert.ok(distancia >= 0.3, `${ids[i]} × ${ids[j]}: ${distancia.toFixed(3)}`)
      }
    }
  })
})

describe('impressão digital melódica', () => {
  test('melodia igual a si mesma tem distância zero', () => {
    const a = impressao('andar-cucina')
    assert.equal(distanciaMelodica(a, a), 0)
  })

  test('conta repetidas, antecipações e tercinas do meio numa música pequena', () => {
    // 1 compasso de 12 passos: Sol Sol (repetida) no 0 e no 2, Lá na tercina do meio (4), Si no último passo
    const musica = [[[1, 0, 130.81]], [[[0, 0, 12, 0, 12, 0, 14, 0, 0, 0, 0, 0, 0, 16]]], [0], 75]
    const nomes = ['orgao']
    const { medidas, total } = impressaoMelodica(musica, nomes, [[['orgao', 0]]])
    assert.equal(total, 4)
    assert.equal(medidas.repetidas, 1 / 3)
    assert.equal(medidas.tercinaDoMeio, 1 / 4)
    assert.equal(medidas.antecipacoes, 1 / 4)
  })
})
