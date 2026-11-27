export default {
  bodyGain: 0.8,
  partials: [
    { ratio: 1, level: 0.5, decay: 8 },
    { ratio: 1.42, level: 0.26, decay: 12 },
    { ratio: 2.21, level: 0.18, decay: 17 },
    { ratio: 3.76, level: 0.08, decay: 24 },
  ],
  noiseCutoff: 2700, noiseGain: 0.55, noiseDecay: 1.3,
  wobbleRate: 5, wobbleDepth: 0.022, pulseRate: 5, pulseDepth: 0.24, echo: 0.2,
  aviso: {
    ratio: 1.88, start: 0.1, length: 0.62, gain: 0.34, bend: -0.52,
    partials: [{ ratio: 1, level: 0.65, decay: 5 }, { ratio: 2.46, level: 0.3, decay: 9 }],
    noise: { start: 0.16, length: 0.32, gain: 0.2, cutoff: 2400, decay: 18 },
  },
  dano: {
    ratio: 1.63, length: 0.38, gain: 0.46, bend: -0.24,
    partials: [{ ratio: 1, level: 0.58, decay: 7 }, { ratio: 2.72, level: 0.28, decay: 12 }],
    noise: { start: 0, length: 0.28, gain: 0.34, cutoff: 3150, decay: 24 },
  },
  morte: {
    ratio: 0.72, start: 0.19, length: 0.8, gain: 0.4, bend: 0.54,
    partials: [{ ratio: 1, level: 0.6, decay: 4 }, { ratio: 1.87, level: 0.29, decay: 7 }],
    noise: { start: 0.12, length: 0.52, gain: 0.34, cutoff: 2200, decay: 15 },
  },
  ataque: {
    ratio: 0.88, length: 0.4, gain: 0.46, bend: -0.38,
    partials: [{ ratio: 1, level: 0.66, decay: 13 }, { ratio: 2.72, level: 0.28, decay: 21 }],
    noise: { start: 0, length: 0.52, gain: 0.48, cutoff: 3000, decay: 22 },
  },
}
