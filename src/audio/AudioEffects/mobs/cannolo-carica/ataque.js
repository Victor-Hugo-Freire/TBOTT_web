import { createMobEffect } from '../createMobEffect.js'

export default createMobEffect('mob-cannolo-carica-ataque', {
  duration: 0.101, frequency: 82, pitchBend: -0.38, gain: 0.5, noise: 0.18, noiseCutoff: 1600, noiseDecay: 24, reverb: 0.12,
  partials: [{ ratio: 1, level: 0.7, decay: 16 }, { ratio: 2.2, level: 0.2, decay: 22 }],
}, { maxVoices: 3, cooldownMs: 65 })
