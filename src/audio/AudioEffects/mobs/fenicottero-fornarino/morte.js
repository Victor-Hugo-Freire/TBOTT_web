import { createMobEffect } from '../createMobEffect.js'

export default createMobEffect('mob-fenicottero-fornarino-morte', {
  duration: 0.418, frequency: 132, pitchBend: 0.34, gain: 0.7, noise: 0.3, noiseCutoff: 2800, noiseDecay: 10, reverb: 0.32,
  partials: [{ ratio: 1, level: 0.58, decay: 5 }, { ratio: 1.42, level: 0.27, decay: 7 }, { ratio: 2.25, level: 0.12, decay: 10 }],
}, { maxVoices: 2, cooldownMs: 120 })

