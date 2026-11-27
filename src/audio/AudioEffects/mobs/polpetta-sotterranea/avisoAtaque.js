import { createMobEffect } from '../createMobEffect.js'

export default createMobEffect('mob-polpetta-sotterranea-aviso', {
  duration: 0.249, frequency: 190, pitchBend: 0.1, gain: 0.5, noise: 0.18, noiseCutoff: 1800, noiseDecay: 14, reverb: 0.24,
  modulationRate: 17, modulationDepth: 0.12,
  partials: [{ ratio: 1, level: 0.48, decay: 8 }, { ratio: 1.48, level: 0.25, decay: 11 }, { ratio: 2.2, level: 0.12, decay: 15 }],
}, { maxVoices: 2, cooldownMs: 100 })
