import { APPEARANCE_SPRITES, getAppearancePath } from '../../../data/appearanceSprites.js'
import { BOSS_SPRITES } from '../../../data/bossSprites.js'
import { getCharacterSheets } from '../../../data/characterSprites.js'
import { ENEMY_SPRITES } from '../../../data/enemySprites.js'
import { getImage } from './images.js'

// Cada folha tem o seu sprite (grade e pés) e a sua imagem. As chaves são as de getPlayerPose (pose.sheet),
// mais "legs": as pernas ficam atrás do tronco, também durante o golpe. "death" é a morte (corpo inteiro).
// As folhas são as do personagem escolhido (getCharacterSheets).
export function loadSheets(characterId) {
  const sheets = {}
  for (const [name, sprite] of Object.entries(getCharacterSheets(characterId))) {
    sheets[name] = { sprite, image: new Image() }
    sheets[name].image.src = sprite.src
  }
  // Camadas dos itens no personagem (drawPlayer.js): pedidas já agora, para não sumirem na primeira vez que ele vira
  for (const item of Object.values(APPEARANCE_SPRITES)) {
    for (const layer of Object.values(item.layers)) {
      if (layer) getImage(getAppearancePath(layer, item, characterId))
    }
  }
  // Camadas dos inimigos e dos chefes (@1x, pequenas): pedidas já agora, para não aparecerem sem desenho na primeira sala
  for (const enemy of [...Object.values(ENEMY_SPRITES), ...Object.values(BOSS_SPRITES)]) {
    getImage(enemy.layers.pernas)
    getImage(enemy.layers.tronco)
    // As versões das folhas de alguns chefes (uma por fase) e do Pinguino (uma por bola perdida): pedidas já, para não
    // piscarem sem desenho na troca
    for (const variant of Object.values(enemy.variantLayers ?? {})) {
      getImage(variant.pernas)
      getImage(variant.tronco)
    }
  }
  return sheets
}
