import { createMobEffect } from '../createMobEffect.js'

export default createMobEffect('mob-fenicottero-fornarino-dano', {
  duration: 0.254, frequency: 245, pitchBend: 0.24, gain: 0.62, noise: 0.26, noiseCutoff: 3300, noiseDecay: 20, reverb: 0.24,
  partials: [{ ratio: 1, level: 0.52, decay: 9 }, { ratio: 1.7, level: 0.23, decay: 13 }, { ratio: 2.6, level: 0.1, decay: 18 }],
}, { maxVoices: 3, cooldownMs: 45 })
