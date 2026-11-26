import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import {
  clearGameMusicContext,
  getGameMusicContext,
  getLastGameMusicContext,
  isSameGameMusicContext,
  notifyGameMusic,
  subscribeGameMusic,
} from '../src/audio/music/contextoDoJogo.js'
import {
  ABAFADO,
  criarMesaDoJogo,
  decidirMusica,
  FADES,
  faixasParaPreparar,
  NIVEL_DO_JOGO,
} from '../src/audio/music/mesaDoJogo.js'
import { criarCacheDeFaixas, montarBufferAosPoucos } from '../src/audio/music/cacheDeFaixas.js'
import { AudioManager } from '../src/audio/AudioManager.js'
import { ROOM_TRANSITION_MS } from '../src/utils/run.js'
import { FAIXAS } from '../src/audio/music/faixas.js'
import { VILA_ESPERA_META } from '../src/audio/music/vila-espera.js'
import { VILA_ESPERA_MUSIC_OPTIONS } from '../src/data/vilaEsperaMusic.js'

// --------------------------------------------------
// Run de mentira, só com o que a música lê
// --------------------------------------------------

function criarRun({ floor = 1, roomType = 'comum', transition = null, death = null, finished = false, seed = 42 } = {}) {
  const rooms = [
    { id: 'a', type: roomType },
    { id: 'b', type: 'loja' },
    { id: 'c', type: 'chefe' },
  ]
  return { seed, floor: { number: floor, rooms }, roomId: 'a', transition, death, finished }
}

const contexto = (mudancas = {}) => ({
  seed: 42,
  floorNumber: 1,
  roomType: 'comum',
  floorChange: false,
  bossPhase: 1,
  bossState: 'luta',
  palco: null,
  paused: false,
  dead: false,
  finished: false,
  ...mudancas,
})

describe('contexto musical lido da run', () => {
  test('andar, sala, pausa, morte e fim vêm da run do jeito que ela está', () => {
    assert.deepEqual(getGameMusicContext(criarRun({ floor: 3, roomType: 'tesouro' }), true), contexto({ floorNumber: 3, roomType: 'tesouro', paused: true }))
    assert.equal(getGameMusicContext(criarRun({ death: { cause: 'chapa' } })).dead, true)
    assert.equal(getGameMusicContext(criarRun({ finished: true })).finished, true)
    assert.equal(getGameMusicContext(criarRun({ seed: 7 })).seed, 7)
  })

  test('na transição de sala, vale a sala de destino', () => {
    const run = criarRun({ transition: { type: 'room', toRoomId: 'b', elapsedMs: 0 } })
    assert.equal(getGameMusicContext(run).roomType, 'loja')
  })

  test('na troca de andar, o contexto já aponta para o andar seguinte antes de a tela escurecer', () => {
    const antes = getGameMusicContext(criarRun({ floor: 2, roomType: 'chefe', transition: { type: 'floor', switched: false } }))
    assert.equal(antes.floorNumber, 3)
    assert.equal(antes.floorChange, true)
    const depois = getGameMusicContext(criarRun({ floor: 3, roomType: 'inicial', transition: { type: 'floor', switched: true } }))
    assert.equal(depois.floorNumber, 3)
  })

  test('run ausente ou estranha não quebra o laço do jogo', () => {
    assert.equal(getGameMusicContext(null), null)
    assert.equal(getGameMusicContext({ floor: { number: 1 } }), null)
  })

  test('compara campo a campo', () => {
    assert.equal(isSameGameMusicContext(contexto(), contexto()), true)
    assert.equal(isSameGameMusicContext(contexto(), contexto({ paused: true })), false)
    assert.equal(isSameGameMusicContext(null, contexto()), false)
    assert.equal(isSameGameMusicContext(null, null), true)
  })

  test('o canal entrega o último contexto a quem chega e isola erros dos ouvintes', () => {
    clearGameMusicContext()
    const recebidos = []
    const sair = subscribeGameMusic((valor) => recebidos.push(valor))
    const sairComErro = subscribeGameMusic(() => { throw new Error('ouvinte com defeito') })
    const avisoOriginal = console.warn
    console.warn = () => {}
    try {
      assert.doesNotThrow(() => notifyGameMusic(contexto({ floorNumber: 2 })))
    } finally {
      console.warn = avisoOriginal
    }
    assert.equal(recebidos.at(-1).floorNumber, 2)

    const atrasados = []
    const sairAtrasado = subscribeGameMusic((valor) => atrasados.push(valor))
    assert.equal(atrasados[0].floorNumber, 2)

    sair()
    sairComErro()
    sairAtrasado()
    clearGameMusicContext()
    assert.equal(getLastGameMusicContext(), null)
  })
})

