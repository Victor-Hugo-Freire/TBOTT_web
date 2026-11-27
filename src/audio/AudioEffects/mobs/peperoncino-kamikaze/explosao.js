import { createMobEffect } from '../createMobEffect.js'

export default createMobEffect('mob-peperoncino-kamikaze-explosao', {
  duration: 0.069, frequency: 68, pitchBend: -0.62, gain: 0.7, noise: 0.62, noiseCutoff: 6100, noiseDecay: 13,
  partials: [{ ratio: 1, level: 0.78, decay: 12 }, { ratio: 2.6, level: 0.22, decay: 18 }],
}, { maxVoices: 1, cooldownMs: 250 })
