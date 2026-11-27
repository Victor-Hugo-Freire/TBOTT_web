export default {
  bodyGain: 0.64,
  partials: [
    { ratio: 1, level: 0.38, decay: 8 },
    { ratio: 1.51, level: 0.3, decay: 12 },
    { ratio: 2.37, level: 0.22, decay: 17 },
    { ratio: 3.89, level: 0.13, decay: 22 },
  ],
  noiseCutoff: 6100, noiseGain: 0.56, noiseDecay: 1.25,
  wobbleRate: 57, wobbleDepth: 0.008, pulseRate: 62, pulseDepth: 0.42, echo: 0.13,
  aviso: {
    ratio: 1.54, start: 0.06, length: 0.76, gain: 0.32, bend: 0.18,
    partials: [{ ratio: 1, level: 0.48, decay: 8 }, { ratio: 2.43, level: 0.38, decay: 12 }],
    noise: { start: 0.02, length: 0.84, gain: 0.26, cutoff: 6800, decay: 10, pulseRate: 64, pulseDepth: 0.5 },
  },
  dano: {
    ratio: 1.78, length: 0.3, gain: 0.34, bend: -0.18,
    partials: [{ ratio: 1, level: 0.5, decay: 8 }, { ratio: 2.61, level: 0.35, decay: 13 }],
    noise: { start: 0, length: 0.3, gain: 0.44, cutoff: 6200, decay: 22 },
  },
  morte: {
    ratio: 0.72, start: 0.12, length: 0.78, gain: 0.34, bend: 0.5,
    partials: [{ ratio: 1, level: 0.55, decay: 5 }, { ratio: 1.62, level: 0.32, decay: 8 }],
    noise: { start: 0.08, length: 0.78, gain: 0.36, cutoff: 5300, decay: 13, pulseRate: 46, pulseDepth: 0.36 },
  },
  ataque: {
    ratio: 1.56, length: 0.32, gain: 0.38, bend: -0.12,
    partials: [{ ratio: 1, level: 0.5, decay: 11 }, { ratio: 3.2, level: 0.36, decay: 19 }],
    noise: { start: 0, length: 0.38, gain: 0.38, cutoff: 7000, decay: 22 },
  },
}
