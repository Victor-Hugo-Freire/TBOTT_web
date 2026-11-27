export default {
  bodyGain: 0.72,
  partials: [
    { ratio: 0.74, level: 0.26, decay: 5 },
    { ratio: 1, level: 0.38, decay: 8 },
    { ratio: 1.89, level: 0.25, decay: 12 },
    { ratio: 3.27, level: 0.16, decay: 19 },
  ],
  noiseCutoff: 6900, noiseGain: 1.15, noiseDecay: 0.82,
  wobbleRate: 9, wobbleDepth: 0.014, pulseRate: 21, pulseDepth: 0.28, echo: 0.18,
  aviso: {
    ratio: 1.52, start: 0.08, length: 0.72, gain: 0.31, bend: 0.36,
    partials: [{ ratio: 1, level: 0.5, decay: 7 }, { ratio: 2.03, level: 0.36, decay: 12 }],
    noise: { start: 0.02, length: 0.84, gain: 0.8, cutoff: 7600, decay: 8, pulseRate: 24, pulseDepth: 0.42 },
  },
  dano: {
    ratio: 0.62, length: 0.3, gain: 0.52, bend: 0.48,
    partials: [{ ratio: 1, level: 0.62, decay: 5 }, { ratio: 2.9, level: 0.28, decay: 10 }],
    noise: { start: 0, length: 0.72, gain: 0.82, cutoff: 7200, decay: 12, pulseRate: 23, pulseDepth: 0.48 },
  },
  morte: {
    ratio: 0.36, start: 0.08, length: 0.86, gain: 0.52, bend: 0.66,
    partials: [{ ratio: 1, level: 0.65, decay: 3 }, { ratio: 1.73, level: 0.3, decay: 6 }],
    noise: { start: 0.02, length: 0.9, gain: 1.1, cutoff: 5800, decay: 8, pulseRate: 18, pulseDepth: 0.5 },
  },
}
