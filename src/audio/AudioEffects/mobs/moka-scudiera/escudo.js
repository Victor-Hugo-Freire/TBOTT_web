import { createMobEffect } from '../createMobEffect.js'

export default createMobEffect('mob-moka-scudiera-escudo', {
  duration: 0.067, frequency: 760, pitchBend: 0.16, gain: 0.38, noise: 0.2, noiseCutoff: 6200, noiseDecay: 24,
  partials: [{ ratio: 1, level: 0.5, decay: 17 }, { ratio: 3.2, level: 0.36, decay: 23 }],
}, { maxVoices: 2, cooldownMs: 120 })
