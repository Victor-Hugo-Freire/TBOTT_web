import { createBossEffects } from '../createBossEffects.js'

export default createBossEffects('nonna-lasagnona', {
  frequency: 154,
  noiseCutoff: 2200,
  noiseDecay: 13,
  reverb: 0.28,
  partials: [
    { ratio: 1, level: 0.65, decay: 4 },
    { ratio: 1.91, level: 0.36, decay: 7 },
    { ratio: 2.67, level: 0.2, decay: 11 },
  ],
}, {
  colherada: { duration: 0.41, frequencyScale: 1.16, pitchBend: -0.12, gain: 0.67, noise: 0.49, noiseCutoff: 1500 },
  invocar: { duration: 0.56, frequencyScale: 0.82, pitchBend: 0.21, gain: 0.56, noise: 0.48, noiseCutoff: 3000 },
  camada: { duration: 0.68, frequencyScale: 0.66, pitchBend: -0.33, gain: 0.59, noise: 0.36 },
})
