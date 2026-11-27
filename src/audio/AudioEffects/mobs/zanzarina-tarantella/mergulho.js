import { createMobEffect } from '../createMobEffect.js'

export default createMobEffect('mob-zanzarina-tarantella-mergulho', {
  duration: 0.082, frequency: 1540, pitchBend: -0.54, gain: 0.38, noise: 0.28, noiseCutoff: 6900, noiseDecay: 22,
  partials: [{ ratio: 1, level: 0.52, decay: 12 }, { ratio: 3.3, level: 0.38, decay: 20 }],
}, { maxVoices: 2, cooldownMs: 120 })
