import { createMobEffect } from '../createMobEffect.js'

export default createMobEffect('mob-vespina-lambrettina-impacto', {
  duration: 0.081, frequency: 120, pitchBend: -0.26, gain: 0.48, noise: 0.34, noiseCutoff: 4800, noiseDecay: 19,
  partials: [{ ratio: 1, level: 0.68, decay: 13 }, { ratio: 2.8, level: 0.28, decay: 20 }],
}, { maxVoices: 2, cooldownMs: 140 })
