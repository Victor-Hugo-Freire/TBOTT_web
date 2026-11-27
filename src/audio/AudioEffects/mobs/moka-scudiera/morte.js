import { createMobEffect } from '../createMobEffect.js'

export default createMobEffect('mob-moka-scudiera-morte', {
  duration: 0.454, frequency: 165, pitchBend: 0.32, gain: 0.66, noise: 0.26, noiseCutoff: 2500, noiseDecay: 12, reverb: 0.34,
  partials: [{ ratio: 1, level: 0.56, decay: 5 }, { ratio: 1.47, level: 0.26, decay: 7 }, { ratio: 2.2, level: 0.12, decay: 10 }],
}, { maxVoices: 2, cooldownMs: 120 })

