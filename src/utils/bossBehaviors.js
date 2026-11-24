import { CHIMPANZINI, CINQUECENTO, NONNA, PATAPIM, TRALALERO } from '../data/bossBehavior.js'
import { BOSS_SPRITES } from '../data/bossSprites.js'
import { getBossPhase } from './bosses.js'
import { moveAndCollide, overlaps } from './collision.js'
import { createBanana, createNote, createRoots } from './enemyShots.js'
import { getFeetBox, ROOM_FLOOR } from './roomMovement.js'
import { getTotalDuration } from './spriteAnimation.js'
import {
  chase,
  createEnemyFlash,
  face,
  getDirectionTo,
  getIdleAnimation,
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

// ---------- troca de fase (os chefes com marcas na barra: Chimpanzini, Nonna e Tralalero) ----------

// Descanso dos chefes que trocam de fase: contado pelo próprio chefe (restMs, veja restCountdown), e não pelo waitMs
// dos inimigos (que nem chama o comportamento): assim, descansando, ele percebe na hora que chegou numa marca da barra
function restBoss(boss, ms) {
  return { ...setAnimation(boss, getIdleAnimation(boss)), restMs: ms }
}

// Um quadro de descanso: devolve o chefe com o descanso contado, ou null se ele não está descansando
function restCountdown(boss, world) {
  if (!(boss.restMs > 0)) return null
  return { ...boss, restMs: Math.max(0, boss.restMs - world.deltaSeconds * 1000) }
}

// Chegou numa marca da barra (decisão do Victor, 2026-11-23): o chefe para o que estava fazendo, fica invencível e
// toca a animação da troca. É uma marca por vez: um golpe que passa de duas marcas toca as duas trocas, uma depois da
// outra. A troca é desenhada na folha `variant` (null = a normal, onde as animações de troca mostram a passagem de um
// estado para o outro); quem chama troca a folha e tira a invencibilidade no fim (endPhaseChange).
// A animação de dano do golpe que passou da marca é cortada (hurtMs): ela tem prioridade sobre as outras e, na folha
// da troca, mostraria a fase antiga (a Nonna inteira levando dano). A própria animação de troca já mostra o golpe.
// Devolve o chefe já trocando de fase, ou null se ele não chegou numa marca nova.
function startPhaseChange(boss, to, animation, variant) {
  if (getBossPhase(boss) <= boss.phase) return null
  const changing = {
    ...boss,
    phase: boss.phase + 1,
    hidden: false,
    invincible: true,
    hurtMs: Infinity,
    restMs: 0,
    layerVariant: variant,
    staff: null,
    biteHit: false,
    staffHit: false,
  }
  return face(setAnimation(changing, animation), to)
}

// Fim da troca: volta a levar dano, já com a folha da fase nova, e descansa `restMs`
function endPhaseChange(boss, variant, restMs) {
  return restBoss({ ...boss, invincible: false, layerVariant: variant }, restMs)
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

// Os quadros da buzina antes do primeiro acerto (ele enchendo o peito): o aviso que repete por honkWarnMs
const HONK = BOSS_SPRITES['cinquecento-turbo'].animations.atacando
const HONK_WINDUP_MS = getTotalDuration(HONK.durations.slice(0, HONK.hitFrames[0]))

// A buzina. Primeiro o aviso: os quadros antes do acerto repetem por honkWarnMs (honkWarnMs conta o que falta).
// Depois a animação segue: a onda de som sai no quadro do emits e, nos quadros de acerto, quem está a até honkRadius
// leva o dano (uma vez).
function honkCinquecento(car, world) {
  if (car.honkWarnMs > 0) {
    const honkWarnMs = Math.max(0, car.honkWarnMs - world.deltaSeconds * 1000)
    return { ...car, honkWarnMs, animationMs: honkWarnMs > 0 ? car.animationMs % HONK_WINDUP_MS : 0 }
  }
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
  if (near && !car.honked) return { ...face(setAnimation(car, 'atacando'), to), honked: true, honkWarnMs: CINQUECENTO.honkWarnMs }
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

function getTralaleroRestMs(fish) {
  return fish.phase >= 3 ? TRALALERO.restMs / TRALALERO.phase3Speed : TRALALERO.restMs
}

function restTralalero(fish) {
  return restBoss(fish, getTralaleroRestMs(fish))
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

  // Troca de fase: a da fase 2 é desenhada na folha normal (ele põe os óculos); a da fase 3, na folha de óculos (os
  // tênis piscam e brilham)
  const changing = startPhaseChange(fish, to, 'transicao-fase2', fish.phase === 1 ? null : 'fase2')
  if (changing) return changing
  const resting = restCountdown(fish, world)
  if (resting) return resting

  const { animation } = fish
  // No fim da troca ele já está de óculos (dali em diante, a folha de óculos)
  if (animation === 'transicao-fase2') return isAnimationOver(fish) ? endPhaseChange(fish, 'fase2', getTralaleroRestMs(fish)) : fish
  // Tropeçando depois da investida tripla (a janela de bater nele)
  if (animation === 'tropeco-vulneravel') return isAnimationOver(fish) ? restTralalero(fish) : fish
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

// ---------- Chimpanzini Bananini (andares 1 e 2): banana-bumerangue; na metade se descasca e fica mais rápido ----------

const PEEL_SCALE = 2 // a casca no chão: o desenho (57 x 40 u na escala 1) 2x maior
const PEEL_BOX = { width: 100, height: 50 } // a parte escorregadia da casca

// A casca no chão: um "obstáculo de piso" escorregadio, como o gelo do Pinguino (some depois de CHIMPANZINI.peelMs)
function createPeel(x, y) {
  const box = { x: x - PEEL_BOX.width / 2, y: y - PEEL_BOX.height, width: PEEL_BOX.width, height: PEEL_BOX.height }
  return { kind: 'casca-escorregadia', mechanic: 'escorregadio', box, x, y: y - PEEL_BOX.height / 2, scale: PEEL_SCALE, ageMs: 0, ms: CHIMPANZINI.peelMs }
}

function updateChimpanzini(chimp, world) {
  const to = getDirectionTo(chimp, world.player)
  // Na metade da vida ele se descasca: é a troca de fase, na folha normal (ela mostra a casca abrindo)
  const changing = startPhaseChange(chimp, to, 'descascar', null)
  if (changing) return changing
  const resting = restCountdown(chimp, world)
  if (resting) return resting

  if (chimp.animation === 'descascar') {
    // A casca cai no chão no quadro do emits e fica escorregadia; no fim ele já está descascado (a folha da fase 2)
    if (reachedEmitFrame(chimp)) {
      world.floor.push(createPeel(chimp.x, chimp.y))
      chimp = { ...chimp, emitted: true }
    }
    return isAnimationOver(chimp) ? endPhaseChange(chimp, 'fase2', CHIMPANZINI.restMs) : chimp
  }
  if (chimp.animation === 'atacando') {
    // As duas bananas saem da mão no quadro do emits, na direção do Tung: uma laça pela esquerda e a outra pela direita
    if (reachedEmitFrame(chimp)) {
      const damage = getAttackDamage(chimp, 'atacando')
      world.shots.push(createBanana(chimp, world.player, damage, -1), createBanana(chimp, world.player, damage, 1))
      chimp = { ...chimp, emitted: true }
    }
    return isAnimationOver(chimp) ? restBoss(chimp, CHIMPANZINI.restMs) : chimp
  }

  // Andando atrás do Tung (descascado, mais rápido e jogando mais vezes); depois de andar, joga a banana
  const peeled = chimp.phase >= 2
  const walk = peeled ? 'fase2-andando' : 'andando'
  const walkMs = peeled ? CHIMPANZINI.phase2WalkMs : CHIMPANZINI.walkMs
  if (chimp.animation === walk && chimp.animationMs >= walkMs && to.distance <= CHIMPANZINI.throwRange) {
    return face(setAnimation(chimp, 'atacando'), to)
  }
  return chase(setAnimation(chimp, walk), world, peeled ? chimp.speed * CHIMPANZINI.phase2Speed : chimp.speed)
}

// ---------- Nonna Lasagnona (andares 1 a 4): colherada, almôndegas e as camadas de lasanha ----------

// A troca de fase de cada marca da barra (a camada que cai, na folha normal) e a folha com as camadas que sobram
const NONNA_LAYERS = {
  2: { animation: 'perde-camada', variant: 'camadas3' },
  3: { animation: 'perde-camada-3', variant: 'camadas2' },
  4: { animation: 'perde-camada-2', variant: 'camadas1' },
}
const MEATBALL_ID = 'polpetta-sotterranea' // as almôndegas são Polpettas do catálogo de inimigos
const MEATBALL_MARGIN = 60 // as almôndegas nascem dentro do piso, a esta distância das paredes

// Almôndegas vivas na sala (as que ela chamou)
function countMeatballs(world) {
  return world.enemies.filter((enemy) => enemy.minion && !enemy.dead).length
}

// Pede as NONNA.meatballs almôndegas (updateEnemies cria as Polpettas), dos dois lados dela. Ela só invoca sem
// nenhuma viva (veja updateNonna), então nunca passam de NONNA.meatballs.
function summonMeatballs(nonna, world) {
  let summoned = nonna.summoned ?? 0
  for (let k = 0; k < NONNA.meatballs; k++) {
    const side = k % 2 === 0 ? -1 : 1
    const x = Math.min(ROOM_FLOOR.right - MEATBALL_MARGIN, Math.max(ROOM_FLOOR.left + MEATBALL_MARGIN, nonna.x + side * NONNA.summonDistance))
    const y = Math.min(ROOM_FLOOR.bottom - 10, Math.max(ROOM_FLOOR.top + MEATBALL_MARGIN, nonna.y + 20))
    world.spawns.push({ enemyId: MEATBALL_ID, id: `almondega-${summoned}`, x, y })
    world.flashes.push(createEnemyFlash('poof', x, y - 30))
    summoned++
  }
  return { ...nonna, summoned }
}

// Colherada: a colher bate no chão à frente dela; a onda de choque sai no quadro do emits e, nos quadros de acerto,
// machuca quem está a até slamRadius de onde a colher bateu (uma vez)
function slamNonna(nonna, world) {
  const side = nonna.facingLeft ? -1 : 1
  const impact = { x: nonna.x + side * NONNA.slamReach, y: nonna.y }
  if (reachedEmitFrame(nonna)) {
    world.flashes.push({ ...createEnemyFlash('onda-choque', impact.x, impact.y - 10), scale: NONNA.slamScale })
    nonna = { ...nonna, emitted: true }
  }
  if (isHitFrame(nonna) && !nonna.slamHit && getDirectionTo(impact, world.player).distance <= NONNA.slamRadius) {
    world.hits.push({ damage: getAttackDamage(nonna, 'atacando'), cause: nonna.enemyId })
    nonna = { ...nonna, slamHit: true }
  }
  return isAnimationOver(nonna) ? restBoss({ ...nonna, slamHit: false }, NONNA.restMs) : nonna
}

function updateNonna(nonna, world) {
  const to = getDirectionTo(nonna, world.player)
  const nextLayer = NONNA_LAYERS[nonna.phase + 1]
  const changing = nextLayer ? startPhaseChange(nonna, to, nextLayer.animation, null) : null
  if (changing) return changing
  const resting = restCountdown(nonna, world)
  if (resting) return resting

  const { animation } = nonna
  // Uma camada caiu: dali em diante, a folha com as camadas que sobraram
  if (animation.startsWith('perde-camada')) {
    return isAnimationOver(nonna) ? endPhaseChange(nonna, NONNA_LAYERS[nonna.phase].variant, NONNA.restMs) : nonna
  }
  if (animation === 'atacando') return slamNonna(nonna, world)
  if (animation === 'invocar') {
    if (reachedEmitFrame(nonna)) nonna = { ...summonMeatballs(nonna, world), emitted: true }
    return isAnimationOver(nonna) ? restBoss(nonna, NONNA.restMs) : nonna
  }

  // Andando atrás do Tung: perto, colherada; depois de andar walkMs, invoca (sem nenhuma almôndega viva e com a
  // Polpetta no catálogo); senão continua andando
  if (to.distance <= NONNA.slamRange) return face(setAnimation(nonna, 'atacando'), to)
  if (animation === 'andando' && nonna.animationMs >= NONNA.walkMs) {
    const canSummon = Boolean(world.enemyCatalog?.[MEATBALL_ID]) && countMeatballs(world) === 0
    if (canSummon) return face(setAnimation(nonna, 'invocar'), to)
    return { ...nonna, animationMs: 0 }
  }
  return chase(setAnimation(nonna, 'andando'), world, nonna.speed)
}

// ---------- Brr Brr Patapim (andares 1 e 2): pisão com onda de choque e raízes em linha ----------

function updatePatapim(boss, world) {
  const to = getDirectionTo(boss, world.player)
  if (boss.animation === 'atacando') {
    // O pisão: a onda de choque sai no quadro do emits; no quadro de acerto, machuca quem está a até stompRadius
    if (reachedEmitFrame(boss)) {
      world.flashes.push({ ...createEnemyFlash('onda-choque', boss.x, boss.y - 10), scale: PATAPIM.stompScale })
      boss = { ...boss, emitted: true }
    }
    if (isHitFrame(boss) && !boss.stompHit && to.distance <= PATAPIM.stompRadius) {
      world.hits.push({ damage: getAttackDamage(boss, 'atacando'), cause: boss.enemyId })
      boss = { ...boss, stompHit: true }
    }
    // Depois do pisão ele descansa: é a hora de bater no pé dele
    return isAnimationOver(boss) ? rest({ ...boss, stompHit: false }, PATAPIM.restMs) : boss
  }
  if (boss.animation === 'raizes') {
    // As raízes começam a brotar no quadro do emits, em linha na direção do Tung
    if (reachedEmitFrame(boss)) {
      world.shots.push(createRoots(boss, world.player, getAttackDamage(boss, 'raizes')))
      boss = { ...boss, emitted: true }
    }
    return isAnimationOver(boss) ? rest(boss, PATAPIM.restMs) : boss
  }
  // Os dois ataques revezam (pedido do Victor, 2026-11-23): depois de um pisão, o próximo é sempre as raízes, mesmo
  // com o Tung perto. Fora isso, andando atrás do Tung: perto, pisa; depois de andar walkMs, solta as raízes.
  if (boss.stomped) return { ...face(setAnimation(boss, 'raizes'), to), stomped: false }
  if (to.distance <= PATAPIM.stompRange) return { ...face(setAnimation(boss, 'atacando'), to), stomped: true }
  if (boss.animation === 'andando' && boss.animationMs >= PATAPIM.walkMs) return face(setAnimation(boss, 'raizes'), to)
  return chase(setAnimation(boss, 'andando'), world, boss.speed)
}

// Comportamento de cada chefe, pelo id. Chefe sem comportamento ainda fica parado (só machuca ao encostar).
export const BOSS_BEHAVIORS = {
  'cinquecento-turbo': (car, world) => setContactDamage(updateCinquecento(car, world), 'investida'),
  'tralalero-tralala': (fish, world) => setContactDamage(updateTralalero(fish, world), 'investida'),
  'chimpanzini-bananini': updateChimpanzini,
  'nonna-lasagnona': updateNonna,
  'brr-brr-patapim': updatePatapim,
}
