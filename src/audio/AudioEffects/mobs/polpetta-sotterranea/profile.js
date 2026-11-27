export default {
  bodyGain: 0.9,
  partials: [
    { ratio: 0.54, level: 0.34, decay: 5 },
    { ratio: 1, level: 0.55, decay: 8 },
    { ratio: 1.28, level: 0.24, decay: 12 },
    { ratio: 2.07, level: 0.12, decay: 18 },
  ],
  noiseCutoff: 1350, noiseGain: 1, noiseDecay: 1.05,
  wobbleRate: 4, wobbleDepth: 0.015, pulseRate: 4.5, pulseDepth: 0.2, echo: 0.22,
  aviso: {
    ratio: 0.78, start: 0.08, length: 0.7, gain: 0.32, bend: -0.32,
    partials: [{ ratio: 1, level: 0.62, decay: 6 }, { ratio: 1.31, level: 0.29, decay: 10 }],
    noise: { start: 0.02, length: 0.62, gain: 0.64, cutoff: 1050, decay: 14, pulseRate: 5, pulseDepth: 0.42 },
  },
  dano: {
    ratio: 0.58, length: 0.34, gain: 0.58, bend: 0.38,
    partials: [{ ratio: 1, level: 0.65, decay: 7 }, { ratio: 1.76, level: 0.24, decay: 13 }],
    noise: { start: 0, length: 0.58, gain: 0.64, cutoff: 1750, decay: 20 },
  },
  morte: {
    ratio: 0.42, start: 0.18, length: 0.8, gain: 0.44, bend: 0.48,
    partials: [{ ratio: 1, level: 0.65, decay: 4 }, { ratio: 1.48, level: 0.28, decay: 7 }],
    noise: { start: 0.1, length: 0.9, gain: 0.64, cutoff: 1450, decay: 11 },
  },
  ataque: {
    ratio: 0.38, length: 0.46, gain: 0.5, bend: -0.56,
    partials: [{ ratio: 1, level: 0.72, decay: 12 }, { ratio: 1.8, level: 0.24, decay: 20 }],
    noise: { start: 0, length: 0.62, gain: 0.7, cutoff: 1500, decay: 20 },
  },
}
