import { createMobEffect } from '../createMobEffect.js'

export default createMobEffect('mob-zanzarina-tarantella-aviso', {
  duration: 0.278, frequency: 920, pitchBend: 0.12, gain: 0.4, noise: 0.09, noiseCutoff: 5200, noiseDecay: 16, reverb: 0.17,
  modulationRate: 52, modulationDepth: 0.24,
  partials: [{ ratio: 1, level: 0.4, decay: 9 }, { ratio: 1.51, level: 0.22, decay: 12 }, { ratio: 2.24, level: 0.1, decay: 15 }],
}, { maxVoices: 2, cooldownMs: 100 })
