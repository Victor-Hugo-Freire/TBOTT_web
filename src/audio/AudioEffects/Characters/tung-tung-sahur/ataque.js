import { createProceduralAudioSource } from '../../createProceduralAudioSource.js'

export default {
  name: 'character-tung-tung-sahur-ataque',
  createSource: (context) => createProceduralAudioSource(context, {
    duration: 0.104, frequency: 205, pitchBend: 0.32, gain: 0.56, noise: 0.36,
    noiseCutoff: 3100, noiseDecay: 24, reverb: 0.16,
    partials: [{ ratio: 1, level: 0.64, decay: 20 }, { ratio: 1.8, level: 0.18, decay: 25 }],
  }),
  options: { maxVoices: 2, cooldownMs: 65 },
}
