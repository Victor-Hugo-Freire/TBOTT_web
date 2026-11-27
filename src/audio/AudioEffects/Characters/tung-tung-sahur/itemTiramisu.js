import { createProceduralAudioSource } from '../../createProceduralAudioSource.js'

export default {
  name: 'character-tung-tung-sahur-item-tiramisu',
  createSource: (context) => createProceduralAudioSource(context, {
    duration: 0.21, frequency: 1040, pitchBend: 0.12, gain: 0.44, noise: 0.015,
    noiseCutoff: 5200, noiseDecay: 30, reverb: 0.38,
    partials: [{ ratio: 1, level: 0.4, decay: 10 }, { ratio: 1.5, level: 0.3, decay: 13 }, { ratio: 2.25, level: 0.17, decay: 18 }],
  }),
  options: { maxVoices: 1, cooldownMs: 100 },
}