describe('decisões da música (tabela de reações)', () => {
  const compostas = ['andar-cantina', 'andar-cucina', 'loja']

  test('entrar na run: a faixa do andar sobe em 1,5 s', () => {
    const decisao = decidirMusica(null, contexto(), compostas)
    assert.equal(decisao.faixa, 'andar-cantina')
    assert.equal(decisao.entradaMs, FADES.entradaDaRun)
    assert.equal(decisao.entradaMs, 1500)
  })

  test('sala comum → sala comum: mesma faixa (a mesa não reinicia)', () => {
    const decisao = decidirMusica(contexto(), contexto({ roomType: 'inicial' }), compostas)
    assert.equal(decisao.faixa, 'andar-cantina')
    assert.equal(decisao.reiniciar, false)
  })

  test('sala com faixa própria: crossfade de 350 ms, o da câmera; chefe, tesouro, palco e adega ficam com a do andar', () => {
    const loja = decidirMusica(contexto(), contexto({ roomType: 'loja' }), compostas)
    assert.equal(loja.faixa, 'loja')
    assert.equal(loja.entradaMs, 350)
    assert.equal(loja.saidaMs, 350)
    assert.equal(FADES.sala, ROOM_TRANSITION_MS)
    for (const roomType of ['chefe', 'tesouro', 'palco', 'adega']) {
      assert.equal(decidirMusica(contexto(), contexto({ roomType }), compostas).faixa, 'andar-cantina', roomType)
    }
  })

  test('troca de andar: a atual some com a tela escurecendo e a do próximo andar sobe', () => {
    const decisao = decidirMusica(contexto({ roomType: 'chefe' }), contexto({ floorNumber: 2, roomType: 'chefe', floorChange: true }), compostas)
    assert.equal(decisao.faixa, 'andar-cucina')
    assert.equal(decisao.saidaMs, FADES.saidaDoAndar)
    assert.equal(decisao.entradaMs, FADES.entradaDoAndar)
  })

  test('tambor do andar 5: não há próximo andar, a música some', () => {
    const decisao = decidirMusica(contexto({ floorNumber: 5, roomType: 'chefe' }), contexto({ floorNumber: 6, roomType: 'chefe', floorChange: true }), compostas)
    assert.equal(decisao.faixa, null)
  })

  test('morte e fim da run: fade para silêncio', () => {
    for (const mudanca of [{ dead: true }, { finished: true }]) {
      const decisao = decidirMusica(contexto(), contexto(mudanca), compostas)
      assert.equal(decisao.faixa, null)
      assert.equal(decisao.saidaMs, FADES.silencio)
    }
  })

  test('morrer toca a derrota (a faixa "morte") uma vez, sem faixa que volte; o fim da run segue em silêncio', () => {
    const composta = [...compostas, 'morte']
    const morte = decidirMusica(contexto(), contexto({ dead: true }), composta)
    assert.equal(morte.faixa, 'morte')
    assert.equal(morte.depois, null)
    assert.equal(morte.entradaMs, FADES.faseEntrada)
    assert.equal(decidirMusica(contexto(), contexto({ finished: true }), composta).faixa, null)
  })

  test('pausa: abafa em vez de parar', () => {
    const decisao = decidirMusica(contexto(), contexto({ paused: true }), compostas)
    assert.equal(decisao.faixa, 'andar-cantina')
    assert.equal(decisao.abafada, true)
  })

  test('recomeçar com R (seed nova): a Cantina volta do começo', () => {
    const decisao = decidirMusica(contexto({ floorNumber: 2 }), contexto({ seed: 99 }), compostas)
    assert.equal(decisao.reiniciar, true)
    assert.equal(decisao.faixa, 'andar-cantina')
  })

  test('sair de /jogo: silêncio', () => {
    assert.equal(decidirMusica(contexto(), null).faixa, null)
  })

  test('prepara a faixa atual, a do andar e a do próximo andar', () => {
    assert.deepEqual(faixasParaPreparar(contexto({ roomType: 'loja' }), 'loja', compostas), ['loja', 'andar-cantina', 'andar-cucina'])
    assert.deepEqual(faixasParaPreparar(contexto({ floorNumber: 5 }), 'andar-cantina', compostas), ['andar-cantina'])
  })
})

