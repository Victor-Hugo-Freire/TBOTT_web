export default {
  bodyGain: 0.7,
  partials: [
    { ratio: 0.82, level: 0.2, decay: 7 },
    { ratio: 1, level: 0.44, decay: 9 },
    { ratio: 1.63, level: 0.3, decay: 13 },
    { ratio: 2.47, level: 0.2, decay: 19 },
  ],
  noiseCutoff: 4400, noiseGain: 0.66, noiseDecay: 1.2,
  wobbleRate: 11, wobbleDepth: 0.018, pulseRate: 7, pulseDepth: 0.08, echo: 0.18,
  aviso: {
    ratio: 1.76, start: 0.06, length: 0.64, gain: 0.35, bend: -0.62,
    partials: [{ ratio: 1, level: 0.55, decay: 6 }, { ratio: 1.74, level: 0.3, decay: 10 }],
    noise: { start: 0.08, length: 0.24, gain: 0.5, cutoff: 5600, decay: 24 },
  },
  dano: {
    ratio: 1.38, length: 0.28, gain: 0.46, bend: -0.42,
    partials: [{ ratio: 1, level: 0.62, decay: 7 }, { ratio: 2.16, level: 0.3, decay: 12 }],
    noise: { start: 0, length: 0.22, gain: 0.72, cutoff: 5100, decay: 24 },
  },
  morte: {
    ratio: 0.64, start: 0.16, length: 0.72, gain: 0.36, bend: 0.46,
    partials: [{ ratio: 1, level: 0.58, decay: 4 }, { ratio: 1.93, level: 0.3, decay: 8 }],
    noise: { start: 0.12, length: 0.7, gain: 0.46, cutoff: 3500, decay: 14 },
  },
  ataque: {
    ratio: 1.78, length: 0.36, gain: 0.42, bend: 0.2,
    partials: [{ ratio: 1, level: 0.56, decay: 12 }, { ratio: 3.35, level: 0.36, decay: 21 }],
    noise: { start: 0, length: 0.4, gain: 0.44, cutoff: 5800, decay: 19 },
  },
}
