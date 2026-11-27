import { createMobEffect } from '../createMobEffect.js'

export default createMobEffect('mob-zanzarina-tarantella-morte', {
  duration: 0.562, frequency: 246, pitchBend: 0.36, gain: 0.62, noise: 0.22, noiseCutoff: 3500, noiseDecay: 11, reverb: 0.3,
  partials: [{ ratio: 1, level: 0.54, decay: 5 }, { ratio: 1.5, level: 0.25, decay: 7 }, { ratio: 2.3, level: 0.12, decay: 10 }],
}, { maxVoices: 2, cooldownMs: 120 })
