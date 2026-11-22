import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import {
  createZzfxAudioSource,
  generateZzfxSamples,
  validateZzfxSamples,
} from '../src/audio/zzfxExperimental.js'
import {
  createZzfxmAudioSource,
  generateZzfxMusicSamples,
  validateZzfxmChannels,
} from '../src/audio/zzfxmExperimental.js'
import {
  AudioManager,
} from '../src/audio/AudioManager.js'
import {
  ZZFX_ATTACK,
  ZZFX_DAMAGE,
  ZZFX_COLLECT,
  ZZFX_INTERFACE,
  ZZFXM_EXPERIMENTAL_SONG,
} from '../src/data/zzfxExperimentalPresets.js'

function createFakeContext() {
  return {
    sampleRate: 44100,
    createBuffer(channelCount, length, sampleRate) {
      const channels = Array.from({ length: channelCount }, () => new Float32Array(length))
      return {
        length,
        sampleRate,
        numberOfChannels: channelCount,
        getChannelData(index) { return channels[index] },
      }
    },
    createBufferSource() {
      return {
        buffer: null,
        connect() {},
        start() {},
        stop() {},
        addEventListener() {},
      }
    },
  }
}

describe('ZzFX experimental', () => {
  test('gera samples finitos e não vazios para três efeitos distintos', () => {
    const attack = generateZzfxSamples(ZZFX_ATTACK)
    const damage = generateZzfxSamples(ZZFX_DAMAGE)
    const collect = generateZzfxSamples(ZZFX_COLLECT)

    assert.equal(validateZzfxSamples(attack), true)
    assert.equal(validateZzfxSamples(damage), true)
    assert.equal(validateZzfxSamples(collect), true)
    assert.ok(attack.length > 0)
    assert.ok(damage.length > 0)
    assert.ok(collect.length > 0)

    const lengths = [attack.length, damage.length, collect.length]
    assert.equal(new Set(lengths).size, 3)
  })

  test('o preset de interface produz uma onda distinta e curta', () => {
    const interfaceSamples = generateZzfxSamples(ZZFX_INTERFACE)
    assert.equal(validateZzfxSamples(interfaceSamples), true)
    assert.ok(interfaceSamples.length < generateZzfxSamples(ZZFX_DAMAGE).length)
  })

  test('não considera válidas amostras produzidas por parâmetros inválidos', () => {
    const samples = generateZzfxSamples([NaN, NaN, NaN, NaN, NaN, NaN])
    assert.equal(validateZzfxSamples(samples), false)
  })

  test('usa o AudioContext fornecido e cria uma única fonte de buffer', () => {
    let createBufferCalls = 0
    let createSourceCalls = 0
    const context = createFakeContext()
    const originalCreateBuffer = context.createBuffer
    const originalCreateSource = context.createBufferSource
    context.createBuffer = (...args) => {
      createBufferCalls++
      return originalCreateBuffer(...args)
    }
    context.createBufferSource = (...args) => {
      createSourceCalls++
      return originalCreateSource(...args)
    }

    const source = createZzfxAudioSource(context, ZZFX_ATTACK)
    assert.ok(source.buffer)
    assert.equal(createBufferCalls, 1)
    assert.equal(createSourceCalls, 1)
  })

  test('não cria um novo contexto no adaptador', () => {
    assert.equal(createZzfxAudioSource.length, 2)
    assert.throws(() => createZzfxAudioSource(null, ZZFX_ATTACK), /AudioContext/i)
  })

  test('gera samples reais com zzfx@1.4.0 sem chamar a reprodução', async () => {
    const createCalls = []
    globalThis.AudioContext = class FakeAudioContext {
      constructor() { createCalls.push('context') }
    }
    const { ZZFX } = await import('zzfx/ZzFX.js')
    const samples = ZZFX.buildSamples(...ZZFX_ATTACK)

    assert.ok(samples instanceof Float32Array)
    assert.ok(samples.length > 0)
    assert.equal(createCalls.length, 1)
    assert.equal(validateZzfxSamples(samples), true)
  })
})

describe('ZzFXM experimental', () => {
  test('gera dois canais finitos a partir do formato oficial da música', () => {
    const channels = generateZzfxMusicSamples(ZZFXM_EXPERIMENTAL_SONG)
    assert.equal(validateZzfxmChannels(channels), true)
    assert.equal(channels.length, 2)
    assert.ok(channels[0].length > 1000)
  })

  test('cria um AudioBuffer stereo no contexto existente', () => {
    const context = createFakeContext()
    const source = createZzfxmAudioSource(context, ZZFXM_EXPERIMENTAL_SONG)

    assert.equal(source.buffer.numberOfChannels, 2)
    assert.ok(source.buffer.length > 1000)
  })

  test('rejeita dados ZzFXM incompletos', () => {
    assert.throws(() => generateZzfxMusicSamples(null), /instrumentos/i)
  })
})

describe('integração simulada ZzFX/ZzFXM com AudioManager', () => {
  function createIntegratedContext() {
    return {
      state: 'running',
      destination: {},
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
          numberOfChannels: channelCount,
          getChannelData(index) { return channels[index] },
        }
      },
      createBufferSource() {
        return {
          buffer: null,
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

  test('reproduz efeito ZzFX pelo ganho de efeitos do gerenciador', () => {
    const context = createIntegratedContext()
    const manager = new AudioManager({ createContext: () => context })
    manager.registerEffect('zzfx-attack', (audioContext) => createZzfxAudioSource(audioContext, ZZFX_ATTACK))

    assert.equal(manager.playEffect('zzfx-attack').played, true)
    manager.setEffectsVolume(25)
    assert.equal(manager.effectsVolume, 25)
    manager.setMuted(true)
    assert.equal(manager.muted, true)
  })

  test('reproduz música ZzFXM pelo ganho de música e permite stop', () => {
    const context = createIntegratedContext()
    const manager = new AudioManager({ createContext: () => context })
    manager.registerMusic('zzfxm-song', (audioContext) => createZzfxmAudioSource(audioContext, ZZFXM_EXPERIMENTAL_SONG))

    assert.equal(manager.playMusic('zzfxm-song', { fadeMs: 0 }).played, true)
    assert.equal(manager.activeMusicName, 'zzfxm-song')
    manager.setMusicVolume(40)
    assert.equal(manager.musicVolume, 40)
    manager.stopMusic({ fadeMs: 0 })
    assert.equal(manager.activeMusicName, null)
  })

  test('destroy impede toda reprodução experimental posterior', () => {
    const context = createIntegratedContext()
    const manager = new AudioManager({ createContext: () => context })
    manager.registerEffect('zzfx-collect', (audioContext) => createZzfxAudioSource(audioContext, ZZFX_COLLECT))
    manager.destroy()

    assert.deepEqual(manager.playEffect('zzfx-collect'), { played: false, reason: 'audio-unavailable' })
  })
})
