import { EFFECT_SPRITES } from '../../../data/effectSprites.js'
import { ITEM_SPRITES } from '../../../data/itemSprites.js'
import { SHIELD_BREAK_MS } from '../../../utils/itemEffects.js'
import { getTimedFrame, getTotalDuration } from '../../../utils/spriteAnimation.js'
import { PLAYER_SPRITE_SCALE } from './drawSprite.js'
import { getImage, isImageReady } from './images.js'

// Efeitos visuais dos itens (as folhas "variants" de itemSprites.js) e dos inimigos (effectSprites.js), em unidades
// da sala. Os efeitos não têm pés: cada quadro é desenhado com o meio em (x, y), na escala do Tung.

// Um quadro de uma folha de efeito (uma linha só), com o meio em (x, y). scale = tamanho a mais; angle = giro (radianos).
export function drawEffectSpriteFrame(ctx, sprite, frame, x, y, scale = 1, angle = 0) {
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

// Um quadro do efeito `variant` do item
function drawEffectFrame(ctx, itemId, variant, frame, x, y, scale = 1, angle = 0) {
  drawEffectSpriteFrame(ctx, ITEM_SPRITES[itemId]?.variants?.[variant], frame, x, y, scale, angle)
}

// Quadro de uma folha de efeito que toca uma vez (-1 depois do fim) ou em laço (loop = true)
export function getEffectSpriteFrame(sprite, elapsedMs, loop) {
  if (!sprite) return -1
  const { durations } = Object.values(sprite.animations)[0]
  if (loop) return getTimedFrame(durations, elapsedMs % getTotalDuration(durations))
  return getTimedFrame(durations, elapsedMs)
}

// Quadro do efeito `variant` do item
function getEffectFrame(itemId, variant, elapsedMs, loop) {
  return getEffectSpriteFrame(ITEM_SPRITES[itemId]?.variants?.[variant], elapsedMs, loop)
}

// A folha de um efeito da lista flashes: a de um inimigo (effect) ou a de um item (itemId + variant)
function getFlashSprite(flash) {
  if (flash.effect) return EFFECT_SPRITES[flash.effect]
  return ITEM_SPRITES[flash.itemId]?.variants?.[flash.variant]
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

// Efeitos que tocam uma vez (estalo, notas, mordida, fios de queijo, faísca, lascas, impacto) e os dos inimigos
// (explosão, impacto; as estrelas de atordoado repetem, loop), por cima de tudo
// hold: depois de tocar, fica no último quadro e apaga no fim (a fumaça da Vespina, que fica na sala)
const HOLD_FADE_MS = 400

export function drawFlashes(ctx, flashes) {
  for (const flash of flashes) {
    const sprite = getFlashSprite(flash)
    let frame = getEffectSpriteFrame(sprite, flash.elapsedMs, Boolean(flash.loop))
    ctx.save()
    if (flash.hold && frame === -1) {
      frame = Object.values(sprite.animations)[0].frames - 1
      ctx.globalAlpha = Math.min(1, (flash.durationMs - flash.elapsedMs) / HOLD_FADE_MS)
    }
    drawEffectSpriteFrame(ctx, sprite, frame, flash.x, flash.y, flash.scale, flash.angle)
    ctx.restore()
  }
}

// Lascas do Parmesão voando: uma lasca recortada do quadro 2 da folha "lascas" (a de cima, com a ponta
// para a direita), virada para onde ela voa
const SHARD_CHIP = { x: 137, y: 10, width: 9, height: 8 } // px de parmesao-curado-lascas.png

export function drawShards(ctx, shards) {
  if (shards.length === 0) return
  const sprite = ITEM_SPRITES['parmesao-curado'].variants.lascas
  const image = getImage(sprite.path)
  if (!isImageReady(image)) return
  const size = sprite.scale * PLAYER_SPRITE_SCALE
  const width = SHARD_CHIP.width * size
  const height = SHARD_CHIP.height * size
  for (const shard of shards) {
    ctx.save()
    ctx.translate(shard.x, shard.y)
    ctx.rotate(Math.atan2(shard.vy, shard.vx))
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(image, SHARD_CHIP.x, SHARD_CHIP.y, SHARD_CHIP.width, SHARD_CHIP.height, -width / 2, -height / 2, width, height)
    ctx.restore()
  }
}

// Efeitos que acompanham o Tung enquanto duram (em laço), desenhados na frente dele. timeMs = relógio da animação.
export function drawPlayerAuras(ctx, player, effects, timeMs) {
  // Caldo da Mamãe: bolha de caldo enquanto o escudo da sala está pronto (pulsa de leve);
  // ao anular um dano, ela estoura: cresce, apaga e solta gotas
  if (effects.shieldHits > 0) drawShieldBubble(ctx, player, 1 + 0.03 * Math.sin(timeMs / 250), 1)
  if (effects.shieldBreakMs > 0) {
    const progress = 1 - effects.shieldBreakMs / SHIELD_BREAK_MS
    drawShieldBubble(ctx, player, 1 + 0.35 * progress, 1 - progress)
    drawShieldDrops(ctx, player, progress)
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

// Escudo do Caldo: uma bolha dourada e meio transparente em volta do Tung, desenhada por código (como o arco
// do golpe). É dourada e lisa de propósito, para não parecer o vapor do Café.
const SHIELD = { up: 52, radiusX: 64, radiusY: 70 } // u: o meio da bolha fica `up` acima dos pés
const SHIELD_COLOR = '255, 196, 92' // dourado de caldo (r, g, b)

// scale = tamanho (1 = normal); alpha = 1 (inteira) a 0 (sumiu)
function drawShieldBubble(ctx, player, scale, alpha) {
  const centerY = player.y - SHIELD.up
  const radiusX = SHIELD.radiusX * scale
  const radiusY = SHIELD.radiusY * scale
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.beginPath()
  ctx.ellipse(player.x, centerY, radiusX, radiusY, 0, 0, Math.PI * 2)
  ctx.fillStyle = `rgba(${SHIELD_COLOR}, 0.16)`
  ctx.fill()
  ctx.lineWidth = 3
  ctx.strokeStyle = `rgba(${SHIELD_COLOR}, 0.85)`
  ctx.stroke()
  // brilho no alto à esquerda, como numa bolha
  ctx.beginPath()
  ctx.ellipse(player.x - radiusX * 0.45, centerY - radiusY * 0.55, 11 * scale, 5 * scale, -0.6, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
  ctx.fill()
  ctx.restore()
}

// Gotas de caldo voando para fora quando a bolha estoura. progress = 0 (começo) a 1 (fim)
function drawShieldDrops(ctx, player, progress) {
  const centerY = player.y - SHIELD.up
  const spread = 1 + 0.7 * progress
  ctx.save()
  ctx.fillStyle = `rgba(${SHIELD_COLOR}, ${1 - progress})`
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4
    ctx.beginPath()
    ctx.arc(player.x + Math.cos(angle) * SHIELD.radiusX * spread, centerY + Math.sin(angle) * SHIELD.radiusY * spread, 5 * (1 - progress) + 1, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}
