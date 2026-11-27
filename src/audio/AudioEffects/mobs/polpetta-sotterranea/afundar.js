import { createMobEffect } from '../createMobEffect.js'

export default createMobEffect('mob-polpetta-sotterranea-afundar', {
  duration: 0.077, frequency: 118, pitchBend: -0.62, gain: 0.46, noise: 0.4, noiseCutoff: 1300, noiseDecay: 18,
  partials: [{ ratio: 1, level: 0.7, decay: 12 }, { ratio: 2, level: 0.2, decay: 19 }],
}, { maxVoices: 2, cooldownMs: 160 })
