import { createRoomInteractionSource } from './createRoomInteractionSource.js'

export default {
  name: 'room-glass-break',
  createSource: (context) => createRoomInteractionSource(context, {
    duration: 0.19,
    frequency: 1050,
    pitchBend: 0.16,
    gain: 0.78,
    noise: 0.42,
    noiseCutoff: 7200,
    noiseDecay: 17,
    reverb: 0.42,
    partials: [
      { ratio: 1, level: 0.42, decay: 8 },
      { ratio: 1.63, level: 0.27, decay: 11 },
      { ratio: 2.31, level: 0.16, decay: 14 },
    ],
  }),
  options: { maxVoices: 4, cooldownMs: 35 },
}
