import { createMobEffect } from '../createMobEffect.js'

export default createMobEffect('mob-moka-scudiera-aviso', {
  duration: 0.206, frequency: 540, pitchBend: -0.1, gain: 0.45, noise: 0.12, noiseCutoff: 3800, noiseDecay: 18, reverb: 0.28,
  partials: [{ ratio: 1, level: 0.4, decay: 8 }, { ratio: 1.5, level: 0.28, decay: 11 }, { ratio: 2.25, level: 0.14, decay: 15 }],
}, { maxVoices: 2, cooldownMs: 100 })
