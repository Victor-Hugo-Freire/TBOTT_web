import { createProceduralAudioSource } from '../../createProceduralAudioSource.js'

export default {
  name: 'character-tung-tung-sahur-item-parmesao-impacto',
  createSource: (context) => createProceduralAudioSource(context, {
    duration: 0.155, frequency: 250, pitchBend: -0.25, gain: 0.53, noise: 0.55,
    noiseCutoff: 3200, noiseDecay: 22, reverb: 0.22,
    partials: [{ ratio: 1, level: 0.48, decay: 12 }, { ratio: 2.7, level: 0.18, decay: 20 }],
  }),
  options: { maxVoices: 2, cooldownMs: 70 },
}
