import { CANNOLO, FORMAGGINO, HAZARD_COOLDOWN_MS, HAZARD_DAMAGE, PEPERONCINO, PINGUINO, POLPETTA } from '../data/enemyBehavior.js'
import { EFFECT_SPRITES } from '../data/effectSprites.js'
import { ENEMY_SPRITES } from '../data/enemySprites.js'
import { moveAndCollide } from './collision.js'
import { getChasePoint, hasClearPath } from './enemyPath.js'
import { getFloorEffect, getSlipMovement, isOnShards, stopBlockedAxes, touchesHot } from './roomObstacles.js'
import { getTimedFrame, getTotalDuration } from './spriteAnimation.js'
import { damageTarget, getBaseBox } from './targets.js'

// Comportamento de cada inimigo: uma função por inimigo, chamada a cada quadro por updateEnemies (enemies.js),
// só com o inimigo vivo e solto (nem preso, nem sendo empurrado, nem esperando).
// O ESTADO do inimigo é a animação que está tocando (enemy.animation) e há quanto tempo ela toca (enemy.animationMs).
// Cada função olha o estado, decide o próximo e devolve o inimigo novo. Os tempos de aviso, de ataque e de
// recuperação saem das próprias folhas (enemySprites.js); os outros números ficam em data/enemyBehavior.js.
//
// world = o que o inimigo enxerga e onde ele deixa o que fez neste quadro:
// - player: os pés do Tung ({ x, y }); solids: o que bloqueia (paredes, obstáculos, pedestais e portas);
//   deltaSeconds: o tempo do quadro; chaseMap: o mapa para chegar ao Tung desviando dos obstáculos (enemyPath.js);
//   floorObstacles: os obstáculos da sala e o gelo do Pinguino, para o piso valer também nos inimigos;
//   pathSolids: o que o caminho não atravessa (solids mais os perigos do chão, que ele evita);
// - hits: dano no Tung que não é de encostar ({ damage, cause }, ex.: a explosão do Peperoncino);
// - flashes: efeitos visuais que tocam uma vez (explosão, impacto, estrelas); floor: rastros novos no chão.

// ---------- ajudantes ----------

// Troca de animação (o tempo dela volta a 0). Pedir a mesma animação não reinicia nada.
export function setAnimation(enemy, animation) {
  if (enemy.animation === animation) return enemy
  return { ...enemy, animation, animationMs: 0 }
}

// Duração de uma animação do inimigo: a soma dos quadros
function getAnimationMs(enemy, animation) {
  return getTotalDuration(ENEMY_SPRITES[enemy.enemyId].animations[animation].durations)
}

// A animação atual chegou ao fim? (as que repetem, como "andando", só acabam quando o comportamento troca)
function isAnimationOver(enemy) {
  return enemy.animationMs >= getAnimationMs(enemy, enemy.animation)
}

// Está num quadro de acerto (hitFrames) da animação atual?
function isHitFrame(enemy) {
  const { durations, hitFrames = [] } = ENEMY_SPRITES[enemy.enemyId].animations[enemy.animation]
  return hitFrames.includes(getTimedFrame(durations, enemy.animationMs))
}

// Quanto tempo somam os quadros de acerto de uma animação
function getHitWindowMs(enemy, animation) {
  const { durations, hitFrames = [] } = ENEMY_SPRITES[enemy.enemyId].animations[animation]
  let ms = 0
  for (const frame of hitFrames) ms += durations[frame]
  return ms
}

// Direção (com tamanho 1) e distância dos pés do inimigo até um ponto
export function getDirectionTo(enemy, point) {
  const dx = point.x - enemy.x
  const dy = point.y - enemy.y
  const distance = Math.hypot(dx, dy)
  if (distance === 0) return { x: 0, y: 0, distance }
  return { x: dx / distance, y: dy / distance, distance }
}

// Vira o inimigo para a direção: espelhado quando ela aponta para a esquerda, e "de lado" (as linhas -lado da
// folha, quando existem) quando ela é mais horizontal que vertical
function face(enemy, direction) {
  if (direction.x === 0 && direction.y === 0) return enemy
  return { ...enemy, facingLeft: direction.x < 0, side: Math.abs(direction.x) > Math.abs(direction.y) }
}

const NO_FLOOR_EFFECT = { slippery: false, speedMultiplier: 1, push: { x: 0, y: 0 } }

