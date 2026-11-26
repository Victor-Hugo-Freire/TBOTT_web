import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import {
  VILA_ESPERA_MUSIC_NAME,
  shouldPlayVilaEsperaForPathname,
  createVilaEsperaAudioSource,
} from '../src/data/vilaEsperaMusic.js'
import { AudioManager } from '../src/audio/AudioManager.js'

function createContext() {
  return {
    state: 'running',
    currentTime: 0,
    sampleRate: 44100,
    createGain() {
      return {
        gain: {
          value: 1,
          cancelScheduledValues() {},
          setValueAtTime() {},
          linearRampToValueAtTime() {},
        },
        connect() {},
        disconnect() {},
      }
    },
    createBuffer(channelCount, length, sampleRate) {
      const channels = Array.from({ length: channelCount }, () => new Float32Array(length))
      return {
        length,
        sampleRate,
        getChannelData(index) { return channels[index] },
      }
    },
    createBufferSource() {
      return {
        buffer: null,
        loop: false,
        onended: null,
        connect() {},
        disconnect() {},
        start() {},
        stop() {},
      }
    },
    async resume() { this.state = 'running' },
    async close() { this.state = 'closed' },
  }
}

describe('trilha global Vila Espera', () => {
  test('somente /jogo exclui a trilha global', () => {
    assert.equal(shouldPlayVilaEsperaForPathname('/jogo'), false)
    assert.equal(shouldPlayVilaEsperaForPathname('/'), true)
    assert.equal(shouldPlayVilaEsperaForPathname('/menu'), true)
    assert.equal(shouldPlayVilaEsperaForPathname('/ranking'), true)
    assert.equal(shouldPlayVilaEsperaForPathname('/opcoes'), true)
  })

  test('a fonte criada para a trilha global fica em loop', () => {
    const source = createVilaEsperaAudioSource(createContext())
    assert.equal(source.loop, true)
  })

  test('não cria instância duplicada e interrompe ao sair da rota global', () => {
    const context = createContext()
    const manager = new AudioManager({ createContext: () => context })
    manager.registerMusic(VILA_ESPERA_MUSIC_NAME, createVilaEsperaAudioSource)

    assert.equal(manager.playMusic(VILA_ESPERA_MUSIC_NAME, { fadeMs: 0 }).played, true)
    assert.deepEqual(
      manager.playMusic(VILA_ESPERA_MUSIC_NAME, { fadeMs: 0 }),
      { played: false, reason: 'already-playing' },
    )

    manager.stopMusic({ fadeMs: 0 })
    assert.equal(manager.activeMusicName, null)

    assert.equal(manager.playMusic(VILA_ESPERA_MUSIC_NAME, { fadeMs: 0 }).played, true)
    assert.equal(manager.activeMusicName, VILA_ESPERA_MUSIC_NAME)
  })
})
