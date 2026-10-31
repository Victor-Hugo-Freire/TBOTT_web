import { CHARACTER_SPRITES } from '../../../data/characterSprites.js'

// Cada folha tem o seu sprite (grade e pés) e a sua imagem. As chaves são as de getPlayerPose (pose.sheet),
// mais "legs": as pernas ficam atrás do tronco, também durante o golpe.
export function loadSheets() {
  const sheets = {
    legs: { sprite: CHARACTER_SPRITES.tungTungSahurPernas },
    walk: { sprite: CHARACTER_SPRITES.tungTungSahurAndar },
    attack: { sprite: CHARACTER_SPRITES.tungTungSahurAtaque },
    hurt: { sprite: CHARACTER_SPRITES.tungTungSahurDano },
  }
  for (const sheet of Object.values(sheets)) {
    sheet.image = new Image()
    sheet.image.src = sheet.sprite.src
  }
  return sheets
}
