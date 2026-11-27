import { createMobEffect } from '../createMobEffect.js'

export default createMobEffect('mob-pistacchio-sputacchio-dano', {
  duration: 0.324, frequency: 278, pitchBend: 0.26, gain: 0.58, noise: 0.2, noiseCutoff: 3400, noiseDecay: 19, reverb: 0.22,
  partials: [{ ratio: 1, level: 0.5, decay: 9 }, { ratio: 1.64, level: 0.22, decay: 13 }, { ratio: 2.5, level: 0.1, decay: 17 }],
}, { maxVoices: 3, cooldownMs: 45 })
