// ZzFX-compatible pure sample generator used by the isolated TBOTT experiment.
// Adapted from ZzFX 1.4.0: MIT, Copyright (c) 2019 Frank Force.
// This module intentionally never creates or starts an AudioContext.

export const ZZFX_EXPERIMENTAL_SAMPLE_RATE = 44100

export function generateZzfxSamples(parameters = []) {
  let [
    volume = 1,
    randomness = 0.05,
    frequency = 220,
    attack = 0,
    sustain = 0,
    release = 0.1,
    shape = 0,
    shapeCurve = 1,
    slide = 0,
    deltaSlide = 0,
    pitchJump = 0,
    pitchJumpTime = 0,
    repeatTime = 0,
    noise = 0,
    modulation = 0,
    bitCrush = 0,
    delay = 0,
    sustainVolume = 1,
    decay = 0,
    tremolo = 0,
    filter = 0,
  ] = parameters

  const sampleRate = ZZFX_EXPERIMENTAL_SAMPLE_RATE
  const pi2 = Math.PI * 2
  const abs = Math.abs
  const sign = (value) => value < 0 ? -1 : 1
  let startSlide = slide *= 500 * pi2 / sampleRate / sampleRate
  let startFrequency = frequency *= (1 + randomness * 2 * Math.random() - randomness) * pi2 / sampleRate
  let modOffset = 0
  let repeat = 0
  let crush = 0
  let jump = 1
  let t = 0
  let s = 0

  const quality = 2
  const w = pi2 * abs(filter) * 2 / sampleRate
  const cos = Math.cos(w)
  const alpha = Math.sin(w) / 2 / quality
  const a0 = 1 + alpha
  const a1 = -2 * cos / a0
  const a2 = (1 - alpha) / a0
  const b0 = (1 + sign(filter) * cos) / 2 / a0
  const b1 = -(sign(filter) + cos) / a0
  const b2 = b0
  let x2 = 0
  let x1 = 0
  let y2 = 0
  let y1 = 0

  attack = attack * sampleRate || 9
  decay *= sampleRate
  sustain *= sampleRate
  release *= sampleRate
  delay *= sampleRate
  deltaSlide *= 500 * pi2 / sampleRate ** 3
  modulation *= pi2 / sampleRate
  pitchJump *= pi2 / sampleRate
  pitchJumpTime *= sampleRate
  repeatTime = repeatTime * sampleRate | 0

  const length = attack + decay + sustain + release + delay | 0
  const samples = new Float32Array(length > 0 ? length : 0)

  for (let i = 0; i < length; i++) {
    if (!(++crush % (bitCrush * 100 | 0))) {
      s = shape
        ? shape > 1
          ? shape > 2
            ? shape > 3
              ? shape > 4
                ? (t / pi2 % 1 < shapeCurve / 2 ? 1 : -1)
                : Math.sin(t ** 3)
              : Math.max(Math.min(Math.tan(t), 1), -1)
            : 1 - (2 * t / pi2 % 2 + 2) % 2
          : 1 - 4 * abs(Math.round(t / pi2) - t / pi2)
        : Math.sin(t)

      s = (repeatTime
        ? 1 - tremolo + tremolo * Math.sin(pi2 * i / repeatTime)
        : 1)
        * (shape > 4 ? s : sign(s) * abs(s) ** shapeCurve)
        * (i < attack
          ? i / attack
          : i < attack + decay
            ? 1 - ((i - attack) / decay) * (1 - sustainVolume)
            : i < attack + decay + sustain
              ? sustainVolume
              : i < length - delay
                ? (length - i - delay) / release * sustainVolume
                : 0)

      s = delay
        ? s / 2 + (delay > i ? 0 : (i < length - delay ? 1 : (length - i) / delay) * samples[i - delay | 0] / 2)
        : s

      if (filter) {
        s = y1 = b2 * x2 + b1 * (x2 = x1) + b0 * (x1 = s) - a2 * y2 - a1 * (y2 = y1)
      }
    }

    const f = (frequency += slide += deltaSlide) * Math.cos(modulation * modOffset++)
    t += f + f * noise * (i * i * pi2 % 2 - 1)

    if (jump && ++jump > pitchJumpTime) {
      frequency += pitchJump
      startFrequency += pitchJump
      jump = 0
    }

    if (repeatTime && !(++repeat % repeatTime)) {
      frequency = startFrequency
      slide = startSlide
    }

    samples[i] = s * volume
  }

  return samples
}

export function createZzfxAudioSource(context, parameters) {
  if (!context || typeof context.createBuffer !== 'function' || typeof context.createBufferSource !== 'function') {
    throw new TypeError('Um AudioContext compatível é obrigatório.')
  }

  const samples = generateZzfxSamples(parameters)
  if (!(samples instanceof Float32Array) || samples.length === 0) {
    throw new Error('O ZzFX não produziu samples válidos.')
  }

  const buffer = context.createBuffer(1, samples.length, context.sampleRate || ZZFX_EXPERIMENTAL_SAMPLE_RATE)
  buffer.getChannelData(0).set(samples)
  const source = context.createBufferSource()
  source.buffer = buffer
  return source
}

export function validateZzfxSamples(samples) {
  if (!(samples instanceof Float32Array) || samples.length === 0) return false
  for (let index = 0; index < samples.length; index++) {
    if (!Number.isFinite(samples[index])) return false
  }
  return true
}
