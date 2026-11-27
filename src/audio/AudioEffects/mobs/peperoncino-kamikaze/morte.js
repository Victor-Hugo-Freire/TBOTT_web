import { createMobEffect } from '../createMobEffect.js'

export default createMobEffect('mob-peperoncino-kamikaze-morte', {
  duration: 0.472, frequency: 72, pitchBend: 0.48, gain: 0.9, noise: 0.5, noiseCutoff: 2450, noiseDecay: 9, reverb: 0.38,
  partials: [{ ratio: 1, level: 0.64, decay: 4 }, { ratio: 1.52, level: 0.27, decay: 6 }, { ratio: 2.35, level: 0.12, decay: 9 }],
}, { maxVoices: 2, cooldownMs: 120 })
