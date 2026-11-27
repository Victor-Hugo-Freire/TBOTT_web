import { createProceduralAudioSource } from '../../createProceduralAudioSource.js'

export default {
  name: 'character-tung-tung-sahur-item-efeito',
  createSource: (context) => createProceduralAudioSource(context, {
    duration: 0.14, frequency: 780, pitchBend: 0.14, gain: 0.48, noise: 0.12,
    noiseCutoff: 4300, noiseDecay: 28, reverb: 0.26,
    partials: [{ ratio: 1, level: 0.4, decay: 14 }, { ratio: 1.34, level: 0.25, decay: 18 }, { ratio: 2.6, level: 0.18, decay: 24 }],
  }),
  options: { maxVoices: 1, cooldownMs: 85 },
}
