import assert from 'node:assert/strict'
import { after, before, describe, test } from 'node:test'
import { generateZzfxMusicSamples } from '../src/audio/zzfxmExperimental.js'
import { prepararFaixa } from '../src/audio/masterizacao.js'
import { ganhoDoNivel } from '../src/audio/music/faixas.js'
import { INSTRUMENTOS_DAS_MUSICAS, METAS_DAS_MUSICAS, MUSICAS, obterFaixa } from '../src/audio/music/musicas.js'
import { BAIXOS } from '../src/audio/music/analiseDosAndares.js'
import { bandasDeEnergia, energiaAcimaDe, mono, volumePercebido } from '../scripts/trilha/analise.mjs'

// O pedido: mais grave (presente também em caixa de notebook), menos agudo e o mesmo volume em todos
// os andares. Cada faixa sai como do worker (preparação, saturação e normalização) com o nível dela
// (faixas.js). A cadeia do master (filtros, sala e compressor) fica de fora para o teste levar
// poucos segundos; o npm run trilha:render mede também depois dela e a parte do baixo no que se ouve.

const SAMPLE_RATE = 44100
const ANDARES = Object.keys(METAS_DAS_MUSICAS)

// O `randomness` do ZzFX usa Math.random: com semente, o resultado não varia entre execuções
const aleatorioOriginal = Math.random
function fixarAleatorio(semente = 20261125) {
  let estado = semente >>> 0
  Math.random = () => {
    estado = (estado + 0x6d2b79f5) >>> 0
    let t = Math.imul(estado ^ (estado >>> 15), estado | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// A música só com alguns instrumentos (os outros canais mudos, do mesmo tamanho), sem normalizar
function somente(id, escolher) {
  const [instrumentos, padroes, sequencia, bpm] = MUSICAS[id]
  const nomes = INSTRUMENTOS_DAS_MUSICAS[id]
  const filtrados = padroes.map((padrao) => padrao.map((linha) => (escolher(nomes[linha[0]]) ? linha : linha.map((valor, i) => (i < 2 ? valor : 0)))))
  return mono(generateZzfxMusicSamples([instrumentos, filtrados, sequencia, bpm], SAMPLE_RATE, { loop: true, normalize: false }))
}

// Emenda do loop: o salto entre a última amostra e a primeira, comparado com os saltos típicos da
// faixa (o percentil 95 de uma amostra dos saltos entre amostras vizinhas)
function emendaDoLoop(canais) {
  let pior = 0
  const saltos = []
  for (const canal of canais) {
    pior = Math.max(pior, Math.abs(canal[0] - canal[canal.length - 1]))
    for (let i = 1; i < canal.length; i += 17) saltos.push(Math.abs(canal[i] - canal[i - 1]))
  }
  saltos.sort((a, b) => a - b)
  return { emenda: pior, saltoP95: saltos[Math.floor(saltos.length * 0.95)] }
}

const medidas = {}

before(() => {
  fixarAleatorio()
  for (const id of ANDARES) {
    const { canais } = prepararFaixa(obterFaixa(id), SAMPLE_RATE)
    const nivel = ganhoDoNivel(id)
    const comNivel = canais.map((canal) => canal.map((valor) => valor * nivel))
    const baixo = somente(id, (nome) => BAIXOS.includes(nome))
    let pico = 0
    for (const canal of comNivel) for (let i = 0; i < canal.length; i++) pico = Math.max(pico, Math.abs(canal[i]))
    const { energia, peloOuvido } = bandasDeEnergia(mono(comNivel), SAMPLE_RATE)
    medidas[id] = {
      bandas: energia,
      peloOuvido,
      baixoAcimaDe150: energiaAcimaDe(baixo, SAMPLE_RATE, 150),
      volume: volumePercebido(comNivel, SAMPLE_RATE),
      pico,
      ...emendaDoLoop(canais),
    }
  }
})

after(() => {
  Math.random = aleatorioOriginal
})

const pct = (valor) => `${(100 * valor).toFixed(0)}%`

describe('equilíbrio grave/agudo e volume dos andares (render)', () => {
  test('o agudo pelo ouvido (acima de 2 kHz) fica em até 10% do que se ouve', () => {
    for (const id of ANDARES) {
      const { presenca, agudo } = medidas[id].peloOuvido
      assert.ok(presenca + agudo <= 0.1, `${id}: ${pct(presenca + agudo)}`)
    }
  })

  test('o sub (abaixo de 60 Hz) não passa de 25% da energia', () => {
    for (const id of ANDARES) assert.ok(medidas[id].bandas.sub <= 0.25, `${id}: ${pct(medidas[id].bandas.sub)}`)
  })

  test('o baixo chega ao alto-falante pequeno: pelo menos 25% da energia dele acima de 150 Hz', () => {
    for (const id of ANDARES) assert.ok(medidas[id].baixoAcimaDe150 >= 0.25, `${id}: ${pct(medidas[id].baixoAcimaDe150)}`)
  })

  test('o volume percebido dos andares difere em até 1 dB', () => {
    const volumes = ANDARES.map((id) => medidas[id].volume)
    const diferenca = Math.max(...volumes) - Math.min(...volumes)
    assert.ok(diferenca <= 1, `${ANDARES.map((id, i) => `${id} ${volumes[i].toFixed(1)}`).join(' · ')} (diferença ${diferenca.toFixed(2)} dB)`)
  })

  test('o loop não tem emenda e nada passa do pico', () => {
    for (const id of ANDARES) {
      const { emenda, saltoP95, pico } = medidas[id]
      assert.ok(emenda <= saltoP95, `${id}: emenda ${emenda.toFixed(4)} (p95 ${saltoP95.toFixed(4)})`)
      assert.ok(pico < 1, `${id}: pico ${pico.toFixed(3)}`)
    }
  })
})
