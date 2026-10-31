import { getAttackHitbox } from '../../../utils/player.js'
import { PLAYER_FEET_BOX, ROOM_WALLS } from '../../../utils/roomMovement.js'

// Camada de depuração (F3), só no `npm run dev`: mostra o que a colisão e o golpe enxergam.
// Serve para calibrar a caixa dos pés (PLAYER_FEET_BOX), as paredes (ROOM_WALLS) e a área do golpe (ATTACK_HITBOXES).
// Cores: vermelho = paredes, ciano = caixa dos pés, amarelo = golpe acertando, branco = ponto dos pés.
export function drawDebug(ctx, player) {
  ctx.lineWidth = 2

  for (const wall of ROOM_WALLS) {
    ctx.fillStyle = 'rgba(255, 60, 60, 0.25)'
    ctx.strokeStyle = 'rgba(255, 60, 60, 0.9)'
    ctx.fillRect(wall.x, wall.y, wall.width, wall.height)
    ctx.strokeRect(wall.x, wall.y, wall.width, wall.height)
  }

  const { width, height } = PLAYER_FEET_BOX
  ctx.strokeStyle = 'cyan'
  ctx.strokeRect(player.x - width / 2, player.y - height, width, height)

  const hitbox = getAttackHitbox(player)
  if (hitbox) {
    ctx.fillStyle = 'rgba(255, 230, 0, 0.3)'
    ctx.strokeStyle = 'yellow'
    ctx.fillRect(hitbox.x, hitbox.y, hitbox.width, hitbox.height)
    ctx.strokeRect(hitbox.x, hitbox.y, hitbox.width, hitbox.height)
  }

  ctx.fillStyle = 'white'
  ctx.fillRect(player.x - 2, player.y - 2, 4, 4)
}
