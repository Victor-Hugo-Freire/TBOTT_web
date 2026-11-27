import { createRoomInteractionSource } from './createRoomInteractionSource.js'

export default {
  name: 'room-arcade-spin',
  createSource: (context) => createRoomInteractionSource(context, {
    duration: 0.41,
    frequency: 335,
    pitchBend: -0.17,
    gain: 0.47,
    noise: 0.04,
    noiseCutoff: 3900,
    noiseDecay: 4,
    modulationRate: 12,
    modulationDepth: 0.28,
    reverb: 0.3,
    partials: [
      { ratio: 1, level: 0.4, decay: 3 },
      { ratio: 1.26, level: 0.24, decay: 4 },
      { ratio: 1.68, level: 0.14, decay: 5 },
    ],
  }),
  options: { maxVoices: 2, cooldownMs: 100 },
}
