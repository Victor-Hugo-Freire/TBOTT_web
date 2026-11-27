import { createMobEffect } from '../createMobEffect.js'

export default createMobEffect('mob-peperoncino-kamikaze-ataque', {
  duration: 0.133, frequency: 96, pitchBend: -0.58, gain: 0.52, noise: 0.4, noiseCutoff: 6100, noiseDecay: 14, reverb: 0.2,
  partials: [{ ratio: 1, level: 0.74, decay: 13 }, { ratio: 2.5, level: 0.22, decay: 20 }],
}, { maxVoices: 3, cooldownMs: 65 })
