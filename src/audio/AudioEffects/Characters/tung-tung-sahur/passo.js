import { createProceduralAudioSource } from '../../createProceduralAudioSource.js'

export default {
  name: 'character-tung-tung-sahur-passo',
  createSource: (context) => createProceduralAudioSource(context, {
    duration: 0.056, frequency: 92, pitchBend: -0.18, gain: 0.62, noise: 0.16,
    noiseCutoff: 1250, noiseDecay: 30, reverb: 0.08,
    partials: [{ ratio: 1, level: 0.72, decay: 32 }, { ratio: 2.4, level: 0.14, decay: 44 }],
  }),
  options: { maxVoices: 1, cooldownMs: 55 },
}
