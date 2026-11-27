import { createMobEffect } from '../createMobEffect.js'

export default createMobEffect('mob-pinguino-sorbettino-gelo', {
  duration: 0.071, frequency: 1120, pitchBend: 0.12, gain: 0.36, noise: 0.28, noiseCutoff: 6400, noiseDecay: 23,
  partials: [{ ratio: 1, level: 0.54, decay: 17 }, { ratio: 2.9, level: 0.4, decay: 22 }],
}, { maxVoices: 2, cooldownMs: 180 })
