import { createProceduralAudioSource } from '../createProceduralAudioSource.js'

const COMMON_CUES = {
  aviso: { duration: 0.31, frequencyScale: 1.65, pitchBend: 0.2, gain: 0.48, noise: 0.18 },
  dano: { duration: 0.28, frequencyScale: 0.72, pitchBend: -0.3, gain: 0.62, noise: 0.3 },
  morte: { duration: 0.68, frequencyScale: 0.52, pitchBend: -0.48, gain: 0.57, noise: 0.2 },
  ataque: { duration: 0.34, frequencyScale: 1.18, pitchBend: 0.12, gain: 0.56, noise: 0.24 },
}

export function createBossEffects(enemyId, signature, cues) {
  const allCues = { ...COMMON_CUES, ...cues }
  return Object.entries(allCues).map(([cue, definition], index) => {
    const {
      frequencyScale = 1,
      pitchBend = 0,
      gain = 0.52,
      noise = 0.16,
      ...recipe
    } = definition
    const sourceRecipe = {
      duration: recipe.duration,
      frequency: signature.frequency * frequencyScale,
      pitchBend,
      gain,
      noise,
      noiseCutoff: signature.noiseCutoff,
      noiseDecay: signature.noiseDecay ?? 17,
      reverb: signature.reverb ?? 0.3,
      attack: 0.006,
      release: Math.min(0.09, recipe.duration * 0.38),
      pitchModulationDepth: signature.pitchModulationDepth ?? 0.004,
      pitchModulationRate: 4.2 + index * 0.37,
      partials: signature.partials,
      ...recipe,
    }

    return {
      name: `boss-${enemyId}-${cue}`,
      createSource: (context) => createProceduralAudioSource(context, sourceRecipe),
      options: { maxVoices: 3, cooldownMs: cue === 'aviso' ? 100 : 55 },
    }
  })
}
