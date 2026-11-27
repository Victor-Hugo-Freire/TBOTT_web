import { createMobEffect } from '../createMobEffect.js'

export default createMobEffect('mob-pistacchio-sputacchio-ataque', {
  duration: 0.149, frequency: 680, pitchBend: 0.16, gain: 0.4, noise: 0.08, noiseCutoff: 5400, noiseDecay: 23, reverb: 0.14,
  partials: [{ ratio: 1, level: 0.55, decay: 14 }, { ratio: 3.2, level: 0.34, decay: 22 }],
}, { maxVoices: 3, cooldownMs: 65 })
