import { createMobEffect } from '../createMobEffect.js'

export default createMobEffect('mob-polpetta-sotterranea-dano', {
  duration: 0.338, frequency: 142, pitchBend: 0.32, gain: 0.62, noise: 0.32, noiseCutoff: 2600, noiseDecay: 18, reverb: 0.25,
  partials: [{ ratio: 1, level: 0.52, decay: 9 }, { ratio: 1.6, level: 0.22, decay: 13 }, { ratio: 2.4, level: 0.1, decay: 18 }],
}, { maxVoices: 3, cooldownMs: 45 })
