import { CANNOLO, FENICOTTERO, FORMAGGINO, HAZARD_COOLDOWN_MS, HAZARD_DAMAGE, MOKA, PEPERONCINO, PINGUINO } from '../data/enemyBehavior.js'
import { PISTACCHIO, POLPETTA, VESPINA, ZANZARINA } from '../data/enemyBehavior.js'
import { BOSS_SPRITES } from '../data/bossSprites.js'
import { EFFECT_SPRITES } from '../data/effectSprites.js'
import { ENEMY_SPRITES } from '../data/enemySprites.js'
import { moveAndCollide } from './collision.js'
import { DOOR_HIT_ZONES } from './doors.js'
import { getChasePoint, hasClearPath } from './enemyPath.js'
import { createPizza, createSeed, createSteamRing } from './enemyShots.js'
import { ROOM_WALLS } from './roomMovement.js'
import { getFloorEffect, getSlipMovement, isOnShards, stopBlockedAxes, touchesHot } from './roomObstacles.js'
import { getTimedFrame, getTotalDuration } from './spriteAnimation.js'
import { damageTarget, getBaseBox, isTargetable } from './targets.js'

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
// - enemies: todos os alvos da sala no começo do quadro (a Moka procura neles um aliado para proteger);
// - hits: dano no Tung que não é de encostar ({ damage, cause }, ex.: a explosão do Peperoncino);
// - flashes: efeitos visuais que tocam uma vez (explosão, impacto, estrelas); floor: rastros novos no chão;
// - shots: projéteis novos (enemyShots.js); shields: ids dos aliados que a Moka acabou de proteger.

// ---------- ajudantes ----------

// Quem voa só bate nas paredes e nas portas: passa por cima dos obstáculos e dos pedestais
const AIR_SOLIDS = [...ROOM_WALLS, ...Object.values(DOOR_HIT_ZONES)]

// A folha (enemySprites.js ou bossSprites.js) de um inimigo ou de um chefe: os dois são alvos com enemyId
export function getEnemySprite(enemyId) {
  return ENEMY_SPRITES[enemyId] ?? BOSS_SPRITES[enemyId]
}

// Troca de animação (o tempo dela volta a 0, e ela ainda não soltou o efeito dela). Pedir a mesma animação não
// reinicia nada.
export function setAnimation(enemy, animation) {
  if (enemy.animation === animation) return enemy
  return { ...enemy, animation, animationMs: 0, emitted: false }
}

// A animação atual chegou ao quadro que solta o efeito dela (emits na folha: o caroço, a pizza, o vapor, a fumaça)
// e ainda não soltou? Quem chama solta o efeito e marca emitted: true.
export function reachedEmitFrame(enemy) {
  const { durations, emits } = getEnemySprite(enemy.enemyId).animations[enemy.animation]
  if (!emits || enemy.emitted) return false
  const frame = getTimedFrame(durations, enemy.animationMs)
  return frame === -1 || frame >= emits.frame // -1: a animação já acabou (quadro grande demais)
}

// Duração de uma animação do inimigo: a soma dos quadros
function getAnimationMs(enemy, animation) {
  return getTotalDuration(getEnemySprite(enemy.enemyId).animations[animation].durations)
}

// A animação atual chegou ao fim? (as que repetem, como "andando", só acabam quando o comportamento troca)
export function isAnimationOver(enemy) {
  return enemy.animationMs >= getAnimationMs(enemy, enemy.animation)
}

// Está num quadro de acerto (hitFrames) da animação atual?
export function isHitFrame(enemy) {
  const { durations, hitFrames = [] } = getEnemySprite(enemy.enemyId).animations[enemy.animation]
  return hitFrames.includes(getTimedFrame(durations, enemy.animationMs))
}

function emitMobCue(world, enemy, cue) {
  world.mobEvents ??= []
  world.mobEvents.push({ enemyId: enemy.enemyId, cue })
}

