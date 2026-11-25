// ZzFXM 2.0.3 song format adapter for the TBOTT experiment.
// ZzFXM: MIT, Copyright (c) 2020 Keith Clark.
// Original format: https://github.com/keithclark/ZzFXM

import { generateZzfxSamples, ZZFX_EXPERIMENTAL_SAMPLE_RATE } from './zzfxExperimental.js'

// Opções (extensões do TBOTT; sem elas o resultado é o do ZzFXM original):
// - loop: a cauda das notas que passa do fim do áudio é somada no começo, como
//   aconteceria se a música tocasse em ciclo. A emenda do loop fica contínua.
// - normalize: false deixa os canais sem normalizar (a masterização faz isso depois,
//   nos dois canais juntos, para não desequilibrar o estéreo).
export function generateZzfxMusicSamples(song, sampleRate = ZZFX_EXPERIMENTAL_SAMPLE_RATE, { loop = false, normalize = true } = {}) {
  if (!Array.isArray(song) || song.length < 3) {
    throw new TypeError('A música ZzFXM precisa dos instrumentos, padrões e sequência.')
  }

  const [instruments, patterns, sequence, bpm = 125] = song
  if (!Array.isArray(instruments) || !Array.isArray(patterns) || !Array.isArray(sequence) || !sequence.length) {
    throw new TypeError('Dados ZzFXM incompletos.')
  }

  const beatLength = sampleRate / bpm * 60 >> 2
  let totalLength = 0
  for (const patternIndex of sequence) {
    const pattern = patterns[patternIndex]
    if (!pattern?.length || !pattern[0]?.length) throw new Error('Padrão ZzFXM inválido.')
    totalLength += (pattern[0].length - 2) * beatLength
  }

  const left = new Float32Array(totalLength)
  const right = new Float32Array(totalLength)
  let offset = 0

  for (const patternIndex of sequence) {
    const pattern = patterns[patternIndex]
    const beatCount = pattern[0].length - 2

    for (let channelIndex = 0; channelIndex < pattern.length; channelIndex++) {
      const channel = pattern[channelIndex]
      if (!channel?.length) continue

      const instrumentIndex = channel[0] || 0
      const panning = Math.min(1, Math.max(-1, channel[1] || 0))
      const instrument = instruments[instrumentIndex]
      if (!Array.isArray(instrument)) throw new Error('Instrumento ZzFXM inválido.')

      for (let beat = 0; beat < beatCount; beat++) {
        const rawNote = channel[beat + 2]
        if (!rawNote || rawNote < 0) continue

        const attenuation = rawNote % 1
        const note = rawNote | 0
        if (note <= 0) continue

        const parameters = [...instrument]
        parameters[2] = (parameters[2] || 220) * 2 ** ((note - 12) / 12)
        const samples = generateZzfxSamples(parameters)
        const destination = offset + beat * beatLength
        const gain = 1 - attenuation

        const leftGain = gain * (1 - panning)
        const rightGain = gain * (1 + panning)
        const end = loop ? samples.length : Math.min(samples.length, totalLength - destination)

        for (let index = 0; index < end; index++) {
          const position = (destination + index) % totalLength
          left[position] += samples[index] * leftGain
          right[position] += samples[index] * rightGain
        }
      }
    }

    offset += beatCount * beatLength
  }

  const normalizeChannel = (channel) => {
    let peak = 0
    for (let index = 0; index < channel.length; index++) peak = Math.max(peak, Math.abs(channel[index]))
    if (peak <= 1) return
    for (let index = 0; index < channel.length; index++) channel[index] /= peak
  }

  if (normalize) {
    normalizeChannel(left)
    normalizeChannel(right)
  }
  return [left, right]
}

export function createZzfxmAudioSource(context, song) {
  if (!context || typeof context.createBuffer !== 'function' || typeof context.createBufferSource !== 'function') {
    throw new TypeError('Um AudioContext compatível é obrigatório.')
  }

  const channels = generateZzfxMusicSamples(song, context.sampleRate || ZZFX_EXPERIMENTAL_SAMPLE_RATE)
  if (channels.some((channel) => !(channel instanceof Float32Array) || channel.length === 0)) {
    throw new Error('O ZzFXM não produziu canais válidos.')
  }

  const buffer = context.createBuffer(2, channels[0].length, context.sampleRate || ZZFX_EXPERIMENTAL_SAMPLE_RATE)
  buffer.getChannelData(0).set(channels[0])
  buffer.getChannelData(1).set(channels[1])
  const source = context.createBufferSource()
  source.buffer = buffer
  return source
}

export function validateZzfxmChannels(channels) {
  if (!Array.isArray(channels) || channels.length !== 2) return false
  return channels.every((channel) => {
    if (!(channel instanceof Float32Array) || channel.length === 0) return false
    for (let index = 0; index < channel.length; index++) {
      if (!Number.isFinite(channel[index])) return false
    }
    return true
  })
}
