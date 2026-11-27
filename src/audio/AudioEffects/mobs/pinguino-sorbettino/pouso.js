import { createMobEffect } from '../createMobEffect.js'

export default createMobEffect('mob-pinguino-sorbettino-pouso', {
  duration: 0.073, frequency: 145, pitchBend: -0.18, gain: 0.44, noise: 0.24, noiseCutoff: 3200, noiseDecay: 18,
  partials: [{ ratio: 1, level: 0.68, decay: 14 }, { ratio: 2.5, level: 0.24, decay: 22 }],
}, { maxVoices: 2, cooldownMs: 140 })
