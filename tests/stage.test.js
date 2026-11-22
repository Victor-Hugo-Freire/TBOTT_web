import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { STAGE } from '../src/data/enemyBehavior.js'
import { getRoomDoors, SIDE_VECTORS } from '../src/utils/doors.js'
import { createWaveEnemies } from '../src/utils/enemies.js'
import { generateFloor } from '../src/utils/floorGenerator.js'
import { getRoomPedestals } from '../src/utils/pedestals.js'
import { createPlayer } from '../src/utils/player.js'
import { normalizeProgressPayload } from '../src/utils/progress.js'
import { getLayoutPoints } from '../src/utils/roomLayout.js'
import { ROOM_PLAYER_BOUNDS } from '../src/utils/roomMovement.js'
import { applyStageDoor, createRun, createRunSnapshot, getCurrentRoom, getStageCurtain, updateRun } from '../src/utils/run.js'
import { getBaseStats } from '../src/utils/stats.js'
import { damageTarget } from '../src/utils/targets.js'
import { TEST_CATALOG, TEST_ENEMIES } from './helpers/testCatalog.js'

const STEP = 1 / 20
const STEP_MS = 50
const IDLE = { movement: { x: 0, y: 0 }, attackDirection: null }
const MAX_HEALTH = getBaseStats('tung-tung-sahur').maxHealth
const { minX, maxX, minY, maxY } = ROOM_PLAYER_BOUNDS
// Pés encostados na parede, no meio do vão de cada porta
const DOOR_EDGES = { up: { x: 800, y: minY }, down: { x: 800, y: maxY }, left: { x: minX, y: 536 }, right: { x: maxX, y: 536 } }

// Primeira seed com Palco no andar 2, o Palco e a sala ao lado dele (o Palco é ponta de corredor: uma porta só)
function findStage() {
  for (let seed = 1; seed < 500; seed++) {
    const floor = generateFloor(seed, 2)
    const stage = floor.rooms.find((room) => room.type === 'palco')
    if (!stage) continue
    const door = getRoomDoors(floor, stage).find((one) => one.side !== stage.secret?.side) // a porta, não a parede da adega
    const neighbor = floor.rooms.find((room) => room.id === door.targetId)
    const neighborSide = getRoomDoors(floor, neighbor).find((one) => one.targetId === stage.id).side
    return { seed, stageId: stage.id, neighborId: neighbor.id, neighborSide }
  }
  throw new Error('nenhuma seed com Palco')
}
// NEIGHBOR_SIDE = o lado da porta da sala vizinha que leva ao Palco
const { seed: SEED, stageId: STAGE_ID, neighborId: NEIGHBOR_ID, neighborSide: NEIGHBOR_SIDE } = findStage()
const PUSH_TO_STAGE = { movement: SIDE_VECTORS[NEIGHBOR_SIDE], attackDirection: null }

function runIn(roomId, fields = {}) {
  return createRun({ seed: SEED, floorNumber: 2, roomId, characterId: 'tung-tung-sahur', catalog: TEST_CATALOG, enemyCatalog: TEST_ENEMIES, ...fields })
}

function steps(run, count) {
  for (let i = 0; i < count; i++) run = updateRun(run, IDLE, STEP)
  return run
}

// Encosta no pedestal do Palco (pega a Batuta) e roda um quadro
function takeBaton(run) {
  const [pedestal] = getRoomPedestals(run, getCurrentRoom(run))
  run.player = createPlayer({ x: pedestal.x, y: pedestal.y + 21 })
  run = updateRun(run, IDLE, STEP)
  run.player = createPlayer({ x: pedestal.x, y: pedestal.y + 120 }) // sai de perto do pedestal
  return run
}

// Roda até a onda atual entrar na sala; devolve a run e quantos inimigos vieram
function waitWave(run) {
  while (run.stage.waitMs > 0) run = updateRun(run, IDLE, STEP)
  return { run, count: run.targets.filter((target) => target.enemyId).length }
}

// Mata todos os inimigos da sala de uma vez
function killAll(run) {
  return { ...run, targets: run.targets.map((target) => (target.enemyId ? damageTarget(target, 999) : target)) }
}

