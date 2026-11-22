import { BOSS_BASE_HEIGHT, BOSS_BASE_WIDTH_SHARE, BOSS_BODIES, BOSS_CONTACT_DEPTH, BOSS_SPEEDS } from '../data/bossBehavior.js'
import { CONTACT_DEPTH, CONTACT_WIDTH_SHARE, ENEMY_BODIES, FLYING_ENEMIES, STAGE, START_WAIT_MS } from '../data/enemyBehavior.js'
import { overlaps } from './collision.js'
import { ENEMY_BEHAVIORS, explodeIfLit, getEnemySprite, getIdleAnimation, setAnimation, settleOnFloor } from './enemyBehaviors.js'
import { createChaseMap, getHazardBoxes } from './enemyPath.js'
import { createRandom, mixSeed, pick } from './random.js'
import { getCellPoint, getLayoutPoints } from './roomLayout.js'
import { getFeetBox } from './roomMovement.js'
import { getTimedFrame, getTotalDuration } from './spriteAnimation.js'
import { createTarget, isTargetable } from './targets.js'

// Inimigos das salas (issue #46). Cada inimigo é um alvo de targets.js (vida, lento, preso, empurrão, morte), com
// os dados do catálogo da API (enemyId, damage em meios corações, speed em u/s) e a animação que está tocando.
// Funções puras (sem React, sem canvas), para testar com node:test.

const ENEMY_SEED = 7100 // separa o sorteio dos inimigos dos outros sorteios da mesma sala (como em drops.js)
export const DEATH_FADE_MS = 300 // depois da animação de morte, o último quadro (o corpo achatado e a nuvem) apaga neste tempo
const ENEMY_ROOM_TYPES = ['comum'] // o Palco tem as ondas dele, e o chefe é a issue #47

// Inimigos de cada casa "i" do layout da sala: [{ enemyId, col, row }]. Sorteio pela seed + andar + sala, então a
// mesma sala tem sempre os mesmos inimigos. Só entram os que podem aparecer no andar (minFloor do catálogo).
// enemyCatalog = inimigos do catálogo por id (buildEnemyCatalog); vazio = nenhuma sala tem inimigos.
export function pickRoomEnemies(seed, floorNumber, room, enemyCatalog) {
  if (!ENEMY_ROOM_TYPES.includes(room.type)) return []
  const ids = Object.keys(enemyCatalog).filter((id) => enemyCatalog[id].minFloor <= floorNumber)
  if (ids.length === 0) return []
  const random = createRandom(mixSeed(mixSeed(seed, ENEMY_SEED + floorNumber), room.col * 16 + room.row))
  return getLayoutPoints(room.layoutId).enemies.map(({ col, row }) => ({ enemyId: pick(random, ids), col, row }))
}

// Um inimigo parado na casa (col, row), com a vida cheia. Os pés ficam no ponto da casa (a 3/4 da altura, como o
// alvo de treino), para a caixa da base caber nela. O id é a casa: único na sala.
// body = a caixa do corpo ({ width, height }); o chefe passa a dele (bosses.js).
export function createEnemy(data, col, row, body = ENEMY_BODIES[data.id]) {
  const point = getCellPoint(col, row)
  const target = createTarget({
    id: `${col}-${row}`,
    x: point.x,
    y: point.y,
    width: body.width,
    height: body.height,
    health: data.health,
  })
  return {
    ...target,
    enemyId: data.id,
    damage: data.damage,
    speed: data.speed,
    animation: 'parado', // a animação que está tocando (nome da linha em enemySprites.js): é o estado dele
    animationMs: 0, // há quanto tempo ela toca
    waitMs: START_WAIT_MS, // parado esperando: ao entrar na sala e depois de cada ataque (enemyBehaviors.js)
    facingLeft: false, // a folha é de frente; virado para a esquerda, o desenho é espelhado
    side: false, // de lado: usa as linhas "-lado" da folha, quando existem
    hidden: false, // escondido (a Polpetta no molho): nada o acerta e encostar não machuca
    hazardMs: 0, // ms até poder levar dano de novo da chapa quente ou dos cacos
    flying: FLYING_ENEMIES.includes(data.id), // voando: o piso e os perigos do chão não o afetam
  }
}

