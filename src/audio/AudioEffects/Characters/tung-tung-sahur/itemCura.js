import { createProceduralAudioSource } from '../../createProceduralAudioSource.js'

export default {
  name: 'character-tung-tung-sahur-item-cura',
  createSource: (context) => createProceduralAudioSource(context, {
    duration: 0.31, frequency: 560, pitchBend: 0.16, gain: 0.46, noise: 0.025,
    noiseCutoff: 4800, noiseDecay: 25, reverb: 0.42,
    partials: [{ ratio: 1, level: 0.42, decay: 7 }, { ratio: 1.5, level: 0.28, decay: 10 }, { ratio: 2.1, level: 0.2, decay: 14 }],
  }),
  options: { maxVoices: 1, cooldownMs: 150 },
}