// O piso nos pés do inimigo vale como para o Tung (roomObstacles.js): o líquido escorrega, o grudento e os cacos
// deixam lento e a esteira empurra. Quem voa e a Polpetta escondida debaixo do molho não sentem o piso; o Pinguino
// não escorrega (nem no gelo que ele mesmo deixa).
function getEnemyFloorEffect(enemy, world) {
  if (enemy.flying || enemy.hidden || !world.floorObstacles) return NO_FLOOR_EFFECT
  const effect = getFloorEffect(world.floorObstacles, enemy)
  if (enemy.enemyId === 'pinguino-sorbettino') return { ...effect, slippery: false }
  return effect
}

// Anda na direção a `speed` u/s (mais devagar se estiver lento ou no piso grudento), com a caixa da base batendo
// no que bloqueia. No líquido, o embalo (slip) funciona como no Tung: escorrega, acelera e freia devagar.
// blocked = bateu em alguma coisa neste quadro; moved = andou neste quadro (veja settleOnFloor).
export function moveEnemy(enemy, direction, speed, world) {
  const floor = getEnemyFloorEffect(enemy, world)
  const slipping = getSlipMovement(enemy.slip ?? null, floor, direction, world.deltaSeconds)
  const distance = speed * enemy.slowMultiplier * floor.speedMultiplier * world.deltaSeconds
  const box = getBaseBox(enemy)
  const dx = slipping.movement.x * distance
  const dy = slipping.movement.y * distance
  const moved = moveAndCollide(box, dx, dy, world.solids)
  const blocked = moved.x !== box.x + dx || moved.y !== box.y + dy
  const next = { ...face(enemy, direction), x: moved.x + box.width / 2, y: moved.y + box.height, blocked, moved: true }
  return { ...next, slip: stopBlockedAxes(slipping.slip, enemy, next, world.deltaSeconds) }
}

// Depois de agir: quem não andou neste quadro continua o embalo do líquido (se tiver), e a esteira empurra todos,
// mesmo parados (como no Tung). Por fim, os perigos do chão (encostar na chapa quente ou pisar nos cacos) tiram
// HAZARD_DAMAGE, e o inimigo só leva esse dano de novo depois de HAZARD_COOLDOWN_MS (hazardMs). Quem voa não se fere.
export function settleOnFloor(enemy, world) {
  let next = enemy.moved ? enemy : moveEnemy(enemy, { x: 0, y: 0 }, enemy.speed, world)
  const { push } = getEnemyFloorEffect(next, world)
  if (push.x !== 0 || push.y !== 0) {
    const box = getBaseBox(next)
    const pushed = moveAndCollide(box, push.x * world.deltaSeconds, push.y * world.deltaSeconds, world.solids)
    next = { ...next, x: pushed.x + box.width / 2, y: pushed.y + box.height }
  }
  next = { ...next, moved: false, hazardMs: Math.max(0, (next.hazardMs ?? 0) - world.deltaSeconds * 1000) }
  const obstacles = world.floorObstacles ?? []
  const grounded = !next.flying && !next.hidden
  if (next.hazardMs === 0 && grounded && (touchesHot(obstacles, next) || isOnShards(obstacles, next))) {
    next = { ...damageTarget(next, HAZARD_DAMAGE), hazardMs: HAZARD_COOLDOWN_MS }
  }
  return next
}

// Anda até o Tung a `speed` u/s, desviando dos obstáculos pelo caminho da grade (enemyPath.js)
function chase(enemy, world, speed) {
  const point = getChasePoint(enemy, world.player, world.chaseMap, world.pathSolids)
  return moveEnemy(enemy, getDirectionTo(enemy, point), speed, world)
}

// O Tung está a até `range` e sem nada no meio? (os ataques em linha reta só começam assim)
function canReach(enemy, world, range) {
  return getDirectionTo(enemy, world.player).distance <= range && hasClearPath(enemy, world.player, world.pathSolids)
}

// Animação parada. O Pinguino mostra as bolas de sorvete que ainda tem (3, 2 ou 1): cada golpe derruba uma.
export function getIdleAnimation(enemy) {
  if (enemy.enemyId !== 'pinguino-sorbettino') return 'parado'
  const balls = Math.ceil((enemy.health / enemy.maxHealth) * 3)
  if (balls >= 3) return 'parado'
  if (balls === 2) return 'parado-2'
  return 'parado-1'
}

// Fica parado `ms` (updateEnemies conta o tempo) e depois volta a agir
function rest(enemy, ms) {
  return { ...setAnimation(enemy, getIdleAnimation(enemy)), waitMs: ms }
}