// A porta do Palco que leva à sala vizinha
function stageDoor(run) {
  return getRoomDoors(run.floor, getCurrentRoom(run)).find((door) => door.targetId === NEIGHBOR_ID)
}

// O progresso salvo da run, depois de virar JSON (como na API)
function saveProgress(run) {
  return normalizeProgressPayload(JSON.parse(JSON.stringify(createRunSnapshot(run, 5000))))
}

// Sai da run e volta, na sala em que estava
function saveAndContinue(run) {
  const progress = saveProgress(run)
  return runIn(progress.roomId, {
    items: progress.items,
    position: { x: progress.playerX, y: progress.playerY },
    visitedRoomIds: progress.visitedRoomIds,
    clearedRoomIds: progress.clearedRoomIds,
    roomStates: progress.roomStates,
    health: progress.health,
  })
}

// A porta da sala vizinha que leva ao Palco, com a regra da vida cheia aplicada
function doorToStage(run, fullHealth) {
  const doors = applyStageDoor(getRoomDoors(run.floor, getCurrentRoom(run)), run.floor, fullHealth)
  return doors.find((door) => door.targetId === STAGE_ID)
}

describe('Palco: a porta', () => {
  test('sem a vida cheia, a porta fica fechada; empurrar não entra e mostra o aviso', () => {
    let run = runIn(NEIGHBOR_ID, { health: MAX_HEALTH - 1, enemyCatalog: {} })
    assert.equal(doorToStage(run, false).state, 'closed')
    run.player = createPlayer(DOOR_EDGES[NEIGHBOR_SIDE])
    run = updateRun(run, PUSH_TO_STAGE, STEP)
    assert.equal(run.transition, null)
    assert.equal(run.notice?.text, 'Só com a vida cheia')
  })

  test('parado longe da porta, não há aviso', () => {
    const run = updateRun(runIn(NEIGHBOR_ID, { health: MAX_HEALTH - 1, enemyCatalog: {} }), PUSH_TO_STAGE, STEP)
    assert.equal(run.notice, null)
  })

  test('com a vida cheia, a porta fica aberta e entra', () => {
    let run = runIn(NEIGHBOR_ID, { enemyCatalog: {} })
    assert.equal(doorToStage(run, true).state, 'open')
    run.player = createPlayer(DOOR_EDGES[NEIGHBOR_SIDE])
    run = updateRun(run, PUSH_TO_STAGE, STEP)
    assert.equal(run.transition?.toRoomId, STAGE_ID)
  })
})

