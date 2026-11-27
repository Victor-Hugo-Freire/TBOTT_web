import { createMobEffect } from '../createMobEffect.js'

export default createMobEffect('mob-polpetta-sotterranea-mordida', {
  duration: 0.076, frequency: 82, pitchBend: -0.5, gain: 0.52, noise: 0.46, noiseCutoff: 1450, noiseDecay: 18,
  partials: [{ ratio: 1, level: 0.74, decay: 13 }, { ratio: 1.8, level: 0.24, decay: 20 }],
}, { maxVoices: 2, cooldownMs: 130 })
