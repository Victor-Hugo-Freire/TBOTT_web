import { createMobEffect } from '../createMobEffect.js'

export default createMobEffect('mob-vespina-lambrettina-ataque', {
  duration: 0.165, frequency: 370, pitchBend: -0.14, gain: 0.4, noise: 0.14, noiseCutoff: 6500, noiseDecay: 22, reverb: 0.13,
  partials: [{ ratio: 1, level: 0.52, decay: 13 }, { ratio: 3.1, level: 0.36, decay: 20 }],
}, { maxVoices: 3, cooldownMs: 65 })
