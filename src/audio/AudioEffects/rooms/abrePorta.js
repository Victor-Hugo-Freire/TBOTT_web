import { createRoomInteractionSource } from './createRoomInteractionSource.js'

export default {
  name: 'room-door-open',
  createSource: (context) => createRoomInteractionSource(context, {
    duration: 0.34,
    frequency: 205,
    pitchBend: -0.1,
    gain: 0.67,
    noise: 0.2,
    noiseCutoff: 1300,
    noiseDecay: 5,
    modulationRate: 7,
    modulationDepth: 0.18,
    reverb: 0.38,
    partials: [
      { ratio: 1, level: 0.51, decay: 4 },
      { ratio: 1.37, level: 0.2, decay: 5 },
      { ratio: 2.06, level: 0.12, decay: 6 },
    ],
  }),
  options: { maxVoices: 3, cooldownMs: 100 },
}
