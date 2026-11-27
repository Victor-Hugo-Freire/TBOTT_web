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
    // Os dos personagens (luz do cetro do God, respingo do taco do Sabor) são desenhados por código
    if (flash.drawn === 'luz') {
      drawLightRing(ctx, flash)
      continue
    }
    if (flash.drawn === 'respingo') {
      drawSplash(ctx, flash)
      continue
    }
    if (flash.drawn === 'mancha') continue // a mancha é do chão: drawFloorFlashes a desenha antes de todos
    const sprite = getFlashSprite(flash)
    let frame = getEffectSpriteFrame(sprite, flash.elapsedMs, Boolean(flash.loop))
    ctx.save()
    if (flash.hold && frame === -1) {
      frame = Object.values(sprite.animations)[0].frames - 1
      ctx.globalAlpha = Math.min(1, (flash.durationMs - flash.elapsedMs) / HOLD_FADE_MS)
    }
    // Espelhado em volta do meio dele (a pauta do Tralalero saindo para a esquerda)
    if (flash.mirror) {
      ctx.translate(flash.x * 2, 0)
      ctx.scale(-1, 1)
    }
    drawEffectSpriteFrame(ctx, sprite, frame, flash.x, flash.y, flash.scale, flash.angle)
    ctx.restore()
  }
}

// Luz do cetro do God: um clarão no alvo e um anel dourado (com um fio branco por dentro) que abre até o alcance do
// dano (flash.range) e apaga. Centrado nos pés do alvo, como o alcance. progress = 0 (começo) a 1 (fim).
function drawLightRing(ctx, flash) {
  const progress = flash.elapsedMs / flash.durationMs
  const radius = flash.range * (0.2 + 0.8 * progress)
  ctx.save()
  ctx.globalAlpha = 1 - progress
  const glow = ctx.createRadialGradient(flash.x, flash.y, 0, flash.x, flash.y, flash.range * 0.5)
  glow.addColorStop(0, 'rgba(255, 255, 255, 0.85)')
  glow.addColorStop(1, 'rgba(255, 214, 102, 0)')
  ctx.fillStyle = glow
  ctx.beginPath()
  ctx.arc(flash.x, flash.y, flash.range * 0.5, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255, 214, 102, 0.95)'
  ctx.lineWidth = 2 + 5 * (1 - progress)
  ctx.beginPath()
  ctx.arc(flash.x, flash.y, radius, 0, Math.PI * 2)
  ctx.stroke()
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(flash.x, flash.y, radius * 0.82, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
}

// Respingo de whisky do Sabor: gotas âmbar (com um brilho claro) que saltam do alvo em arco até o alcance do
// efeito (flash.range) e caem. Centrado no meio do alvo. progress = 0 (começo) a 1 (fim).
const SPLASH_DROPS = 10

function drawSplash(ctx, flash) {
  const progress = flash.elapsedMs / flash.durationMs
  ctx.save()
  ctx.globalAlpha = 1 - progress * progress
  for (let i = 0; i < SPLASH_DROPS; i++) {
    const angle = (i / SPLASH_DROPS) * Math.PI * 2 + 0.3
    const reach = flash.range * progress * (0.55 + 0.45 * ((i % 3) / 2)) // umas gotas vão mais longe que outras
    const arc = 28 * Math.sin(Math.PI * progress) * (0.6 + 0.4 * (i % 2)) // o salto: sobem e caem
    const x = flash.x + Math.cos(angle) * reach
    const y = flash.y + Math.sin(angle) * reach * 0.6 - arc // 0,6: o chão é visto de cima, achatado
    const radius = 7 * (1 - progress * 0.5)
    ctx.fillStyle = 'rgb(214, 132, 34)'
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = 'rgb(255, 224, 160)'
    ctx.beginPath()
    ctx.arc(x - radius * 0.3, y - radius * 0.3, radius * 0.4, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

// Efeitos que ficam no chão, embaixo de todos (como as poças da Concha): a mancha de whisky do Sabor
export function drawFloorFlashes(ctx, flashes) {
  for (const flash of flashes) {
    if (flash.drawn === 'mancha') drawWhiskyStain(ctx, flash)
  }
}

// Mancha de whisky: um círculo âmbar do tamanho do alcance do respingo (flash.range), com pingos em volta. Espalha no
// primeiro quarto do tempo e apaga até o fim. Centrada nos pés do alvo, como o alcance.
function drawWhiskyStain(ctx, flash) {
  const progress = flash.elapsedMs / flash.durationMs
  const spread = Math.min(1, progress / 0.25)
  const radius = flash.range * (0.6 + 0.4 * spread)
  ctx.save()
  ctx.globalAlpha = 0.45 * (1 - progress)
  ctx.fillStyle = 'rgb(176, 98, 22)'
  ctx.beginPath()
  ctx.arc(flash.x, flash.y, radius, 0, Math.PI * 2)
  ctx.fill()
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4 + 0.4
    const distance = radius * (1.05 + 0.1 * (i % 2))
    ctx.beginPath()
    ctx.arc(flash.x + Math.cos(angle) * distance, flash.y + Math.sin(angle) * distance, 8 + 4 * (i % 3), 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

// Inimigo respingado pelo Sabor (enemy.whiskyMs > 0): quatro gotas âmbar, com contorno escuro (para ler em qualquer
// chão), caindo do corpo dele, cada uma num tempo. Com "reduzir movimento", as gotas ficam paradas no meio do caminho.
const WHISKY_DRIPS = 4

export function drawWhiskyDrips(ctx, enemy, timeMs, reduceMotion) {
  ctx.save()
  ctx.lineWidth = 2
  ctx.strokeStyle = 'rgb(70, 34, 6)'
  for (let i = 0; i < WHISKY_DRIPS; i++) {
    const phase = reduceMotion ? 0.5 : ((timeMs + i * 250) % 1000) / 1000
    const x = enemy.x + (i - 1.5) * enemy.width * 0.22
    const y = enemy.y - enemy.height * 0.7 + phase * enemy.height * 0.7
    ctx.globalAlpha = 1 - phase * 0.6
    ctx.fillStyle = 'rgb(214, 132, 34)'
    ctx.beginPath()
    ctx.arc(x, y, 7, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = 'rgb(255, 224, 160)'
    ctx.beginPath()
    ctx.arc(x - 2, y - 2, 2.5, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
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
