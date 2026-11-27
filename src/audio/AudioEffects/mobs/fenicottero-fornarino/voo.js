import { createMobEffect } from '../createMobEffect.js'

export default createMobEffect('mob-fenicottero-fornarino-voo', {
  duration: 0.063, frequency: 385, pitchBend: -0.2, gain: 0.38, noise: 0.34, noiseCutoff: 4000, noiseDecay: 18,
  partials: [{ ratio: 1, level: 0.56, decay: 16 }, { ratio: 2.3, level: 0.28, decay: 22 }],
}, { maxVoices: 2, cooldownMs: 200 })
