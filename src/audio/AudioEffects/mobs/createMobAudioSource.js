const REFLECTIONS = [
  { delay: 0.021, gain: 0.18 },
  { delay: 0.047, gain: 0.12 },
  { delay: 0.083, gain: 0.07 },
  { delay: 0.119, gain: 0.035 },
]

export function createMobAudioSource(context, recipe, profile, event) {
  if (!context || typeof context.createBuffer !== 'function' || typeof context.createBufferSource !== 'function') {
    throw new TypeError('Um AudioContext compatível é obrigatório.')
  }
  if (!profile || !profile[event]) {
    throw new TypeError(`Perfil sonoro de mob inválido para o evento "${event}".`)
  }

  const sampleRate = context.sampleRate || 44100
  const dryLength = Math.max(1, Math.round(recipe.duration * sampleRate))
  const samples = new Float32Array(dryLength + Math.round(0.2 * sampleRate))
  const bodyPartials = [
    ...recipe.partials.map((partial) => ({ ...partial, level: partial.level * 0.32 })),
    ...profile.partials,
  ]

  addTone(samples, sampleRate, {
    start: 0,
    duration: recipe.duration,
    frequency: recipe.frequency,
    gain: recipe.gain * profile.bodyGain,
    pitchBend: recipe.pitchBend ?? 0,
    pitchModulationDepth: (recipe.pitchModulationDepth ?? 0) + profile.wobbleDepth,
    pitchModulationRate: profile.wobbleRate,
    modulationDepth: profile.pulseDepth,
    modulationRate: profile.pulseRate,
    attack: recipe.attack ?? 0.008,
    release: recipe.release ?? 0.06,
    partials: bodyPartials,
  })

  if (recipe.noise > 0) {
    addNoise(samples, sampleRate, {
      start: 0,
      duration: recipe.duration * 0.88,
      gain: recipe.gain * recipe.noise * profile.noiseGain,
      cutoff: profile.noiseCutoff,
      decay: (recipe.noiseDecay ?? 18) * profile.noiseDecay,
      attack: recipe.attack ?? 0.008,
      release: recipe.release ?? 0.06,
      pulseRate: profile.noisePulseRate ?? profile.pulseRate,
      pulseDepth: profile.noisePulseDepth ?? profile.pulseDepth,
    })
  }

  const gesture = profile[event]
  if (gesture.ratio) {
    addTone(samples, sampleRate, {
      start: recipe.duration * (gesture.start ?? 0),
      duration: recipe.duration * gesture.length,
      frequency: recipe.frequency * gesture.ratio,
      gain: recipe.gain * gesture.gain,
      pitchBend: gesture.bend,
      pitchModulationDepth: profile.wobbleDepth * 0.55,
      pitchModulationRate: profile.wobbleRate * 0.73,
      modulationDepth: gesture.pulseDepth ?? profile.pulseDepth * 0.5,
      modulationRate: gesture.pulseRate ?? profile.pulseRate,
      attack: recipe.attack ?? 0.008,
      release: recipe.release ?? 0.06,
      partials: gesture.partials,
    })
  }
  if (gesture.noise) {
    addNoise(samples, sampleRate, {
      start: recipe.duration * gesture.noise.start,
      duration: recipe.duration * gesture.noise.length,
      gain: recipe.gain * gesture.noise.gain,
      cutoff: gesture.noise.cutoff,
      decay: gesture.noise.decay,
      attack: 0.002,
      release: 0.025,
      pulseRate: gesture.noise.pulseRate ?? 0,
      pulseDepth: gesture.noise.pulseDepth ?? 0,
    })
  }

  addReflections(samples, dryLength, sampleRate, profile.echo)
  return createBufferSource(context, samples, sampleRate)
}

