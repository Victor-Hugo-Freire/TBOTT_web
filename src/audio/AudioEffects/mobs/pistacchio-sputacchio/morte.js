import { createMobEffect } from '../createMobEffect.js'

export default createMobEffect('mob-pistacchio-sputacchio-morte', {
  duration: 0.508, frequency: 154, pitchBend: 0.34, gain: 0.65, noise: 0.25, noiseCutoff: 2900, noiseDecay: 11, reverb: 0.32,
  partials: [{ ratio: 1, level: 0.56, decay: 5 }, { ratio: 1.5, level: 0.26, decay: 7 }, { ratio: 2.3, level: 0.12, decay: 10 }],
}, { maxVoices: 2, cooldownMs: 120 })

