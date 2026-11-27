import { createBossEffects } from '../createBossEffects.js'

export default createBossEffects('bombardiro-crocodilo', {
  frequency: 96,
  noiseCutoff: 1250,
  noiseDecay: 8,
  reverb: 0.24,
  partials: [
    { ratio: 1, level: 0.7, decay: 3 },
    { ratio: 1.98, level: 0.4, decay: 5 },
    { ratio: 3.04, level: 0.18, decay: 8 },
  ],
}, {
  bomba: { duration: 0.37, frequencyScale: 1.4, pitchBend: 0.39, gain: 0.62, noise: 0.55, noiseCutoff: 1900 },
  explosao: { duration: 0.56, frequencyScale: 0.58, pitchBend: -0.42, gain: 0.78, noise: 0.84, noiseCutoff: 1100 },
  pouso: { duration: 0.73, frequencyScale: 0.78, pitchBend: -0.17, gain: 0.66, noise: 0.59, noiseCutoff: 1500 },
})