// --------------------------------------------------
// AudioContext de mentira, que registra o que a mesa pede
// --------------------------------------------------

function criarParametro(valor) {
  return {
    value: valor,
    eventos: [],
    setValueAtTime(v, t) { this.eventos.push(['set', v, t]) },
    linearRampToValueAtTime(v, t) { this.eventos.push(['rampa', v, t]) },
    cancelScheduledValues(t) { this.eventos.push(['cancelar', t]) },
    setTargetAtTime(v, t, c) { this.eventos.push(['alvo', v, t, c]); this.alvo = v },
  }
}

function criarNo(extra = {}) {
  return { ligacoes: [], connect(destino) { this.ligacoes.push(destino) }, disconnect() { this.ligacoes = [] }, ...extra }
}

function criarContextoFalso() {
  const fontes = []
  const contexto = {
    currentTime: 0,
    sampleRate: 44100,
    fontes,
    createGain: () => criarNo({ gain: criarParametro(1) }),
    createBiquadFilter: () => criarNo({ type: 'lowpass', frequency: criarParametro(350) }),
    createConvolver: () => criarNo({ buffer: null, normalize: true }),
    createBuffer(canais, length, sampleRate) {
      const dados = []
      return {
        length,
        sampleRate,
        duration: length / sampleRate,
        numberOfChannels: canais,
        getChannelData(indice) {
          dados[indice] ??= new Float32Array(length)
          return dados[indice]
        },
      }
    },
    createBufferSource() {
      const fonte = criarNo({
        buffer: null,
        loop: false,
        inicio: null,
        parada: null,
        onended: null,
        start(quando, offset) { this.inicio = { quando, offset } },
        stop(quando) { this.parada = quando ?? contexto.currentTime },
      })
      fontes.push(fonte)
      return fonte
    },
  }
  return contexto
}

// Buffers "de 60 s" sem alocar os 2,6 milhões de amostras: a mesa só lê a duração
function criarCacheFalso(prontas) {
  return {
    prontas,
    pedidos: [],
    preparar(id, opcoes = {}) {
      this.pedidos.push({ id, urgente: Boolean(opcoes.urgente) })
      return Promise.resolve(this.prontas.has(id))
    },
    obterBuffer(id) {
      return this.prontas.has(id) ? { duration: 60, length: 60 * 44100, sampleRate: 44100 } : null
    },
  }
}

function montarMesa(prontas = ['andar-cantina', 'loja', 'andar-cucina']) {
  const cache = criarCacheFalso(new Set(prontas))
  const mesa = criarMesaDoJogo({ cache, compostas: ['andar-cantina', 'andar-cucina', 'loja'] })
  const audio = criarContextoFalso()
  const fonte = mesa.criarFonte(audio)
  fonte.connect(criarNo())
  return { mesa, cache, audio, fonte }
}

const vozesAtivas = (mesa) => mesa.estado().vozes.filter((voz) => !voz.saindo).map((voz) => voz.id)

