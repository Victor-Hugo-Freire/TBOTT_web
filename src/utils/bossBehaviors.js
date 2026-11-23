import { CINQUECENTO, TRALALERO } from '../data/bossBehavior.js'
import { BOSS_SPRITES } from '../data/bossSprites.js'
import { getBossPhase } from './bosses.js'
import { moveAndCollide, overlaps } from './collision.js'
import { createNote } from './enemyShots.js'
import { getFeetBox } from './roomMovement.js'
import { getTotalDuration } from './spriteAnimation.js'
import {
  chase,
  createEnemyFlash,
  face,
  getDirectionTo,
  isAnimationOver,
  isHitFrame,
  moveEnemy,
  reachedEmitFrame,
  rest,
  setAnimation,
} from './enemyBehaviors.js'
import { getBaseBox } from './targets.js'

// Comportamento de cada chefe (issue #47): uma função por chefe, chamada a cada quadro por updateEnemies (enemies.js),
// do mesmo jeito que os inimigos (enemyBehaviors.js): o ESTADO é a animação que está tocando (boss.animation) e há
// quanto tempo ela toca (boss.animationMs). Os ajudantes (andar, virar, trocar de animação, efeitos) são os dos
// inimigos. Os números ficam em data/bossBehavior.js; o dano de cada ataque, no catálogo (boss.attacks).
// world é o mesmo dos inimigos (veja o começo de enemyBehaviors.js).

// ---------- ajudantes ----------

// Dano de um ataque do chefe (attacks do catálogo, pelo id, que é o nome da animação); sem esse ataque, o de encostar
function getAttackDamage(boss, attackId) {
  const attack = boss.attacks.find((item) => item.id === attackId)
  return attack ? attack.damage : boss.contactDamage
}

// Encostar no chefe tira o dano de encostar; durante a investida (`chargeAnimation`), o dano dela
function setContactDamage(boss, chargeAnimation) {
  const damage = boss.animation === chargeAnimation ? getAttackDamage(boss, chargeAnimation) : boss.contactDamage
  return { ...boss, damage }
}

// Ricochete: o lado em que ele bateu inverte a direção (bateu numa parede de lado: x inverte; em cima ou embaixo: y).
// Para saber qual lado bateu, testa um passo curto só em x e só em y a partir de onde ele parou.
function bounceAim(boss, aim, solids) {
  const box = getBaseBox(boss)
  const probe = 4
  const blockedX = aim.x !== 0 && moveAndCollide(box, aim.x * probe, 0, solids).x !== box.x + aim.x * probe
  const blockedY = aim.y !== 0 && moveAndCollide(box, 0, aim.y * probe, solids).y !== box.y + aim.y * probe
  if (!blockedX && !blockedY) return { x: -aim.x, y: -aim.y } // bateu de quina: volta por onde veio
  return { x: blockedX ? -aim.x : aim.x, y: blockedY ? -aim.y : aim.y }
}

// ---------- Cinquecento Turbo: investe e ricocheteia, buzina e abre o capô para esfriar ----------

// A investida: em linha reta a CINQUECENTO.chargeSpeed. Bateu em algo: o impacto, a marca de pneu e o ricochete; na
// batida número bounces + 1 (ou depois de maxChargeMs), para e abre o capô.
function chargeCinquecento(car, world) {
  if (reachedEmitFrame(car)) {
    world.flashes.push(createEnemyFlash('marca-pneu', car.x, car.y))
    car = { ...car, emitted: true }
  }
  const moved = moveEnemy(car, car.aim, CINQUECENTO.chargeSpeed, world)
  if (!moved.blocked) return moved.animationMs >= CINQUECENTO.maxChargeMs ? setAnimation(moved, 'esfriando') : moved

  world.flashes.push(createEnemyFlash('impacto', moved.x + moved.aim.x * (moved.base.width / 2), moved.y - 40))
  const bounces = moved.bounces + 1
  if (bounces > CINQUECENTO.bounces) return setAnimation({ ...moved, bounces }, 'esfriando')
  const aim = bounceAim(moved, moved.aim, world.solids)
  world.flashes.push(createEnemyFlash('marca-pneu', moved.x, moved.y))
  return { ...face(moved, aim), aim, bounces }
}

// A buzina: a onda de som sai no quadro do emits; nos quadros de acerto, quem está a até honkRadius leva o dano (uma vez)
function honkCinquecento(car, world) {
  if (reachedEmitFrame(car)) {
    const wave = createEnemyFlash('buzina', car.x, car.y - car.height / 2)
    world.flashes.push({ ...wave, scale: CINQUECENTO.honkScale })
    car = { ...car, emitted: true }
  }
  if (isHitFrame(car) && !car.honkHit && getDirectionTo(car, world.player).distance <= CINQUECENTO.honkRadius) {
    world.hits.push({ damage: getAttackDamage(car, 'atacando'), cause: car.enemyId })
    car = { ...car, honkHit: true }
  }
  return isAnimationOver(car) ? rest({ ...car, honkHit: false }, CINQUECENTO.restMs) : car
}

