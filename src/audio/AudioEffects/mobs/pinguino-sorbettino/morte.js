import { createMobEffect } from '../createMobEffect.js'

export default createMobEffect('mob-pinguino-sorbettino-morte', {
  duration: 0.49, frequency: 126, pitchBend: 0.36, gain: 0.68, noise: 0.3, noiseCutoff: 2600, noiseDecay: 11, reverb: 0.4,
  partials: [{ ratio: 1, level: 0.56, decay: 5 }, { ratio: 1.45, level: 0.26, decay: 7 }, { ratio: 2.2, level: 0.12, decay: 10 }],
}, { maxVoices: 2, cooldownMs: 120 })

