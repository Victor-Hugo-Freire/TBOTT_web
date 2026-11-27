import { CHARACTER_SPRITES } from '../data/characterSprites.js'
import { getTimedFrame, getTotalDuration, getWalkFrame, updateWalkDistance, WALK_FRAME_COUNT } from './spriteAnimation.js'
import { moveRoomPlayer, PLAYER_SCALE, ROOM_WALLS } from './roomMovement.js'
import { getBaseStats } from './stats.js'

// Estado do personagem na sala, em funções puras (sem React, sem canvas), para testar.
// Posição (x, y) = centro dos pés. Tempos em ms.
//
// Na velocidade de golpe 1 (atributo attackSpeed): o golpe de 630 ms não é cortado e deixa o personagem um pouco
// mais lento (80% da velocidade), sem travar. O cooldown conta do INÍCIO do golpe, mas como o golpe dura mais que
// o cooldown, a cadência real é de 630 ms (cerca de 1,6 golpe/s). Com o golpe mais rápido, os dois encurtam juntos.
export const ATTACK_COOLDOWN_MS = 430
export const ATTACK_MOVE_SPEED = 0.8 // fração da velocidade normal enquanto ataca (era 0,5: o golpe segurava demais)

const ATTACK = CHARACTER_SPRITES.tungTungSahurAtaque
const LEGS = CHARACTER_SPRITES.tungTungSahurPernas
export const ATTACK_DURATION_MS = getTotalDuration(ATTACK.durations)

// Dano: 410 ms de animação, em que o personagem não anda nem ataca (morte > dano > ataque > andar).
// Depois de levar dano fica invencível pelo tempo do atributo invincibilityMs (1000 ms no Tung), contado do golpe.
// Quem tira a vida é a run (run.js): aqui fica só a animação. Por enquanto só a chapa quente e os cacos machucam.
const HURT = CHARACTER_SPRITES.tungTungSahurDano
export const HURT_DURATION_MS = getTotalDuration(HURT.durations)

// Atributos usados quando quem chama não passa os dele (como nos testes): o Tung Tung sem itens
const DEFAULT_STATS = getBaseStats('tung-tung-sahur')

// Morte: a animação toca uma vez e para no último quadro (ele fica deitado). Morto, não anda, não ataca e não leva dano.
const DEATH = CHARACTER_SPRITES.tungTungSahurMorte
export const DEATH_DURATION_MS = getTotalDuration(DEATH.durations)

// Quem voa (o God) bate as asas mesmo parado: o tronco percorre os 12 quadros do andar pelo tempo, 50 ms cada (uma batida
// a cada 0,6 s). As pernas ficam paradas.
export const FLAP_FRAME_MS = 50

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

// Leva dano: interrompe o golpe, para o personagem e liga a invencibilidade por invincibilityMs (atributo).
// Enquanto está invencível, outro dano é ignorado.
export function hurtPlayer(player, invincibilityMs = DEFAULT_STATS.invincibilityMs) {
  if (player.dead || player.invincibleMs > 0 || player.hurt) return player
  return {
    ...player,
    attack: null,
    walkDistance: 0,
    hurt: { direction: player.direction, elapsed: 0 },
    invincibleMs: invincibilityMs,
  }
}

// A vida acabou: começa a animação de morte. Ela é sempre de frente e interrompe o golpe e o dano.
export function killPlayer(player) {
  if (player.dead) return player
  return { ...player, direction: 'down', attack: null, hurt: null, walkDistance: 0, dead: { elapsed: 0 } }
}

