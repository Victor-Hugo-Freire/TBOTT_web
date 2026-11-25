import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { AudioManager } from '../src/audio/AudioManager.js'

function createSource() {
  return {
    onended: null,
    startCalls: 0,
    stopCalls: 0,
    connectedTo: null,
    connect(node) { this.connectedTo = node },
    disconnect() {},
    start() { this.startCalls += 1 },
    stop() {
      this.stopCalls += 1
      if (typeof this.onended === 'function') this.onended()
    },
  }
}

function createFakeContext({ state = 'running', resumeError = false } = {}) {
  const context = {
    state,
    destination: { name: 'destination' },
    currentTime: 0,
    closeCalls: 0,
    resumeCalls: 0,
    createGainCalls: 0,
    createGain() {
      this.createGainCalls += 1
      return {
        value: 1,
        gain: {
          value: 1,
          cancelScheduledValues() {},
          setValueAtTime(value) { this.value = value },
          linearRampToValueAtTime(value) { this.value = value },
        },
        connect() {},
        disconnect() {},
      }
    },
    async resume() {
      this.resumeCalls += 1
      if (resumeError) throw new Error('resume bloqueado')
      this.state = 'running'
    },
    async close() {
      this.closeCalls += 1
      this.state = 'closed'
    },
  }
  return context
}

function createManager(contextOptions = {}, managerOptions = {}) {
  const context = createFakeContext(contextOptions)
  let createCalls = 0
  const manager = new AudioManager({
    createContext: () => {
      createCalls += 1
      return context
    },
    now: managerOptions.now || (() => 1000),
    fallbackOptions: {
      effectsVolume: 80,
      musicVolume: 70,
      ...managerOptions.fallbackOptions,
    },
  })
  return { manager, context, getCreateCalls: () => createCalls }
}

