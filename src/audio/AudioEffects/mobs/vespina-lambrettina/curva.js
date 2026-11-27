import { createMobEffect } from '../createMobEffect.js'

export default createMobEffect('mob-vespina-lambrettina-curva', {
  duration: 0.08, frequency: 440, pitchBend: 0.38, gain: 0.38, noise: 0.2, noiseCutoff: 5600, noiseDecay: 20,
  partials: [{ ratio: 1, level: 0.54, decay: 15 }, { ratio: 2.9, level: 0.34, decay: 22 }],
}, { maxVoices: 2, cooldownMs: 100 })
