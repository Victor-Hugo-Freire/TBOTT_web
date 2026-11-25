import { CADEIA_DO_MASTER, criarRespostaDeSala } from './masterizacao.js'

const DEFAULT_EFFECT_VOLUME = 80
const DEFAULT_MUSIC_VOLUME = 70
const DEFAULT_FADE_MS = 180

function normalizeVolume(value, fallback) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  return Math.min(100, Math.max(0, value))
}

function normalizeOptions(options) {
  if (!options || typeof options !== 'object') return {}
  return {
    maxVoices: Number.isInteger(options.maxVoices) && options.maxVoices > 0
      ? options.maxVoices
      : 8,
    cooldownMs: typeof options.cooldownMs === 'number' && Number.isFinite(options.cooldownMs)
      ? Math.max(0, options.cooldownMs)
      : 0,
  }
}

export class AudioManager {
  constructor({ createContext, now = () => performance.now(), fallbackOptions } = {}) {
    this._createContext = createContext || (() => {
      const AudioContextConstructor = globalThis.AudioContext || globalThis.webkitAudioContext
      if (!AudioContextConstructor) throw new Error('Este navegador não suporta Web Audio API.')
      return new AudioContextConstructor()
    })
    this._now = now
    this._context = null
    this._masterGain = null
    this._effectsGain = null
    this._musicGain = null
    this._musicBus = null
    this._reverb = null
    this._state = 'idle'
    this._unlockPromise = null
    this._effects = new Map()
    this._music = new Map()
    this._effectVoices = new Map()
    this._effectCooldowns = new Map()
    this._activeMusicName = null
    this._musicSource = null
    this._musicGainNode = null
    this._musicSendNode = null
    this._fadeTimers = new Set()
    this._muted = false
    this._destroyed = false

    const options = fallbackOptions || {}
    this._effectsVolume = normalizeVolume(options.effectsVolume, DEFAULT_EFFECT_VOLUME)
    this._musicVolume = normalizeVolume(options.musicVolume, DEFAULT_MUSIC_VOLUME)
  }

  get state() {
    return this._state
  }

  get muted() {
    return this._muted
  }

  get activeMusicName() {
    return this._activeMusicName
  }

  get musicVolume() {
    return this._musicVolume === undefined ? DEFAULT_MUSIC_VOLUME : this._musicVolume
  }

  get effectsVolume() {
    return this._effectsVolume
  }

  registerEffect(name, createSource, options = {}) {
    if (typeof name !== 'string' || !name.trim()) throw new TypeError('O nome do efeito é obrigatório.')
    if (typeof createSource !== 'function') throw new TypeError('O efeito deve informar uma função criadora.')
    this._effects.set(name, { createSource, ...normalizeOptions(options) })
  }

  // reverb: quanto da faixa vai para a sala do master (0 a 1)
  registerMusic(name, createSource, { reverb = CADEIA_DO_MASTER.reverbPadrao } = {}) {
    if (typeof name !== 'string' || !name.trim()) throw new TypeError('O nome da música é obrigatório.')
    if (typeof createSource !== 'function') throw new TypeError('A música deve informar uma função criadora.')
    const mix = typeof reverb === 'number' && Number.isFinite(reverb) ? Math.min(1, Math.max(0, reverb)) : CADEIA_DO_MASTER.reverbPadrao
    this._music.set(name, { createSource, reverb: mix })
  }

  unregisterEffect(name) {
    this.stopEffect(name)
    this._effects.delete(name)
  }

  unregisterMusic(name) {
    if (this._activeMusicName === name) this.stopMusic()
    this._music.delete(name)
  }

  _ensureContext() {
    if (this._destroyed) return null
    if (this._context && this._context.state !== 'closed') return this._context

    try {
      this._context = this._createContext()
      if (!this._context) throw new Error('Não foi possível criar o contexto de áudio.')

      this._masterGain = this._context.createGain()
      this._effectsGain = this._context.createGain()
      this._musicGain = this._context.createGain()
      this._masterGain.gain.value = this._muted ? 0 : 1
      this._effectsGain.gain.value = this._effectsVolume / 100
      this._musicGain.gain.value = this._musicVolume / 100
      this._effectsGain.connect(this._masterGain)
      this._musicGain.connect(this._masterGain)
      this._masterGain.connect(this._context.destination)
      this._createMusicChain(this._context)
      this._state = 'ready'
      return this._context
    } catch {
      this._context = null
      this._masterGain = null
      this._effectsGain = null
      this._musicGain = null
      this._state = 'failed'
      return null
    }
  }

