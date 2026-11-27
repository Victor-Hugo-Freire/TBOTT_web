export default {
  bodyGain: 0.68,
  partials: [
    { ratio: 1, level: 0.42, decay: 7 },
    { ratio: 1.97, level: 0.28, decay: 11 },
    { ratio: 3.04, level: 0.2, decay: 16 },
    { ratio: 4.11, level: 0.12, decay: 21 },
  ],
  noiseCutoff: 2800, noiseGain: 0.68, noiseDecay: 1.1,
  wobbleRate: 38, wobbleDepth: 0.012, pulseRate: 31, pulseDepth: 0.4, echo: 0.14,
  aviso: {
    ratio: 0.82, start: 0.07, length: 0.78, gain: 0.38, bend: 0.4,
    partials: [{ ratio: 1, level: 0.48, decay: 8 }, { ratio: 1.95, level: 0.35, decay: 12 }],
    noise: { start: 0.04, length: 0.8, gain: 0.4, cutoff: 3100, decay: 9, pulseRate: 36, pulseDepth: 0.46 },
  },
  dano: {
    ratio: 1.22, length: 0.3, gain: 0.42, bend: 0.3,
    partials: [{ ratio: 1, level: 0.56, decay: 8 }, { ratio: 2.37, level: 0.3, decay: 13 }],
    noise: { start: 0, length: 0.38, gain: 0.58, cutoff: 3900, decay: 18 },
  },
  morte: {
    ratio: 0.52, start: 0.18, length: 0.74, gain: 0.38, bend: 0.62,
    partials: [{ ratio: 1, level: 0.54, decay: 4 }, { ratio: 1.96, level: 0.3, decay: 7 }],
    noise: { start: 0.12, length: 0.8, gain: 0.5, cutoff: 2600, decay: 12, pulseRate: 28, pulseDepth: 0.38 },
  },
}
