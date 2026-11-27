import { createMobEffect } from '../createMobEffect.js'

export default createMobEffect('mob-zanzarina-tarantella-ataque', {
  duration: 0.173, frequency: 870, pitchBend: -0.1, gain: 0.38, noise: 0.12, noiseCutoff: 6200, noiseDecay: 24, reverb: 0.12,
  partials: [{ ratio: 1, level: 0.5, decay: 12 }, { ratio: 3.3, level: 0.35, decay: 19 }],
}, { maxVoices: 3, cooldownMs: 65 })
