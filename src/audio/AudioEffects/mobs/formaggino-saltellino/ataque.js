import { createMobEffect } from '../createMobEffect.js'

export default createMobEffect('mob-formaggino-saltellino-ataque', {
  duration: 0.117, frequency: 185, pitchBend: -0.28, gain: 0.46, noise: 0.16, noiseCutoff: 2600, noiseDecay: 22, reverb: 0.13,
  partials: [{ ratio: 1, level: 0.65, decay: 15 }, { ratio: 2.4, level: 0.25, decay: 23 }],
}, { maxVoices: 3, cooldownMs: 65 })
