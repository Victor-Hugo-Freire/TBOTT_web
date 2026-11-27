import { createMobEffect } from '../createMobEffect.js'

export default createMobEffect('mob-vespina-lambrettina-motor', {
  duration: 0.078, frequency: 135, pitchBend: 0.48, gain: 0.42, noise: 0.24, noiseCutoff: 5200, noiseDecay: 19,
  partials: [{ ratio: 1, level: 0.62, decay: 14 }, { ratio: 2.6, level: 0.32, decay: 21 }],
}, { maxVoices: 2, cooldownMs: 130 })