function updateCinquecento(car, world) {
  const to = getDirectionTo(car, world.player)
  if (car.animation === 'preparando-investida') {
    // Acelera parado, virado para o Tung (o aviso); no fim, investe para onde ele está
    if (!isAnimationOver(car)) return face(car, to)
    return { ...setAnimation(car, 'investida'), aim: { x: to.x, y: to.y }, bounces: 0, honked: false }
  }
  if (car.animation === 'investida') return chargeCinquecento(car, world)
  if (car.animation === 'atacando') return honkCinquecento(car, world)
  // Capô aberto: a janela de bater nele (a barra mostra VULNERAVEL); depois descansa
  if (car.animation === 'esfriando') return isAnimationOver(car) ? rest(car, CINQUECENTO.restMs) : car

  // Andando atrás do Tung. Perto dele, buzina (se não acabou de buzinar); depois de andar walkMs, ou logo depois de
  // buzinar com ele ainda perto, prepara a investida.
  const near = to.distance <= CINQUECENTO.honkRange
  if (near && !car.honked) return { ...face(setAnimation(car, 'atacando'), to), honked: true }
  const walkedEnough = car.animation === 'andando' && car.animationMs >= CINQUECENTO.walkMs
  if (walkedEnough || (near && car.honked)) return face(setAnimation(car, 'preparando-investida'), to)
  return chase(setAnimation(car, 'andando'), world, car.speed)
}

// ---------- Tralalero Tralala (andar 5): 3 fases ----------

// Ataques de longe de cada fase, na ordem em que ele reveza (a mordida é de perto, em qualquer fase)
const TRALALERO_ATTACKS = {
  1: ['investida'],
  2: ['investida', 'canto', 'pauta'],
  3: ['investida', 'canto', 'pauta', 'mergulho'],
}
const STAFF_DRAW_OFFSET = 20 // as linhas da pauta ficam um pouco acima do meio do desenho: ele desce para elas ficarem na fileira
const STAFF_MS = getTotalDuration(BOSS_SPRITES['tralalero-tralala'].animations.pauta.durations) // o desenho fica até o fim do canto

// Na fase 3 tudo fica mais rápido e os descansos, mais curtos
function getTralaleroSpeed(fish, speed) {
  return fish.phase >= 3 ? speed * TRALALERO.phase3Speed : speed
}

function restTralalero(fish) {
  const ms = fish.phase >= 3 ? TRALALERO.restMs / TRALALERO.phase3Speed : TRALALERO.restMs
  return rest(fish, ms)
}

// A pauta: no chão, na fileira em que o Tung está agora, saindo do lado do Tralalero para o lado do Tung, com
// TRALALERO.staffLength u. O desenho aparece já (é o aviso); o dano vem nos quadros de acerto (updateStaff).
function startStaff(fish, world) {
  const side = world.player.x < fish.x ? -1 : 1
  const length = TRALALERO.staffLength
  const staff = {
    x: side > 0 ? fish.x : fish.x - length,
    y: world.player.y - TRALALERO.staffHeight / 2,
    width: length,
    height: TRALALERO.staffHeight,
  }
  const drawing = createEnemyFlash('pauta', fish.x + (side * length) / 2, world.player.y + STAFF_DRAW_OFFSET)
  world.flashes.push({ ...drawing, scale: TRALALERO.staffScale, mirror: side < 0, durationMs: STAFF_MS, hold: true })
  return { ...fish, staff, staffHit: false }
}

// O próximo ataque de longe, revezando na ordem da fase. A pauta só serve com o Tung ao alcance dela (de lado);
// longe demais, vira o canto.
function startTralaleroAttack(fish, world, to) {
  const attacks = TRALALERO_ATTACKS[fish.phase]
  let attack = attacks[fish.attackCount % attacks.length]
  if (attack === 'pauta' && Math.abs(world.player.x - fish.x) > TRALALERO.staffLength) attack = 'canto'
  const next = { ...fish, attackCount: fish.attackCount + 1 }
  if (attack === 'investida') return { ...face(setAnimation(next, 'preparando-investida'), to), dashesLeft: TRALALERO.dashes }
  if (attack === 'canto') return face(setAnimation(next, 'canto-tralala'), to)
  if (attack === 'pauta') return startStaff(face(setAnimation(next, 'pauta'), to), world)
  return setAnimation(next, 'salto-mergulho') // o mergulho
}

// Investida tripla: o aviso (virado para o Tung) e um avanço em linha reta até dashMs ou até bater; depois do último,
// ele tropeça (a janela de bater nele)
function updateTralaleroCharge(fish, world, to) {
  if (fish.animation === 'preparando-investida') {
    if (!isAnimationOver(fish)) return face(fish, to)
    return { ...setAnimation(fish, 'investida'), aim: { x: to.x, y: to.y } }
  }
  const moved = moveEnemy(fish, fish.aim, getTralaleroSpeed(fish, TRALALERO.chargeSpeed), world)
  if (!moved.blocked && moved.animationMs < TRALALERO.dashMs) return moved
  if (moved.blocked) world.flashes.push(createEnemyFlash('impacto', moved.x + moved.aim.x * (moved.base.width / 2), moved.y - 40))
  const dashesLeft = moved.dashesLeft - 1
  if (dashesLeft > 0) return face(setAnimation({ ...moved, dashesLeft }, 'preparando-investida'), getDirectionTo(moved, world.player))
  return setAnimation({ ...moved, dashesLeft }, 'tropeco-vulneravel')
}

