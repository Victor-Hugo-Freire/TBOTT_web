import step from './tung-tung-sahur/passo.js'
import attack from './tung-tung-sahur/ataque.js'
import hit from './tung-tung-sahur/acerto.js'
import hurt from './tung-tung-sahur/dano.js'
import death from './tung-tung-sahur/morte.js'
import itemPickup from './tung-tung-sahur/itemColeta.js'
import itemEffect from './tung-tung-sahur/itemEfeito.js'
import itemShield from './tung-tung-sahur/itemEscudo.js'
import itemHeal from './tung-tung-sahur/itemCura.js'
import itemCoffeeBoost from './tung-tung-sahur/itemCafeImpulso.js'
import itemTiramisu from './tung-tung-sahur/itemTiramisu.js'
import itemPuddle from './tung-tung-sahur/itemConchaPoca.js'
import itemShardLaunch from './tung-tung-sahur/itemParmesaoLancamento.js'
import itemShardImpact from './tung-tung-sahur/itemParmesaoImpacto.js'
import itemFrenzy from './tung-tung-sahur/itemDenteFrenesi.js'

export const CHARACTER_EFFECTS = [
  step,
  attack,
  hit,
  hurt,
  death,
  itemPickup,
  itemEffect,
  itemShield,
  itemHeal,
  itemCoffeeBoost,
  itemTiramisu,
  itemPuddle,
  itemShardLaunch,
  itemShardImpact,
  itemFrenzy,
]

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
