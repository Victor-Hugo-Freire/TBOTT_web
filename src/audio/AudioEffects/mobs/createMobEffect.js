import { createProceduralAudioSource } from '../createProceduralAudioSource.js'

export function createMobEffect(name, recipe, options) {
  const organicRecipe = {
    ...recipe,
    attack: recipe.attack ?? 0.008,
    release: recipe.release ?? 0.06,
    pitchModulationDepth: recipe.pitchModulationDepth ?? 0.0035,
    pitchModulationRate: recipe.pitchModulationRate ?? 3.8,
  }

  return {
    name,
    createSource: (context) => createProceduralAudioSource(context, organicRecipe),
    options,
  }
}