  // Cadeia do master da música, montada uma vez e usada por todas as faixas:
  // entrada → passa-alta → passa-baixa → compressor → ganho de saída → volume de música.
  // Cada faixa também manda um pouco de si para a reverb de sala, que volta na entrada.
  // Sem suporte a algum desses nós (navegador antigo, testes), a entrada vai direto ao volume.
  _createMusicChain(context) {
    const input = context.createGain()
    this._musicBus = input
    this._reverb = null

    const supported = ['createBiquadFilter', 'createDynamicsCompressor', 'createConvolver', 'createBuffer']
      .every((method) => typeof context[method] === 'function')
    if (!supported) {
      input.connect(this._musicGain)
      return
    }

    try {
      const highpass = context.createBiquadFilter()
      highpass.type = 'highpass'
      highpass.frequency.value = CADEIA_DO_MASTER.passaAltaHz
      const lowpass = context.createBiquadFilter()
      lowpass.type = 'lowpass'
      lowpass.frequency.value = CADEIA_DO_MASTER.passaBaixaHz

      const compressor = context.createDynamicsCompressor()
      for (const [parameter, value] of Object.entries(CADEIA_DO_MASTER.compressor)) {
        compressor[parameter].value = value
      }
      const output = context.createGain()
      output.gain.value = CADEIA_DO_MASTER.ganhoDeSaida

      const sampleRate = context.sampleRate || 44100
      const impulse = criarRespostaDeSala(sampleRate)
      const buffer = context.createBuffer(2, impulse[0].length, sampleRate)
      buffer.getChannelData(0).set(impulse[0])
      buffer.getChannelData(1).set(impulse[1])
      const reverb = context.createConvolver()
      reverb.normalize = false
      reverb.buffer = buffer

      input.connect(highpass)
      highpass.connect(lowpass)
      lowpass.connect(compressor)
      compressor.connect(output)
      output.connect(this._musicGain)
      reverb.connect(input)
      this._reverb = reverb
    } catch {
      try { input.disconnect() } catch { /* ainda sem ligações */ }
      input.connect(this._musicGain)
      this._reverb = null
    }
  }

  async unlock() {
    if (this._destroyed) return { unlocked: false, reason: 'destroyed' }
    if (this._unlockPromise) return this._unlockPromise

    this._unlockPromise = (async () => {
      const context = this._ensureContext()
      if (!context) return { unlocked: false, reason: 'unsupported' }

      if (context.state === 'running') {
        this._state = 'ready'
        return { unlocked: true, reason: 'running' }
      }

      this._state = 'initializing'
      try {
        if (typeof context.resume === 'function') await context.resume()
        const unlocked = context.state === 'running'
        this._state = unlocked ? 'ready' : 'blocked'
        return { unlocked, reason: unlocked ? 'resumed' : 'blocked' }
      } catch {
        this._state = 'blocked'
        return { unlocked: false, reason: 'blocked' }
      }
    })()

    const result = await this._unlockPromise
    this._unlockPromise = null
    return result
  }

  setEffectsVolume(value) {
    this._effectsVolume = normalizeVolume(value, this._effectsVolume)
    if (this._effectsGain) this._effectsGain.gain.value = this._effectsVolume / 100
  }

  setMusicVolume(value) {
    this._musicVolume = normalizeVolume(value, this._musicVolume)
    if (this._musicGain) this._musicGain.gain.value = this._musicVolume / 100
  }

  setMuted(muted) {
    this._muted = Boolean(muted)
    if (this._masterGain) this._masterGain.gain.value = this._muted ? 0 : 1
  }

  toggleMute() {
    this.setMuted(!this._muted)
    return this._muted
  }

  playEffect(name) {
    const registration = this._effects.get(name)
    if (!registration) return { played: false, reason: 'unknown-effect' }

    const context = this._ensureContext()
    if (!context || context.state === 'closed') return { played: false, reason: 'audio-unavailable' }

    const now = this._now()
    const lastPlayed = this._effectCooldowns.get(name) || -Infinity
    if (now - lastPlayed < registration.cooldownMs) return { played: false, reason: 'cooldown' }

    const voices = this._effectVoices.get(name) || new Set()
    if (voices.size >= registration.maxVoices) return { played: false, reason: 'voice-limit' }

    try {
      const source = registration.createSource(context)
      if (!source) return { played: false, reason: 'source-unavailable' }

      const voiceGain = context.createGain()
      voiceGain.gain.value = 1
      source.connect(voiceGain)
      voiceGain.connect(this._effectsGain)

      let cleaned = false
      const cleanup = () => {
        if (cleaned) return
        cleaned = true
        voices.delete(voice)
        if (voices.size === 0) this._effectVoices.delete(name)
        try { voiceGain.disconnect() } catch { /* node já desconectado */ }
      }

      const voice = { source, gain: voiceGain, cleanup }
      voices.add(voice)
      this._effectVoices.set(name, voices)
      this._effectCooldowns.set(name, now)

      if (typeof source.addEventListener === 'function') {
        source.addEventListener('ended', cleanup, { once: true })
      } else if ('onended' in source) {
        const previous = source.onended
        source.onended = (event) => {
          if (typeof previous === 'function') previous.call(source, event)
          cleanup()
        }
      }

      source.start()
      return { played: true, reason: 'playing' }
    } catch {
      return { played: false, reason: 'source-error' }
    }
  }

  stopEffect(name) {
    const voices = this._effectVoices.get(name)
    if (!voices) return
    for (const voice of [...voices]) {
      try { voice.source.stop() } catch { /* já interrompido */ }
      voice.cleanup()
    }
  }

