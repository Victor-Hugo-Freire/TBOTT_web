import { CHARACTER_SPRITES } from '../data/characterSprites.js'
import { getTimedFrame, getTotalDuration, getWalkFrame, updateWalkDistance } from './spriteAnimation.js'
import { moveRoomPlayer } from './roomMovement.js'

// Estado do personagem na sala, em funções puras (sem React, sem canvas), para testar.
// Posição (x, y) = centro dos pés. Tempos em ms.
//
// O golpe de 630 ms trava o movimento e não é cortado. O cooldown conta do INÍCIO do golpe,
// mas como o golpe dura mais que o cooldown, a cadência real é de 630 ms (cerca de 1,6 golpe/s):
// o cooldown só passa a valer se um dia o golpe ficar mais curto que ele.
export const ATTACK_COOLDOWN_MS = 430

const ATTACK = CHARACTER_SPRITES.tungTungSahurAtaque
export const ATTACK_DURATION_MS = getTotalDuration(ATTACK.durations)

// Dano: 410 ms de animação, em que o personagem não anda nem ataca (dano > ataque > andar).
// Depois de levar dano fica invencível por 1000 ms, contados do momento do golpe.
// Por enquanto nada chama hurtPlayer no jogo: só existe o estado, até haver inimigos.
const HURT = CHARACTER_SPRITES.tungTungSahurDano
export const HURT_DURATION_MS = getTotalDuration(HURT.durations)
export const INVINCIBILITY_MS = 1000

// Passo máximo de lógica por quadro: depois de uma pausa (aba escondida) o jogo não "pula"
const MAX_STEP_MS = 50

// Área do golpe, em unidades da sala e relativa aos pés. Medida na união dos quadros 2 a 4 do
// ataque, só do lado do golpe. Valores iniciais: ajuste olhando o debug (F3).
export const ATTACK_HITBOXES = {
  right: { x: 0, y: -60, width: 62, height: 82 },
  left: { x: -59, y: -60, width: 59, height: 79 },
  down: { x: -31, y: -30, width: 70, height: 56 },
  up: { x: -30, y: -116, width: 61, height: 76 },
}

export function createPlayer(position) {
  return {
    x: position.x,
    y: position.y,
    direction: 'down',
    walkDistance: 0,
    attack: null, // { direction, elapsed } enquanto o golpe acontece
    hurt: null, // { direction, elapsed } enquanto a animação de dano acontece
    invincibleMs: 0, // ms de invencibilidade que ainda restam
    sinceAttackStart: Infinity, // ms desde o início do último golpe
  }
}

// Leva dano: interrompe o golpe, para o personagem e liga a invencibilidade.
// Enquanto está invencível, outro dano é ignorado.
export function hurtPlayer(player) {
  if (player.invincibleMs > 0 || player.hurt) return player
  return {
    ...player,
    attack: null,
    walkDistance: 0,
    hurt: { direction: player.direction, elapsed: 0 },
    invincibleMs: INVINCIBILITY_MS,
  }
}

// Começa um golpe se não há golpe nem dano em andamento e o cooldown já acabou.
export function startAttack(player, direction) {
  if (!direction || player.attack || player.hurt || player.sinceAttackStart < ATTACK_COOLDOWN_MS) return player
  return { ...player, direction, attack: { direction, elapsed: 0 }, sinceAttackStart: 0, walkDistance: 0 }
}

function getFacingDirection(movement, currentDirection) {
  if (movement.y < 0) return 'up'
  if (movement.y > 0) return 'down'
  if (movement.x < 0) return 'left'
  if (movement.x > 0) return 'right'
  return currentDirection
}

// Avança o personagem um quadro.
// input: { movement: { x, y }, attackDirection: 'up' | 'down' | 'left' | 'right' | null }
export function updatePlayer(player, input, deltaSeconds) {
  const stepMs = Math.max(0, Math.min(deltaSeconds * 1000, MAX_STEP_MS))

  let next = {
    ...player,
    sinceAttackStart: player.sinceAttackStart + stepMs,
    invincibleMs: Math.max(0, player.invincibleMs - stepMs),
  }
  if (next.attack) {
    const elapsed = next.attack.elapsed + stepMs
    next.attack = elapsed >= ATTACK_DURATION_MS ? null : { ...next.attack, elapsed }
  }
  if (next.hurt) {
    const elapsed = next.hurt.elapsed + stepMs
    next.hurt = elapsed >= HURT_DURATION_MS ? null : { ...next.hurt, elapsed }
  }

  next = startAttack(next, input.attackDirection)

  // Durante o dano e durante o golpe o personagem não anda
  if (next.hurt || next.attack) return { ...next, walkDistance: 0 }

  const { movement } = input
  if (movement.x !== 0 || movement.y !== 0) next.direction = getFacingDirection(movement, next.direction)
  const moved = moveRoomPlayer(next, movement, stepMs / 1000)
  next.walkDistance = updateWalkDistance(next.walkDistance, Math.hypot(moved.x - next.x, moved.y - next.y))
  next.x = moved.x
  next.y = moved.y
  return next
}

// O golpe acerta nos quadros hitFrames (de 160 a 350 ms)
export function isAttackHitActive(attack) {
  return Boolean(attack) && ATTACK.hitFrames.includes(getTimedFrame(ATTACK.durations, attack.elapsed))
}

// Caixa do golpe no mundo, ou null se o golpe não está acertando agora.
export function getAttackHitbox(player) {
  if (!isAttackHitActive(player.attack)) return null
  const box = ATTACK_HITBOXES[player.attack.direction]
  return { x: player.x + box.x, y: player.y + box.y, width: box.width, height: box.height }
}

// Qual folha, direção e quadro desenhar. reduceMotion deixa o andar parado no quadro 0;
// o golpe sempre anima, porque é informação de jogo.
export function getPlayerPose(player, reduceMotion = false) {
  if (player.hurt) {
    return { sheet: 'hurt', direction: player.hurt.direction, frame: getTimedFrame(HURT.durations, player.hurt.elapsed) }
  }
  if (player.attack) {
    return { sheet: 'attack', direction: player.attack.direction, frame: getTimedFrame(ATTACK.durations, player.attack.elapsed) }
  }
  const frame = reduceMotion ? 0 : getWalkFrame(player.walkDistance)
  return { sheet: 'walk', direction: player.direction, frame }
}