describe('mesa de som do jogo', () => {
  test('sem contexto da run não toca nada; ao entrar na run, a Cantina sobe do começo', () => {
    const { mesa, audio, fonte } = montarMesa()
    fonte.start()
    assert.deepEqual(mesa.estado().vozes, [])

    mesa.definirContexto(contexto())
    assert.deepEqual(vozesAtivas(mesa), ['andar-cantina'])
    const voz = audio.fontes.at(-1)
    assert.equal(voz.loop, true)
    assert.equal(voz.inicio.offset, 0)
  })

  test('a saída da mesa fica ~3 dB abaixo do menu', () => {
    assert.ok(Math.abs(20 * Math.log10(NIVEL_DO_JOGO) + 3) < 0.01)
  })

  test('sala comum → sala comum não reinicia a faixa', () => {
    const { mesa, audio, fonte } = montarMesa()
    fonte.start()
    mesa.definirContexto(contexto())
    const criadas = audio.fontes.length
    mesa.definirContexto(contexto({ roomType: 'inicial' }))
    mesa.definirContexto(contexto({ roomType: 'chefe' }))
    assert.equal(audio.fontes.length, criadas)
    assert.deepEqual(vozesAtivas(mesa), ['andar-cantina'])
  })

  test('sala especial: crossfade e, ao sair, a faixa do andar volta do ponto onde parou', () => {
    const { mesa, audio, fonte } = montarMesa()
    fonte.start()
    mesa.definirContexto(contexto())
    audio.currentTime = 10
    mesa.definirContexto(contexto({ roomType: 'loja' }))
    assert.deepEqual(vozesAtivas(mesa), ['loja'])
    // Começou em 0,05 s; saiu em 10 s com 350 ms de fade: parou em 10,35 - 0,05 = 10,30 s
    assert.ok(Math.abs(mesa.estado().posicoes['andar-cantina'] - 10.3) < 1e-9)

    audio.currentTime = 30
    mesa.definirContexto(contexto())
    assert.deepEqual(vozesAtivas(mesa), ['andar-cantina'])
    assert.ok(Math.abs(audio.fontes.at(-1).inicio.offset - 10.3) < 1e-9)
  })

  test('troca de andar: a faixa atual some em 450 ms e a do próximo andar entra', () => {
    const { mesa, audio, fonte } = montarMesa()
    fonte.start()
    mesa.definirContexto(contexto({ roomType: 'chefe' }))
    const cantina = audio.fontes.at(-1)
    audio.currentTime = 5
    mesa.definirContexto(contexto({ floorNumber: 2, roomType: 'chefe', floorChange: true }))
    assert.deepEqual(vozesAtivas(mesa), ['andar-cucina'])
    assert.ok(Math.abs(cantina.parada - (5 + 0.45 + 0.05)) < 1e-9)
  })

  test('pausa abafa (passa-baixa e -6 dB) e despausar volta ao normal, sem parar a faixa', () => {
    const { mesa, audio, fonte } = montarMesa()
    fonte.start()
    mesa.definirContexto(contexto())
    const criadas = audio.fontes.length
    mesa.definirContexto(contexto({ paused: true }))
    assert.equal(mesa.estado().abafada, true)
    assert.equal(audio.fontes.length, criadas)
    assert.deepEqual(vozesAtivas(mesa), ['andar-cantina'])
    assert.equal(ABAFADO.ganho, 0.5)

    mesa.definirContexto(contexto({ paused: false }))
    assert.equal(mesa.estado().abafada, false)
  })

  test('morte e fim da run: a faixa sai e nada entra', () => {
    for (const mudanca of [{ dead: true }, { finished: true }]) {
      const { mesa, fonte } = montarMesa()
      fonte.start()
      mesa.definirContexto(contexto())
      mesa.definirContexto(contexto(mudanca))
      assert.deepEqual(vozesAtivas(mesa), [])
    }
  })

  test('a derrota toca até o fim, sem ser cortada por outro aviso, e depois dela a música fica em silêncio', () => {
    const cache = criarCacheFalso(new Set(['andar-cantina', 'morte']))
    const mesa = criarMesaDoJogo({ cache, compostas: ['andar-cantina', 'morte'] })
    const audio = criarContextoFalso()
    const fonte = mesa.criarFonte(audio)
    fonte.connect(criarNo())
    fonte.start()
    mesa.definirContexto(contexto())
    mesa.definirContexto(contexto({ dead: true }))
    assert.deepEqual(vozesAtivas(mesa), ['morte'])
    const derrota = audio.fontes.at(-1)
    assert.equal(derrota.loop, false)

    mesa.definirContexto(contexto({ dead: true, paused: true })) // a janela perdeu o foco no meio dela
    assert.deepEqual(vozesAtivas(mesa), ['morte'])
    assert.equal(derrota.parada, null, 'a derrota não é cortada')

    derrota.onended() // a derrota acabou
    mesa.definirContexto(contexto({ dead: true }))
    assert.deepEqual(vozesAtivas(mesa), [], 'nada volta depois dela')
  })

  test('recomeçar com R: a Cantina volta do começo, mesmo já tocando', () => {
    const { mesa, audio, fonte } = montarMesa()
    fonte.start()
    mesa.definirContexto(contexto())
    audio.currentTime = 20
    mesa.definirContexto(contexto({ roomType: 'loja' }))
    audio.currentTime = 25
    mesa.definirContexto(contexto())
    audio.currentTime = 40
    mesa.definirContexto(contexto({ seed: 7 }))
    assert.deepEqual(vozesAtivas(mesa), ['andar-cantina'])
    assert.equal(audio.fontes.at(-1).inicio.offset, 0)
    assert.deepEqual(mesa.estado().posicoes, {})
  })

  test('faixa que ainda não está pronta: a atual continua e a nova entra quando ficar pronta', async () => {
    const { mesa, cache, fonte } = montarMesa(['andar-cantina'])
    fonte.start()
    mesa.definirContexto(contexto())
    mesa.definirContexto(contexto({ roomType: 'loja' }))
    assert.deepEqual(vozesAtivas(mesa), ['andar-cantina'])
    assert.ok(cache.pedidos.some(({ id, urgente }) => id === 'loja' && urgente))

    cache.prontas.add('loja')
    mesa.definirContexto(contexto({ roomType: 'loja', paused: true }))
    await new Promise((resolve) => setTimeout(resolve, 0))
    assert.deepEqual(vozesAtivas(mesa), ['loja'])
  })

  test('recomeçar com R com a Cantina fora do cache: a faixa da run anterior sai e a Cantina entra quando ficar pronta', () => {
    const { mesa, cache, audio, fonte } = montarMesa(['andar-cucina'])
    cache.preparar = () => new Promise(() => {}) // o worker ainda está gerando a Cantina: o pedido não responde
    fonte.start()
    mesa.definirContexto(contexto({ floorNumber: 2 }))
    assert.deepEqual(vozesAtivas(mesa), ['andar-cucina'])

    mesa.definirContexto(contexto({ seed: 7 }))
    assert.deepEqual(vozesAtivas(mesa), [], 'a faixa da run anterior não segue tocando por cima da run nova')

    cache.prontas.add('andar-cantina')
    mesa.definirContexto(contexto({ seed: 7, paused: true }))
    assert.deepEqual(vozesAtivas(mesa), ['andar-cantina'])
    assert.equal(audio.fontes.at(-1).inicio.offset, 0)
  })

  test('prepara a do próximo andar durante o andar atual', () => {
    const { mesa, cache, fonte } = montarMesa()
    fonte.start()
    mesa.definirContexto(contexto())
    assert.ok(cache.pedidos.some(({ id }) => id === 'andar-cucina'))
  })

  test('uma fonte antiga parando no fim do fade não derruba a música nova', () => {
    const { mesa, audio, fonte } = montarMesa()
    fonte.start()
    mesa.definirContexto(contexto())
    let terminou = false
    fonte.onended = () => { terminou = true }

    const nova = mesa.criarFonte(audio)
    nova.connect(criarNo())
    nova.start()
    fonte.stop()
    assert.equal(terminou, true)
    assert.deepEqual(vozesAtivas(mesa), ['andar-cantina'])

    nova.stop()
    assert.deepEqual(mesa.estado().vozes, [])
  })

  test('funciona como música registrada no AudioManager (o volume das Opções vem depois)', async () => {
    const cache = criarCacheFalso(new Set(['andar-cantina']))
    const mesa = criarMesaDoJogo({ cache })
    const audio = { ...criarContextoFalso(), state: 'running', destination: criarNo() }
    const manager = new AudioManager({ createContext: () => audio })
    manager.registerMusic('musica-do-jogo', (context) => mesa.criarFonte(context), { reverb: 0 })
    assert.equal(manager.playMusic('musica-do-jogo', { fadeMs: 0 }).played, true)
    mesa.definirContexto(contexto())
    assert.deepEqual(vozesAtivas(mesa), ['andar-cantina'])
    // O AudioManager para a fonte no fim do fade (num setTimeout, mesmo com 0 ms)
    manager.stopMusic({ fadeMs: 0 })
    await new Promise((resolve) => setTimeout(resolve, 5))
    assert.deepEqual(mesa.estado().vozes, [])
    manager.destroy()
  })
})

