import { createRoomInteractionSource } from './createRoomInteractionSource.js'

export default {
  name: 'room-object-impact',
  createSource: (context) => createRoomInteractionSource(context, {
    duration: 0.28,
    frequency: 92,
    pitchBend: 0.28,
    gain: 0.76,
    noise: 0.36,
    noiseCutoff: 1750,
    noiseDecay: 24,
    reverb: 0.28,
    partials: [
      { ratio: 1, level: 0.57, decay: 9 },
      { ratio: 1.73, level: 0.21, decay: 13 },
      { ratio: 2.64, level: 0.1, decay: 18 },
    ],
  }),
  options: { maxVoices: 3, cooldownMs: 65 },
}
