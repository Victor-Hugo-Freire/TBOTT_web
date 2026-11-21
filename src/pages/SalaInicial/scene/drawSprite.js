import { PLAYER_SCALE } from '../../../utils/roomMovement.js'
import { getImage, isImageReady } from './images.js'

// Escala do personagem na sala: o quadro de 296 px ocupava 118,8 u e agora é PLAYER_SCALE vezes maior
export const PLAYER_SPRITE_SCALE = (118.8 / 296) * PLAYER_SCALE

// Desenha um quadro da folha com os pés (o pivô do quadro) na posição feet, em unidades da sala.
// Assim trocar de folha (andar 296x259, ataque 420x380) não faz o personagem "pular".
// O personagem não está em grade de pixel e aparece reduzido, então usa suavização alta.
export function drawSprite(ctx, image, sprite, direction, frame, feet) {
  if (!image.complete || !image.naturalWidth) return
  const scale = PLAYER_SPRITE_SCALE

  const pivotX = sprite.feetX ?? sprite.frameWidth / 2
  const pivotY = sprite.frameHeight - sprite.feetPadding
  // Algumas direções da arte original são menores que as outras: directionScale corrige isso, a partir dos pés
  const size = scale * (sprite.directionScale?.[direction] ?? 1)

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(
    image,
    frame * sprite.frameWidth,
    sprite.rows[direction] * sprite.frameHeight,
    sprite.frameWidth,
    sprite.frameHeight,
    feet.x - pivotX * size,
    feet.y - pivotY * size,
    sprite.frameWidth * size,
    sprite.frameHeight * size,
  )
}

// Um quadro da folha (linha = animação, coluna = quadro), com os pés em (x, y).
// Folha @1x (scale 3) é desenhada 3x maior, para ficar do mesmo tamanho da arte grande. Serve às folhas dos itens,
// dos pedestais, do grão e do garfo (itemSprites.js e roomSprites.js), que têm feetX e feetPadding.
export function drawFrame(ctx, sprite, row, frame, x, y) {
  const image = getImage(sprite.path)
  if (!isImageReady(image)) return
  const size = sprite.scale * PLAYER_SPRITE_SCALE
  const pivotX = sprite.feetX
  const pivotY = sprite.frameHeight - sprite.feetPadding
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(
    image,
    frame * sprite.frameWidth,
    row * sprite.frameHeight,
    sprite.frameWidth,
    sprite.frameHeight,
    x - pivotX * size,
    y - pivotY * size,
    sprite.frameWidth * size,
    sprite.frameHeight * size,
  )
}
