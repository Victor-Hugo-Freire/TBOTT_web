import step from './tung-tung-sahur/passo.js'
import attack from './tung-tung-sahur/ataque.js'
import hit from './tung-tung-sahur/acerto.js'
import hurt from './tung-tung-sahur/dano.js'
import death from './tung-tung-sahur/morte.js'
import itemPickup from './tung-tung-sahur/itemColeta.js'
import itemEffect from './tung-tung-sahur/itemEfeito.js'

export const CHARACTER_EFFECTS = [step, attack, hit, hurt, death, itemPickup, itemEffect]

export function registerCharacterEffects(audioManager) {
  for (const { name, createSource, options } of CHARACTER_EFFECTS) {
    audioManager.registerEffect(name, createSource, options)
  }
}

export function unregisterCharacterEffects(audioManager) {
  for (const { name } of CHARACTER_EFFECTS) {
    audioManager.unregisterEffect(name)
  }
}
