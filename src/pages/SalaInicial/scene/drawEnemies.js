import { EFFECT_SPRITES } from '../../../data/effectSprites.js'
import { MOKA } from '../../../data/enemyBehavior.js'
import { ENEMY_SPRITES } from '../../../data/enemySprites.js'
import { getEnemyPose } from '../../../utils/enemies.js'
import { SEED_HEIGHT } from '../../../utils/enemyShots.js'
import { drawEffectSpriteFrame, getEffectSpriteFrame } from './drawItemEffects.js'
import { drawShadow } from './drawShadow.js'
import { drawFrame } from './drawSprite.js'

// Tamanho dos desenhos dos efeitos (escala 1 = o tamanho da folha no jogo)
const SHIELD_SCALE = 1.8 // escudo de vapor (71 u na escala 1) em volta do corpo do aliado
const SEED_SCALE = 1.3 // caroço
const PIZZA_SCALE = 1.3 // pizza
const MARK_SCALE = 1.95 // marca no chão (62 u na escala 1) do tamanho do queijo que a pizza vai deixar

// Um inimigo na sala: a sombra, as pernas (atrás) e o tronco (na frente), com os pés em (enemy.x, enemy.y).
// A folha é de frente; virado para a esquerda, o desenho é espelhado em volta dos pés.
// Sem barra de vida nem número de dano (regra do Victor): o dano aparece pela animação "dano" e a morte pela "morte".
// Com o escudo de vapor da Moka, a bolha de vapor fica em volta do corpo até ele levar um golpe.
export function drawEnemy(ctx, enemy, reduceMotion, timeMs) {
  const pose = getEnemyPose(enemy, reduceMotion)
  if (!pose) return // a animação de morte já acabou: ele sumiu
  const sprite = ENEMY_SPRITES[enemy.enemyId]
  const { row } = sprite.animations[pose.animation]

  ctx.save()
  ctx.globalAlpha = pose.alpha // no fim da morte, ele e a sombra apagam juntos
  if (!enemy.hidden) drawShadow(ctx, enemy) // escondida no molho, a Polpetta não tem sombra
  ctx.translate(enemy.x, enemy.y)
  if (enemy.facingLeft) ctx.scale(-1, 1)
  drawFrame(ctx, { ...sprite, path: sprite.layers.pernas }, row, pose.frame, 0, 0)
  drawFrame(ctx, { ...sprite, path: sprite.layers.tronco }, row, pose.frame, 0, 0)
  ctx.restore()

  if (enemy.shielded && !enemy.dead) {
    const shield = EFFECT_SPRITES['vapor-escudo']
    const frame = reduceMotion ? 0 : getEffectSpriteFrame(shield, timeMs, true)
    drawEffectSpriteFrame(ctx, shield, frame, enemy.x, enemy.y - enemy.height / 2, SHIELD_SCALE)
  }
}

// Rastros dos inimigos no chão (o gelo do Pinguino e o queijo quente do Fenicottero), embaixo de todos: a folha
// do efeito com o nome do rastro (kind) repete e apaga no fim
const TRAIL_FADE_MS = 500

export function drawEnemyFloor(ctx, floor) {
  for (const trail of floor) {
    const sprite = EFFECT_SPRITES[trail.kind]
    ctx.save()
    ctx.globalAlpha = Math.min(1, (trail.ms - trail.ageMs) / TRAIL_FADE_MS)
    drawEffectSpriteFrame(ctx, sprite, getEffectSpriteFrame(sprite, trail.ageMs, true), trail.x, trail.y, trail.scale ?? 1)
    ctx.restore()
  }
}

// Sombra pequena (metade da de um personagem) embaixo de um projétil
function drawSmallShadow(ctx, x, y) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(0.5, 0.5)
  drawShadow(ctx, { x: 0, y: 0 })
  ctx.restore()
}

// A parte dos projéteis que fica no chão, embaixo de todos: a sombra do caroço e da pizza, a marca de onde a pizza
// vai cair e o anel de vapor da Moka crescendo
export function drawEnemyShotsFloor(ctx, shots) {
  for (const shot of shots) {
    if (shot.kind === 'anel') {
      const sprite = EFFECT_SPRITES['vapor-anel']
      drawEffectSpriteFrame(ctx, sprite, getEffectSpriteFrame(sprite, shot.ageMs, false), shot.x, shot.y, MOKA.ringScale)
      continue
    }
    if (shot.kind === 'pizza') {
      const mark = EFFECT_SPRITES['marca-chao']
      drawEffectSpriteFrame(ctx, mark, getEffectSpriteFrame(mark, shot.ageMs, true), shot.to.x, shot.to.y, MARK_SCALE)
    }
    drawSmallShadow(ctx, shot.x, shot.y)
  }
}

// O caroço e a pizza no ar, girando, por cima de todos
export function drawEnemyShots(ctx, shots) {
  for (const shot of shots) {
    if (shot.kind === 'caroco') {
      const sprite = EFFECT_SPRITES.caroco
      drawEffectSpriteFrame(ctx, sprite, getEffectSpriteFrame(sprite, shot.ageMs, true), shot.x, shot.y - SEED_HEIGHT, SEED_SCALE)
    }
    if (shot.kind === 'pizza') {
      const sprite = EFFECT_SPRITES['pizza-lancada']
      drawEffectSpriteFrame(ctx, sprite, getEffectSpriteFrame(sprite, shot.ageMs, true), shot.x, shot.y - shot.height, PIZZA_SCALE)
    }
  }
}
