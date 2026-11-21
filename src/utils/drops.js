import { CELLAR_GRAINS, GRAIN_GROUP_CHANCES, HEART_HEAL, MAX_GRAINS, ROOM_REWARD_CHANCES } from '../data/economy.js'
import { CONSUMABLE_SPRITES } from '../data/itemSprites.js'
import { overlaps } from './collision.js'
import { chance, createRandom, mixSeed } from './random.js'
import { findFreeCell, getCellPoint } from './roomLayout.js'
import { getFeetBox } from './roomMovement.js'
import { getTotalDuration } from './spriteAnimation.js'

// Grãos de café, garfos e corações no chão. Funções puras (sem React, sem canvas), para testar com node:test.
// Cada coisa no chão é { kind, amount, x, y, appearMs }:
// - kind: 'graos', 'garfo' ou 'coracao'; amount: quantos grãos (1, 3 ou 5) ou 1 (garfo e coração);
// - x, y: o ponto no chão, onde ficam os pés do desenho;
// - appearMs: o tempo da animação de aparecer. Sem ele, a coisa já está no chão. Negativo, ela ainda não apareceu
//   (o prêmio do Fliperama espera o tambor parar) e não dá para pegar. Não vai para o save.
// O que está no chão fica em room.drops (o estado vivo da sala, como room.removed) e vai para o save.

export const DROP_KINDS = ['graos', 'garfo', 'coracao']
// Duração da animação "aparecer" do grão e do garfo (as duas têm o mesmo tempo); o coração usa o mesmo
export const DROP_APPEAR_MS = getTotalDuration(CONSUMABLE_SPRITES['grao-de-cafe'].animations.aparecer.durations)
// Duração da animação "coleta" (o que foi pego sobe e some); o coração usa a mesma
export const DROP_COLLECT_MS = getTotalDuration(CONSUMABLE_SPRITES['grao-de-cafe'].animations.coleta.durations)
const DROP_BOX = { width: 44, height: 26 } // caixa que os pés tocam para pegar (em volta do ponto no chão)
const DROP_SPACING = 50 // distância entre duas coisas que aparecem juntas, uma do lado da outra
const REWARD_SEED = 9200 // separa o sorteio da recompensa dos outros sorteios da run
const LUCKY_SEED = 9300 // separa o sorteio do grão do Chifre da Sorte
const CENTER_CELL = { col: 6, row: 3 } // casa do meio da sala (a grade tem 13 x 7)

// Coisas lado a lado, centradas no ponto da casa. things = [{ kind, amount }]
export function placeDrops(things, col, row, appearMs) {
  const point = getCellPoint(col, row)
  const drops = []
  for (let i = 0; i < things.length; i++) {
    const x = point.x + (i - (things.length - 1) / 2) * DROP_SPACING
    drops.push({ kind: things[i].kind, amount: things[i].amount, x, y: point.y, appearMs })
  }
  return drops
}

// Sorteia uma chave de { chave: chance } (as chances somam 1)
export function pickByChance(random, chances) {
  let roll = random()
  const keys = Object.keys(chances)
  for (const key of keys) {
    if (roll < chances[key]) return key
    roll -= chances[key]
  }
  return keys[keys.length - 1]
}

// Tamanho do grupo de grãos (1, 3 ou 5)
function rollGrainGroup(random) {
  let roll = random()
  for (const group of GRAIN_GROUP_CHANCES) {
    if (roll < group.chance) return group.amount
    roll -= group.chance
  }
  return GRAIN_GROUP_CHANCES[GRAIN_GROUP_CHANCES.length - 1].amount
}