// Quanto tempo somam os quadros de acerto de uma animação
function getHitWindowMs(enemy, animation) {
  const { durations, hitFrames = [] } = getEnemySprite(enemy.enemyId).animations[animation]
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
export function face(enemy, direction) {
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
  // O Pinguino não escorrega no gelo dele, nem o Chimpanzini na casca dele
  if (enemy.enemyId === 'pinguino-sorbettino' || enemy.enemyId === 'chimpanzini-bananini') return { ...effect, slippery: false }
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
  const moved = moveAndCollide(box, dx, dy, enemy.flying ? AIR_SOLIDS : world.solids)
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
export function chase(enemy, world, speed) {
  const point = getChasePoint(enemy, world.player, world.chaseMap, world.pathSolids)
  return moveEnemy(enemy, getDirectionTo(enemy, point), speed, world)
}

// O Tung está a até `range` e sem nada no meio? (os ataques em linha reta só começam assim)
function canReach(enemy, world, range) {
  return getDirectionTo(enemy, world.player).distance <= range && hasClearPath(enemy, world.player, world.pathSolids)
}

// Quantas bolas de sorvete o Pinguino ainda tem (3, 2 ou 1): cada terço da vida que ele perde derruba uma
function countScoops(enemy) {
  return Math.max(1, Math.ceil((enemy.health / enemy.maxHealth) * 3))
}

// Animação parada. O Pinguino mostra as bolas de sorvete que ainda tem (3, 2 ou 1): cada golpe derruba uma.
// O Tralalero, da fase 2 em diante, fica parado de óculos escuros.
export function getIdleAnimation(enemy) {
  if (enemy.enemyId === 'tralalero-tralala') return enemy.phase >= 2 ? 'parado-fase2' : 'parado'
  if (enemy.enemyId !== 'pinguino-sorbettino') return 'parado'
  const balls = countScoops(enemy)
  if (balls >= 3) return 'parado'
  if (balls === 2) return 'parado-2'
  return 'parado-1'
}

// A versão da folha que o inimigo usa agora (variantLayers em enemySprites.js e bossSprites.js), ou null para a
// normal. O Pinguino usa a das bolas que ainda tem, em todas as animações; o chefe numa fase com outra aparência
// guarda a dele em layerVariant (bossBehaviors.js).
export function getLayerVariant(enemy) {
  if (enemy.enemyId !== 'pinguino-sorbettino') return enemy.layerVariant ?? null
  const balls = countScoops(enemy)
  if (balls >= 3) return null
  return balls === 2 ? 'bolas2' : 'bolas1'
}

// Fica parado `ms` (updateEnemies conta o tempo) e depois volta a agir
export function rest(enemy, ms) {
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
      if (!enemy.biteCuePlayed) {
        emitMobCue(world, enemy, 'mordida')
        enemy = { ...enemy, biteCuePlayed: true }
      }
      const speed = (FORMAGGINO.jumpDistance / getHitWindowMs(enemy, 'atacando')) * 1000
      enemy = moveEnemy(enemy, enemy.aim, speed, world)
    }
    if (isAnimationOver(enemy)) {
      emitMobCue(world, enemy, 'pouso')
      return rest(enemy, FORMAGGINO.restMs)
    }
    return enemy
  }
  if (canReach(enemy, world, FORMAGGINO.attackRange)) {
    const to = getDirectionTo(enemy, world.player)
    return { ...face(setAnimation(enemy, 'atacando'), to), aim: to, biteCuePlayed: false }
  }
  return chase(setAnimation(enemy, 'andando'), world, enemy.speed)
}

// ---------- Cannolo Carica: raspa o pé (aviso), investe em linha reta e, se bater, fica atordoado ----------

