import { createMobEffect } from '../createMobEffect.js'

export default createMobEffect('mob-peperoncino-kamikaze-dano', {
  duration: 0.296, frequency: 178, pitchBend: 0.35, gain: 0.64, noise: 0.38, noiseCutoff: 3900, noiseDecay: 18, reverb: 0.22,
  partials: [{ ratio: 1, level: 0.48, decay: 10 }, { ratio: 1.8, level: 0.22, decay: 14 }, { ratio: 2.7, level: 0.1, decay: 19 }],
}, { maxVoices: 3, cooldownMs: 45 })
