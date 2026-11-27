import { createMobEffect } from '../createMobEffect.js'

export default createMobEffect('mob-pinguino-sorbettino-aviso', {
  duration: 0.23, frequency: 330, pitchBend: -0.22, gain: 0.47, noise: 0.2, noiseCutoff: 3600, noiseDecay: 13, reverb: 0.3,
  partials: [{ ratio: 1, level: 0.45, decay: 8 }, { ratio: 1.5, level: 0.25, decay: 11 }, { ratio: 2.25, level: 0.12, decay: 15 }],
}, { maxVoices: 2, cooldownMs: 100 })
