export default {
  bodyGain: 0.88,
  partials: [
    { ratio: 0.62, level: 0.27, decay: 5 },
    { ratio: 1, level: 0.56, decay: 8 },
    { ratio: 1.34, level: 0.24, decay: 13 },
    { ratio: 2.13, level: 0.12, decay: 19 },
  ],
  noiseCutoff: 1150, noiseGain: 0.9, noiseDecay: 1.1,
  wobbleRate: 6, wobbleDepth: 0.012, pulseRate: 8, pulseDepth: 0.12, echo: 0.16,
  aviso: {
    ratio: 0.72, start: 0.12, length: 0.72, gain: 0.3, bend: -0.2,
    partials: [{ ratio: 1, level: 0.7, decay: 5 }, { ratio: 1.29, level: 0.3, decay: 9 }],
    noise: { start: 0.18, length: 0.48, gain: 0.3, cutoff: 950, decay: 16 },
  },
  dano: {
    ratio: 0.48, length: 0.42, gain: 0.58, bend: 0.42,
    partials: [{ ratio: 1, level: 0.7, decay: 8 }, { ratio: 1.73, level: 0.22, decay: 15 }],
    noise: { start: 0, length: 0.5, gain: 0.56, cutoff: 1650, decay: 22 },
  },
  morte: {
    ratio: 0.42, start: 0.22, length: 0.74, gain: 0.42, bend: 0.34,
    partials: [{ ratio: 1, level: 0.68, decay: 4 }, { ratio: 1.52, level: 0.27, decay: 7 }],
    noise: { start: 0.18, length: 0.7, gain: 0.48, cutoff: 1200, decay: 13 },
  },
  ataque: {
    ratio: 0.54, length: 0.42, gain: 0.48, bend: -0.5,
    partials: [{ ratio: 1, level: 0.72, decay: 14 }, { ratio: 2.4, level: 0.24, decay: 22 }],
    noise: { start: 0, length: 0.56, gain: 0.62, cutoff: 1800, decay: 24 },
  },
}
