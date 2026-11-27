import { createMobEffect } from '../createMobEffect.js'

export default createMobEffect('mob-cannolo-carica-aviso', {
  duration: 0.17, frequency: 148, pitchBend: 0.18, gain: 0.54, noise: 0.16, noiseCutoff: 1450, noiseDecay: 15, reverb: 0.16,
  partials: [{ ratio: 1, level: 0.55, decay: 12 }, { ratio: 1.8, level: 0.2, decay: 18 }, { ratio: 2.7, level: 0.09, decay: 23 }],
}, { maxVoices: 2, cooldownMs: 100 })
