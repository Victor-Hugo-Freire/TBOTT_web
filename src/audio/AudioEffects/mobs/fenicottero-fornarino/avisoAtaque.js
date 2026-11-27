import { createMobEffect } from '../createMobEffect.js'

export default createMobEffect('mob-fenicottero-fornarino-aviso', {
  duration: 0.182, frequency: 390, pitchBend: -0.08, gain: 0.48, noise: 0.22, noiseCutoff: 5200, noiseDecay: 18, reverb: 0.22,
  partials: [{ ratio: 1, level: 0.44, decay: 8 }, { ratio: 1.62, level: 0.24, decay: 11 }, { ratio: 2.45, level: 0.13, decay: 14 }],
}, { maxVoices: 2, cooldownMs: 100 })
