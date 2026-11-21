import { CONTACT_DEPTH, CONTACT_WIDTH_SHARE, ENEMY_BODIES } from '../data/enemyBehavior.js'
import { ENEMY_SPRITES } from '../data/enemySprites.js'
import { overlaps } from './collision.js'
import { createRandom, mixSeed, pick } from './random.js'
import { getCellRect, getLayoutPoints } from './roomLayout.js'
import { getFeetBox } from './roomMovement.js'
import { getTimedFrame, getTotalDuration } from './spriteAnimation.js'
import { createTarget } from './targets.js'

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

// Um inimigo parado na casa (col, row), com a vida cheia. Os pés ficam a 3/4 da altura da casa (como o alvo de
// treino), para a caixa da base caber nela. O id é a casa: único na sala.
export function createEnemy(data, col, row) {
  const cell = getCellRect(col, row)
  const body = ENEMY_BODIES[data.id]
  const target = createTarget({
    id: `${col}-${row}`,
    x: cell.x + cell.width / 2,
    y: cell.y + cell.height * 0.75,
    width: body.width,
    height: body.height,
    health: data.health,
  })
  return {
    ...target,
    enemyId: data.id,
    damage: data.damage,
    speed: data.speed,
    animation: 'parado', // a animação que está tocando (nome da linha em enemySprites.js)
    animationMs: 0, // há quanto tempo ela toca
    facingLeft: false, // a folha é de frente; virado para a esquerda, o desenho é espelhado
  }
}

// Os inimigos da sala, prontos para entrar em run.targets
export function createRoomEnemies(seed, floorNumber, room, enemyCatalog) {
  return pickRoomEnemies(seed, floorNumber, room, enemyCatalog).map(({ enemyId, col, row }) =>
    createEnemy(enemyCatalog[enemyId], col, row),
  )
}

// Área de contato no chão, em volta dos pés: encostar nela machuca
export function getEnemyContactBox(enemy) {
  const width = enemy.width * CONTACT_WIDTH_SHARE
  return { x: enemy.x - width / 2, y: enemy.y - CONTACT_DEPTH, width, height: CONTACT_DEPTH }
}

// O primeiro inimigo vivo que os pés do Tung (feet = { x, y }) estão tocando, ou null
export function findTouchingEnemy(targets, feet) {
  const box = getFeetBox(feet)
  return targets.find((target) => target.enemyId && !target.dead && overlaps(box, getEnemyContactBox(target))) ?? null
}

// A sala tinha inimigos e todos morreram? (o alvo de treino não conta)
export function areEnemiesDefeated(targets) {
  const enemies = targets.filter((target) => target.enemyId)
  return enemies.length > 0 && enemies.every((enemy) => enemy.dead)
}

// Avança a animação dos inimigos um quadro. (Por enquanto eles ficam parados: os comportamentos vêm depois.)
export function updateEnemies(targets, stepMs) {
  return targets.map((target) => (target.enemyId ? { ...target, animationMs: target.animationMs + stepMs } : target))
}

// O que desenhar agora: { animation, frame, alpha }, ou null quando o inimigo já sumiu.
// A morte toca uma vez e o último quadro apaga aos poucos (alpha de 1 a 0 em DEATH_FADE_MS), com a sombra junto:
// assim ele não some de repente. O dano toca logo depois de levar um golpe; as outras repetem. Com "reduzir
// movimento", as que repetem ficam no quadro 0.
export function getEnemyPose(enemy, reduceMotion = false) {
  const { animations } = ENEMY_SPRITES[enemy.enemyId]
  if (enemy.dead) {
    const { durations } = animations.morte
    const deathMs = getTotalDuration(durations)
    if (enemy.deadMs < deathMs) return { animation: 'morte', frame: getTimedFrame(durations, enemy.deadMs), alpha: 1 }
    const alpha = 1 - (enemy.deadMs - deathMs) / DEATH_FADE_MS
    return alpha > 0 ? { animation: 'morte', frame: durations.length - 1, alpha } : null
  }
  if (enemy.hurtMs < getTotalDuration(animations.dano.durations)) {
    return { animation: 'dano', frame: getTimedFrame(animations.dano.durations, enemy.hurtMs), alpha: 1 }
  }
  const { durations } = animations[enemy.animation]
  const frame = reduceMotion ? 0 : getTimedFrame(durations, enemy.animationMs % getTotalDuration(durations))
  return { animation: enemy.animation, frame, alpha: 1 }
}
