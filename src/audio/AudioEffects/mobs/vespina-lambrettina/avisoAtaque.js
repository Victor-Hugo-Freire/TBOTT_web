import { createMobEffect } from '../createMobEffect.js'

export default createMobEffect('mob-vespina-lambrettina-aviso', {
  duration: 0.266, frequency: 165, pitchBend: 0.28, gain: 0.47, noise: 0.13, noiseCutoff: 2100, noiseDecay: 12, reverb: 0.2,
  modulationRate: 34, modulationDepth: 0.2,
  partials: [{ ratio: 1, level: 0.45, decay: 8 }, { ratio: 1.5, level: 0.24, decay: 11 }, { ratio: 2.3, level: 0.12, decay: 15 }],
}, { maxVoices: 2, cooldownMs: 100 })
