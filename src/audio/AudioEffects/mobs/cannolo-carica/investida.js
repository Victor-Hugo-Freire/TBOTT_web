import { createMobEffect } from '../createMobEffect.js'

export default createMobEffect('mob-cannolo-carica-investida', {
  duration: 0.06, frequency: 105, pitchBend: -0.45, gain: 0.72, noise: 0.18, noiseCutoff: 1550, noiseDecay: 22,
  partials: [{ ratio: 1, level: 0.7, decay: 15 }, { ratio: 2.2, level: 0.2, decay: 21 }],
}, { maxVoices: 2, cooldownMs: 120 })
