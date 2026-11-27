import { createBossEffects } from '../createBossEffects.js'

export default createBossEffects('chimpanzini-bananini', {
  frequency: 184,
  noiseCutoff: 2800,
  noiseDecay: 15,
  reverb: 0.31,
  partials: [
    { ratio: 1, level: 0.57, decay: 4 },
    { ratio: 1.72, level: 0.35, decay: 8 },
    { ratio: 2.81, level: 0.22, decay: 13 },
  ],
}, {
  banana: { duration: 0.34, frequencyScale: 1.8, pitchBend: 0.46, gain: 0.58, noise: 0.25 },
  casca: { duration: 0.53, frequencyScale: 0.74, pitchBend: -0.38, gain: 0.62, noise: 0.55, noiseCutoff: 1600 },
  fase2: { duration: 0.71, frequencyScale: 1.34, pitchBend: 0.2, gain: 0.59, noise: 0.34 },
})
