import { createMobEffect } from '../createMobEffect.js'

export default createMobEffect('mob-moka-scudiera-dano', {
  duration: 0.282, frequency: 315, pitchBend: 0.22, gain: 0.58, noise: 0.2, noiseCutoff: 3200, noiseDecay: 22, reverb: 0.24,
  partials: [{ ratio: 1, level: 0.5, decay: 10 }, { ratio: 1.73, level: 0.23, decay: 14 }, { ratio: 2.6, level: 0.11, decay: 18 }],
}, { maxVoices: 3, cooldownMs: 45 })