function addTone(samples, sampleRate, layer) {
  const startIndex = Math.round(layer.start * sampleRate)
  const length = Math.max(1, Math.min(
    Math.round(layer.duration * sampleRate),
    samples.length - startIndex,
  ))
  const phases = layer.partials.map(() => Math.random() * Math.PI * 2)
  const frequencies = layer.partials.map((partial) => layer.frequency * partial.ratio)
  const releaseDuration = Math.min(layer.release, layer.duration * 0.45)
  const releaseStart = layer.duration - releaseDuration
  const pitchPhase = Math.random() * Math.PI * 2

  for (let index = 0; index < length; index += 1) {
    const time = index / sampleRate
    const attack = 1 - Math.exp(-time / layer.attack)
    const releaseProgress = Math.max(0, (time - releaseStart) / releaseDuration)
    const release = time < releaseStart ? 1 : 0.5 + 0.5 * Math.cos(Math.PI * releaseProgress)
    const pitchWobble = layer.pitchModulationDepth *
      Math.sin(2 * Math.PI * layer.pitchModulationRate * time + pitchPhase)
    const pitch = 1 + layer.pitchBend * Math.exp(-time * 13) + pitchWobble
    const modulation = layer.modulationDepth
      ? 1 + layer.modulationDepth * Math.sin(2 * Math.PI * layer.modulationRate * time)
      : 1
    let value = 0

    for (let partialIndex = 0; partialIndex < layer.partials.length; partialIndex += 1) {
      const partial = layer.partials[partialIndex]
      phases[partialIndex] += 2 * Math.PI * frequencies[partialIndex] * pitch / sampleRate
      value += Math.sin(phases[partialIndex]) *
        partial.level *
        Math.exp(-time * partial.decay) *
        modulation
    }

    samples[startIndex + index] += value * attack * release * layer.gain
  }
}

function addNoise(samples, sampleRate, layer) {
  const startIndex = Math.round(layer.start * sampleRate)
  const length = Math.max(1, Math.min(
    Math.round(layer.duration * sampleRate),
    samples.length - startIndex,
  ))
  const filter = Math.exp(-2 * Math.PI * layer.cutoff / sampleRate)
  const releaseDuration = Math.min(layer.release, layer.duration * 0.45)
  const releaseStart = layer.duration - releaseDuration
  let filtered = 0
  let softened = 0

  for (let index = 0; index < length; index += 1) {
    const time = index / sampleRate
    const attack = 1 - Math.exp(-time / layer.attack)
    const releaseProgress = Math.max(0, (time - releaseStart) / releaseDuration)
    const release = time < releaseStart ? 1 : 0.5 + 0.5 * Math.cos(Math.PI * releaseProgress)
    const pulse = layer.pulseDepth
      ? 1 + layer.pulseDepth * Math.sin(2 * Math.PI * layer.pulseRate * time)
      : 1
    filtered = filter * filtered + (1 - filter) * (Math.random() * 2 - 1)
    softened = filter * softened + (1 - filter) * filtered
    samples[startIndex + index] += softened *
      Math.exp(-time * layer.decay) *
      attack *
      release *
      pulse *
      layer.gain
  }
}

function addReflections(samples, dryLength, sampleRate, amount) {
  const drySamples = samples.slice(0, dryLength)
  for (let index = 0; index < dryLength; index += 1) {
    for (const reflection of REFLECTIONS) {
      const reflectedIndex = index + Math.round(reflection.delay * sampleRate)
      if (reflectedIndex < samples.length) {
        samples[reflectedIndex] += drySamples[index] * reflection.gain * amount
      }
    }
  }
}

function createBufferSource(context, samples, sampleRate) {
  const buffer = context.createBuffer(1, samples.length, sampleRate)
  const channel = buffer.getChannelData(0)
  for (let index = 0; index < samples.length; index += 1) {
    channel[index] = Math.tanh(samples[index] * 1.4) / Math.tanh(1.4)
  }

  const source = context.createBufferSource()
  source.buffer = buffer
  return source
}
