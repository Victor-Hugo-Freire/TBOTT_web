import { createMobEffect } from '../createMobEffect.js'

export default createMobEffect('mob-formaggino-saltellino-aviso', {
  duration: 0.194, frequency: 285, pitchBend: 0.2, gain: 0.5, noise: 0.06, noiseCutoff: 2500, noiseDecay: 16, reverb: 0.18,
  partials: [{ ratio: 1, level: 0.46, decay: 9 }, { ratio: 1.51, level: 0.24, decay: 12 }, { ratio: 2.02, level: 0.12, decay: 15 }],
}, { maxVoices: 2, cooldownMs: 100 })
