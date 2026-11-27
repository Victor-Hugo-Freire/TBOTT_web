const REFLECTIONS = [
  { delay: 0.027, gain: 0.22 },
  { delay: 0.053, gain: 0.14 },
  { delay: 0.089, gain: 0.09 },
  { delay: 0.127, gain: 0.05 },
]

export function createRoomInteractionSource(context, recipe) {
  if (!context || typeof context.createBuffer !== 'function' || typeof context.createBufferSource !== 'function') {
    throw new TypeError('Um AudioContext compatível é obrigatório.')
  }

  const sampleRate = context.sampleRate || 44100
  const dryLength = Math.max(1, Math.round(recipe.duration * sampleRate))
  const tailLength = Math.round(0.17 * sampleRate)
  const samples = new Float32Array(dryLength + tailLength)
  const phases = recipe.partials.map(() => Math.random() * Math.PI * 2)
  const frequencies = recipe.partials.map((partial) => recipe.frequency * partial.ratio)
  const noiseFilter = Math.exp(-2 * Math.PI * (recipe.noiseCutoff ?? 5000) / sampleRate)
  let filteredNoise = 0

  for (let index = 0; index < dryLength; index += 1) {
    const time = index / sampleRate
    const attack = 1 - Math.exp(-time / (recipe.attack ?? 0.003))
    const pitch = 1 + (recipe.pitchBend ?? 0) * Math.exp(-time * 13)
    const modulation = recipe.modulationDepth
      ? 1 + recipe.modulationDepth * Math.sin(2 * Math.PI * recipe.modulationRate * time)
      : 1
    let value = 0

    for (let partialIndex = 0; partialIndex < recipe.partials.length; partialIndex += 1) {
      const partial = recipe.partials[partialIndex]
      phases[partialIndex] += 2 * Math.PI * frequencies[partialIndex] * pitch / sampleRate
      value += Math.sin(phases[partialIndex]) *
        partial.level *
        Math.exp(-time * partial.decay) *
        modulation
    }

    if (recipe.noise > 0) {
      const whiteNoise = Math.random() * 2 - 1
      filteredNoise = noiseFilter * filteredNoise + (1 - noiseFilter) * whiteNoise
      value += filteredNoise * recipe.noise * Math.exp(-time * (recipe.noiseDecay ?? 18))
    }

    value *= attack * recipe.gain
    samples[index] += value
    for (const reflection of REFLECTIONS) {
      const reflectedIndex = index + Math.round(reflection.delay * sampleRate)
      if (reflectedIndex < samples.length) {
        samples[reflectedIndex] += value * reflection.gain * (recipe.reverb ?? 0.35)
      }
    }
  }

  const buffer = context.createBuffer(1, samples.length, sampleRate)
  const channel = buffer.getChannelData(0)
  for (let index = 0; index < samples.length; index += 1) {
    channel[index] = Math.tanh(samples[index] * 1.4) / Math.tanh(1.4)
  }

  const source = context.createBufferSource()
  source.buffer = buffer
  return source
}
