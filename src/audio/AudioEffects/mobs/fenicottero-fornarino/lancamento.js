import { createMobEffect } from '../createMobEffect.js'

export default createMobEffect('mob-fenicottero-fornarino-lancamento', {
  duration: 0.062, frequency: 510, pitchBend: 0.26, gain: 0.42, noise: 0.28, noiseCutoff: 4600, noiseDecay: 20,
  partials: [{ ratio: 1, level: 0.58, decay: 14 }, { ratio: 2.6, level: 0.3, decay: 22 }],
}, { maxVoices: 3, cooldownMs: 90 })
