export default {
  bodyGain: 0.78,
  partials: [
    { ratio: 1, level: 0.48, decay: 7 },
    { ratio: 1.51, level: 0.3, decay: 11 },
    { ratio: 2.42, level: 0.2, decay: 16 },
    { ratio: 3.17, level: 0.1, decay: 21 },
  ],
  noiseCutoff: 5200, noiseGain: 0.85, noiseDecay: 1.25,
  wobbleRate: 13, wobbleDepth: 0.018, pulseRate: 17, pulseDepth: 0.22, echo: 0.23,
  aviso: {
    ratio: 1.72, start: 0.13, length: 0.6, gain: 0.27, bend: 0.18,
    partials: [{ ratio: 1, level: 0.6, decay: 8 }, { ratio: 1.83, level: 0.33, decay: 13 }],
    noise: { start: 0.05, length: 0.62, gain: 0.38, cutoff: 5800, decay: 12, pulseRate: 16, pulseDepth: 0.38 },
  },
  dano: {
    ratio: 1.34, length: 0.32, gain: 0.42, bend: -0.16,
    partials: [{ ratio: 1, level: 0.55, decay: 8 }, { ratio: 2.1, level: 0.34, decay: 12 }],
    noise: { start: 0, length: 0.42, gain: 0.6, cutoff: 4300, decay: 18 },
  },
  morte: {
    ratio: 0.84, start: 0.17, length: 0.68, gain: 0.36, bend: 0.45,
    partials: [{ ratio: 1, level: 0.58, decay: 4 }, { ratio: 1.61, level: 0.32, decay: 7 }],
    noise: { start: 0.1, length: 0.82, gain: 0.48, cutoff: 4900, decay: 12, pulseRate: 14, pulseDepth: 0.34 },
  },
}
