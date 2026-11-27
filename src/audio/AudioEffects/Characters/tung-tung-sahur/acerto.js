import { createProceduralAudioSource } from '../../createProceduralAudioSource.js'

export default {
  name: 'character-tung-tung-sahur-acerto',
  createSource: (context) => createProceduralAudioSource(context, {
    duration: 0.078, frequency: 118, pitchBend: -0.34, gain: 0.72, noise: 0.28,
    noiseCutoff: 1900, noiseDecay: 20, reverb: 0.12,
    partials: [{ ratio: 1, level: 0.76, decay: 18 }, { ratio: 2.1, level: 0.16, decay: 24 }],
  }),
  options: { maxVoices: 2, cooldownMs: 55 },
}
