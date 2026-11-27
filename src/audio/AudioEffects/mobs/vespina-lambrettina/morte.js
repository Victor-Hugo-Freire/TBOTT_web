import { createMobEffect } from '../createMobEffect.js'

export default createMobEffect('mob-vespina-lambrettina-morte', {
  duration: 0.544, frequency: 108, pitchBend: 0.4, gain: 0.72, noise: 0.32, noiseCutoff: 2300, noiseDecay: 10, reverb: 0.36,
  partials: [{ ratio: 1, level: 0.58, decay: 5 }, { ratio: 1.48, level: 0.25, decay: 7 }, { ratio: 2.2, level: 0.12, decay: 10 }],
}, { maxVoices: 2, cooldownMs: 120 })

