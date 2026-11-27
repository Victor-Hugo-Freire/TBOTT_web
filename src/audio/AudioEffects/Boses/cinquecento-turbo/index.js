import { createBossEffects } from '../createBossEffects.js'

export default createBossEffects('cinquecento-turbo', {
  frequency: 112,
  noiseCutoff: 1800,
  noiseDecay: 12,
  reverb: 0.18,
  partials: [
    { ratio: 1, level: 0.62, decay: 5 },
    { ratio: 2.03, level: 0.42, decay: 8 },
    { ratio: 3.12, level: 0.2, decay: 12 },
  ],
}, {
  buzina: { duration: 0.46, frequencyScale: 1.4, pitchBend: 0.02, gain: 0.64, noise: 0.08 },
  investida: { duration: 0.53, frequencyScale: 0.82, pitchBend: 0.48, gain: 0.65, noise: 0.72, noiseCutoff: 2600 },
  impacto: { duration: 0.39, frequencyScale: 0.64, pitchBend: -0.5, gain: 0.72, noise: 0.66, noiseCutoff: 1100 },
  vulneravel: { duration: 0.76, frequencyScale: 0.94, pitchBend: -0.22, gain: 0.6, noise: 0.12 },
})
