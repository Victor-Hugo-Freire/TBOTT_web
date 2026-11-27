import { createBossEffects } from '../createBossEffects.js'

export default createBossEffects('brr-brr-patapim', {
  frequency: 124,
  noiseCutoff: 1450,
  noiseDecay: 10,
  reverb: 0.42,
  partials: [
    { ratio: 1, level: 0.64, decay: 3 },
    { ratio: 1.46, level: 0.31, decay: 6 },
    { ratio: 2.38, level: 0.24, decay: 9 },
  ],
}, {
  pisao: { duration: 0.45, frequencyScale: 0.72, pitchBend: -0.28, gain: 0.7, noise: 0.68, noiseCutoff: 900 },
  raizes: { duration: 0.57, frequencyScale: 1.38, pitchBend: 0.31, gain: 0.61, noise: 0.42, noiseCutoff: 2100 },
})
