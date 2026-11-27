import { createProceduralAudioSource } from '../../createProceduralAudioSource.js'

export default {
  name: 'character-tung-tung-sahur-item-dente-frenesi',
  createSource: (context) => createProceduralAudioSource(context, {
    duration: 0.28, frequency: 680, pitchBend: 0.2, gain: 0.5, noise: 0.1,
    noiseCutoff: 4300, noiseDecay: 22, reverb: 0.34,
    partials: [{ ratio: 1, level: 0.42, decay: 8 }, { ratio: 2.8, level: 0.27, decay: 13 }, { ratio: 4.2, level: 0.14, decay: 19 }],
  }),
  options: { maxVoices: 1, cooldownMs: 100 },
}
