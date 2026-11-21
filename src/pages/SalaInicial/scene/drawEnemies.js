import { ENEMY_SPRITES } from '../../../data/enemySprites.js'
import { getEnemyPose } from '../../../utils/enemies.js'
import { drawShadow } from './drawShadow.js'
import { drawFrame } from './drawSprite.js'

// Um inimigo na sala: a sombra, as pernas (atrás) e o tronco (na frente), com os pés em (enemy.x, enemy.y).
// A folha é de frente; virado para a esquerda, o desenho é espelhado em volta dos pés.
// Sem barra de vida nem número de dano (regra do Victor): o dano aparece pela animação "dano" e a morte pela "morte".
export function drawEnemy(ctx, enemy, reduceMotion) {
  const pose = getEnemyPose(enemy, reduceMotion)
  if (!pose) return // a animação de morte já acabou: ele sumiu
  const sprite = ENEMY_SPRITES[enemy.enemyId]
  const { row } = sprite.animations[pose.animation]

  ctx.save()
  ctx.globalAlpha = pose.alpha // no fim da morte, ele e a sombra apagam juntos
  drawShadow(ctx, enemy)
  ctx.translate(enemy.x, enemy.y)
  if (enemy.facingLeft) ctx.scale(-1, 1)
  drawFrame(ctx, { ...sprite, path: sprite.layers.pernas }, row, pose.frame, 0, 0)
  drawFrame(ctx, { ...sprite, path: sprite.layers.tronco }, row, pose.frame, 0, 0)
  ctx.restore()
}
