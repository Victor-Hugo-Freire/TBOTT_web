export default {
  bodyGain: 0.7,
  partials: [
    { ratio: 1, level: 0.46, decay: 5 },
    { ratio: 1.97, level: 0.3, decay: 8 },
    { ratio: 2.76, level: 0.22, decay: 12 },
    { ratio: 5.41, level: 0.12, decay: 18 },
  ],
  noiseCutoff: 5100, noiseGain: 0.72, noiseDecay: 1.45,
  wobbleRate: 3.4, wobbleDepth: 0.006, pulseRate: 0, pulseDepth: 0, echo: 0.4,
  aviso: {
    ratio: 2.54, start: 0.16, length: 0.74, gain: 0.34, bend: -0.08,
    partials: [{ ratio: 1, level: 0.58, decay: 5 }, { ratio: 2.63, level: 0.4, decay: 9 }],
    noise: { start: 0.12, length: 0.76, gain: 0.32, cutoff: 6200, decay: 10 },
  },
  dano: {
    ratio: 1.16, length: 0.5, gain: 0.48, bend: 0.12,
    partials: [{ ratio: 1, level: 0.55, decay: 5 }, { ratio: 2.83, level: 0.38, decay: 9 }],
    noise: { start: 0, length: 0.3, gain: 0.5, cutoff: 5700, decay: 20 },
  },
  morte: {
    ratio: 0.68, start: 0.18, length: 0.84, gain: 0.38, bend: 0.28,
    partials: [{ ratio: 1, level: 0.55, decay: 4 }, { ratio: 2.76, level: 0.32, decay: 7 }],
    noise: { start: 0.08, length: 0.86, gain: 0.48, cutoff: 4800, decay: 11 },
  },
  ataque: {
    ratio: 0.42, length: 0.48, gain: 0.52, bend: 0.16,
    partials: [{ ratio: 1, level: 0.7, decay: 15 }, { ratio: 3.1, level: 0.3, decay: 24 }],
    noise: { start: 0, length: 0.5, gain: 0.58, cutoff: 5200, decay: 20 },
  },
}
