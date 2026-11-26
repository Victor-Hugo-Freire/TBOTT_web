import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { duracaoDaMusicaEmAmostras, PICO_DA_FAIXA, prepararFaixa } from '../src/audio/masterizacao.js'
import { criarFonteComIntro, ENTRADA_DO_CORPO } from '../src/audio/fonteComIntro.js'
import { criarCacheDeFaixas } from '../src/audio/music/cacheDeFaixas.js'
import { INSTRUMENTOS } from '../src/audio/music/instrumentos.js'
import { INTROS, INSTRUMENTOS_DAS_INTROS, obterFaixa } from '../src/audio/music/musicas.js'
import {
  VILA_ESPERA_INTRO_COMPASSOS,
  VILA_ESPERA_INTRO_INSTRUMENTOS,
  VILA_ESPERA_INTRO_META,
  VILA_ESPERA_INTRO_SONG,
  VILA_ESPERA_META,
  VILA_ESPERA_SONG,
} from '../src/audio/music/vila-espera.js'

const SR = 44100
const alturaEscrita = (nota, nome) => (nota | 0) - 12 + INSTRUMENTOS[nome].baseMidi

describe('introdução da "A Vila Espera"', () => {
  const [, padroes, sequencia, bpm] = VILA_ESPERA_INTRO_SONG

  test('dura de 4 a 8 segundos, em compassos inteiros no mesmo andamento do corpo', () => {
    assert.equal(padroes.length, VILA_ESPERA_INTRO_COMPASSOS)
    assert.deepEqual(sequencia, padroes.map((_, indice) => indice))
    assert.equal(padroes[0][0].length - 2, 12)
    assert.equal(bpm, VILA_ESPERA_SONG[3])
    assert.ok(VILA_ESPERA_INTRO_META.duracao >= 4 && VILA_ESPERA_INTRO_META.duracao <= 8)
    const compasso = 12 * ((SR / bpm * 60) >> 2)
    assert.equal(duracaoDaMusicaEmAmostras(VILA_ESPERA_INTRO_SONG, SR), VILA_ESPERA_INTRO_COMPASSOS * compasso)
    assert.ok(Math.abs(VILA_ESPERA_INTRO_META.duracao - (VILA_ESPERA_INTRO_COMPASSOS * compasso) / SR) < 0.01)
  })

  test('o corpo começa no tema (compasso 0), logo depois da introdução', () => {
    assert.equal(VILA_ESPERA_META.loopStart, 0)
    assert.equal(VILA_ESPERA_SONG[2][0], 0)
  })

  test('usa as notas do blues em Ré do corpo (mesmo tom e escala)', () => {
    // Ré mixolídio com as notas de blues do tema: Ré Mi Fá Fá# Sol Sol# Lá Si Dó Dó#
    const permitidas = new Set([2, 4, 5, 6, 7, 8, 9, 11, 0, 1])
    for (const padrao of padroes) {
      for (const canal of padrao) {
        const nome = VILA_ESPERA_INTRO_INSTRUMENTOS[canal[0]]
        if (INSTRUMENTOS[nome].percussao) continue
        for (const nota of canal.slice(2)) {
          if (nota > 0) assert.ok(permitidas.has(alturaEscrita(nota, nome) % 12), `${nome}: ${alturaEscrita(nota, nome)}`)
        }
      }
    }
  })

  test('a última barra leva ao tema: tung-tung-tung no 4º tempo, baixo descendo até Mi e o Dó# do sax', () => {
    const ultimo = padroes.at(-1)
    const canalDe = (nome) => ultimo.find((canal) => VILA_ESPERA_INTRO_INSTRUMENTOS[canal[0]] === nome)
    const tocadas = (canal) => canal.slice(2).flatMap((nota, passo) => (nota > 0 ? [{ passo, nota }] : []))
    assert.deepEqual(tocadas(canalDe('madeira')).map(({ passo }) => passo), [9, 10, 11])
    const baixo = tocadas(canalDe('contrabaixo'))
    assert.equal(alturaEscrita(baixo.at(-1).nota, 'contrabaixo'), 40) // Mi2 → Ré2 no tema
    const sax = tocadas(canalDe('saxTenor'))
    assert.deepEqual(sax.map(({ passo, nota }) => [passo, alturaEscrita(nota, 'saxTenor')]), [[11, 61]]) // Dó#4
  })

  test('cresce compasso a compasso e chega perto do nível do corpo, com a mesma normalização', () => {
    const faixa = prepararFaixa(obterFaixa('a-vila-espera'), SR)
    const compasso = faixa.introAmostras / VILA_ESPERA_INTRO_COMPASSOS
    const nivel = (canais, de, ate) => {
      let soma = 0
      for (const canal of canais) for (let i = de; i < ate; i++) soma += canal[i] * canal[i]
      return 10 * Math.log10(soma / (2 * (ate - de)))
    }
    const niveis = Array.from({ length: VILA_ESPERA_INTRO_COMPASSOS }, (_, i) => nivel(faixa.intro, i * compasso, (i + 1) * compasso))
    for (let i = 1; i < niveis.length; i++) assert.ok(niveis[i] > niveis[i - 1], `crescendo: ${niveis.map((n) => n.toFixed(1)).join(' → ')}`)

    // O último compasso da introdução fica a menos de 3 dB dos quatro primeiros do corpo
    const corpo = nivel(faixa.canais, 0, compasso * 4)
    assert.ok(corpo - niveis.at(-1) < 3, `${niveis.at(-1).toFixed(1)} dB contra ${corpo.toFixed(1)} dB`)

    // Mesma normalização: o pico das duas partes juntas é o pico da faixa
    let pico = 0
    for (const canal of [...faixa.canais, ...faixa.intro]) for (let i = 0; i < canal.length; i++) pico = Math.max(pico, Math.abs(canal[i]))
    assert.ok(Math.abs(pico - PICO_DA_FAIXA) < 1e-6)
  })

  test('está registrada como introdução da faixa', () => {
    assert.equal(INTROS['a-vila-espera'], VILA_ESPERA_INTRO_SONG)
    assert.equal(INSTRUMENTOS_DAS_INTROS['a-vila-espera'], VILA_ESPERA_INTRO_INSTRUMENTOS)
  })
})

