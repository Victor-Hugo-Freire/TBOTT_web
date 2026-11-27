import { createMobEffect } from '../createMobEffect.js'

export default createMobEffect('mob-peperoncino-kamikaze-aviso', {
  duration: 0.218, frequency: 455, pitchBend: -0.18, gain: 0.52, noise: 0.36, noiseCutoff: 6100, noiseDecay: 8, reverb: 0.2,
  partials: [{ ratio: 1, level: 0.37, decay: 8 }, { ratio: 1.58, level: 0.22, decay: 11 }, { ratio: 2.4, level: 0.12, decay: 14 }],
}, { maxVoices: 2, cooldownMs: 100 })
