import { CHARACTER_SPRITES } from '../data/characterSprites.js'
import { getTimedFrame, getTotalDuration, getWalkFrame, updateWalkDistance, WALK_CYCLE_DISTANCE } from './spriteAnimation.js'
import { moveRoomPlayer, PLAYER_SCALE, ROOM_WALLS } from './roomMovement.js'

// Estado do personagem na sala, em funções puras (sem React, sem canvas), para testar.
// Posição (x, y) = centro dos pés. Tempos em ms.
//
// O golpe de 630 ms não é cortado e deixa o personagem um pouco mais lento (80% da velocidade), sem travar.
// O cooldown conta do INÍCIO do golpe, mas como o golpe dura mais que o cooldown, a cadência real
// é de 630 ms (cerca de 1,6 golpe/s): o cooldown só passa a valer se um dia o golpe ficar mais curto que ele.
export const ATTACK_COOLDOWN_MS = 430
export const ATTACK_MOVE_SPEED = 0.8 // fração da velocidade normal enquanto ataca (era 0,5: o golpe segurava demais)

const ATTACK = CHARACTER_SPRITES.tungTungSahurAtaque
const LEGS = CHARACTER_SPRITES.tungTungSahurPernas
export const ATTACK_DURATION_MS = getTotalDuration(ATTACK.durations)

// Dano: 410 ms de animação, em que o personagem não anda nem ataca (morte > dano > ataque > andar).
// Depois de levar dano fica invencível por 1000 ms, contados do momento do golpe.
// Quem tira a vida é a run (run.js): aqui fica só a animação. Por enquanto só a chapa quente machuca.
const HURT = CHARACTER_SPRITES.tungTungSahurDano
export const HURT_DURATION_MS = getTotalDuration(HURT.durations)
export const INVINCIBILITY_MS = 1000

// Morte: a animação toca uma vez e para no último quadro (ele fica deitado). Morto, não anda, não ataca e não leva dano.
const DEATH = CHARACTER_SPRITES.tungTungSahurMorte
export const DEATH_DURATION_MS = getTotalDuration(DEATH.durations)

// Passo máximo de lógica por quadro: depois de uma pausa (aba escondida) o jogo não "pula"
const MAX_STEP_MS = 50

// Ao soltar as teclas de andar, o personagem espera um pouco antes de ficar de frente. Assim, ao trocar
// de tecla (soltar A e apertar D), ele não pisca de frente e a passada continua de onde estava.
export const TURN_FRONT_DELAY_MS = 120

// Área do golpe, em unidades da sala e relativa aos pés. Começou como a união dos quadros 2 a 4 do
// ataque e foi ampliada (cerca de 20% de alcance e abertura; para cima, bem mais larga).
// Os valores base são do personagem em escala 1; ATTACK_HITBOXES os multiplica por PLAYER_SCALE,
// para o golpe acompanhar o tamanho do desenho. O arco branco usa a mesma caixa. Ajuste olhando o debug (F3).
const BASE_ATTACK_HITBOXES = {
  right: { x: 0, y: -67, width: 76, height: 98 },
  left: { x: -76, y: -67, width: 76, height: 98 }, // espelho da direita (era menor porque o sprite da esquerda era menor)
  down: { x: -38, y: -30, width: 86, height: 68 },
  up: { x: -50, y: -136, width: 100, height: 92 },
}

function scaleBox(box) {
  return {
    x: Math.round(box.x * PLAYER_SCALE),
    y: Math.round(box.y * PLAYER_SCALE),
    width: Math.round(box.width * PLAYER_SCALE),
    height: Math.round(box.height * PLAYER_SCALE),
  }
}

export const ATTACK_HITBOXES = Object.fromEntries(
  Object.entries(BASE_ATTACK_HITBOXES).map(([direction, box]) => [direction, scaleBox(box)]),
)

export function createPlayer(position) {
  return {
    x: position.x,
    y: position.y,
    direction: 'down',
    walkDistance: 0,
    attack: null, // { direction, elapsed } enquanto o golpe acontece
    hurt: null, // { direction, elapsed } enquanto a animação de dano acontece
    dead: null, // { elapsed } depois que a vida acaba (a animação de morte)
    invincibleMs: 0, // ms de invencibilidade que ainda restam
    sinceAttackStart: Infinity, // ms desde o início do último golpe
    stoppedMs: 0, // ms sem nenhuma tecla de andar apertada
  }
}

// Leva dano: interrompe o golpe, para o personagem e liga a invencibilidade.
// Enquanto está invencível, outro dano é ignorado.
export function hurtPlayer(player) {
  if (player.dead || player.invincibleMs > 0 || player.hurt) return player
  return {
    ...player,
    attack: null,
    walkDistance: 0,
    hurt: { direction: player.direction, elapsed: 0 },
    invincibleMs: INVINCIBILITY_MS,
  }
}