describe('Palco: a Batuta e as ondas', () => {
  test('a Batuta fica no pedestal do meio da sala, e ela começa limpa (portas abertas)', () => {
    const run = runIn(STAGE_ID)
    const pedestals = getRoomPedestals(run, getCurrentRoom(run))
    assert.deepEqual(pedestals.map((pedestal) => [pedestal.id, pedestal.itemId]), [['6-3', 'batuta-do-maestro']])
    assert.equal(getCurrentRoom(run).cleared, true)
    assert.equal(run.stage, null)
  })

  test('pegar a Batuta fecha a cortina e as portas; vêm 4 ondas de 2, 2, 3 e 3; vencer abre tudo e dá a recompensa', () => {
    let run = takeBaton(runIn(STAGE_ID))
    const room = getCurrentRoom(run)
    assert.ok(run.items.includes('batuta-do-maestro'))
    assert.equal(room.cleared, false)
    assert.equal(stageDoor(run).state, 'closed')
    assert.equal(getStageCurtain(run.stage), 0, 'a cortina começa aberta e fecha')
    run = steps(run, STAGE.curtainMs / STEP_MS)
    assert.equal(getStageCurtain(run.stage), 1)

    const counts = []
    for (let wave = 0; wave < STAGE.waves.length; wave++) {
      const entered = waitWave(run)
      counts.push(entered.count)
      assert.equal(entered.run.stage.wave, wave)
      run = steps(killAll(entered.run), 1)
      if (wave < STAGE.waves.length - 1) assert.equal(room.cleared, false, 'entre as ondas, as portas continuam fechadas')
    }
    assert.deepEqual(counts, STAGE.waves)
    assert.equal(room.cleared, true)
    assert.equal(room.rewards, 1, 'a recompensa de sala limpa')
    assert.equal(stageDoor(run).state, 'open')
    assert.equal(run.stage.won, true, 'a cortina abre')
    run = steps(run, STAGE.curtainMs / STEP_MS + 1)
    assert.equal(run.stage, null)
  })

  test('a próxima onda espera wavePauseMs depois do último abate', () => {
    let run = waitWave(steps(takeBaton(runIn(STAGE_ID)), 1)).run
    run = steps(killAll(run), 1)
    assert.equal(run.stage.wave, 1)
    assert.equal(run.stage.waitMs, STAGE.wavePauseMs)
  })

  test('continuar no meio da luta: as ondas recomeçam da 1ª, com a cortina fechada e a Batuta já pega', () => {
    let run = waitWave(takeBaton(runIn(STAGE_ID))).run
    run = steps(killAll(run), 1)
    run = waitWave(run).run // a 2ª onda na sala
    const back = saveAndContinue(run)
    assert.equal(back.roomId, STAGE_ID)
    assert.ok(back.items.includes('batuta-do-maestro'))
    assert.equal(getCurrentRoom(back).cleared, false)
    assert.deepEqual(back.stage, { wave: 0, waitMs: STAGE.startMs, curtainMs: STAGE.curtainMs, won: false })
    assert.equal(getStageCurtain(back.stage), 1)
    assert.equal(back.targets.length, 0, 'os inimigos entram quando a pausa acaba')
  })

  test('depois de vencer, continuar não começa outra luta, e a porta deixa entrar sem a vida cheia', () => {
    let run = takeBaton(runIn(STAGE_ID))
    for (let wave = 0; wave < STAGE.waves.length; wave++) run = steps(killAll(waitWave(run).run), 1)
    const hurt = { ...run, health: MAX_HEALTH - 2 }
    const back = saveAndContinue(hurt)
    assert.equal(getCurrentRoom(back).cleared, true)
    assert.equal(back.stage, null)

    // Na sala ao lado, com a Batuta já pega: a porta do Palco deixa entrar mesmo sem a vida cheia
    const progress = saveProgress(hurt)
    const fields = { items: progress.items, clearedRoomIds: progress.clearedRoomIds, roomStates: progress.roomStates, health: progress.health }
    let outside = runIn(NEIGHBOR_ID, { ...fields, enemyCatalog: {} })
    outside.player = createPlayer(DOOR_EDGES[NEIGHBOR_SIDE])
    outside = updateRun(outside, PUSH_TO_STAGE, STEP)
    assert.equal(outside.transition?.toRoomId, STAGE_ID)
  })

  test('sem inimigos no catálogo, as ondas passam vazias e a sala fica limpa', () => {
    let run = takeBaton(runIn(STAGE_ID, { enemyCatalog: {} }))
    run = steps(run, (STAGE.startMs + 3 * STAGE.wavePauseMs) / STEP_MS + 10)
    assert.equal(getCurrentRoom(run).cleared, true)
  })
})

describe('Palco: inimigos das ondas', () => {
  test('nascem nas casas "i" do Palco, com o id da onda, e só os que podem aparecer no andar', () => {
    const room = generateFloor(SEED, 2).rooms.find((one) => one.id === STAGE_ID)
    const cells = getLayoutPoints(room.layoutId).enemies
    assert.equal(cells.length, 4)
    const wave = createWaveEnemies(SEED, 2, room, 2, TEST_ENEMIES)
    assert.equal(wave.length, STAGE.waves[2])
    assert.ok(wave.every((enemy) => enemy.id.startsWith('onda3-')))
    assert.equal(new Set(wave.map((enemy) => enemy.id)).size, wave.length, 'cada um numa casa')
    assert.ok(wave.every((enemy) => TEST_ENEMIES[enemy.enemyId].minFloor <= 2))
    assert.deepEqual(createWaveEnemies(SEED, 2, room, 2, TEST_ENEMIES), wave, 'a mesma seed, os mesmos inimigos')
  })
})
