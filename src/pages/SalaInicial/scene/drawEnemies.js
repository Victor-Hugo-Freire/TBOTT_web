import { EFFECT_SPRITES } from '../../../data/effectSprites.js'
import { MOKA } from '../../../data/enemyBehavior.js'
import { getEnemyPose } from '../../../utils/enemies.js'
import { getEnemySprite } from '../../../utils/enemyBehaviors.js'
import { SEED_HEIGHT } from '../../../utils/enemyShots.js'
import { drawEffectSpriteFrame, getEffectSpriteFrame } from './drawItemEffects.js'
import { drawShadow } from './drawShadow.js'
import { drawFrame } from './drawSprite.js'

// Tamanho dos desenhos dos efeitos (escala 1 = o tamanho da folha no jogo)
const SHIELD_SCALE = 1.8 // escudo de vapor (71 u na escala 1) em volta do corpo do aliado
const SEED_SCALE = 1.3 // caroço
const PIZZA_SCALE = 1.3 // pizza
const MARK_SCALE = 1.95 // marca no chão (62 u na escala 1) do tamanho do queijo que a pizza vai deixar
const BOSS_SHADOW_SCALE = 2.5 // a sombra do chefe: 2,5x a do Tung (61 u), mais ou menos a largura da base dele
const NOTE_SCALE = 1.3 // nota musical do Tralalero (34 x 43 u na escala 1)
const NOTE_HEIGHT = 60 // a nota voa nesta altura acima da sombra dela

// Um inimigo (ou o chefe) na sala: a sombra, as pernas (atrás) e o tronco (na frente), com os pés em (enemy.x, enemy.y).
// A folha é de frente; virado para a esquerda, o desenho é espelhado em volta dos pés.
// Sem barra de vida nem número de dano (regra do Victor): o dano aparece pela animação "dano" e a morte pela "morte".
// Só o chefe tem barra, embaixo da tela (drawBossBar.js).
// Com o escudo de vapor da Moka, a bolha de vapor fica em volta do corpo até ele levar um golpe.
export function drawEnemy(ctx, enemy, reduceMotion, timeMs) {
  const pose = getEnemyPose(enemy, reduceMotion)
  if (!pose) return // a animação de morte já acabou: ele sumiu
  const sprite = getEnemySprite(enemy.enemyId)
  const { row } = sprite.animations[pose.animation]
  // O Tralalero de óculos (fase 2 em diante) usa a folha com os óculos em todos os quadros
  const layers = enemy.glasses && sprite.glassesLayers ? sprite.glassesLayers : sprite.layers

  ctx.save()
  ctx.globalAlpha = pose.alpha // no fim da morte, ele e a sombra apagam juntos
  // Escondidos (a Polpetta no molho, o Tralalero debaixo do chão, só a barbatana) não têm sombra
  if (enemy.boss && !enemy.hidden) drawScaledShadow(ctx, enemy.x, enemy.y, BOSS_SHADOW_SCALE)
  else if (!enemy.hidden) drawShadow(ctx, enemy)
  ctx.translate(enemy.x, enemy.y)
  if (enemy.facingLeft) ctx.scale(-1, 1)
  drawFrame(ctx, { ...sprite, path: layers.pernas }, row, pose.frame, 0, 0)
  drawFrame(ctx, { ...sprite, path: layers.tronco }, row, pose.frame, 0, 0)
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

// Sombra de um personagem `scale` vezes maior: 0,5 embaixo de um projétil e BOSS_SHADOW_SCALE embaixo do chefe
function drawScaledShadow(ctx, x, y, scale) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(scale, scale)
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
    drawScaledShadow(ctx, shot.x, shot.y, 0.5)
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
    if (shot.kind === 'nota') {
      const sprite = EFFECT_SPRITES['nota-musical']
      drawEffectSpriteFrame(ctx, sprite, getEffectSpriteFrame(sprite, shot.ageMs, true), shot.x, shot.y - NOTE_HEIGHT, NOTE_SCALE)
    }
  }
}
