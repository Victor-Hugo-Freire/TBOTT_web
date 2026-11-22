import { NOTICE_MS } from '../../../data/economy.js'
import { CONSUMABLE_SPRITES } from '../../../data/itemSprites.js'
import { HEART_PIXELS } from '../../../data/heartPixels.js'
import { DROP_APPEAR_MS, DROP_COLLECT_MS } from '../../../utils/drops.js'
import { getTimedFrame, getTotalDuration } from '../../../utils/spriteAnimation.js'
import { drawHearts } from './drawHearts.js'
import { drawFrame } from './drawSprite.js'
import { DESCRIPTION_FONT } from './fonts.js'

// Grãos de café, garfos e corações no chão (drops.js), o que acabou de ser pego e o aviso curto em cima do Tung,
// em unidades da sala. Grão e garfo usam as folhas de itemSprites.js (CONSUMABLE_SPRITES: "chao", "aparecer" e
// "coleta"); o grupo de 3 ou 5 grãos usa a folha "grupos". Não existe arte de coração no chão: ele é o do HUD
// (heartPixels.js), um pouco maior e balançando.

const GRAIN = CONSUMABLE_SPRITES['grao-de-cafe']
const FORK = CONSUMABLE_SPRITES.garfo
const GROUPS = GRAIN.variants.grupos
const HEART_PIXEL = 3 // tamanho de cada pixel do coração, em u
const HEART_LIFT = 8 // o coração flutua um pouco acima do chão
const COLLECT_RISE = 40 // o coração pego sobe e apaga

// Tudo o que está no chão da sala. As coisas que ainda esperam para aparecer (prêmio do Fliperama) não aparecem.
export function drawDrops(ctx, drops, timeMs, reduceMotion) {
  for (const drop of drops) {
    if (drop.appearMs !== undefined && drop.appearMs < 0) continue
    drawFloorThing(ctx, drop, timeMs, reduceMotion)
  }
}

// Uma coisa no chão, com os pés em (x, y): aparecendo (appearMs) ou parada no chão, na animação em laço.
// Também desenha o garfo e o coração em cima do pedestal da Loja.
export function drawFloorThing(ctx, thing, timeMs, reduceMotion) {
  const appearing = thing.appearMs !== undefined
  if (thing.kind === 'coracao') {
    const grow = appearing ? Math.min(1, thing.appearMs / DROP_APPEAR_MS) : 1
    const bob = reduceMotion ? 0 : Math.sin(timeMs / 300) * 3
    drawHeart(ctx, thing.x, thing.y - HEART_LIFT - bob, grow, 1)
    return
  }
  if (thing.kind === 'graos' && thing.amount > 1) {
    drawGrainGroup(ctx, thing, appearing ? Math.min(1, thing.appearMs / DROP_APPEAR_MS) : 1)
    return
  }
  const sprite = thing.kind === 'garfo' ? FORK : GRAIN
  if (appearing) {
    const appear = sprite.animations.aparecer
    const frame = getTimedFrame(appear.durations, thing.appearMs)
    if (frame >= 0) drawFrame(ctx, sprite, appear.row, frame, thing.x, thing.y)
    return
  }
  const { row, durations } = sprite.animations.chao
  const frame = reduceMotion ? 0 : getTimedFrame(durations, timeMs % getTotalDuration(durations))
  drawFrame(ctx, sprite, row, frame, thing.x, thing.y)
}

// Grupo de grãos (quadro 0 = 1 grão, 1 = 3 grãos, 2 = 5 grãos), crescendo a partir dos pés ao aparecer (grow 0 a 1)
function drawGrainGroup(ctx, drop, grow) {
  let frame = 0
  if (drop.amount >= 5) frame = 2
  else if (drop.amount >= 3) frame = 1
  ctx.save()
  ctx.translate(drop.x, drop.y)
  ctx.scale(grow, grow)
  drawFrame(ctx, GROUPS, 0, frame, 0, 0)
  ctx.restore()
}

// Coração do HUD centrado em x, com a base em y. scale = tamanho (0 a 1); alpha = 1 (inteiro) a 0 (sumiu)
function drawHeart(ctx, x, y, scale, alpha) {
  const pixel = HEART_PIXEL * scale
  if (pixel <= 0) return
  ctx.save()
  ctx.globalAlpha = alpha
  drawHearts(ctx, ['full'], x - (HEART_PIXELS.width * pixel) / 2, y - HEART_PIXELS.height * pixel, pixel)
  ctx.restore()
}

// O que acabou de ser pego (run.collecting): a animação "coleta" no lugar onde estava; o coração sobe e apaga
export function drawCollecting(ctx, collecting) {
  for (const thing of collecting) {
    if (thing.kind === 'coracao') {
      const progress = thing.elapsedMs / DROP_COLLECT_MS
      drawHeart(ctx, thing.x, thing.y - HEART_LIFT - COLLECT_RISE * progress, 1, 1 - progress)
      continue
    }
    const sprite = thing.kind === 'garfo' ? FORK : GRAIN
    const collect = sprite.animations.coleta
    const frame = getTimedFrame(collect.durations, thing.elapsedMs)
    if (frame >= 0) drawFrame(ctx, sprite, collect.row, frame, thing.x, thing.y)
  }
}

// Aviso curto em cima do Tung ("Faltam grãos", "Vida cheia", "Nada desta vez!"): sobe um pouco e apaga no fim.
// Na fonte das descrições (com acentos), clara e com contorno escuro, para ler em qualquer piso.
const NOTICE_SIZE = 26 // u
const NOTICE_HEIGHT = 150 // u acima dos pés (acima da cabeça)
const NOTICE_FADE_MS = 300

export function drawNotice(ctx, player, notice) {
  const rise = (notice.elapsedMs / NOTICE_MS) * 20
  const fade = Math.min(1, (NOTICE_MS - notice.elapsedMs) / NOTICE_FADE_MS)
  ctx.save()
  ctx.globalAlpha = fade
  ctx.font = `${NOTICE_SIZE}px ${DESCRIPTION_FONT}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'bottom'
  ctx.lineJoin = 'round'
  ctx.lineWidth = 6
  ctx.strokeStyle = '#140806'
  ctx.strokeText(notice.text, player.x, player.y - NOTICE_HEIGHT - rise)
  ctx.fillStyle = '#f4ece4'
  ctx.fillText(notice.text, player.x, player.y - NOTICE_HEIGHT - rise)
  ctx.restore()
}
