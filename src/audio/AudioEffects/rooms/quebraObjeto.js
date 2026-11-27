import { createRoomInteractionSource } from './createRoomInteractionSource.js'

export default {
  name: 'room-object-break',
  createSource: (context) => createRoomInteractionSource(context, {
    duration: 0.23,
    frequency: 185,
    pitchBend: 0.3,
    gain: 0.82,
    noise: 0.3,
    noiseCutoff: 2600,
    noiseDecay: 24,
    reverb: 0.3,
    partials: [
      { ratio: 1, level: 0.55, decay: 9 },
      { ratio: 2.2, level: 0.21, decay: 14 },
      { ratio: 3.7, level: 0.1, decay: 20 },
    ],
  }),
  options: { maxVoices: 4, cooldownMs: 45 },
}
