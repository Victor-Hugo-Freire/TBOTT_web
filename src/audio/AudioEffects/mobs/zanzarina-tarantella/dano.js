import { createMobEffect } from '../createMobEffect.js'

export default createMobEffect('mob-zanzarina-tarantella-dano', {
  duration: 0.366, frequency: 358, pitchBend: 0.25, gain: 0.56, noise: 0.18, noiseCutoff: 4100, noiseDecay: 20, reverb: 0.2,
  partials: [{ ratio: 1, level: 0.48, decay: 9 }, { ratio: 1.65, level: 0.22, decay: 13 }, { ratio: 2.5, level: 0.1, decay: 18 }],
}, { maxVoices: 3, cooldownMs: 45 })
