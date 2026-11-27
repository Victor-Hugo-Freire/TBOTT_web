import { createProceduralAudioSource } from '../../createProceduralAudioSource.js'

export default {
  name: 'character-tung-tung-sahur-item-escudo',
  createSource: (context) => createProceduralAudioSource(context, {
    duration: 0.245, frequency: 410, pitchBend: -0.28, gain: 0.55, noise: 0.32,
    noiseCutoff: 3600, noiseDecay: 22, reverb: 0.28,
    partials: [{ ratio: 1, level: 0.52, decay: 9 }, { ratio: 1.6, level: 0.24, decay: 13 }, { ratio: 2.6, level: 0.16, decay: 20 }],
  }),
  options: { maxVoices: 1, cooldownMs: 120 },
}
