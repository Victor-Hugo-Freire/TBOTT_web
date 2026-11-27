export default {
  bodyGain: 0.75,
  partials: [
    { ratio: 1, level: 0.44, decay: 7 },
    { ratio: 2.03, level: 0.32, decay: 11 },
    { ratio: 3.17, level: 0.2, decay: 16 },
    { ratio: 4.76, level: 0.11, decay: 23 },
  ],
  noiseCutoff: 4200, noiseGain: 0.75, noiseDecay: 1.3,
  wobbleRate: 4.4, wobbleDepth: 0.009, pulseRate: 0, pulseDepth: 0, echo: 0.34,
  aviso: {
    ratio: 2.62, start: 0.12, length: 0.72, gain: 0.3, bend: -0.38,
    partials: [{ ratio: 1, level: 0.54, decay: 5 }, { ratio: 2.71, level: 0.42, decay: 10 }],
    noise: { start: 0.14, length: 0.66, gain: 0.44, cutoff: 5000, decay: 13 },
  },
  dano: {
    ratio: 1.84, length: 0.34, gain: 0.4, bend: 0.32,
    partials: [{ ratio: 1, level: 0.56, decay: 5 }, { ratio: 3.31, level: 0.37, decay: 9 }],
    noise: { start: 0, length: 0.46, gain: 0.6, cutoff: 6200, decay: 16 },
  },
  morte: {
    ratio: 0.56, start: 0.14, length: 0.82, gain: 0.42, bend: 0.68,
    partials: [{ ratio: 1, level: 0.55, decay: 3 }, { ratio: 2.86, level: 0.35, decay: 6 }],
    noise: { start: 0.12, length: 0.76, gain: 0.54, cutoff: 5200, decay: 11 },
  },
}