// --------------------------------------------------
// Fonte "introdução + loop" com um AudioContext de mentira
// --------------------------------------------------

function criarContexto() {
  const fontes = []
  const ganhos = []
  const no = (extra) => ({ ligacoes: [], connect(destino) { this.ligacoes.push(destino) }, disconnect() {}, ...extra })
  return {
    currentTime: 5,
    fontes,
    ganhos,
    createGain() {
      const ganho = no({
        gain: {
          value: 1,
          eventos: [],
          setValueAtTime(valor, tempo) { this.eventos.push(['set', valor, tempo]) },
          linearRampToValueAtTime(valor, tempo) { this.eventos.push(['rampa', valor, tempo]) },
        },
      })
      ganhos.push(ganho)
      return ganho
    },
    createBufferSource() {
      const fonte = no({ buffer: null, loop: false, onended: null, inicio: null, parada: null, start(t) { this.inicio = t }, stop(t) { this.parada = t ?? 'agora' } })
      fontes.push(fonte)
      return fonte
    },
  }
}

describe('fonte com introdução', () => {
  test('a introdução toca uma vez e o corpo entra em loop no fim dela, subindo em 8 ms', () => {
    const contexto = criarContexto()
    const fonte = criarFonteComIntro(contexto, { nome: 'corpo' }, { buffer: { nome: 'intro' }, duracao: 7.2 })
    fonte.connect({})
    fonte.start()
    const [corpo, intro] = contexto.fontes
    assert.equal(fonte.loop, true)
    assert.equal(corpo.loop, true)
    assert.equal(intro.loop, false)
    assert.equal(intro.inicio, 5)
    assert.equal(corpo.inicio, 5 + 7.2)
    const entrada = contexto.ganhos.find((ganho) => ganho.gain.eventos.length > 0)
    assert.deepEqual(entrada.gain.eventos, [['set', 0, 12.2], ['rampa', 1, 12.2 + ENTRADA_DO_CORPO]])
  })

  test('stop para as duas partes e o fim do corpo avisa quem tocou', () => {
    const contexto = criarContexto()
    const fonte = criarFonteComIntro(contexto, {}, { buffer: {}, duracao: 4.8 })
    let terminou = false
    fonte.onended = () => { terminou = true }
    fonte.start()
    fonte.stop()
    const [corpo, intro] = contexto.fontes
    assert.equal(corpo.parada, 'agora')
    assert.equal(intro.parada, 'agora')
    corpo.onended()
    assert.equal(terminou, true)
  })

  test('sem introdução, é a fonte do corpo em loop, como antes', () => {
    const contexto = criarContexto()
    const fonte = criarFonteComIntro(contexto, { nome: 'corpo' }, null)
    assert.equal(contexto.fontes.length, 1)
    assert.equal(fonte, contexto.fontes[0])
    assert.equal(fonte.loop, true)
  })

  test('o cache guarda a introdução junto e diz onde o corpo começa', () => {
    const cache = criarCacheDeFaixas({ renderizar: async () => null })
    const canais = () => [new Float32Array(10), new Float32Array(10)]
    cache.guardar('faixa', { canais: canais(), intro: canais(), introAmostras: 4410 })
    const contexto = {
      createBuffer(c, length, sampleRate) {
        const dados = [new Float32Array(length), new Float32Array(length)]
        return { length, sampleRate, getChannelData: (i) => dados[i] }
      },
    }
    const intro = cache.obterIntro('faixa', contexto)
    assert.ok(intro.buffer)
    assert.equal(intro.duracao, 0.1)
    cache.guardar('sem-intro', canais())
    assert.equal(cache.obterIntro('sem-intro', contexto), null)
  })
})