describe('cache das faixas', () => {
  const canais = () => [new Float32Array(8), new Float32Array(8)]

  test('guarda no máximo 6 faixas (o limite padrão) e solta a usada há mais tempo', async () => {
    const cache = criarCacheDeFaixas({ renderizar: async () => canais() })
    for (const id of ['a', 'b', 'c', 'd', 'e', 'f']) await cache.preparar(id)
    await cache.preparar('a') // "a" volta a ser a mais recente
    await cache.preparar('g')
    assert.deepEqual(cache.ids().sort(), ['a', 'c', 'd', 'e', 'f', 'g'])
    assert.equal(cache.tamanho, 6)
  })

  test('o limite pode ser menor (3): sai a usada há mais tempo', async () => {
    const cache = criarCacheDeFaixas({ renderizar: async () => canais(), limite: 3 })
    await cache.preparar('a')
    await cache.preparar('b')
    await cache.preparar('c')
    await cache.preparar('a')
    await cache.preparar('d')
    assert.deepEqual(cache.ids().sort(), ['a', 'c', 'd'])
  })

  test('gera uma faixa de cada vez, com a urgente na frente da fila', async () => {
    const ordem = []
    let emAndamento = 0
    let maximo = 0
    const cache = criarCacheDeFaixas({
      renderizar: async (id) => {
        emAndamento += 1
        maximo = Math.max(maximo, emAndamento)
        ordem.push(id)
        await new Promise((resolve) => setTimeout(resolve, 1))
        emAndamento -= 1
        return canais()
      },
    })
    const pedidos = [cache.preparar('a'), cache.preparar('b'), cache.preparar('c', { urgente: true })]
    await Promise.all(pedidos)
    assert.equal(maximo, 1)
    assert.deepEqual(ordem, ['a', 'c', 'b'])
  })

  test('cria o AudioBuffer uma vez e solta os canais', async () => {
    const cache = criarCacheDeFaixas({ renderizar: async () => canais() })
    await cache.preparar('a')
    const audio = criarContextoFalso()
    const buffer = cache.obterBuffer('a', audio)
    assert.ok(buffer)
    assert.equal(cache.obterBuffer('a', audio), buffer)
    assert.equal(buffer.length, 8)
  })

  test('falha ao gerar: a faixa sai do cache e pode ser pedida de novo', async () => {
    let tentativas = 0
    const avisoOriginal = console.warn
    console.warn = () => {}
    try {
      const cache = criarCacheDeFaixas({
        renderizar: async () => {
          tentativas += 1
          if (tentativas === 1) throw new Error('worker caiu')
          return canais()
        },
      })
      assert.equal(await cache.preparar('a'), false)
      assert.equal(cache.estaPronta('a'), false)
      assert.equal(await cache.preparar('a'), true)
    } finally {
      console.warn = avisoOriginal
    }
  })
})

