import { ITEM_SPRITES } from '../../../data/itemSprites.js'
import { PEDESTAL_SPRITES } from '../../../data/roomSprites.js'
import { drawPixelText, getTextWidth, SMALL_FONT } from '../../../utils/pixelFont.js'
import { getTimedFrame, getTotalDuration } from '../../../utils/spriteAnimation.js'
import { drawHearts } from './drawHearts.js'
import { PLAYER_SPRITE_SCALE } from './drawSprite.js'
import { getImage, isImageReady } from './images.js'

// Pedestal com o item em cima (pedestals.js) e o item pego sobre a cabeça do Tung, em unidades da sala.
// O pedestal e o item usam a mesma célula de 300 x 384 px da arte, com os pés no mesmo ponto: basta desenhar os
// dois com os pés na base do pedestal. A escala é a do Tung Tung (PLAYER_SPRITE_SCALE): a arte dos itens e dos
// pedestais usa a mesma grade de pixels.

// Um quadro da folha (linha = animação, coluna = quadro), com os pés em (x, y).
// Folha @1x (scale 3) é desenhada 3x maior, para ficar do mesmo tamanho da arte grande.
function drawFrame(ctx, sprite, row, frame, x, y) {
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

// timeMs = relógio da animação do item flutuando. Com "reduzir movimento", o item fica parado no quadro 0.
export function drawPedestal(ctx, pedestal, { timeMs, reduceMotion }) {
  drawFrame(ctx, PEDESTAL_SPRITES[pedestal.variant], 0, 0, pedestal.x, pedestal.y)
  if (!pedestal.itemId) return

  const sprite = ITEM_SPRITES[pedestal.itemId]
  const { row, durations } = sprite.animations.pedestal
  const frame = reduceMotion ? 0 : getTimedFrame(durations, timeMs % getTotalDuration(durations))
  drawFrame(ctx, sprite, row, frame, pedestal.x, pedestal.y)
  if (pedestal.maxHealthCost > 0) drawCost(ctx, pedestal)
}

// O item pego fica sobre a cabeça do Tung (run.pickup), acompanhando ele: primeiro a animação "coleta" (o item
// sobe com o brilho), depois o item parado até o fim de PICKUP_MS. Ela sempre anima: mostra que o item foi pego.
// HELD_ITEM_LIFT = quanto acima dos pés fica o pé da célula do item (o Tung tem cerca de 105 u de altura).
const HELD_ITEM_LIFT = 80

export function drawHeldItem(ctx, player, pickup) {
  const sprite = ITEM_SPRITES[pickup.itemId]
  if (!sprite) return
  const collect = sprite.animations.coleta
  const frame = getTimedFrame(collect.durations, pickup.elapsedMs)
  const y = player.y - HELD_ITEM_LIFT
  if (frame >= 0) drawFrame(ctx, sprite, collect.row, frame, player.x, y)
  else drawFrame(ctx, sprite, sprite.animations.pedestal.row, 0, player.x, y)
}

// Etiqueta do custo da Sala do Pacto, embaixo do pedestal: "-1" e um coração vazio (o coração que ele perde).
// O custo vem em meios corações; a etiqueta mostra corações.
const COST_PIXEL = 3 // tamanho de cada pixel da fonte e do coração, em unidades da sala

function drawCost(ctx, pedestal) {
  const text = `-${pedestal.maxHealthCost / 2}`
  const textWidth = getTextWidth(SMALL_FONT, text) * COST_PIXEL
  const heartWidth = 13 * COST_PIXEL
  const gap = 2 * COST_PIXEL
  const left = pedestal.x - (textWidth + gap + heartWidth) / 2
  const top = pedestal.y + 10

  ctx.save()
  // Fundo escuro, para a etiqueta aparecer em qualquer piso
  ctx.fillStyle = 'rgba(10, 6, 6, 0.75)'
  ctx.fillRect(left - 6, top - 6, textWidth + gap + heartWidth + 12, 12 * COST_PIXEL + 12)
  ctx.translate(left, top + 2 * COST_PIXEL)
  ctx.scale(COST_PIXEL, COST_PIXEL)
  drawPixelText(ctx, SMALL_FONT, text, 0, 0, '#f4ece4')
  ctx.restore()
  drawHearts(ctx, ['empty'], left + textWidth + gap, top, COST_PIXEL)
}
