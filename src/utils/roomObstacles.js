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
export const CONVEYOR_SPEED = 130 // u/s da esteira, metade do andar (260): dá para andar contra ela
export const STICKY_SPEED = 0.5 // fração da velocidade em cima do piso grudento
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
// slippery: em cima do piso escorregadio; speedMultiplier: 0,5 no grudento, senão 1;
// push: empurrão da esteira em u/s (aplique com pushPlayer, que respeita os sólidos).
export function getFloorEffect(obstacles, feet) {
  const effect = { slippery: false, speedMultiplier: 1, push: { x: 0, y: 0 } }
  for (const obstacle of obstacles) {
    if (obstacle.removed || !containsPoint(obstacle.box, feet)) continue
    if (obstacle.mechanic === 'escorregadio') effect.slippery = true
    if (obstacle.mechanic === 'grudento') effect.speedMultiplier = STICKY_SPEED
    if (obstacle.mechanic === 'esteira') effect.push = { x: CONVEYOR_SPEED, y: 0 } // para a direita, como as setas do desenho
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

// O passo anterior foi bloqueado? Sim se havia movimento num eixo e a posição não mudou nele.
// (moveAndCollide encaixa os pés na borda, então encostado num sólido o eixo fica parado.)
// Um quadro sem tempo (deltaSeconds 0, como o primeiro quadro ou a volta do foco) não anda e não conta como bloqueio.
export function isBlockedStep(before, after, movement, deltaSeconds = 1) {
  if (deltaSeconds <= 0) return false
  return (movement.x !== 0 && after.x === before.x) || (movement.y !== 0 && after.y === before.y)
}

// Piso escorregadio: decide o movimento deste quadro.
//   slip: a direção guardada ({ x, y }) ou null se o jogador não está escorregando;
//   effect: o de getFloorEffect nos pés;
//   movement: o movimento das teclas (getRoomMovement);
//   blocked: o passo anterior foi bloqueado (isBlockedStep com o movimento usado nele).
// Devolve { slip, movement }: guarde o slip para o próximo quadro e ande com o movement.
// Regras:
// - fora do piso escorregadio, ou se bateu em algo: sem slip, valem as teclas (o jogador nunca fica preso);
// - já escorregando: segue a direção guardada, ignorando as teclas;
// - em cima, sem slip: andando, guarda a direção das teclas; parado, espera até começar a andar.
export function getSlipMovement(slip, effect, movement, blocked = false) {
  if (!effect.slippery || blocked) return { slip: null, movement }
  if (slip) return { slip, movement: slip }
  if (movement.x === 0 && movement.y === 0) return { slip: null, movement }
  return { slip: { x: movement.x, y: movement.y }, movement }
}
