import { createMobEffect } from '../createMobEffect.js'

export default createMobEffect('mob-pistacchio-sputacchio-lancamento', {
  duration: 0.074, frequency: 840, pitchBend: 0.32, gain: 0.4, noise: 0.16, noiseCutoff: 5700, noiseDecay: 23,
  partials: [{ ratio: 1, level: 0.58, decay: 15 }, { ratio: 3.2, level: 0.34, decay: 22 }],
}, { maxVoices: 2, cooldownMs: 130 })