function updateCannolo(enemy, world) {
  const to = getDirectionTo(enemy, world.player)
  if (enemy.animation === 'preparando') {
    // Raspa o pé virado para o Tung; no fim, investe para onde ele está
    if (!isAnimationOver(enemy)) return face(enemy, to)
    emitMobCue(world, enemy, 'investida')
    return { ...setAnimation(enemy, 'atacando'), aim: to }
  }
  if (enemy.animation === 'atacando') {
    const moved = moveEnemy(enemy, enemy.aim, CANNOLO.chargeSpeed, world)
    if (moved.blocked) {
      // Bateu numa parede ou num obstáculo: o impacto e as estrelas de atordoado em cima da cabeça
      emitMobCue(world, moved, 'impacto')
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
  if (enemy.animation === 'emergindo') {
    if (!isAnimationOver(enemy)) return enemy
    emitMobCue(world, enemy, 'mordida')
    return setAnimation(enemy, 'atacando')
  }
  if (enemy.animation === 'atacando') return isAnimationOver(enemy) ? rest(enemy, POLPETTA.surfacedMs) : enemy
  if (enemy.animation === 'afundando') return isAnimationOver(enemy) ? { ...setAnimation(enemy, 'escondida'), hidden: true } : enemy
  // Parada na superfície (no começo da sala ou depois de morder): afunda
  emitMobCue(world, enemy, 'afundar')
  return setAnimation(enemy, 'afundando')
}

// ---------- Peperoncino Kamikaze: corre até o Tung, acende (aviso) e explode, morrendo junto ----------

// A explosão: o efeito (do tamanho da área do dano) e, se o Tung estiver perto, o dano dele (uma vez só)
function blast(enemy, world) {
  emitMobCue(world, enemy, 'explosao')
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
    emitMobCue(world, enemy, 'deslize')
    return { ...setAnimation(enemy, 'deslizando'), trailFrom: { x: enemy.x, y: enemy.y } }
  }
  if (enemy.animation === 'deslizando') {
    let moved = moveEnemy(enemy, enemy.aim, PINGUINO.slideSpeed, world)
    // Um pedaço de rastro a cada trailSpacing deslizados
    if (Math.hypot(moved.x - moved.trailFrom.x, moved.y - moved.trailFrom.y) >= PINGUINO.trailSpacing) {
      world.floor.push(createIceTrail(moved.x, moved.y))
      emitMobCue(world, moved, 'gelo')
      moved = { ...moved, trailFrom: { x: moved.x, y: moved.y } }
    }
    if (moved.blocked) {
      emitMobCue(world, moved, 'impacto')
      return rest(moved, PINGUINO.restMs)
    }
    if (moved.animationMs >= PINGUINO.maxSlideMs) {
      emitMobCue(world, moved, 'pouso')
      return rest(moved, PINGUINO.restMs)
    }
    return moved
  }
  if (canReach(enemy, world, PINGUINO.slideRange)) {
    const to = getDirectionTo(enemy, world.player)
    return { ...face(setAnimation(enemy, 'atacando'), to), aim: to }
  }
  return chase(setAnimation(enemy, 'andando'), world, enemy.speed)
}

// ---------- Pistacchio Sputacchio: com a linha livre, abre a casca e cospe um caroço ----------

function updatePistacchio(enemy, world) {
  if (enemy.animation === 'atacando') {
    // O caroço sai no quadro do emits, mirando onde o Tung está agora
    if (reachedEmitFrame(enemy)) {
      emitMobCue(world, enemy, 'lancamento')
      world.shots.push(createSeed(enemy, world.player))
      enemy = { ...enemy, emitted: true }
    }
    return isAnimationOver(enemy) ? rest(enemy, PISTACCHIO.restMs) : enemy
  }
  const to = getDirectionTo(enemy, world.player)
  // O caroço passa por cima dos perigos do chão, mas não atravessa obstáculo: basta a linha estar livre deles
  if (to.distance <= PISTACCHIO.shootRange && hasClearPath(enemy, world.player, world.solids)) {
    return face(setAnimation(enemy, 'atacando'), to)
  }
  return chase(setAnimation(enemy, 'andando'), world, enemy.speed)
}

// ---------- Fenicottero Fornarino: lança uma pizza em arco, que deixa queijo quente onde cai ----------

function updateFenicottero(enemy, world) {
  if (enemy.animation === 'atacando') {
    // A boca do forno acende (o aviso) e a pizza sai no quadro do emits, para onde o Tung está agora
    if (reachedEmitFrame(enemy)) {
      emitMobCue(world, enemy, 'lancamento')
      world.shots.push(createPizza(enemy, world.player))
      enemy = { ...enemy, emitted: true }
    }
    return isAnimationOver(enemy) ? rest(enemy, FENICOTTERO.restMs) : enemy
  }
  const to = getDirectionTo(enemy, world.player)
  // Perto demais, o queijo cairia nele: anda para longe do Tung (até bater em alguma coisa)
  if (to.distance < FENICOTTERO.minRange && !enemy.blocked) {
    return moveEnemy(setAnimation(enemy, 'andando'), { x: -to.x, y: -to.y }, enemy.speed, world)
  }
  // A pizza voa por cima de tudo: não precisa da linha livre
  if (to.distance <= FENICOTTERO.throwRange) return face(setAnimation(enemy, 'atacando'), to)
  return chase(setAnimation(enemy, 'andando'), world, enemy.speed)
}

// ---------- Moka Scudiera: protege um aliado com um escudo de vapor; sem aliado para proteger, solta o anel ----------

// O aliado mais perto da Moka que ainda não tem escudo (um inimigo vivo e à vista, que não seja ela), ou null
function findAllyToShield(moka, enemies) {
  let best = null
  for (const ally of enemies) {
    if (!ally.enemyId || ally.id === moka.id || ally.shielded || !isTargetable(ally)) continue
    if (!best || getDirectionTo(moka, ally).distance < getDirectionTo(moka, best).distance) best = ally
  }
  return best
}

function updateMoka(enemy, world) {
  if (enemy.animation === 'escudo') {
    // O vapor chega no aliado no quadro do emits (updateEnemies põe o escudo nele)
    if (reachedEmitFrame(enemy)) {
      emitMobCue(world, enemy, 'escudo')
      world.shields.push(enemy.allyId)
      enemy = { ...enemy, emitted: true }
    }
    return isAnimationOver(enemy) ? rest(enemy, MOKA.shieldRestMs) : enemy
  }
  if (enemy.animation === 'atacando') {
    // A tampa pula e o anel de vapor sai no quadro do emits
    if (reachedEmitFrame(enemy)) {
      emitMobCue(world, enemy, 'anel')
      world.shots.push(createSteamRing(enemy))
      enemy = { ...enemy, emitted: true }
    }
    return isAnimationOver(enemy) ? rest(enemy, MOKA.restMs) : enemy
  }
  // Proteger vem antes de atacar ("matar primeiro, antes que proteja os outros")
  const ally = findAllyToShield(enemy, world.enemies)
  if (ally) return { ...face(setAnimation(enemy, 'escudo'), getDirectionTo(enemy, ally)), allyId: ally.id }
  const to = getDirectionTo(enemy, world.player)
  if (to.distance <= MOKA.attackRange) return face(setAnimation(enemy, 'atacando'), to)
  return chase(setAnimation(enemy, 'andando'), world, enemy.speed)
}

// ---------- Vespina Lambrettina: acelera soltando fumaça, mergulha, faz uma curva fechada e mergulha de novo ----------

const SMOKE_SCALE = 1.4 // o desenho da fumaça (88 u de largura na escala 1) do tamanho da lambreta

// Gira a direção `aim` para o lado de `to`, no máximo `maxAngle` radianos
function turnToward(aim, to, maxAngle) {
  const current = Math.atan2(aim.y, aim.x)
  let turn = Math.atan2(to.y, to.x) - current
  // Pelo lado mais curto: virar 350° para a esquerda é o mesmo que virar 10° para a direita
  if (turn > Math.PI) turn -= 2 * Math.PI
  if (turn < -Math.PI) turn += 2 * Math.PI
  const angle = current + Math.max(-maxAngle, Math.min(maxAngle, turn))
  return { x: Math.cos(angle), y: Math.sin(angle) }
}

// Anda na direção guardada (aim) a `speed`, virando para o Tung até `turnRate` radianos por segundo
function steer(enemy, world, speed, turnRate) {
  const aim = turnToward(enemy.aim, getDirectionTo(enemy, world.player), turnRate * world.deltaSeconds)
  return moveEnemy({ ...enemy, aim }, aim, speed, world)
}

function updateVespina(enemy, world) {
  const to = getDirectionTo(enemy, world.player)
  if (enemy.animation === 'acelerando') {
    // Acelera parada, virada para o Tung (o aviso). A fumaça sai do escapamento, atrás dela, e fica na sala.
    enemy = face(enemy, to)
    if (reachedEmitFrame(enemy)) {
      emitMobCue(world, enemy, 'motor')
      const smoke = createEnemyFlash('fumaca', enemy.x - to.x * 50, enemy.y - 30)
      world.flashes.push({ ...smoke, scale: SMOKE_SCALE, durationMs: VESPINA.smokeMs, hold: true })
      enemy = { ...enemy, emitted: true }
    }
    if (!isAnimationOver(enemy)) return enemy
    emitMobCue(world, enemy, 'mergulho')
    return { ...setAnimation(enemy, 'atacando'), aim: to, divesLeft: VESPINA.dives }
  }
  if (enemy.animation === 'atacando') {
    // O mergulho com a ferroada: rápido, virando pouco. Bateu em alguma coisa, para.
    const moved = steer(enemy, world, VESPINA.diveSpeed, VESPINA.diveTurn)
    if (moved.blocked) {
      emitMobCue(world, moved, 'impacto')
      return rest(moved, VESPINA.restMs)
    }
    if (!isAnimationOver(moved)) return moved
    if (moved.divesLeft > 1) {
      emitMobCue(world, moved, 'curva')
      return { ...setAnimation(moved, 'curva'), divesLeft: moved.divesLeft - 1 }
    }
    return rest(moved, VESPINA.restMs)
  }
  if (enemy.animation === 'curva') {
    // A curva fechada: mais devagar e virando muito; no fim, mergulha de novo
    const moved = steer(enemy, world, VESPINA.curveSpeed, VESPINA.curveTurn)
    if (!isAnimationOver(moved)) return moved
    emitMobCue(world, moved, 'mergulho')
    return setAnimation(moved, 'atacando')
  }
  if (canReach(enemy, world, VESPINA.attackRange)) return face(setAnimation(enemy, 'acelerando'), to)
  return chase(setAnimation(enemy, 'andando'), world, enemy.speed)
}

// ---------- Zanzarina Tarantella: voa dançando até o Tung e mergulha com o ferrão ----------

function updateZanzarina(enemy, world) {
  if (enemy.animation === 'atacando') {
    // O mergulho acontece só nos quadros de acerto, na direção guardada, e cobre diveDistance (como o salto do Formaggino)
    if (isHitFrame(enemy)) {
      if (!enemy.diveCuePlayed) {
        emitMobCue(world, enemy, 'mergulho')
        enemy = { ...enemy, diveCuePlayed: true }
      }
      const speed = (ZANZARINA.diveDistance / getHitWindowMs(enemy, 'atacando')) * 1000
      enemy = moveEnemy(enemy, enemy.aim, speed, world)
    }
    return isAnimationOver(enemy) ? rest(enemy, ZANZARINA.restMs) : enemy
  }
  const to = getDirectionTo(enemy, world.player)
  if (to.distance <= ZANZARINA.diveRange) {
    return { ...face(setAnimation(enemy, 'atacando'), to), aim: to, diveCuePlayed: false }
  }
  // A dança: voa direto para o Tung (por cima dos obstáculos), balançando para os lados
  enemy = setAnimation(enemy, 'andando')
  const sway = Math.sin((enemy.animationMs / ZANZARINA.swayMs) * 2 * Math.PI) * ZANZARINA.sway
  const x = to.x - to.y * sway
  const y = to.y + to.x * sway
  const length = Math.hypot(x, y)
  return moveEnemy(enemy, { x: x / length, y: y / length }, enemy.speed, world)
}

// Comportamento de cada inimigo
export const ENEMY_BEHAVIORS = {
  'formaggino-saltellino': updateFormaggino,
  'cannolo-carica': updateCannolo,
  'polpetta-sotterranea': updatePolpetta,
  'peperoncino-kamikaze': updatePeperoncino,
  'pinguino-sorbettino': updatePinguino,
  'pistacchio-sputacchio': updatePistacchio,
  'fenicottero-fornarino': updateFenicottero,
  'moka-scudiera': updateMoka,
  'vespina-lambrettina': updateVespina,
  'zanzarina-tarantella': updateZanzarina,
}
