import { createMobEffect } from '../createMobEffect.js'

export default createMobEffect('mob-cannolo-carica-impacto', {
  duration: 0.061, frequency: 78, pitchBend: -0.3, gain: 0.82, noise: 0.3, noiseCutoff: 1450, noiseDecay: 18,
  partials: [{ ratio: 1, level: 0.76, decay: 12 }, { ratio: 2.5, level: 0.18, decay: 20 }],
}, { maxVoices: 2, cooldownMs: 120 })
