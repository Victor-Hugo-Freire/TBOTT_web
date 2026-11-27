import { createMobEffect } from '../createMobEffect.js'

export default createMobEffect('mob-vespina-lambrettina-dano', {
  duration: 0.352, frequency: 232, pitchBend: 0.24, gain: 0.6, noise: 0.25, noiseCutoff: 3500, noiseDecay: 20, reverb: 0.23,
  partials: [{ ratio: 1, level: 0.5, decay: 9 }, { ratio: 1.7, level: 0.22, decay: 13 }, { ratio: 2.55, level: 0.1, decay: 18 }],
}, { maxVoices: 3, cooldownMs: 45 })
