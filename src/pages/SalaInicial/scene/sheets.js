import { APPEARANCE_SPRITES } from '../../../data/appearanceSprites.js'
import { BOSS_SPRITES } from '../../../data/bossSprites.js'
import { CHARACTER_SPRITES } from '../../../data/characterSprites.js'
import { ENEMY_SPRITES } from '../../../data/enemySprites.js'
import { getImage } from './images.js'

// Cada folha tem o seu sprite (grade e pés) e a sua imagem. As chaves são as de getPlayerPose (pose.sheet),
// mais "legs": as pernas ficam atrás do tronco, também durante o golpe. "death" é a morte (corpo inteiro).
export function loadSheets() {
  const sheets = {
    legs: { sprite: CHARACTER_SPRITES.tungTungSahurPernas },
    walk: { sprite: CHARACTER_SPRITES.tungTungSahurAndar },
    attack: { sprite: CHARACTER_SPRITES.tungTungSahurAtaque },
    hurt: { sprite: CHARACTER_SPRITES.tungTungSahurDano },
    death: { sprite: CHARACTER_SPRITES.tungTungSahurMorte },
  }
  for (const sheet of Object.values(sheets)) {
    sheet.image = new Image()
    sheet.image.src = sheet.sprite.src
  }
  // Camadas dos itens no Tung (drawPlayer.js): pedidas já agora, para não sumirem na primeira vez que ele vira
  for (const item of Object.values(APPEARANCE_SPRITES)) {
    for (const layer of Object.values(item.layers)) {
      if (layer) getImage(layer.path)
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
