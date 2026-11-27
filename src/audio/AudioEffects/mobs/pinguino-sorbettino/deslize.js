import { createMobEffect } from '../createMobEffect.js'

export default createMobEffect('mob-pinguino-sorbettino-deslize', {
  duration: 0.07, frequency: 180, pitchBend: 0.3, gain: 0.42, noise: 0.34, noiseCutoff: 3900, noiseDecay: 21,
  partials: [{ ratio: 1, level: 0.65, decay: 15 }, { ratio: 2.5, level: 0.3, decay: 22 }],
}, { maxVoices: 2, cooldownMs: 130 })
