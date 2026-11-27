import { createMobEffect } from '../createMobEffect.js'

export default createMobEffect('mob-pinguino-sorbettino-ataque', {
  duration: 0.141, frequency: 240, pitchBend: 0.26, gain: 0.46, noise: 0.25, noiseCutoff: 3800, noiseDecay: 21, reverb: 0.18,
  partials: [{ ratio: 1, level: 0.66, decay: 15 }, { ratio: 2.6, level: 0.3, decay: 22 }],
}, { maxVoices: 3, cooldownMs: 65 })