describe('montagem do AudioBuffer em pedaços', () => {
  test('copia os dois canais aos poucos, sem perder amostra', async () => {
    const original = globalThis.AudioBuffer
    class AudioBufferFalso {
      constructor({ length, numberOfChannels }) {
        this.length = length
        this.dados = Array.from({ length: numberOfChannels }, () => new Float32Array(length))
        this.copias = 0
      }
      copyToChannel(origem, canal, inicio) {
        this.dados[canal].set(origem, inicio)
        this.copias += 1
      }
    }
    globalThis.AudioBuffer = AudioBufferFalso
    try {
      const esquerdo = Float32Array.from({ length: 10 }, (_, i) => i)
      const direito = Float32Array.from({ length: 10 }, (_, i) => -i)
      const buffer = await montarBufferAosPoucos([esquerdo, direito], 44100, { pedaco: 3, agendar: (tarefa) => setTimeout(tarefa, 0) })
      assert.deepEqual([...buffer.dados[0]], [...esquerdo])
      assert.deepEqual([...buffer.dados[1]], [...direito])
      assert.equal(buffer.copias, 8) // 4 pedaços × 2 canais
    } finally {
      globalThis.AudioBuffer = original
    }
  })

  test('sem new AudioBuffer (Node), não monta nada e o cache monta na hora de tocar', async () => {
    assert.equal(await montarBufferAosPoucos([new Float32Array(4), new Float32Array(4)], 44100), null)
  })
})

describe('registro das faixas', () => {
  test('a reverb da Vila no registro é a mesma do arquivo da Vila', () => {
    assert.equal(FAIXAS['a-vila-espera'].reverb, VILA_ESPERA_META.reverb)
    assert.equal(VILA_ESPERA_MUSIC_OPTIONS.reverb, VILA_ESPERA_META.reverb)
  })
})