// Os inimigos da sala, prontos para entrar em run.targets
export function createRoomEnemies(seed, floorNumber, room, enemyCatalog) {
  return pickRoomEnemies(seed, floorNumber, room, enemyCatalog).map(({ enemyId, col, row }) =>
    createEnemy(enemyCatalog[enemyId], col, row),
  )
}

// O chefe: um inimigo grande, com a vida, o dano de encostar e os ataques do catálogo (bosses da API), o nome (para
// a barra de vida), a velocidade de BOSS_SPEEDS e uma base maior que a dos inimigos (veja getBaseBox em targets.js).
// O id é sempre 'chefe' (a sala tem um só).
export function createBoss(data, col, row) {
  const body = BOSS_BODIES[data.id]
  return {
    ...createEnemy(data, col, row, body),
    id: 'chefe',
    boss: true,
    name: data.name,
    speed: BOSS_SPEEDS[data.id],
    attacks: Array.isArray(data.attacks) ? data.attacks : [], // [{ id, name, damage }]: o id é o nome da animação
    base: { width: Math.round(body.width * BOSS_BASE_WIDTH_SHARE), height: BOSS_BASE_HEIGHT },
  }
}

// O chefe da sala do chefe, na casa "i" do layout, pronto para entrar em run.targets: [chefe], ou [] sem chefe
// para o andar (bossId null: catálogo vazio). bossCatalog = chefes do catálogo por id (buildBossCatalog).
export function createRoomBoss(bossId, bossCatalog, room) {
  if (!bossId || !bossCatalog[bossId]) return []
  const { col, row } = getLayoutPoints(room.layoutId).enemies[0]
  return [createBoss(bossCatalog[bossId], col, row)]
}

const STAGE_SEED = 7200 // separa o sorteio das ondas do Palco do sorteio das salas comuns

// Os inimigos da onda `wave` (0 a 3) do Palco, nas casas "i" do layout dele (STAGE.waves diz quantos). Os tipos são
// sorteados pela seed + andar + onda, entre os que podem aparecer no andar (minFloor). Cada onda começa numa casa
// diferente, para não nascerem sempre no mesmo lugar, e o id leva a onda (não repete o de quem morreu na anterior).
export function createWaveEnemies(seed, floorNumber, room, wave, enemyCatalog) {
  const ids = Object.keys(enemyCatalog).filter((id) => enemyCatalog[id].minFloor <= floorNumber)
  if (ids.length === 0) return []
  const random = createRandom(mixSeed(mixSeed(seed, STAGE_SEED + floorNumber), wave))
  const cells = getLayoutPoints(room.layoutId).enemies
  const enemies = []
  for (let k = 0; k < STAGE.waves[wave]; k++) {
    const { col, row } = cells[(wave + k) % cells.length]
    const enemy = createEnemy(enemyCatalog[pick(random, ids)], col, row)
    enemies.push({ ...enemy, id: `onda${wave + 1}-${enemy.id}` })
  }
  return enemies
}

// Área de contato no chão, em volta dos pés: encostar nela machuca. A do chefe é mais funda (o corpo ocupa mais chão).
export function getEnemyContactBox(enemy) {
  const width = enemy.width * CONTACT_WIDTH_SHARE
  const depth = enemy.boss ? BOSS_CONTACT_DEPTH : CONTACT_DEPTH
  return { x: enemy.x - width / 2, y: enemy.y - depth, width, height: depth }
}

// O primeiro inimigo vivo que os pés do Tung (feet = { x, y }) estão tocando, ou null
export function findTouchingEnemy(targets, feet) {
  const box = getFeetBox(feet)
  return targets.find((target) => target.enemyId && !target.dead && !target.hidden && overlaps(box, getEnemyContactBox(target))) ?? null
}

// A sala tinha inimigos e todos morreram? (o alvo de treino não conta)
export function areEnemiesDefeated(targets) {
  const enemies = targets.filter((target) => target.enemyId)
  return enemies.length > 0 && enemies.every((enemy) => enemy.dead)
}

