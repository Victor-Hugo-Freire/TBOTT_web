import { overlaps } from './collision.js'
import { getFeetBox, moveRoomPlayer, ROOM_FLOOR, ROOM_PLAYER_SPEED, ROOM_WALLS } from './roomMovement.js'

// As 7 mecânicas dos obstáculos da sala, em funções puras (sem React, sem canvas), para testar.
// Um obstáculo é { id, col, row, kind, mechanic, blocking, box } (formato de roomLayout.js).
// Em jogo ele ganha, quando for o caso, removed: true (quebrou) e rolling: { x, y } (rolando nessa direção).
// Nenhuma função muda a lista recebida: elas devolvem uma lista nova.

// Direção do golpe → vetor (só o necessário aqui; as portas têm o mapa delas)
const DIRECTION_VECTORS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
}

export const ROLL_SPEED = 520 // u/s do barril deitado e da roda de parmesão depois do golpe
// u/s da esteira (o andar é 260). Era 130 e mal se sentia numa esteira de uma casa só; com 220 ainda dá para
// andar contra ela, bem devagar (40 u/s), e atravessar de lado desvia mais de meia casa.
export const CONVEYOR_SPEED = 220
export const STICKY_SPEED = 0.35 // fração da velocidade em cima do piso grudento (era 0,5: segurava pouco)
const HOT_MARGIN = 2 // a chapa bloqueia, então os pés só encostam: a margem faz o encostar contar

// O que bloqueia o jogador agora: as paredes, os obstáculos que bloqueiam (sem os quebrados e sem
// os que estão rolando, que passariam por cima dele) e as caixas extras (ex.: o tambor).
export function getRoomSolids(obstacles, extra = []) {
  const boxes = obstacles.filter((obstacle) => obstacle.blocking && !obstacle.removed && !obstacle.rolling)
  return [...ROOM_WALLS, ...boxes.map((obstacle) => obstacle.box), ...extra]
}

// Golpe do bastão: o quebrável que a caixa do golpe toca some; o rolante parado começa a rolar
// na direção do golpe. Os outros não mudam. hitbox é a de getAttackHitbox (null = golpe fora da janela).
export function hitObstacles(obstacles, hitbox, direction) {
  if (!hitbox) return obstacles
  return obstacles.map((obstacle) => {
    if (obstacle.removed || !overlaps(hitbox, obstacle.box)) return obstacle
    if (obstacle.mechanic === 'quebravel') return { ...obstacle, removed: true }
    if (obstacle.mechanic === 'rolante' && !obstacle.rolling) return { ...obstacle, rolling: { ...DIRECTION_VECTORS[direction] } }
    return obstacle
  })
}

// A caixa saiu do piso? (bateu na parede)
function isOutsideFloor(box) {
  return box.x < ROOM_FLOOR.left || box.y < ROOM_FLOOR.top || box.x + box.width > ROOM_FLOOR.right || box.y + box.height > ROOM_FLOOR.bottom
}

// Move os obstáculos que rolam. O que bate na borda do piso ou em outro obstáculo que bloqueia
// (e não quebrou) quebra também: obstáculo nunca para num lugar novo, então não fecha caminho.
// O passo máximo (520 x 0,05 = 26 u) é menor que qualquer obstáculo, então ele não atravessa nenhum.
export function updateRollingObstacles(obstacles, deltaSeconds) {
  const distance = ROLL_SPEED * Math.max(0, Math.min(deltaSeconds, 0.05))
  return obstacles.map((obstacle) => {
    if (!obstacle.rolling || obstacle.removed) return obstacle
    const { rolling } = obstacle
    const box = { ...obstacle.box, x: obstacle.box.x + rolling.x * distance, y: obstacle.box.y + rolling.y * distance }
    const hitsOther = obstacles.some(
      (other) => other !== obstacle && other.blocking && !other.removed && overlaps(box, other.box),
    )
    if (isOutsideFloor(box) || hitsOther) return { ...obstacle, box, removed: true }
    return { ...obstacle, box }
  })
}

// O ponto dos pés está dentro da área do obstáculo? (meio-aberto: a borda de baixo e a da direita
// já são da casa vizinha, então o ponto nunca fica em duas casas ao mesmo tempo)
function containsPoint(box, point) {
  return point.x >= box.x && point.x < box.x + box.width && point.y >= box.y && point.y < box.y + box.height
}

// Efeito do piso onde estão os pés (feet = { x, y }, a posição do jogador):
// slippery: em cima do piso escorregadio; speedMultiplier: STICKY_SPEED no grudento, senão 1;
// push: empurrão da esteira em u/s (aplique com pushPlayer, que respeita os sólidos).
export function getFloorEffect(obstacles, feet) {
  const effect = { slippery: false, speedMultiplier: 1, push: { x: 0, y: 0 } }
  for (const obstacle of obstacles) {
    if (obstacle.removed || !containsPoint(obstacle.box, feet)) continue
    if (obstacle.mechanic === 'escorregadio') effect.slippery = true
    if (obstacle.mechanic === 'grudento') effect.speedMultiplier = STICKY_SPEED
    // direction: 1 empurra para a direita e -1 para a esquerda, como as setas do desenho (veja getConveyorDirection)
    if (obstacle.mechanic === 'esteira') effect.push = { x: CONVEYOR_SPEED * (obstacle.direction ?? 1), y: 0 }
  }
  return effect
}

