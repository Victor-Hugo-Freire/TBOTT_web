import { createProceduralAudioSource } from '../../createProceduralAudioSource.js'

export default {
  name: 'character-tung-tung-sahur-item-parmesao-lancamento',
  createSource: (context) => createProceduralAudioSource(context, {
    duration: 0.12, frequency: 1300, pitchBend: 0.3, gain: 0.39, noise: 0.4,
    noiseCutoff: 6000, noiseDecay: 26, reverb: 0.2,
    partials: [{ ratio: 1, level: 0.38, decay: 17 }, { ratio: 2.2, level: 0.2, decay: 24 }],
  }),
  options: { maxVoices: 1, cooldownMs: 80 },
}
