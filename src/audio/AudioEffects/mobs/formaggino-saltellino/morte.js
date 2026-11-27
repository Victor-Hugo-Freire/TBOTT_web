import { createMobEffect } from '../createMobEffect.js'

export default createMobEffect('mob-formaggino-saltellino-morte', {
  duration: 0.436, frequency: 118, pitchBend: 0.38, gain: 0.68, noise: 0.3, noiseCutoff: 2200, noiseDecay: 12, reverb: 0.3,
  partials: [{ ratio: 1, level: 0.58, decay: 5 }, { ratio: 1.58, level: 0.25, decay: 7 }, { ratio: 2.4, level: 0.12, decay: 10 }],
}, { maxVoices: 2, cooldownMs: 120 })