// Recompensa da sala limpa (quando o último inimigo da sala morre): o que aparece no chão, no meio da sala.
// Sorteio pela seed + andar + sala, então a mesma sala dá sempre a mesma coisa.
// attempt = 0 é a recompensa de verdade. A tecla G (depuração) conta 1, 2, 3... para sortear de novo.
// Devolve a lista de coisas no chão (com a animação de aparecer) e o que foi sorteado ('nada', 'graos'...).
export function rollRoomReward(seed, floorNumber, room, attempt = 0) {
  const roomSeed = mixSeed(mixSeed(seed, REWARD_SEED + floorNumber), room.col * 16 + room.row)
  const random = createRandom(mixSeed(roomSeed, attempt))
  const reward = pickByChance(random, ROOM_REWARD_CHANCES)
  const things = []
  if (reward === 'graos') things.push({ kind: 'graos', amount: rollGrainGroup(random) })
  if (reward === 'coracao') things.push({ kind: 'coracao', amount: 1 })
  if (reward === 'garfo') things.push({ kind: 'garfo', amount: 1 })
  const cell = findFreeCell(room.layoutId, CENTER_CELL.col, CENTER_CELL.row) ?? CENTER_CELL
  return { reward, drops: placeDrops(things, cell.col, cell.row, 0) }
}

// Chifre da Sorte: o abate número `killNumber` da sala (0, 1, 2...) solta 1 grão? Chance = extraCoinChance.
// Sorteio pela seed + andar + sala + abate: o mesmo abate dá sempre o mesmo resultado.
export function rollLuckyGrain(seed, floorNumber, room, killNumber, extraCoinChance) {
  const roomSeed = mixSeed(mixSeed(seed, LUCKY_SEED + floorNumber), room.col * 16 + room.row)
  return chance(createRandom(mixSeed(roomSeed, killNumber)), extraCoinChance)
}

// Um grão solto no chão, no ponto (x, y), com a animação de aparecer
export function createGrainDrop(x, y) {
  return { kind: 'graos', amount: 1, x, y, appearMs: 0 }
}

// O chão da Adega: um grupo de grãos à esquerda e um garfo à direita, em casas livres
export function createCellarDrops(layoutId) {
  const grainCell = findFreeCell(layoutId, 4, 3) ?? CENTER_CELL
  const forkCell = findFreeCell(layoutId, 8, 3) ?? CENTER_CELL
  return [
    ...placeDrops([{ kind: 'graos', amount: CELLAR_GRAINS }], grainCell.col, grainCell.row),
    ...placeDrops([{ kind: 'garfo', amount: 1 }], forkCell.col, forkCell.row),
  ]
}

// Caixa que os pés tocam para pegar a coisa
export function getDropBox(drop) {
  return { x: drop.x - DROP_BOX.width / 2, y: drop.y - DROP_BOX.height, width: DROP_BOX.width, height: DROP_BOX.height }
}

// Cura do coração: até HEART_HEAL, sem passar da vida máxima (o resto se perde)
export function healWithHeart(health, maxHealth) {
  return Math.min(maxHealth, health + HEART_HEAL)
}

// Pegar é encostar. Grão e garfo vão para os contadores; o coração cura, mas com a vida cheia não é pego e fica no
// chão. O que ainda não apareceu (appearMs negativo) não é pego.
// counters = { grains, forks, health, maxHealth }. Devolve { drops (o que ficou), grains, forks, health, collected }.
export function collectDrops(drops, position, counters) {
  const feet = getFeetBox(position)
  let { grains, forks, health } = counters
  const left = []
  const collected = []
  for (const drop of drops) {
    const waiting = drop.appearMs !== undefined && drop.appearMs < 0
    const touching = !waiting && overlaps(feet, getDropBox(drop))
    if (!touching || (drop.kind === 'coracao' && health >= counters.maxHealth)) {
      left.push(drop)
      continue
    }
    if (drop.kind === 'graos') grains = Math.min(MAX_GRAINS, grains + drop.amount)
    if (drop.kind === 'garfo') forks += 1
    if (drop.kind === 'coracao') health = healWithHeart(health, counters.maxHealth)
    collected.push(drop)
  }
  return { drops: left, grains, forks, health, collected }
}

// A animação de aparecer anda (as que ainda esperam, com tempo negativo, também). Depois de DROP_APPEAR_MS,
// a coisa fica só no chão (sem appearMs).
export function advanceDrops(drops, stepMs) {
  const next = []
  for (const drop of drops) {
    if (drop.appearMs === undefined) {
      next.push(drop)
      continue
    }
    const appearMs = drop.appearMs + stepMs
    if (appearMs >= DROP_APPEAR_MS) {
      const settled = { ...drop }
      delete settled.appearMs
      next.push(settled)
    } else {
      next.push({ ...drop, appearMs })
    }
  }
  return next
}