describe('AudioManager', () => {
  test('cria um único contexto e desbloqueia somente sob interação', async () => {
    const { manager, context, getCreateCalls } = createManager({ state: 'suspended' })

    assert.equal(getCreateCalls(), 0)
    assert.equal(manager.state, 'idle')

    const first = await manager.unlock()
    assert.deepEqual(first, { unlocked: true, reason: 'resumed' })
    assert.equal(context.resumeCalls, 1)
    assert.equal(getCreateCalls(), 1)
    assert.equal(manager.state, 'ready')

    const second = await manager.unlock()
    assert.equal(second.unlocked, true)
    assert.equal(context.resumeCalls, 1)
  })

  test('trata falha de resume sem criação duplicada', async () => {
    const { manager, getCreateCalls } = createManager({ state: 'suspended', resumeError: true })

    const result = await manager.unlock()
    assert.deepEqual(result, { unlocked: false, reason: 'blocked' })
    assert.equal(manager.state, 'blocked')
    assert.equal(getCreateCalls(), 1)
  })

  test('trata navegador sem suporte e falha de contexto', async () => {
    const manager = new AudioManager({ createContext: () => { throw new Error('sem suporte') } })

    assert.deepEqual(await manager.unlock(), { unlocked: false, reason: 'unsupported' })
    assert.equal(manager.state, 'failed')
  })

  test('registra e reproduz efeitos pelo nome', () => {
    const { manager, context } = createManager()
    const source = createSource()

    manager.registerEffect('test', () => source)
    const result = manager.playEffect('test')

    assert.equal(result.played, true)
    assert.equal(source.startCalls, 1)
    // master, efeitos, música, entrada do barramento de música e a voz do efeito
    assert.equal(context.createGainCalls, 5)
  })

  test('solicitação de efeito inexistente é segura', () => {
    const { manager } = createManager()
    assert.deepEqual(manager.playEffect('ausente'), { played: false, reason: 'unknown-effect' })
  })

  test('controle rápido respeita cooldown e limite de vozes', () => {
    let time = 100
    const { manager } = createManager({}, { now: () => time })
    manager.registerEffect('hit', () => createSource(), { maxVoices: 2, cooldownMs: 250 })

    assert.equal(manager.playEffect('hit').played, true)
    assert.equal(manager.playEffect('hit').reason, 'cooldown')

    time = 350
    assert.equal(manager.playEffect('hit').played, true)

    time = 600
    const limited = manager.playEffect('hit')
    assert.equal(limited.played, false)
    assert.equal(limited.reason, 'voice-limit')
  })

  test('remove vozes ao terminar e permite stopEffect', () => {
    const { manager } = createManager()
    const source = createSource()
    manager.registerEffect('hit', () => source)

    assert.equal(manager.playEffect('hit').played, true)
    manager.stopEffect('hit')
    assert.equal(source.stopCalls, 1)
  })

  test('registra, troca e interrompe músicas sem repetição simultânea', () => {
    const { manager } = createManager()
    const first = createSource()
    const second = createSource()
    manager.registerMusic('primeira', () => first)
    manager.registerMusic('segunda', () => second)

    assert.equal(manager.playMusic('primeira', { fadeMs: 0 }).played, true)
    assert.equal(manager.activeMusicName, 'primeira')

    assert.deepEqual(manager.playMusic('primeira'), { played: false, reason: 'already-playing' })
    assert.equal(manager.playMusic('segunda', { fadeMs: 0 }).played, true)
    assert.equal(manager.activeMusicName, 'segunda')

    manager.stopMusic({ fadeMs: 0 })
    assert.equal(manager.activeMusicName, null)
  })

  test('música inexistente é rejeitada sem alterar música atual', () => {
    const { manager } = createManager()
    assert.deepEqual(manager.playMusic('ausente'), { played: false, reason: 'unknown-music' })
  })

  test('volumes são independentes, normalizados e mute é master', () => {
    const { manager } = createManager()

    manager.unlock()
    manager.setEffectsVolume(150)
    manager.setMusicVolume(-10)
    assert.equal(manager.effectsVolume, 100)
    assert.equal(manager.musicVolume, 0)

    manager.setEffectsVolume(25)
    assert.equal(manager.effectsVolume, 25)
    assert.equal(manager.musicVolume, 0)

    manager.setMusicVolume(63)
    manager._effectsVolume = undefined
    assert.equal(manager.musicVolume, 63)

    assert.equal(manager.toggleMute(), true)
    assert.equal(manager.muted, true)
    assert.equal(manager.toggleMute(), false)
  })

  test('destrói recursos e fecha o contexto uma única vez', async () => {
    const { manager, context } = createManager()
    const source = createSource()
    manager.registerEffect('hit', () => source)

    await manager.unlock()
    manager.playEffect('hit')
    manager.destroy()
    manager.destroy()

    assert.equal(manager.state, 'destroyed')
    assert.equal(context.closeCalls, 1)
    assert.equal(source.stopCalls, 1)
  })

  test('monta a cadeia do master e envia a música para a reverb quando há suporte', () => {
    const { manager, context } = createManager()
    const created = []
    const node = (kind, extra = {}) => {
      const item = { kind, connections: [], connect(target) { this.connections.push(target) }, disconnect() {}, ...extra }
      created.push(item)
      return item
    }
    const param = () => ({ value: 0 })
    const originalCreateGain = context.createGain.bind(context)
    context.sampleRate = 8000
    context.createGain = () => {
      const gain = originalCreateGain()
      gain.kind = 'gain'
      gain.connections = []
      gain.connect = (target) => { gain.connections.push(target) }
      created.push(gain)
      return gain
    }
    context.createBiquadFilter = () => node('filtro', { type: '', frequency: param() })
    context.createDynamicsCompressor = () => node('compressor', {
      threshold: param(), knee: param(), ratio: param(), attack: param(), release: param(),
    })
    context.createConvolver = () => node('reverb', { buffer: null, normalize: true })
    context.createBuffer = (channels, length) => {
      const data = Array.from({ length: channels }, () => new Float32Array(length))
      return { getChannelData: (index) => data[index] }
    }

    manager.registerMusic('faixa', () => createSource(), { reverb: 0.2 })
    assert.equal(manager.playMusic('faixa', { fadeMs: 0 }).played, true)

    const filtros = created.filter((item) => item.kind === 'filtro')
    assert.deepEqual(filtros.map((item) => item.type), ['highpass', 'lowpass'])
    const reverb = created.find((item) => item.kind === 'reverb')
    assert.equal(reverb.normalize, false)
    assert.ok(reverb.buffer)
    const envio = created.find((item) => item.kind === 'gain' && item.connections.includes(reverb))
    assert.equal(envio.gain.value, 0.2)
  })

  test('destroy impede reprodução posterior', () => {
    const { manager } = createManager()
    manager.registerEffect('hit', () => createSource())
    manager.destroy()

    assert.deepEqual(manager.playEffect('hit'), { played: false, reason: 'audio-unavailable' })
  })
})
