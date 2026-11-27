import { createRoomInteractionSource } from './createRoomInteractionSource.js'

export default {
  name: 'room-arcade-result',
  createSource: (context) => createRoomInteractionSource(context, {
    duration: 0.24,
    frequency: 570,
    pitchBend: -0.16,
    gain: 0.46,
    noise: 0.008,
    noiseCutoff: 4200,
    noiseDecay: 30,
    reverb: 0.48,
    partials: [
      { ratio: 1, level: 0.38, decay: 9 },
      { ratio: 1.34, level: 0.26, decay: 11 },
      { ratio: 1.81, level: 0.16, decay: 14 },
    ],
  }),
  options: { maxVoices: 2, cooldownMs: 120 },
}