// Mordida: nos quadros de acerto, quem está a até biteRange leva o dano (uma vez). biteAttack diz qual ataque do
// catálogo vale: 'atacando' (a mordida de perto) ou 'salto-mergulho' (saindo do chão, no fim do mergulho).
function updateBite(fish, world) {
  if (isHitFrame(fish) && !fish.biteHit && getDirectionTo(fish, world.player).distance <= TRALALERO.biteRange) {
    world.hits.push({ damage: getAttackDamage(fish, fish.biteAttack), cause: fish.enemyId })
    fish = { ...fish, biteHit: true }
  }
  return isAnimationOver(fish) ? restTralalero({ ...fish, biteHit: false }) : fish
}

// Canto: as notas saem no quadro do emits, em leque na direção do Tung
function updateSong(fish, world) {
  if (reachedEmitFrame(fish)) {
    const to = getDirectionTo(fish, world.player)
    const middle = Math.atan2(to.y, to.x)
    for (let k = 0; k < TRALALERO.notes; k++) {
      const angle = middle + (k - (TRALALERO.notes - 1) / 2) * TRALALERO.noteSpread
      world.shots.push(createNote(fish, angle, getAttackDamage(fish, 'canto-tralala')))
    }
    fish = { ...fish, emitted: true }
  }
  return isAnimationOver(fish) ? restTralalero(fish) : fish
}

// Pauta: nos quadros de acerto, quem está nela leva o dano (uma vez)
function updateStaff(fish, world) {
  if (isHitFrame(fish) && !fish.staffHit && overlaps(getFeetBox(world.player), fish.staff)) {
    world.hits.push({ damage: getAttackDamage(fish, 'pauta'), cause: fish.enemyId })
    fish = { ...fish, staffHit: true }
  }
  return isAnimationOver(fish) ? restTralalero({ ...fish, staff: null }) : fish
}

function updateTralalero(fish, world) {
  const to = getDirectionTo(fish, world.player)

  // Chegou numa marca da barra: na fase 2 ele para e põe os óculos escuros (a transição); na 3 só fica mais rápido
  const phase = getBossPhase(fish)
  if (phase > fish.phase) {
    const changed = { ...fish, phase, staff: null, biteHit: false, staffHit: false }
    if (fish.phase === 1) return face(setAnimation({ ...changed, hidden: false }, 'transicao-fase2'), to)
    return changed
  }

  const { animation } = fish
  if (animation === 'transicao-fase2' || animation === 'tropeco-vulneravel') {
    // Pondo os óculos, ou tropeçando depois da investida tripla (a janela de bater nele)
    return isAnimationOver(fish) ? restTralalero(fish) : fish
  }
  if (animation === 'preparando-investida' || animation === 'investida') return updateTralaleroCharge(fish, world, to)
  if (animation === 'atacando') return updateBite(fish, world)
  if (animation === 'canto-tralala') return updateSong(fish, world)
  if (animation === 'pauta') return updateStaff(fish, world)
  if (animation === 'salto-mergulho') {
    // Salta e mergulha no chão; lá embaixo, só a barbatana aparece (e nada o acerta)
    return isAnimationOver(fish) ? { ...setAnimation(fish, 'barbatana'), hidden: true } : fish
  }
  if (animation === 'barbatana') {
    // A barbatana persegue o Tung; perto dele (ou depois de finMaxMs), sai do chão mordendo
    const near = to.distance <= TRALALERO.emergeRange
    if (!near && fish.animationMs < TRALALERO.finMaxMs) return chase(fish, world, getTralaleroSpeed(fish, TRALALERO.finSpeed))
    world.flashes.push(createEnemyFlash('respingo', fish.x, fish.y - 20))
    return { ...face(setAnimation(fish, 'atacando'), to), hidden: false, biteAttack: 'salto-mergulho' }
  }

  // Andando atrás do Tung: perto, morde; depois de andar walkMs, faz o próximo ataque de longe
  if (to.distance <= TRALALERO.biteRange) return { ...face(setAnimation(fish, 'atacando'), to), biteAttack: 'atacando' }
  if (animation === 'andando' && fish.animationMs >= TRALALERO.walkMs) return startTralaleroAttack(fish, world, to)
  return chase(setAnimation(fish, 'andando'), world, getTralaleroSpeed(fish, fish.speed))
}

// Comportamento de cada chefe, pelo id. Chefe sem comportamento ainda fica parado (só machuca ao encostar).
export const BOSS_BEHAVIORS = {
  'cinquecento-turbo': (car, world) => setContactDamage(updateCinquecento(car, world), 'investida'),
  'tralalero-tralala': (fish, world) => setContactDamage(updateTralalero(fish, world), 'investida'),
}
