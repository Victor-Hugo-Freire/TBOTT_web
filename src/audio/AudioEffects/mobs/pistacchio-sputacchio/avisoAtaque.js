import { createMobEffect } from '../createMobEffect.js'

export default createMobEffect('mob-pistacchio-sputacchio-aviso', {
  duration: 0.242, frequency: 735, pitchBend: -0.3, gain: 0.44, noise: 0.08, noiseCutoff: 4600, noiseDecay: 15, reverb: 0.2,
  partials: [{ ratio: 1, level: 0.42, decay: 8 }, { ratio: 1.52, level: 0.23, decay: 11 }, { ratio: 2.3, level: 0.11, decay: 14 }],
}, { maxVoices: 2, cooldownMs: 100 })
