import { createRoomInteractionSource } from './createRoomInteractionSource.js'

export default {
  name: 'room-wall-hit',
  createSource: (context) => createRoomInteractionSource(context, {
    duration: 0.21,
    frequency: 138,
    pitchBend: 0.26,
    gain: 0.72,
    noise: 0.27,
    noiseCutoff: 2100,
    noiseDecay: 26,
    reverb: 0.2,
    partials: [
      { ratio: 1, level: 0.52, decay: 11 },
      { ratio: 1.9, level: 0.2, decay: 16 },
      { ratio: 3.1, level: 0.09, decay: 22 },
    ],
  }),
  options: { maxVoices: 3, cooldownMs: 80 },
}
