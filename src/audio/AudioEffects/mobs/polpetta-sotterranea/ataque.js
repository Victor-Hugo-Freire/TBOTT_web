import { createMobEffect } from '../createMobEffect.js'

export default createMobEffect('mob-polpetta-sotterranea-ataque', {
  duration: 0.157, frequency: 118, pitchBend: -0.46, gain: 0.52, noise: 0.3, noiseCutoff: 1500, noiseDecay: 22, reverb: 0.18,
  partials: [{ ratio: 1, level: 0.7, decay: 14 }, { ratio: 2.1, level: 0.24, decay: 21 }],
}, { maxVoices: 3, cooldownMs: 65 })
