import { createProceduralAudioSource } from '../../createProceduralAudioSource.js'

export default {
  name: 'character-tung-tung-sahur-item-coleta',
  createSource: (context) => createProceduralAudioSource(context, {
    duration: 0.19, frequency: 610, pitchBend: 0.22, gain: 0.54, noise: 0.035,
    noiseCutoff: 5200, noiseDecay: 32, reverb: 0.38,
    partials: [{ ratio: 1, level: 0.48, decay: 10 }, { ratio: 1.5, level: 0.32, decay: 13 }, { ratio: 2.05, level: 0.18, decay: 18 }],
  }),
  options: { maxVoices: 1, cooldownMs: 100 },
}
