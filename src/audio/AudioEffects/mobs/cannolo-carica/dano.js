import { createMobEffect } from '../createMobEffect.js'

export default createMobEffect('mob-cannolo-carica-dano', {
  duration: 0.24, frequency: 112, pitchBend: 0.28, gain: 0.86, noise: 0.34, noiseCutoff: 2200, noiseDecay: 22, reverb: 0.2,
  partials: [{ ratio: 1, level: 0.6, decay: 10 }, { ratio: 2.1, level: 0.21, decay: 15 }, { ratio: 3.2, level: 0.1, decay: 20 }],
}, { maxVoices: 3, cooldownMs: 45 })
