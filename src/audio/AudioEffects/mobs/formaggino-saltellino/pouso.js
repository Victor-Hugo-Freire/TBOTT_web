import { createMobEffect } from '../createMobEffect.js'

export default createMobEffect('mob-formaggino-saltellino-pouso', {
  duration: 0.066, frequency: 130, pitchBend: -0.2, gain: 0.5, noise: 0.2, noiseCutoff: 2200, noiseDecay: 18,
  partials: [{ ratio: 1, level: 0.72, decay: 14 }, { ratio: 1.8, level: 0.25, decay: 21 }],
}, { maxVoices: 2, cooldownMs: 140 })
