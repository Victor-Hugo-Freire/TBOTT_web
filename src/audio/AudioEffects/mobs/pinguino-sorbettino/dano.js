import { createMobEffect } from '../createMobEffect.js'

export default createMobEffect('mob-pinguino-sorbettino-dano', {
  duration: 0.31, frequency: 222, pitchBend: 0.22, gain: 0.6, noise: 0.24, noiseCutoff: 3000, noiseDecay: 20, reverb: 0.3,
  partials: [{ ratio: 1, level: 0.5, decay: 9 }, { ratio: 1.55, level: 0.23, decay: 13 }, { ratio: 2.35, level: 0.11, decay: 18 }],
}, { maxVoices: 3, cooldownMs: 45 })