// Efeito visual de inimigo (effectSprites.js) com o meio em (x, y): toca uma vez; com durationMs, repete até lá
export function createEnemyFlash(effect, x, y, durationMs = null) {
  const loop = durationMs !== null
  const ms = loop ? durationMs : getTotalDuration(Object.values(EFFECT_SPRITES[effect].animations)[0].durations)
  return { effect, x, y, scale: 1, angle: 0, elapsedMs: 0, durationMs: ms, loop }
}

// ---------- Formaggino Saltellino: persegue; perto, agacha e salta mordendo; descansa ao pousar ----------

function updateFormaggino(enemy, world) {
  if (enemy.animation === 'atacando') {
    // O salto acontece só nos quadros de acerto, na direção guardada ao agachar, e cobre jumpDistance
    if (isHitFrame(enemy)) {
      const speed = (FORMAGGINO.jumpDistance / getHitWindowMs(enemy, 'atacando')) * 1000
      enemy = moveEnemy(enemy, enemy.aim, speed, world)
    }
    return isAnimationOver(enemy) ? rest(enemy, FORMAGGINO.restMs) : enemy
  }
  if (canReach(enemy, world, FORMAGGINO.attackRange)) {
    const to = getDirectionTo(enemy, world.player)
    return { ...face(setAnimation(enemy, 'atacando'), to), aim: to }
  }
  return chase(setAnimation(enemy, 'andando'), world, enemy.speed)
}

// ---------- Cannolo Carica: raspa o pé (aviso), investe em linha reta e, se bater, fica atordoado ----------

function updateCannolo(enemy, world) {
  const to = getDirectionTo(enemy, world.player)
  if (enemy.animation === 'preparando') {
    // Raspa o pé virado para o Tung; no fim, investe para onde ele está
    if (!isAnimationOver(enemy)) return face(enemy, to)
    return { ...setAnimation(enemy, 'atacando'), aim: to }
  }
  if (enemy.animation === 'atacando') {
    const moved = moveEnemy(enemy, enemy.aim, CANNOLO.chargeSpeed, world)
    if (moved.blocked) {
      // Bateu numa parede ou num obstáculo: o impacto e as estrelas de atordoado em cima da cabeça
      world.flashes.push(createEnemyFlash('impacto', moved.x + moved.aim.x * 30, moved.y - 40))
      world.flashes.push(createEnemyFlash('estrela-atordoado', moved.x, moved.y - moved.height, CANNOLO.stunnedMs))
      return setAnimation(moved, 'atordoado')
    }
    return moved.animationMs >= CANNOLO.maxChargeMs ? rest(moved, CANNOLO.restMs) : moved
  }
  if (enemy.animation === 'atordoado') {
    // A janela de bater nele
    return enemy.animationMs >= CANNOLO.stunnedMs ? rest(enemy, CANNOLO.restMs) : enemy
  }
  if (canReach(enemy, world, CANNOLO.chargeRange)) return face(setAnimation(enemy, 'preparando'), to)
  return chase(setAnimation(enemy, 'andando'), world, enemy.speed)
}

// ---------- Polpetta Sotterranea: escondida no molho, emerge embaixo do Tung, morde e afunda ----------

function updatePolpetta(enemy, world) {
  if (enemy.animation === 'escondida') {
    // Debaixo do molho, vai até o Tung (desviando dos obstáculos); emerge quando chega perto ou depois de hiddenMs
    const to = getDirectionTo(enemy, world.player)
    if (to.distance > POLPETTA.emergeRange && enemy.animationMs < POLPETTA.hiddenMs) return chase(enemy, world, enemy.speed)
    return { ...setAnimation(enemy, 'emergindo'), hidden: false }
  }
  if (enemy.animation === 'emergindo') return isAnimationOver(enemy) ? setAnimation(enemy, 'atacando') : enemy
  if (enemy.animation === 'atacando') return isAnimationOver(enemy) ? rest(enemy, POLPETTA.surfacedMs) : enemy
  if (enemy.animation === 'afundando') return isAnimationOver(enemy) ? { ...setAnimation(enemy, 'escondida'), hidden: true } : enemy
  // Parada na superfície (no começo da sala ou depois de morder): afunda
  return setAnimation(enemy, 'afundando')
}

// ---------- Peperoncino Kamikaze: corre até o Tung, acende (aviso) e explode, morrendo junto ----------