  stopAllEffects() {
    for (const voices of this._effectVoices.values()) {
      for (const voice of [...voices]) {
        try { voice.source.stop() } catch { /* já interrompido */ }
        voice.cleanup()
      }
    }
  }

  playMusic(name, { fadeMs = DEFAULT_FADE_MS } = {}) {
    if (this._activeMusicName === name && this._musicSource) {
      return { played: false, reason: 'already-playing' }
    }

    const registration = this._music.get(name)
    if (!registration) return { played: false, reason: 'unknown-music' }

    const context = this._ensureContext()
    if (!context || context.state === 'closed') return { played: false, reason: 'audio-unavailable' }

    try {
      const previousSource = this._musicSource
      const previousGain = this._musicGainNode
      const previousSend = this._musicSendNode
      if (previousSource) this._stopMusicSource(previousSource, previousGain, fadeMs, previousSend)

      const source = registration.createSource(context)
      if (!source) return { played: false, reason: 'source-unavailable' }

      const sourceGain = context.createGain()
      sourceGain.gain.value = 1
      source.connect(sourceGain)
      sourceGain.connect(this._musicBus || this._musicGain)

      // Envio para a sala: sai depois do ganho da faixa, então o fade leva a reverb junto
      let send = null
      if (this._reverb && registration.reverb > 0) {
        send = context.createGain()
        send.gain.value = registration.reverb
        sourceGain.connect(send)
        send.connect(this._reverb)
      }

      this._activeMusicName = name
      this._musicSource = source
      this._musicGainNode = sourceGain
      this._musicSendNode = send

      source.onended = () => {
        if (this._musicSource === source) {
          this._musicSource = null
          this._musicGainNode = null
          this._musicSendNode = null
          this._activeMusicName = null
        }
        try { sourceGain.disconnect() } catch { /* node já desconectado */ }
        try { send?.disconnect() } catch { /* node já desconectado */ }
      }

      source.start()
      return { played: true, reason: 'playing' }
    } catch {
      return { played: false, reason: 'source-error' }
    }
  }

  _stopMusicSource(source, sourceGain, fadeMs, send = null) {
    if (!source) return

    if (sourceGain && typeof sourceGain.gain.cancelScheduledValues === 'function') {
      const now = this._context.currentTime
      const duration = Math.max(0, fadeMs) / 1000
      sourceGain.gain.cancelScheduledValues(now)
      sourceGain.gain.setValueAtTime(sourceGain.gain.value, now)
      if (duration > 0) {
        sourceGain.gain.linearRampToValueAtTime(0, now + duration)
      } else {
        sourceGain.gain.value = 0
      }
      const timer = this._context ? setTimeout(() => {
        this._fadeTimers.delete(timer)
        try { source.stop() } catch { /* já interrompido */ }
        try { sourceGain.disconnect() } catch { /* já desconectado */ }
        try { send?.disconnect() } catch { /* já desconectado */ }
      }, Math.max(0, fadeMs)) : null
      if (timer) this._fadeTimers.add(timer)
      return
    }

    try { source.stop() } catch { /* já interrompido */ }
    try { send?.disconnect() } catch { /* já desconectado */ }
  }

  stopMusic({ fadeMs = DEFAULT_FADE_MS } = {}) {
    if (!this._musicSource) {
      this._activeMusicName = null
      this._musicGainNode = null
      return
    }

    const source = this._musicSource
    const sourceGain = this._musicGainNode
    const send = this._musicSendNode
    this._musicSource = null
    this._musicGainNode = null
    this._musicSendNode = null
    this._activeMusicName = null
    this._stopMusicSource(source, sourceGain, fadeMs, send)
  }

  destroy() {
    if (this._destroyed) return
    this._destroyed = true
    this.stopAllEffects()

    for (const timer of this._fadeTimers) clearTimeout(timer)
    this._fadeTimers.clear()

    if (this._musicSource) {
      try { this._musicSource.stop() } catch { /* já interrompido */ }
    }

    this._musicSource = null
    this._musicGainNode = null
    this._musicSendNode = null
    this._activeMusicName = null

    try { this._musicBus?.disconnect() } catch { /* já desconectado */ }
    try { this._reverb?.disconnect() } catch { /* já desconectado */ }
    try { this._masterGain?.disconnect() } catch { /* já desconectado */ }
    try { this._effectsGain?.disconnect() } catch { /* já desconectado */ }
    try { this._musicGain?.disconnect() } catch { /* já desconectado */ }

    if (this._context && this._context.state !== 'closed') {
      try {
        const closing = this._context.close()
        if (closing?.catch) closing.catch(() => {})
      } catch { /* contexto já fechado */ }
    }

    this._context = null
    this._masterGain = null
    this._effectsGain = null
    this._musicGain = null
    this._musicBus = null
    this._reverb = null
    this._state = 'destroyed'
  }
}

export function createAudioManager(options) {
  return new AudioManager(options)
}
