import { createRoomInteractionSource } from './createRoomInteractionSource.js'

export default {
  name: 'room-door-unlock',
  createSource: (context) => createRoomInteractionSource(context, {
    duration: 0.26,
    frequency: 410,
    pitchBend: -0.12,
    gain: 0.54,
    noise: 0.13,
    noiseCutoff: 3100,
    noiseDecay: 25,
    reverb: 0.36,
    partials: [
      { ratio: 1, level: 0.46, decay: 8 },
      { ratio: 1.51, level: 0.25, decay: 10 },
      { ratio: 2.42, level: 0.12, decay: 13 },
    ],
  }),
  options: { maxVoices: 2, cooldownMs: 100 },
}
