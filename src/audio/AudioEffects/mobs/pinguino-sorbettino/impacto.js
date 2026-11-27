import { createMobEffect } from '../createMobEffect.js'

export default createMobEffect('mob-pinguino-sorbettino-impacto', {
  duration: 0.072, frequency: 96, pitchBend: -0.34, gain: 0.54, noise: 0.3, noiseCutoff: 3200, noiseDecay: 19,
  partials: [{ ratio: 1, level: 0.74, decay: 13 }, { ratio: 2.2, level: 0.22, decay: 20 }],
}, { maxVoices: 2, cooldownMs: 140 })