// A explosão: o efeito (do tamanho da área do dano) e, se o Tung estiver perto, o dano dele (uma vez só)
function blast(enemy, world) {
  world.flashes.push({ ...createEnemyFlash('explosao', enemy.x, enemy.y - enemy.height / 2), scale: PEPERONCINO.blastScale })
  if (getDirectionTo(enemy, world.player).distance <= PEPERONCINO.blastRadius) {
    world.hits.push({ damage: enemy.damage, cause: enemy.enemyId })
  }
  return { ...enemy, blasted: true }
}

function updatePeperoncino(enemy, world) {
  if (enemy.animation === 'aceso') {
    // Acende e pisca (o aviso) e corre atrás do Tung mais rápido; quando o pavio acaba, explode
    if (enemy.animationMs >= PEPERONCINO.fuseMs) return setAnimation(enemy, 'atacando')
    return chase(enemy, world, enemy.speed * PEPERONCINO.litSpeedMultiplier)
  }
  if (enemy.animation === 'atacando') {
    // A explosão acerta no primeiro quadro de acerto; no fim da animação ele morre e some (vanished)
    if (isHitFrame(enemy) && !enemy.blasted) enemy = blast(enemy, world)
    return isAnimationOver(enemy) ? { ...enemy, health: 0, dead: true, deadMs: 0, vanished: true } : enemy
  }
  if (getDirectionTo(enemy, world.player).distance <= PEPERONCINO.fuseRange) return setAnimation(enemy, 'aceso')
  return chase(setAnimation(enemy, 'andando'), world, enemy.speed)
}

// Morto pelo Tung com o pavio já aceso, ele explode na hora e some. Morto antes de acender, não explode.
export function explodeIfLit(enemy, world) {
  if (enemy.blasted || (enemy.animation !== 'aceso' && enemy.animation !== 'atacando')) return enemy
  return { ...blast(enemy, world), vanished: true }
}

// ---------- Pinguino Sorbettino: se joga de barriga e desliza em linha reta, deixando gelo ----------

const ICE_TRAIL_BOX = { width: 90, height: 40 } // o desenho do rastro tem cerca de 99 x 43 u

// Um pedaço de rastro de gelo: um "obstáculo de piso" escorregadio, como o vinho (roomObstacles.js já sabe o que
// fazer com ele: getFloorEffect). Some depois de PINGUINO.trailMs.
export function createIceTrail(x, y) {
  const box = { x: x - ICE_TRAIL_BOX.width / 2, y: y - ICE_TRAIL_BOX.height, width: ICE_TRAIL_BOX.width, height: ICE_TRAIL_BOX.height }
  return { kind: 'rastro-gelo', mechanic: 'escorregadio', box, x, y: y - ICE_TRAIL_BOX.height / 2, ageMs: 0, ms: PINGUINO.trailMs }
}

function updatePinguino(enemy, world) {
  if (enemy.animation === 'atacando') {
    // Toma impulso e se joga de barriga (o aviso); depois desliza para onde o Tung estava
    if (!isAnimationOver(enemy)) return enemy
    return { ...setAnimation(enemy, 'deslizando'), trailFrom: { x: enemy.x, y: enemy.y } }
  }
  if (enemy.animation === 'deslizando') {
    let moved = moveEnemy(enemy, enemy.aim, PINGUINO.slideSpeed, world)
    // Um pedaço de rastro a cada trailSpacing deslizados
    if (Math.hypot(moved.x - moved.trailFrom.x, moved.y - moved.trailFrom.y) >= PINGUINO.trailSpacing) {
      world.floor.push(createIceTrail(moved.x, moved.y))
      moved = { ...moved, trailFrom: { x: moved.x, y: moved.y } }
    }
    if (moved.blocked || moved.animationMs >= PINGUINO.maxSlideMs) return rest(moved, PINGUINO.restMs)
    return moved
  }
  if (canReach(enemy, world, PINGUINO.slideRange)) {
    const to = getDirectionTo(enemy, world.player)
    return { ...face(setAnimation(enemy, 'atacando'), to), aim: to }
  }
  return chase(setAnimation(enemy, 'andando'), world, enemy.speed)
}

// Comportamento de cada inimigo. Quem não está aqui fica parado (os que atiram e voam vêm na etapa 3).
export const ENEMY_BEHAVIORS = {
  'formaggino-saltellino': updateFormaggino,
  'cannolo-carica': updateCannolo,
  'polpetta-sotterranea': updatePolpetta,
  'peperoncino-kamikaze': updatePeperoncino,
  'pinguino-sorbettino': updatePinguino,
}
