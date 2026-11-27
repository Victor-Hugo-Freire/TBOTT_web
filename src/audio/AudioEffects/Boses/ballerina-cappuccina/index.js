import { createBossEffects } from '../createBossEffects.js'

export default createBossEffects('ballerina-cappuccina', {
  frequency: 292,
  noiseCutoff: 4400,
  noiseDecay: 18,
  reverb: 0.5,
  pitchModulationDepth: 0.008,
  partials: [
    { ratio: 1, level: 0.47, decay: 5 },
    { ratio: 2.16, level: 0.42, decay: 9 },
    { ratio: 3.83, level: 0.27, decay: 14 },
  ],
}, {
  pirueta: { duration: 0.61, frequencyScale: 1.26, pitchBend: 0.22, gain: 0.58, noise: 0.25, modulationDepth: 0.19, modulationRate: 8 },
  gotas: { duration: 0.32, frequencyScale: 2.1, pitchBend: 0.32, gain: 0.56, noise: 0.18 },
  impacto: { duration: 0.39, frequencyScale: 0.74, pitchBend: -0.45, gain: 0.68, noise: 0.58, noiseCutoff: 1700 },
  vulneravel: { duration: 0.69, frequencyScale: 0.62, pitchBend: -0.34, gain: 0.59, noise: 0.22 },
})
