import { getPlayerPose } from '../../../utils/player.js'
import { drawAttackArc } from './drawAttackArc.js'
import { drawShadow } from './drawShadow.js'
import { drawSprite } from './drawSprite.js'

// Desenha o personagem de baixo para cima: sombra, arco do golpe (atrás, para não tapá-lo),
// pernas e tronco (ou o corpo inteiro, no dano).
export function drawPlayer(ctx, sheets, player, reduceMotion) {
  const pose = getPlayerPose(player, reduceMotion)
  const { sprite, image } = sheets[pose.sheet]
  drawShadow(ctx, player)
  drawAttackArc(ctx, player)
  if (pose.legs) {
    const legs = sheets.legs
    drawSprite(ctx, legs.image, legs.sprite, pose.legs.direction, pose.legs.frame, player)
  }
  drawSprite(ctx, image, sprite, pose.direction, pose.frame, player)
}
