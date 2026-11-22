import { ITEM_SPRITES } from '../../../data/itemSprites.js'
import { PEDESTAL_SPRITES } from '../../../data/roomSprites.js'
import { PEDESTAL_TOP_HEIGHT } from '../../../utils/pedestals.js'
import { drawPixelText, getTextWidth, SMALL_FONT } from '../../../utils/pixelFont.js'
import { VANISH_MS } from '../../../utils/run.js'
import { getTimedFrame, getTotalDuration } from '../../../utils/spriteAnimation.js'
import { drawFloorThing } from './drawDrops.js'
import { drawHearts } from './drawHearts.js'
import { drawFrame } from './drawSprite.js'

// Pedestal com o item em cima (pedestals.js) e o item pego sobre a cabeça do Tung, em unidades da sala.
// O pedestal e o item usam a mesma célula de 300 x 384 px da arte, com os pés no mesmo ponto: basta desenhar os
// dois com os pés na base do pedestal. A escala é a do Tung Tung (PLAYER_SPRITE_SCALE): a arte dos itens e dos
// pedestais usa a mesma grade de pixels.

// timeMs = relógio da animação do item flutuando. Com "reduzir movimento", o item fica parado no quadro 0.
// leaving = o item que está sumindo deste pedestal (run.vanishing), ou null.
export function drawPedestal(ctx, pedestal, { timeMs, reduceMotion, leaving }) {
  drawFrame(ctx, PEDESTAL_SPRITES[pedestal.variant], 0, 0, pedestal.x, pedestal.y)
  if (leaving) drawVanishingItem(ctx, pedestal, leaving)
  // Loja: o garfo e o coração ficam em cima do tampo (o garfo na animação "chao", o coração é o do HUD)
  if (pedestal.consumable) {
    const top = { x: pedestal.x, y: pedestal.y - PEDESTAL_TOP_HEIGHT }
    if (pedestal.consumable === 'garfo') drawFloorThing(ctx, { kind: 'garfo', amount: 1, ...top }, timeMs, reduceMotion)
    else drawFloorThing(ctx, { kind: 'coracao', amount: 1, ...top }, timeMs, reduceMotion)
    drawPrice(ctx, pedestal)
    return
  }
  if (!pedestal.itemId) return

  const sprite = ITEM_SPRITES[pedestal.itemId]
  const { row, durations } = sprite.animations.pedestal
  const frame = reduceMotion ? 0 : getTimedFrame(durations, timeMs % getTotalDuration(durations))
  drawFrame(ctx, sprite, row, frame, pedestal.x, pedestal.y)
  if (pedestal.maxHealthCost > 0) drawCost(ctx, pedestal)
  if (pedestal.price > 0) drawPrice(ctx, pedestal)
}

// Etiqueta do preço em grãos, embaixo da plaquinha do grão do pedestal da Loja: placa clara com contorno e o número
// na fonte do jogo. Desenhada por código, no estilo da folha grao-de-cafe-preco, porque essa folha só vai até 9.
// O pedestal sem plaquinha (o comum) tem a etiqueta logo embaixo dele.
const PRICE_PIXEL = 3 // tamanho de cada pixel da fonte, em u
const FONT_HEIGHT = 7 // as letras de SMALL_FONT têm 7 pixels de altura
const PRICE_TOP = { loja: 18, base: 8 } // u abaixo da base do pedestal (o da Loja tem a plaquinha do grão embaixo)

function drawPrice(ctx, pedestal) {
  const text = String(pedestal.price)
  const padding = 2 * PRICE_PIXEL
  const width = padding + getTextWidth(SMALL_FONT, text) * PRICE_PIXEL + padding
  const height = FONT_HEIGHT * PRICE_PIXEL + padding * 2
  const left = Math.round(pedestal.x - width / 2)
  const top = Math.round(pedestal.y + (PRICE_TOP[pedestal.variant] ?? 8))
  ctx.save()
  ctx.fillStyle = '#140806' // contorno
  ctx.fillRect(left - 3, top - 3, width + 6, height + 6)
  ctx.fillStyle = '#e8dcc0' // placa
  ctx.fillRect(left, top, width, height)
  // Número (o grão está na plaquinha do pedestal, logo acima)
  ctx.translate(left + padding, top + padding)
  ctx.scale(PRICE_PIXEL, PRICE_PIXEL)
  drawPixelText(ctx, SMALL_FONT, text, 0, 0, '#2a1a10')
  ctx.restore()
}

// Item que não foi escolhido (sala de escolha) sumindo: ele sobe VANISH_RISE u e apaga, e uma fumacinha
// se abre em volta. A animação sempre toca: ela mostra que o item foi embora.
const VANISH_RISE = 40
const PUFF_COUNT = 8

function drawVanishingItem(ctx, pedestal, leaving) {
  const progress = Math.min(1, leaving.elapsedMs / VANISH_MS)
  const sprite = ITEM_SPRITES[leaving.itemId]
  ctx.save()
  ctx.globalAlpha = 1 - progress
  if (sprite) drawFrame(ctx, sprite, sprite.animations.pedestal.row, 0, pedestal.x, pedestal.y - VANISH_RISE * progress)

  // Fumacinha: quadradinhos brancos que se afastam do item e apagam junto com ele
  const centerY = pedestal.y - 55 - VANISH_RISE * progress
  const distance = 10 + 45 * progress
  ctx.fillStyle = '#f4ece4'
  for (let i = 0; i < PUFF_COUNT; i++) {
    const angle = (i / PUFF_COUNT) * Math.PI * 2
    const size = 9 * (1 - progress) + 3
    ctx.fillRect(pedestal.x + Math.cos(angle) * distance - size / 2, centerY + Math.sin(angle) * distance - size / 2, size, size)
  }
  ctx.restore()
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
