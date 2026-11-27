import { createMobEffect } from '../createMobEffect.js'

export default createMobEffect('mob-formaggino-saltellino-dano', {
  duration: 0.268, frequency: 205, pitchBend: 0.3, gain: 0.6, noise: 0.24, noiseCutoff: 3000, noiseDecay: 21, reverb: 0.22,
  partials: [{ ratio: 1, level: 0.52, decay: 10 }, { ratio: 1.62, level: 0.22, decay: 14 }, { ratio: 2.4, level: 0.1, decay: 19 }],
}, { maxVoices: 3, cooldownMs: 45 })
