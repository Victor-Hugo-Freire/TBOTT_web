import { createMobEffect } from '../createMobEffect.js'

export default createMobEffect('mob-polpetta-sotterranea-morte', {
  duration: 0.526, frequency: 82, pitchBend: 0.45, gain: 0.76, noise: 0.42, noiseCutoff: 1750, noiseDecay: 10, reverb: 0.34,
  partials: [{ ratio: 1, level: 0.6, decay: 5 }, { ratio: 1.5, level: 0.25, decay: 7 }, { ratio: 2.25, level: 0.12, decay: 10 }],
}, { maxVoices: 2, cooldownMs: 120 })

