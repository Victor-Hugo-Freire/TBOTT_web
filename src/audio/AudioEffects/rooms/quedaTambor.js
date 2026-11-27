import { createRoomInteractionSource } from './createRoomInteractionSource.js'

export default {
  name: 'room-drum-land',
  createSource: (context) => createRoomInteractionSource(context, {
    duration: 0.46,
    frequency: 58,
    pitchBend: 0.31,
    gain: 0.94,
    noise: 0.32,
    noiseCutoff: 1050,
    noiseDecay: 15,
    reverb: 0.42,
    partials: [
      { ratio: 1, level: 0.68, decay: 4 },
      { ratio: 1.54, level: 0.28, decay: 6 },
      { ratio: 2.37, level: 0.12, decay: 8 },
    ],
  }),
  options: { maxVoices: 2, cooldownMs: 150 },
}
