import { createMobEffect } from '../createMobEffect.js'

export default createMobEffect('mob-vespina-lambrettina-mergulho', {
  duration: 0.079, frequency: 620, pitchBend: -0.42, gain: 0.4, noise: 0.32, noiseCutoff: 6100, noiseDecay: 20,
  partials: [{ ratio: 1, level: 0.56, decay: 13 }, { ratio: 3.1, level: 0.34, decay: 21 }],
}, { maxVoices: 2, cooldownMs: 100 })
