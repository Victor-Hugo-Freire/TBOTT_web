import { createMobEffect } from '../createMobEffect.js'

export default createMobEffect('mob-fenicottero-fornarino-ataque', {
  duration: 0.109, frequency: 315, pitchBend: 0.2, gain: 0.43, noise: 0.22, noiseCutoff: 4400, noiseDecay: 20, reverb: 0.15,
  partials: [{ ratio: 1, level: 0.58, decay: 14 }, { ratio: 2.6, level: 0.28, decay: 21 }],
}, { maxVoices: 3, cooldownMs: 65 })
