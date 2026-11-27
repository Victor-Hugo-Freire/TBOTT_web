import { createRoomInteractionSource } from './createRoomInteractionSource.js'

export default {
  name: 'room-rest',
  createSource: (context) => createRoomInteractionSource(context, {
    duration: 0.52,
    frequency: 248,
    pitchBend: -0.13,
    gain: 0.36,
    noise: 0.012,
    noiseCutoff: 2800,
    noiseDecay: 5,
    reverb: 0.62,
    partials: [
      { ratio: 1, level: 0.45, decay: 2.8 },
      { ratio: 1.5, level: 0.28, decay: 3.5 },
      { ratio: 2, level: 0.16, decay: 4.2 },
    ],
  }),
  options: { maxVoices: 1, cooldownMs: 200 },
}
