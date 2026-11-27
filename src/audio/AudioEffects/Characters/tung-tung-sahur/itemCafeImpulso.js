import { createProceduralAudioSource } from '../../createProceduralAudioSource.js'

export default {
  name: 'character-tung-tung-sahur-item-cafe-impulso',
  createSource: (context) => createProceduralAudioSource(context, {
    duration: 0.17, frequency: 910, pitchBend: 0.28, gain: 0.46, noise: 0.12,
    noiseCutoff: 4700, noiseDecay: 28, reverb: 0.25,
    partials: [{ ratio: 1, level: 0.43, decay: 11 }, { ratio: 1.7, level: 0.24, decay: 15 }, { ratio: 2.4, level: 0.16, decay: 20 }],
  }),
  options: { maxVoices: 1, cooldownMs: 120 },
}
