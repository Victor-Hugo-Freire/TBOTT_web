import { createMobEffect } from '../createMobEffect.js'

export default createMobEffect('mob-moka-scudiera-ataque', {
  duration: 0.125, frequency: 530, pitchBend: 0.08, gain: 0.42, noise: 0.12, noiseCutoff: 5000, noiseDecay: 25, reverb: 0.19,
  partials: [{ ratio: 1, level: 0.64, decay: 17 }, { ratio: 3.1, level: 0.32, decay: 24 }],
}, { maxVoices: 3, cooldownMs: 65 })
