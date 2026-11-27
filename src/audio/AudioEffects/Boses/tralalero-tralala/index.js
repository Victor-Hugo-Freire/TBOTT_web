import { createBossEffects } from '../createBossEffects.js'

export default createBossEffects('tralalero-tralala', {
  frequency: 236,
  noiseCutoff: 3400,
  noiseDecay: 19,
  reverb: 0.48,
  pitchModulationDepth: 0.009,
  partials: [
    { ratio: 1, level: 0.52, decay: 4 },
    { ratio: 1.49, level: 0.34, decay: 8 },
    { ratio: 2.36, level: 0.25, decay: 12 },
    { ratio: 3.71, level: 0.12, decay: 16 },
  ],
}, {
  canto: { duration: 0.59, frequencyScale: 1.44, pitchBend: 0.14, gain: 0.53, noise: 0.1, modulationDepth: 0.16, modulationRate: 7 },
  pauta: { duration: 0.48, frequencyScale: 1.08, pitchBend: -0.02, gain: 0.56, noise: 0.12, modulationDepth: 0.12, modulationRate: 4.5 },
  mergulho: { duration: 0.62, frequencyScale: 0.9, pitchBend: 0.38, gain: 0.62, noise: 0.46 },
  respingo: { duration: 0.42, frequencyScale: 0.78, pitchBend: -0.19, gain: 0.63, noise: 0.61, noiseCutoff: 5200 },
  mordida: { duration: 0.3, frequencyScale: 0.67, pitchBend: -0.35, gain: 0.72, noise: 0.42, noiseCutoff: 1900 },
  investida: { duration: 0.44, frequencyScale: 1.26, pitchBend: 0.32, gain: 0.6, noise: 0.4 },
  impacto: { duration: 0.35, frequencyScale: 0.64, pitchBend: -0.42, gain: 0.68, noise: 0.64, noiseCutoff: 1300 },
  vulneravel: { duration: 0.74, frequencyScale: 0.58, pitchBend: -0.36, gain: 0.58, noise: 0.2 },
  fase2: { duration: 0.79, frequencyScale: 1.72, pitchBend: 0.28, gain: 0.58, noise: 0.28 },
  fase3: { duration: 0.87, frequencyScale: 2.04, pitchBend: 0.36, gain: 0.61, noise: 0.32 },
})
