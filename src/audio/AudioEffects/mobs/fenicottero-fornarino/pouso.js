import { createMobEffect } from '../createMobEffect.js'

export default createMobEffect('mob-fenicottero-fornarino-pouso', {
  duration: 0.064, frequency: 88, pitchBend: -0.18, gain: 0.55, noise: 0.36, noiseCutoff: 2500, noiseDecay: 18,
  partials: [{ ratio: 1, level: 0.72, decay: 13 }, { ratio: 2.1, level: 0.24, decay: 21 }],
}, { maxVoices: 2, cooldownMs: 140 })
