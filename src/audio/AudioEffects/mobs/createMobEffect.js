import { createMobAudioSource } from './createMobAudioSource.js'
import { MOB_SOUND_PROFILES } from './profileRegistry.js'

export function createMobEffect(name, recipe, options) {
  const identity = /^mob-(.+)-(aviso|dano|morte)$/.exec(name)
  if (!identity) throw new TypeError(`Nome de efeito de mob inválido: "${name}".`)

  const [, enemyId, event] = identity
  const profile = MOB_SOUND_PROFILES[enemyId]
  if (!profile) throw new TypeError(`Perfil sonoro de mob não encontrado: "${enemyId}".`)

  const organicRecipe = {
    ...recipe,
    attack: recipe.attack ?? 0.008,
    release: recipe.release ?? 0.06,
    pitchModulationDepth: recipe.pitchModulationDepth ?? 0.0035,
  }

  return {
    name,
    createSource: (context) => createMobAudioSource(context, organicRecipe, profile, event),
    options,
  }
}
