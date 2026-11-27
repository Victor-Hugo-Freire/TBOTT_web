import { createMobEffect } from '../createMobEffect.js'

export default createMobEffect('mob-moka-scudiera-anel', {
  duration: 0.068, frequency: 340, pitchBend: -0.12, gain: 0.4, noise: 0.22, noiseCutoff: 4900, noiseDecay: 20,
  partials: [{ ratio: 1, level: 0.6, decay: 15 }, { ratio: 2.8, level: 0.3, decay: 22 }],
}, { maxVoices: 2, cooldownMs: 120 })
