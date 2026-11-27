import { createBossEffects } from '../createBossEffects.js'

export default createBossEffects('cappuccino-assassino', {
  frequency: 208,
  noiseCutoff: 3900,
  noiseDecay: 16,
  reverb: 0.43,
  partials: [
    { ratio: 1, level: 0.53, decay: 4 },
    { ratio: 1.64, level: 0.37, decay: 8 },
    { ratio: 2.73, level: 0.3, decay: 12 },
  ],
}, {
  corte: { duration: 0.27, frequencyScale: 1.72, pitchBend: 0.31, gain: 0.64, noise: 0.47, noiseCutoff: 5000 },
  teleporte: { duration: 0.44, frequencyScale: 0.89, pitchBend: -0.19, gain: 0.56, noise: 0.72, noiseCutoff: 2900 },
  clones: { duration: 0.64, frequencyScale: 1.32, pitchBend: 0.24, gain: 0.59, noise: 0.5 },
})