// Começa um golpe se não há golpe nem dano em andamento e o cooldown já acabou.
// attackSpeed (atributo): com o golpe mais rápido, o cooldown encurta na mesma proporção.
// area (atributo attackArea): tamanho da caixa do golpe; fica guardado no golpe (veja getAttackBox).
export function startAttack(player, direction, attackSpeed = 1, area = 1) {
  const cooldownMs = ATTACK_COOLDOWN_MS / attackSpeed
  if (!direction || player.dead || player.attack || player.hurt || player.sinceAttackStart < cooldownMs) return player
  // walkDistance não zera: as pernas continuam o ciclo do andar durante o golpe
  return { ...player, direction, attack: { direction, elapsed: 0, area }, sinceAttackStart: 0 }
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
// - speedMultiplier: velocidade do piso (ex.: 0,5 no piso grudento). Multiplica com a do golpe;
// - stats: atributos do jogador (stats.js; padrão: o Tung sem itens). moveSpeed multiplica a velocidade de andar
//   e attackSpeed a do golpe: o tempo do golpe anda mais depressa, então a animação, a janela de acerto e o arco
//   encolhem juntos (todos usam attack.elapsed).
export function updatePlayer(player, input, deltaSeconds, options = {}) {
  const { solids = ROOM_WALLS, speedMultiplier = 1, stats = DEFAULT_STATS } = options
  const stepMs = Math.max(0, Math.min(deltaSeconds * 1000, MAX_STEP_MS))

  // Morto: só o tempo da animação de morte anda
  if (player.dead) return { ...player, dead: { elapsed: player.dead.elapsed + stepMs } }

  let next = {
    ...player,
    sinceAttackStart: player.sinceAttackStart + stepMs,
    invincibleMs: Math.max(0, player.invincibleMs - stepMs),
  }
  if (next.attack) {
    const elapsed = next.attack.elapsed + stepMs * stats.attackSpeed
    next.attack = elapsed >= ATTACK_DURATION_MS ? null : { ...next.attack, elapsed }
  }
  if (next.hurt) {
    const elapsed = next.hurt.elapsed + stepMs
    next.hurt = elapsed >= HURT_DURATION_MS ? null : { ...next.hurt, elapsed }
  }

  next = startAttack(next, input.attackDirection, stats.attackSpeed, stats.attackArea)

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
  const speed = (attacking ? ATTACK_MOVE_SPEED : 1) * speedMultiplier * stats.moveSpeed
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

// Caixa do golpe no mundo. Com a área maior (attack.area, por exemplo 1,3 da Concha Longa), a caixa cresce
// para a frente (o lado do Tung fica parado: todo o ganho vira alcance) e abre igual para os dois lados.
function getAttackBox(player) {
  const { direction } = player.attack
  const box = ATTACK_HITBOXES[direction]
  const area = player.attack.area ?? 1
  const width = box.width * area
  const height = box.height * area
  let x = player.x + box.x
  let y = player.y + box.y
  if (direction === 'left') x -= width - box.width // cresce para a esquerda
  if (direction === 'up') y -= height - box.height // cresce para cima
  if (direction === 'up' || direction === 'down') x -= (width - box.width) / 2 // abre igual dos dois lados
  if (direction === 'left' || direction === 'right') y -= (height - box.height) / 2
  return { x, y, width, height }
}

// Caixa do golpe no mundo, ou null se o golpe não está acertando agora.
export function getAttackHitbox(player) {
  if (!isAttackHitActive(player.attack)) return null
  return getAttackBox(player)
}

// Arco branco do golpe (efeito desenhado pelo jogo, fora da folha do personagem).
// Aparece em 160 ms (início da janela de acerto), fica cheio de 200 a 350 ms e some até 450 ms.
// Usa a mesma caixa do golpe (getAttackBox, com a área), então o visual e o acerto combinam.
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

  return { ...getAttackBox(player), direction, opacity }
}

// Qual folha, direção e quadro desenhar. reduceMotion deixa o andar parado no quadro 0 e a morte já deitada;
// o golpe sempre anima, porque é informação de jogo.
// O personagem é desenhado em camadas: as pernas (legs) atrás e o tronco (sheet/direction/frame) na frente.
// legs é null no dano e na morte, que têm o corpo inteiro numa folha só.
// O corpo não inclina ao andar: o Victor rejeitou o balanço (2026-11-13); o passo fica todo na folha.
// flying (atributo do personagem) e timeMs (relógio da cena): quem voa e está parado anima as asas pelo tempo.
// Parado (ou reduzir movimento), as pernas ficam no quadro parado; andando, o quadro das pernas e o do tronco vêm da mesma distância andada, inclusive no golpe.
export function getPlayerPose(player, reduceMotion = false, flying = false, timeMs = 0) {
  if (player.dead) {
    // Depois do fim (ou com reduzir movimento, sem a queda), fica no último quadro: deitado
    const last = DEATH.durations.length - 1
    const timed = getTimedFrame(DEATH.durations, player.dead.elapsed)
    return { sheet: 'death', direction: 'down', frame: reduceMotion || timed === -1 ? last : timed, legs: null }
  }
  if (player.hurt) {
    return { sheet: 'hurt', direction: player.hurt.direction, frame: getTimedFrame(HURT.durations, player.hurt.elapsed), legs: null }
  }
  const walking = player.walkDistance > 0 && !reduceMotion
  let walkFrame = walking ? getWalkFrame(player.walkDistance) : 0
  if (flying && !walking && !reduceMotion) walkFrame = Math.floor(timeMs / FLAP_FRAME_MS) % WALK_FRAME_COUNT
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
  const { direction } = player
  return { sheet: 'walk', direction, frame: walkFrame, legs: { direction, frame: legsFrame } }
}
