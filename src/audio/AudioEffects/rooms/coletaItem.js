import { createRoomInteractionSource } from './createRoomInteractionSource.js'

export default {
  name: 'room-pickup',
  createSource: (context) => createRoomInteractionSource(context, {
    duration: 0.2,
    frequency: 690,
    pitchBend: -0.22,
    gain: 0.54,
    noise: 0.025,
    noiseCutoff: 4500,
    noiseDecay: 35,
    reverb: 0.48,
    partials: [
      { ratio: 1, level: 0.42, decay: 9 },
      { ratio: 1.5, level: 0.29, decay: 12 },
      { ratio: 2.02, level: 0.16, decay: 15 },
    ],
  }),
  options: { maxVoices: 4, cooldownMs: 45 },
}
