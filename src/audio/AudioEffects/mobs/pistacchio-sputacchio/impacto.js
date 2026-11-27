import { createMobEffect } from '../createMobEffect.js'

export default createMobEffect('mob-pistacchio-sputacchio-impacto', {
  duration: 0.075, frequency: 270, pitchBend: -0.26, gain: 0.42, noise: 0.2, noiseCutoff: 4500, noiseDecay: 21,
  partials: [{ ratio: 1, level: 0.64, decay: 14 }, { ratio: 2.7, level: 0.32, decay: 21 }],
}, { maxVoices: 2, cooldownMs: 140 })
