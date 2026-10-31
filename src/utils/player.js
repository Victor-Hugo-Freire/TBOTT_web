import { CHARACTER_SPRITES } from '../data/characterSprites.js'
import { getTimedFrame, getTotalDuration, getWalkFrame, updateWalkDistance } from './spriteAnimation.js'
import { moveRoomPlayer } from './roomMovement.js'

// Estado do personagem na sala, em funções puras (sem React, sem canvas), para testar.
// Posição (x, y) = centro dos pés. Tempos em ms.
//
// O golpe de 630 ms não é cortado e deixa o personagem mais lento (metade da velocidade), sem travar.
// O cooldown conta do INÍCIO do golpe, mas como o golpe dura mais que o cooldown, a cadência real
// é de 630 ms (cerca de 1,6 golpe/s): o cooldown só passa a valer se um dia o golpe ficar mais curto que ele.
export const ATTACK_COOLDOWN_MS = 430
export const ATTACK_MOVE_SPEED = 0.5 // fração da velocidade normal enquanto ataca

const ATTACK = CHARACTER_SPRITES.tungTungSahurAtaque
const LEGS = CHARACTER_SPRITES.tungTungSahurPernas
export const ATTACK_DURATION_MS = getTotalDuration(ATTACK.durations)

// Dano: 410 ms de animação, em que o personagem não anda nem ataca (dano > ataque > andar).
// Depois de levar dano fica invencível por 1000 ms, contados do momento do golpe.
// Por enquanto nada chama hurtPlayer no jogo: só existe o estado, até haver inimigos.
const HURT = CHARACTER_SPRITES.tungTungSahurDano
export const HURT_DURATION_MS = getTotalDuration(HURT.durations)
export const INVINCIBILITY_MS = 1000

// Passo máximo de lógica por quadro: depois de uma pausa (aba escondida) o jogo não "pula"
const MAX_STEP_MS = 50

// Área do golpe, em unidades da sala e relativa aos pés. Começou como a união dos quadros 2 a 4 do
// ataque e foi ampliada (cerca de 20% de alcance e abertura; para cima, bem mais larga).
// O arco branco usa a mesma caixa. Ajuste olhando o debug (F3).
export const ATTACK_HITBOXES = {
  right: { x: 0, y: -67, width: 76, height: 98 },
  left: { x: -72, y: -68, width: 72, height: 97 },
  down: { x: -38, y: -30, width: 86, height: 68 },
  up: { x: -50, y: -136, width: 100, height: 92 },
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
  // walkDistance não zera: as pernas continuam o ciclo do andar durante o golpe
  return { ...player, direction, attack: { direction, elapsed: 0 }, sinceAttackStart: 0 }
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

  // Durante o dano o personagem não anda
  if (next.hurt) return { ...next, walkDistance: 0 }

  // Durante o golpe ele anda mais devagar e continua virado para o lado do golpe
  // (a pose do golpe usa attack.direction). As pernas seguem andando: a distância continua somando.
  const { movement } = input
  const attacking = Boolean(next.attack)
  if (!attacking && (movement.x !== 0 || movement.y !== 0)) next.direction = getFacingDirection(movement, next.direction)
  const moved = moveRoomPlayer(next, movement, stepMs / 1000, attacking ? ATTACK_MOVE_SPEED : 1)
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

// Arco branco do golpe (efeito desenhado pelo jogo, fora da folha do personagem).
// Aparece em 160 ms (início da janela de acerto), fica cheio de 200 a 350 ms e some até 450 ms.
// Usa a mesma caixa do golpe (ATTACK_HITBOXES), então o visual e o acerto combinam.
const ARC_START_MS = 160
const ARC_FULL_MS = 200
const ARC_HOLD_END_MS = 350
const ARC_END_MS = 450

// { x, y, width, height, direction, opacity } em unidades da sala, ou null se o arco não aparece agora.
export function getAttackArc(player) {
  if (!player.attack) return null
  const { direction, elapsed } = player.attack
  if (elapsed < ARC_START_MS || elapsed >= ARC_END_MS) return null

  let opacity = 1
  if (elapsed < ARC_FULL_MS) opacity = (elapsed - ARC_START_MS) / (ARC_FULL_MS - ARC_START_MS)
  else if (elapsed > ARC_HOLD_END_MS) opacity = (ARC_END_MS - elapsed) / (ARC_END_MS - ARC_HOLD_END_MS)

  const box = ATTACK_HITBOXES[direction]
  return { x: player.x + box.x, y: player.y + box.y, width: box.width, height: box.height, direction, opacity }
}

// Qual folha, direção e quadro desenhar. reduceMotion deixa o andar parado no quadro 0;
// o golpe sempre anima, porque é informação de jogo.
// O personagem é desenhado em camadas: as pernas (legs) atrás e o tronco (sheet/direction/frame) na frente.
// legs é null no dano, que tem o corpo inteiro numa folha só. Parado (ou reduzir movimento), as pernas ficam no
// quadro parado; andando, o quadro das pernas e o do tronco vêm da mesma distância andada, inclusive no golpe.
export function getPlayerPose(player, reduceMotion = false) {
  if (player.hurt) {
    return { sheet: 'hurt', direction: player.hurt.direction, frame: getTimedFrame(HURT.durations, player.hurt.elapsed), legs: null }
  }
  const walking = player.walkDistance > 0 && !reduceMotion
  const walkFrame = walking ? getWalkFrame(player.walkDistance) : 0
  const legsFrame = walking ? walkFrame : LEGS.idleFrame
  if (player.attack) {
    const { direction, elapsed } = player.attack
    return {
      sheet: 'attack',
      direction,
      frame: getTimedFrame(ATTACK.durations, elapsed),
      legs: { direction, frame: legsFrame },
    }
  }
  return { sheet: 'walk', direction: player.direction, frame: walkFrame, legs: { direction: player.direction, frame: legsFrame } }
}
