import { CINQUECENTO } from '../data/bossBehavior.js'
import { moveAndCollide } from './collision.js'
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

// Comportamento de cada chefe, pelo id. Chefe sem comportamento ainda fica parado (só machuca ao encostar).
export const BOSS_BEHAVIORS = {
  'cinquecento-turbo': (car, world) => setContactDamage(updateCinquecento(car, world), 'investida'),
}
