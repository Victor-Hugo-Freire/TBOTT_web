import { getPlayerPose } from '../../../utils/player.js'
import { drawAttackArc } from './drawAttackArc.js'
import { drawShadow } from './drawShadow.js'
import { drawSprite } from './drawSprite.js'

// Desenha o personagem de baixo para cima: sombra, arco do golpe (atrás, para não tapá-lo),
// pernas e tronco (ou o corpo inteiro, no dano e na morte). A inclinação do andar (pose.tilt) gira só o corpo,
// em volta dos pés; a sombra e o arco ficam retos. Na morte a sombra vem da própria folha (ele cai de lado).
export function drawPlayer(ctx, sheets, player, reduceMotion) {
  const pose = getPlayerPose(player, reduceMotion)
  const { sprite, image } = sheets[pose.sheet]
  if (!player.dead) drawShadow(ctx, player)
  drawAttackArc(ctx, player)

  ctx.save()
  if (pose.tilt !== 0) {
    ctx.translate(player.x, player.y)
    ctx.rotate((pose.tilt * Math.PI) / 180)
    ctx.translate(-player.x, -player.y)
  }
  if (pose.legs) {
    const legs = sheets.legs
    drawSprite(ctx, legs.image, legs.sprite, pose.legs.direction, pose.legs.frame, player)
  }
  drawSprite(ctx, image, sprite, pose.direction, pose.frame, player)
  ctx.restore()
}