// Empurra os pés (esteira) com a mesma colisão do andar, então o empurrão não atravessa parede nem obstáculo.
export function pushPlayer(position, push, deltaSeconds, solids = ROOM_WALLS) {
  const speed = Math.hypot(push.x, push.y)
  if (speed === 0) return position
  return moveRoomPlayer(position, { x: push.x / speed, y: push.y / speed }, deltaSeconds, speed / ROOM_PLAYER_SPEED, solids)
}

// A caixa dos pés, aumentada 2 u, toca uma chapa quente (não removida)? Quem chama aplica hurtPlayer.
export function touchesHot(obstacles, feet) {
  const box = getFeetBox(feet, HOT_MARGIN)
  return obstacles.some((obstacle) => obstacle.mechanic === 'quente' && !obstacle.removed && overlaps(box, obstacle.box))
}

// ---------- piso escorregadio (vinho, azeite, sorvete e poça) ----------
// O personagem tem uma VELOCIDADE guardada (slip = { x, y }, em fração da velocidade de andar, com módulo
// no máximo SLIP_SPEED) que se aproxima aos poucos do que as teclas pedem. Assim ele acelera e freia devagar
// e continua deslizando depois de soltar a tecla. Fora do líquido, nada disso existe.
// Cada poça ocupa uma casa só (105 u), e atravessá-la reto não mudava nada. Por isso pisar nela andando dá um
// ESCORREGÃO: a velocidade pula para SLIP_SPEED vezes a do andar e ele sai da poça embalado, sem conseguir
// virar nem parar na hora (pedido do Victor em 2026-11-13: ser um obstáculo de verdade, sem exagero).
export const SLIP_SPEED = 1.4 // velocidade em cima do líquido, em vezes a do andar
export const SLIP_ACCELERATION = 0.8 // por segundo, no líquido: parado até a velocidade do andar em 1,25 s
export const SLIP_EXIT_DECAY = 1.6 // por segundo, ao sair do líquido: solto, o embalo leva ele ~160 u além da poça
const SLIP_MIN_SPEED = 0.01 // abaixo disso, sem tecla, a velocidade vira 0 (senão ele nunca ficaria parado)
const SLIP_MAX_STEP = 0.05 // passo máximo de tempo, o mesmo de moveRoomPlayer: o deslize nunca pula uma parede

// Anda de `from` até `to`, no máximo maxDelta. Os dois dentro do círculo de raio SLIP_SPEED: o caminho reto também fica.
function approach(from, to, maxDelta) {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const distance = Math.hypot(dx, dy)
  if (distance <= maxDelta) return { x: to.x, y: to.y }
  return { x: from.x + (dx / distance) * maxDelta, y: from.y + (dy / distance) * maxDelta }
}

// Decide o movimento deste quadro.
//   slip: a velocidade guardada ({ x, y }) ou null se o jogador não está escorregando;
//   effect: o de getFloorEffect nos pés;
//   movement: o movimento das teclas (getRoomMovement);
//   deltaSeconds: o tempo do quadro.
// Devolve { slip, movement }: guarde o slip para o próximo quadro e ande com o movement.
// Regras:
// - em cima do líquido: a velocidade vai para as teclas x SLIP_SPEED, com SLIP_ACCELERATION. Ao entrar andando,
//   ela já começa nesse valor (o escorregão); parado em cima, começa em 0 e acelera;
// - fora do líquido com velocidade sobrando: ela volta para as teclas com SLIP_EXIT_DECAY e, ao chegar, o slip acaba;
// - sem velocidade e fora do líquido, valem as teclas (o jogador nunca fica preso).
export function getSlipMovement(slip, effect, movement, deltaSeconds = 0) {
  if (!effect.slippery && !slip) return { slip: null, movement }

  const step = Math.max(0, Math.min(deltaSeconds, SLIP_MAX_STEP))
  const rate = effect.slippery ? SLIP_ACCELERATION : SLIP_EXIT_DECAY
  const speed = effect.slippery ? SLIP_SPEED : 1
  const target = { x: movement.x * speed, y: movement.y * speed }
  let velocity = approach(slip ?? target, target, rate * step)

  const noKeys = movement.x === 0 && movement.y === 0
  if (noKeys && Math.hypot(velocity.x, velocity.y) < SLIP_MIN_SPEED) velocity = { x: 0, y: 0 }

  if (!effect.slippery && velocity.x === movement.x && velocity.y === movement.y) return { slip: null, movement }
  return { slip: velocity, movement: velocity }
}

// Bateu numa parede ou obstáculo: o eixo em que a posição não mudou perde a velocidade.
// (moveAndCollide encaixa os pés na borda, então encostado num sólido o eixo fica parado.)
// Um quadro sem tempo (deltaSeconds 0, como o primeiro quadro ou a volta do foco) não anda e não conta.
export function stopBlockedAxes(slip, before, after, deltaSeconds = 1) {
  if (!slip || deltaSeconds <= 0) return slip
  return {
    x: slip.x !== 0 && after.x === before.x ? 0 : slip.x,
    y: slip.y !== 0 && after.y === before.y ? 0 : slip.y,
  }
}
