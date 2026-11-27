import { createProceduralAudioSource } from '../../createProceduralAudioSource.js'

export default {
  name: 'character-tung-tung-sahur-dano',
  createSource: (context) => createProceduralAudioSource(context, {
    duration: 0.23, frequency: 124, pitchBend: -0.52, gain: 0.9, noise: 0.3,
    noiseCutoff: 1750, noiseDecay: 16, reverb: 0.2,
    partials: [{ ratio: 1, level: 0.66, decay: 11 }, { ratio: 1.47, level: 0.24, decay: 16 }, { ratio: 2.2, level: 0.12, decay: 21 }],
  }),
  options: { maxVoices: 1, cooldownMs: 120 },
}
