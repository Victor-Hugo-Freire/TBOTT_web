import { createProceduralAudioSource } from '../../createProceduralAudioSource.js'

export default {
  name: 'character-tung-tung-sahur-morte',
  createSource: (context) => createProceduralAudioSource(context, {
    duration: 0.46, frequency: 88, pitchBend: -0.82, gain: 0.76, noise: 0.34,
    noiseCutoff: 1250, noiseDecay: 8, reverb: 0.34,
    partials: [{ ratio: 1, level: 0.72, decay: 5 }, { ratio: 1.49, level: 0.3, decay: 7 }, { ratio: 2.12, level: 0.14, decay: 10 }],
  }),
  options: { maxVoices: 1, cooldownMs: 500 },
}
