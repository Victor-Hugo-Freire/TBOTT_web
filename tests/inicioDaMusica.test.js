import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { AudioManager } from '../src/audio/AudioManager.js'
import { MUSICA_DO_JOGO, shouldStartGameMusic } from '../src/audio/music/mesaDoJogo.js'
import { shouldStartVilaEspera, VILA_ESPERA_MUSIC_NAME } from '../src/data/vilaEsperaMusic.js'

describe('quando cada música começa (sem pedir gesto além do primeiro)', () => {
  test('a Vila começa sozinha em qualquer tela fora de /jogo, assim que o áudio está destravado', () => {
    for (const pathname of ['/', '/entrar', '/menu', '/ranking', '/opcoes', '/selecao-personagem']) {
      assert.equal(shouldStartVilaEspera({ pathname, audioState: 'ready', activeMusicName: null }), true, pathname)
    }
    // Ao voltar do jogo, a música do jogo ainda está saindo: a Vila entra por cima (crossfade)
    assert.equal(shouldStartVilaEspera({ pathname: '/menu', audioState: 'ready', activeMusicName: MUSICA_DO_JOGO }), true)
  })

  test('a Vila espera o primeiro gesto depois de abrir a página e não recomeça se já está tocando', () => {
    for (const audioState of ['idle', 'initializing', 'blocked', 'failed', 'destroyed']) {
      assert.equal(shouldStartVilaEspera({ pathname: '/menu', audioState, activeMusicName: null }), false, audioState)
    }
    assert.equal(shouldStartVilaEspera({ pathname: '/menu', audioState: 'ready', activeMusicName: VILA_ESPERA_MUSIC_NAME }), false)
    assert.equal(shouldStartVilaEspera({ pathname: '/jogo', audioState: 'ready', activeMusicName: null }), false)
  })

  test('a música do jogo começa sozinha em /jogo com o áudio destravado', () => {
    assert.equal(shouldStartGameMusic({ pathname: '/jogo', audioState: 'ready', activeMusicName: null }), true)
    assert.equal(shouldStartGameMusic({ pathname: '/jogo', audioState: 'ready', activeMusicName: VILA_ESPERA_MUSIC_NAME }), true)
    assert.equal(shouldStartGameMusic({ pathname: '/jogo', audioState: 'ready', activeMusicName: MUSICA_DO_JOGO }), false)
    assert.equal(shouldStartGameMusic({ pathname: '/jogo', audioState: 'idle', activeMusicName: null }), false)
    assert.equal(shouldStartGameMusic({ pathname: '/menu', audioState: 'ready', activeMusicName: null }), false)
  })
})

function criarContexto() {
  const ganhos = []
  return {
    state: 'running',
    currentTime: 2,
    destination: {},
    ganhos,
    createGain() {
      const ganho = {
        gain: {
          value: 1,
          eventos: [],
          cancelScheduledValues() {},
          setValueAtTime(valor, tempo) { this.eventos.push(['set', valor, tempo]) },
          linearRampToValueAtTime(valor, tempo) { this.eventos.push(['rampa', valor, tempo]) },
        },
        connect() {},
        disconnect() {},
      }
      ganhos.push(ganho)
      return ganho
    },
  }
}

function criarFonte() {
  return { onended: null, connect() {}, disconnect() {}, start() {}, stop() { this.onended?.() } }
}

describe('AudioManager: entrada com fade e parada pelo nome', () => {
  test('fadeInMs faz a música subir de 0 a 1', () => {
    const contexto = criarContexto()
    const manager = new AudioManager({ createContext: () => contexto })
    manager.registerMusic('faixa', () => criarFonte())
    assert.equal(manager.playMusic('faixa', { fadeMs: 0, fadeInMs: 1000 }).played, true)
    const ganhoDaFonte = contexto.ganhos.at(-1)
    assert.deepEqual(ganhoDaFonte.gain.eventos, [['set', 0, 2], ['rampa', 1, 3]])
  })

  test('sem fadeInMs, a música entra cheia (como antes)', () => {
    const contexto = criarContexto()
    const manager = new AudioManager({ createContext: () => contexto })
    manager.registerMusic('faixa', () => criarFonte())
    manager.playMusic('faixa', { fadeMs: 0 })
    const ganhoDaFonte = contexto.ganhos.at(-1)
    assert.equal(ganhoDaFonte.gain.value, 1)
    assert.deepEqual(ganhoDaFonte.gain.eventos, [])
  })

  test('stopMusic com nome só para a música desse nome', () => {
    const manager = new AudioManager({ createContext: () => criarContexto() })
    manager.registerMusic('vila', () => criarFonte())
    manager.registerMusic('jogo', () => criarFonte())
    manager.playMusic('vila', { fadeMs: 0 })
    manager.stopMusic({ fadeMs: 0, name: 'jogo' })
    assert.equal(manager.activeMusicName, 'vila')
    manager.stopMusic({ fadeMs: 0, name: 'vila' })
    assert.equal(manager.activeMusicName, null)
  })
})
