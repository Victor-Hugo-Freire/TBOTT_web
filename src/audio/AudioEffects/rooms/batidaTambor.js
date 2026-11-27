import { createRoomInteractionSource } from './createRoomInteractionSource.js'

export default {
  name: 'room-drum-hit',
  createSource: (context) => createRoomInteractionSource(context, {
    duration: 0.3,
    frequency: 84,
    pitchBend: 0.22,
    gain: 0.88,
    noise: 0.16,
    noiseCutoff: 1500,
    noiseDecay: 20,
    reverb: 0.3,
    partials: [
      { ratio: 1, level: 0.62, decay: 6 },
      { ratio: 1.47, level: 0.28, decay: 8 },
      { ratio: 2.18, level: 0.13, decay: 11 },
    ],
  }),
  options: { maxVoices: 3, cooldownMs: 80 },
}
