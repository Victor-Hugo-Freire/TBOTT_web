import { createRoomInteractionSource } from './createRoomInteractionSource.js'

export default {
  name: 'room-object-roll',
  createSource: (context) => createRoomInteractionSource(context, {
    duration: 0.38,
    frequency: 112,
    pitchBend: -0.08,
    gain: 0.52,
    noise: 0.17,
    noiseCutoff: 1900,
    noiseDecay: 5,
    modulationRate: 27,
    modulationDepth: 0.32,
    reverb: 0.2,
    partials: [
      { ratio: 1, level: 0.48, decay: 4 },
      { ratio: 1.49, level: 0.19, decay: 5 },
      { ratio: 2.03, level: 0.12, decay: 6 },
    ],
  }),
  options: { maxVoices: 3, cooldownMs: 60 },
}
