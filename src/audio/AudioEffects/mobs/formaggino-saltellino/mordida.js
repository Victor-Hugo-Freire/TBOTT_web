import { createMobEffect } from '../createMobEffect.js'

export default createMobEffect('mob-formaggino-saltellino-mordida', {
  duration: 0.065, frequency: 220, pitchBend: -0.32, gain: 0.46, noise: 0.28, noiseCutoff: 2850, noiseDecay: 20,
  partials: [{ ratio: 1, level: 0.68, decay: 14 }, { ratio: 2.4, level: 0.28, decay: 21 }],
}, { maxVoices: 2, cooldownMs: 110 })
