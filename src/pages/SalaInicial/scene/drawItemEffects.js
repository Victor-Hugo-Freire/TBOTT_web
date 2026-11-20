import { ITEM_SPRITES } from '../../../data/itemSprites.js'
import { getTimedFrame, getTotalDuration } from '../../../utils/spriteAnimation.js'
import { PLAYER_SPRITE_SCALE } from './drawSprite.js'
import { getImage, isImageReady } from './images.js'

// Efeitos visuais dos itens (as folhas "variants" de itemSprites.js), em unidades da sala.
// Os efeitos não têm pés: cada quadro é desenhado com o meio em (x, y), na escala do Tung.

// Um quadro do efeito `variant` do item, com o meio em (x, y). scale = tamanho a mais; angle = giro (radianos).
function drawEffectFrame(ctx, itemId, variant, frame, x, y, scale = 1, angle = 0) {
  const sprite = ITEM_SPRITES[itemId]?.variants?.[variant]
  if (!sprite || frame < 0) return
  const image = getImage(sprite.path)
  if (!isImageReady(image)) return
  const { row } = Object.values(sprite.animations)[0]
  const size = sprite.scale * PLAYER_SPRITE_SCALE * scale
  const width = sprite.frameWidth * size
  const height = sprite.frameHeight * size
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(angle)
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(image, frame * sprite.frameWidth, row * sprite.frameHeight, sprite.frameWidth, sprite.frameHeight, -width / 2, -height / 2, width, height)
  ctx.restore()
}

// Quadro de uma animação que toca uma vez (-1 depois do fim) ou em laço (loop = true)
function getEffectFrame(itemId, variant, elapsedMs, loop) {
  const sprite = ITEM_SPRITES[itemId]?.variants?.[variant]
  if (!sprite) return -1
  const { durations } = Object.values(sprite.animations)[0]
  if (loop) return getTimedFrame(durations, elapsedMs % getTotalDuration(durations))
  return getTimedFrame(durations, elapsedMs)
}

// Poças de molho da Concha, no chão (embaixo de tudo): crescem uma vez, ficam no último quadro e apagam no fim
const PUDDLE_FADE_MS = 300

export function drawPuddles(ctx, puddles) {
  for (const puddle of puddles) {
    let frame = getEffectFrame('concha-longa', 'poca-de-molho', puddle.ageMs, false)
    if (frame === -1) frame = ITEM_SPRITES['concha-longa'].variants['poca-de-molho'].animations['poca-de-molho'].frames - 1
    ctx.save()
    ctx.globalAlpha = Math.min(1, (puddle.ms - puddle.ageMs) / PUDDLE_FADE_MS)
    drawEffectFrame(ctx, 'concha-longa', 'poca-de-molho', frame, puddle.x, puddle.y)
    ctx.restore()
  }
}

// Efeitos que tocam uma vez (estalo, notas, mordida, fios de queijo, faísca, lascas, impacto), por cima de tudo
export function drawFlashes(ctx, flashes) {
  for (const flash of flashes) {
    const frame = getEffectFrame(flash.itemId, flash.variant, flash.elapsedMs, false)
    drawEffectFrame(ctx, flash.itemId, flash.variant, frame, flash.x, flash.y, flash.scale, flash.angle)
  }
}

// Efeitos que acompanham os pés do Tung enquanto duram (em laço). timeMs = relógio da animação.
// behind = true desenha o que fica atrás dele (o escudo de vapor no chão); false, o que fica na frente.
export function drawPlayerAuras(ctx, player, effects, timeMs, behind) {
  if (behind) {
    // Caldo da Mamãe: anel de vapor no chão enquanto o escudo da sala está ativo
    if (effects.shieldHits > 0) {
      drawEffectFrame(ctx, 'caldo-da-mamae', 'escudo-de-vapor', getEffectFrame('caldo-da-mamae', 'escudo-de-vapor', timeMs, true), player.x, player.y - 8)
    }
    return
  }
  // Café Duplo: vapor saindo dos pés durante a corrida
  if (effects.coffeeBoostMs > 0) {
    drawEffectFrame(ctx, 'cafe-duplo', 'vapor-de-cafe', getEffectFrame('cafe-duplo', 'vapor-de-cafe', timeMs, true), player.x, player.y - 20)
  }
  // Tiramisu: pó de cacau caindo em volta dos pés enquanto o golpe está mais rápido
  if (effects.sugarMs > 0) {
    drawEffectFrame(ctx, 'tiramisu', 'po-de-cacau', getEffectFrame('tiramisu', 'po-de-cacau', timeMs, true), player.x, player.y - 25)
  }
}
