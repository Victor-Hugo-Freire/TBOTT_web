import { createProceduralAudioSource } from '../../createProceduralAudioSource.js'

export default {
  name: 'character-tung-tung-sahur-item-concha-poca',
  createSource: (context) => createProceduralAudioSource(context, {
    duration: 0.25, frequency: 330, pitchBend: 0.15, gain: 0.54, noise: 0.68,
    noiseCutoff: 2200, noiseDecay: 16, reverb: 0.3,
    partials: [{ ratio: 1, level: 0.3, decay: 10 }, { ratio: 1.8, level: 0.16, decay: 16 }],
  }),
  options: { maxVoices: 2, cooldownMs: 70 },
}