// A vida acabou: começa a animação de morte. Ela é sempre de frente e interrompe o golpe e o dano.
export function killPlayer(player) {
  if (player.dead) return player
  return { ...player, direction: 'down', attack: null, hurt: null, walkDistance: 0, dead: { elapsed: 0 } }
}

// Começa um golpe se não há golpe nem dano em andamento e o cooldown já acabou.
export function startAttack(player, direction) {
  if (!direction || player.dead || player.attack || player.hurt || player.sinceAttackStart < ATTACK_COOLDOWN_MS) return player
  // walkDistance não zera: as pernas continuam o ciclo do andar durante o golpe
  return { ...player, direction, attack: { direction, elapsed: 0 }, sinceAttackStart: 0 }
}

// Parado (depois de TURN_FRONT_DELAY_MS), o personagem fica de frente (para baixo)
function getFacingDirection(movement) {
  if (movement.y < 0) return 'up'
  if (movement.x < 0) return 'left'
  if (movement.x > 0) return 'right'
  return 'down'
}

// Avança o personagem um quadro.
// input: { movement: { x, y }, attackDirection: 'up' | 'down' | 'left' | 'right' | null }
// options (opcional), para a sala com obstáculos:
// - solids: caixas que bloqueiam (padrão: só as paredes da sala);
// - speedMultiplier: velocidade do piso (ex.: 0,5 no piso grudento). Multiplica com a do golpe.
export function updatePlayer(player, input, deltaSeconds, options = {}) {
  const { solids = ROOM_WALLS, speedMultiplier = 1 } = options
  const stepMs = Math.max(0, Math.min(deltaSeconds * 1000, MAX_STEP_MS))

  // Morto: só o tempo da animação de morte anda
  if (player.dead) return { ...player, dead: { elapsed: player.dead.elapsed + stepMs } }

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
  // Parou há menos de TURN_FRONT_DELAY_MS: mantém a direção e a passada (pode estar só trocando de tecla)
  const stopped = movement.x === 0 && movement.y === 0
  next.stoppedMs = stopped ? player.stoppedMs + stepMs : 0
  const pausing = stopped && next.stoppedMs < TURN_FRONT_DELAY_MS
  if (!attacking && !pausing) next.direction = getFacingDirection(movement)
  const speed = (attacking ? ATTACK_MOVE_SPEED : 1) * speedMultiplier
  const moved = moveRoomPlayer(next, movement, stepMs / 1000, speed, solids)
  if (!pausing) next.walkDistance = updateWalkDistance(next.walkDistance, Math.hypot(moved.x - next.x, moved.y - next.y))
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

// Andar de frente e de costas: o tronco cobre boa parte das pernas, então além do passo da folha o corpo inteiro
// (pernas e tronco) inclina para um lado e para o outro em volta dos pés, acompanhando a passada. A inclinação
// muda a cada quadro desenhado (e não só a cada quadro da folha), por isso deixa o andar mais fluido.
// É o mesmo quadro da folha desenhado inclinado, não um quadro novo.
export const WALK_TILT_DEGREES = 3

// Inclinação do corpo, em graus: 0 de lado, senão segue o ciclo do andar (+ e - a cada passo)
function getWalkTilt(direction, walkDistance) {
  if (direction !== 'up' && direction !== 'down') return 0
  return WALK_TILT_DEGREES * Math.sin((2 * Math.PI * walkDistance) / WALK_CYCLE_DISTANCE)
}

// Qual folha, direção e quadro desenhar. reduceMotion deixa o andar parado no quadro 0 e a morte já deitada;
// o golpe sempre anima, porque é informação de jogo.
// O personagem é desenhado em camadas: as pernas (legs) atrás e o tronco (sheet/direction/frame) na frente.
// legs é null no dano e na morte, que têm o corpo inteiro numa folha só.
// tilt é a inclinação do corpo em graus (só andando de frente ou de costas; 0 no golpe, no dano e parado).
// Parado (ou reduzir movimento), as pernas ficam no quadro parado; andando, o quadro das pernas e o do tronco vêm da mesma distância andada, inclusive no golpe.
export function getPlayerPose(player, reduceMotion = false) {
  if (player.dead) {
    // Depois do fim (ou com reduzir movimento, sem a queda), fica no último quadro: deitado
    const last = DEATH.durations.length - 1
    const timed = getTimedFrame(DEATH.durations, player.dead.elapsed)
    return { sheet: 'death', direction: 'down', frame: reduceMotion || timed === -1 ? last : timed, legs: null, tilt: 0 }
  }
  if (player.hurt) {
    return { sheet: 'hurt', direction: player.hurt.direction, frame: getTimedFrame(HURT.durations, player.hurt.elapsed), legs: null, tilt: 0 }
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
      tilt: 0,
    }
  }
  const { direction } = player
  const tilt = walking ? getWalkTilt(direction, player.walkDistance) : 0
  return { sheet: 'walk', direction, frame: walkFrame, legs: { direction, frame: legsFrame }, tilt }
}
