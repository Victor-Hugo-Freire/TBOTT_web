import { createMobEffect } from '../createMobEffect.js'

export default createMobEffect('mob-cannolo-carica-morte', {
  duration: 0.4, frequency: 92, pitchBend: 0.42, gain: 0.72, noise: 0.38, noiseCutoff: 1900, noiseDecay: 11, reverb: 0.3,
  partials: [{ ratio: 1, level: 0.62, decay: 5 }, { ratio: 1.52, level: 0.25, decay: 7 }, { ratio: 2.3, level: 0.12, decay: 9 }],
}, { maxVoices: 2, cooldownMs: 120 })