// Um quadro dos inimigos: a animação anda e cada um age pelo seu comportamento (enemyBehaviors.js).
// Preso (Muçarela) ou sendo empurrado, ele não age e a animação para; esperando (waitMs), fica parado.
// Depois, o piso age nele (settleOnFloor): o embalo do líquido e a esteira.
// No fim, o escudo de vapor que a Moka soltou neste quadro chega nos aliados (shielded: anula o próximo dano).
// world = o que eles enxergam e onde deixam o que fizeram (veja enemyBehaviors.js). O alvo de treino não muda.
export function updateEnemies(targets, world) {
  const stepMs = world.deltaSeconds * 1000
  // O caminho até o Tung desviando dos obstáculos e dos perigos do chão: um mapa só por quadro, para todos
  world.pathSolids = [...world.solids, ...getHazardBoxes(world.floorObstacles ?? [])]
  world.chaseMap = createChaseMap(world.pathSolids, world.player)
  world.enemies = targets
  world.shields = []
  const next = targets.map((target) => {
    if (!target.enemyId) return target
    // Morto com o pavio aceso, o Peperoncino explode
    if (target.dead) return target.enemyId === 'peperoncino-kamikaze' ? explodeIfLit(target, world) : target
    if (target.stunMs > 0 || target.push) return target
    const enemy = { ...target, animationMs: target.animationMs + stepMs }
    // O piso (esteira, líquido, grudento) vale depois de agir, também para quem está esperando
    if (enemy.waitMs > 0) return settleOnFloor(setAnimation({ ...enemy, waitMs: Math.max(0, enemy.waitMs - stepMs) }, getIdleAnimation(enemy)), world)
    const behavior = ENEMY_BEHAVIORS[enemy.enemyId]
    return settleOnFloor(behavior ? behavior(enemy, world) : enemy, world)
  })
  return next.map((target) => (world.shields.includes(target.id) && isTargetable(target) ? { ...target, shielded: true } : target))
}

// Os rastros no chão (o gelo do Pinguino e o queijo quente do Fenicottero) envelhecem e somem depois de `ms`
export function updateEnemyFloor(floor, stepMs) {
  const next = []
  for (const trail of floor) {
    const ageMs = trail.ageMs + stepMs
    if (ageMs < trail.ms) next.push({ ...trail, ageMs })
  }
  return next
}

// A versão de lado da animação ("andando-lado"), se o inimigo está de lado e a folha tem essa linha
function withSide(enemy, animations, name) {
  const sideName = `${name}-lado`
  return enemy.side && animations[sideName] ? sideName : name
}

// O que desenhar agora: { animation, frame, alpha }, ou null quando o inimigo já sumiu.
// A morte toca uma vez e o último quadro apaga aos poucos (alpha de 1 a 0 em DEATH_FADE_MS), com a sombra junto:
// assim ele não some de repente. O dano toca logo depois de levar um golpe; as outras repetem. Com "reduzir
// movimento", as que repetem ficam no quadro 0.
export function getEnemyPose(enemy, reduceMotion = false) {
  const { animations } = getEnemySprite(enemy.enemyId)
  if (enemy.vanished) return null // explodiu (Peperoncino): a explosão toma o lugar da morte
  if (enemy.dead) {
    const animation = withSide(enemy, animations, 'morte')
    const { durations } = animations[animation]
    const deathMs = getTotalDuration(durations)
    if (enemy.deadMs < deathMs) return { animation, frame: getTimedFrame(durations, enemy.deadMs), alpha: 1 }
    const alpha = 1 - (enemy.deadMs - deathMs) / DEATH_FADE_MS
    return alpha > 0 ? { animation, frame: durations.length - 1, alpha } : null
  }
  const hurt = withSide(enemy, animations, 'dano')
  if (enemy.hurtMs < getTotalDuration(animations[hurt].durations)) {
    return { animation: hurt, frame: getTimedFrame(animations[hurt].durations, enemy.hurtMs), alpha: 1 }
  }
  const animation = withSide(enemy, animations, enemy.animation)
  const { durations } = animations[animation]
  const frame = reduceMotion ? 0 : getTimedFrame(durations, enemy.animationMs % getTotalDuration(durations))
  return { animation, frame, alpha: 1 }
}
