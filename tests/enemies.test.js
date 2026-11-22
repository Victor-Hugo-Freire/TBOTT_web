import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { ENEMY_SPRITES } from '../src/data/enemySprites.js'
import { getRoomDoors, SIDE_VECTORS } from '../src/utils/doors.js'
import {
  areEnemiesDefeated,
  createEnemy,
  DEATH_FADE_MS,
  createRoomEnemies,
  findTouchingEnemy,
  getEnemyPose,
  pickRoomEnemies,
} from '../src/utils/enemies.js'
import { generateFloor } from '../src/utils/floorGenerator.js'
import { getDeathCauseLabel } from '../src/utils/health.js'
import { buildEnemyCatalog } from '../src/utils/itemCatalog.js'
import { createPlayer } from '../src/utils/player.js'
import { normalizeProgressPayload } from '../src/utils/progress.js'
import { getCellRect, getLayoutPoints, ROOM_LAYOUTS } from '../src/utils/roomLayout.js'
import { ROOM_PLAYER_BOUNDS } from '../src/utils/roomMovement.js'
import { getTotalDuration } from '../src/utils/spriteAnimation.js'
import { createRun, createRunSnapshot, getCurrentRoom, updateRun } from '../src/utils/run.js'
import { damageTarget, getTargetBox } from '../src/utils/targets.js'
import { TEST_CATALOG, TEST_ENEMIES } from './helpers/testCatalog.js'

const STEP = 1 / 20
const IDLE = { movement: { x: 0, y: 0 }, attackDirection: null }
const FIRST_FLOOR_IDS = ['formaggino-saltellino', 'pistacchio-sputacchio', 'zanzarina-tarantella']

// Pés encostados na parede, no meio do vão de cada porta (como em run.test.js)
const DOOR_EDGES = {
  up: { x: 800, y: ROOM_PLAYER_BOUNDS.minY },
  down: { x: 800, y: ROOM_PLAYER_BOUNDS.maxY },
  left: { x: ROOM_PLAYER_BOUNDS.minX, y: 536 },
  right: { x: ROOM_PLAYER_BOUNDS.maxX, y: 536 },
}

const findCommonRoom = (floor) => floor.rooms.find((room) => room.type === 'comum')

// Run do andar 1 começando dentro de uma sala comum, com os inimigos dela
function runInCommonRoom(fields = {}) {
  const room = findCommonRoom(generateFloor(1, 1))
  return createRun({ seed: 1, characterId: 'x', roomId: room.id, catalog: TEST_CATALOG, enemyCatalog: TEST_ENEMIES, ...fields })
}

// Mata todos os inimigos da sala (como se um golpe tivesse acertado cada um)
function killAll(run) {
  return { ...run, targets: run.targets.map((target) => damageTarget(target, 999)) }
}

// Sai da run e volta: o save vira JSON (como na API) e a run é recriada com o que voltou
function saveAndContinue(run) {
  const progress = normalizeProgressPayload(JSON.parse(JSON.stringify(createRunSnapshot(run, 5000))))
  return createRun({
    seed: progress.seed,
    floorNumber: progress.floor,
    roomId: progress.roomId,
    position: { x: progress.playerX, y: progress.playerY },
    characterId: progress.characterId,
    visitedRoomIds: progress.visitedRoomIds,
    clearedRoomIds: progress.clearedRoomIds,
    roomStates: progress.roomStates,
    health: progress.health,
    catalog: run.catalog,
    enemyCatalog: run.enemyCatalog,
  })
}

describe('catálogo de inimigos', () => {
  test('guarda por id; sem sprite fica de fora, e sprite sem inimigo no catálogo aparece na lista', () => {
    const { enemies, missingSprite, missingInCatalog } = buildEnemyCatalog([
      { id: 'formaggino-saltellino', health: 6, damage: 1, speed: 150, minFloor: 1 },
      { id: 'inimigo-novo', health: 3, damage: 1, speed: 100, minFloor: 1 },
      null,
      { name: 'sem id' },
    ])
    assert.deepEqual(Object.keys(enemies), ['formaggino-saltellino'])
    assert.deepEqual(missingSprite, ['inimigo-novo'])
    assert.equal(missingInCatalog.length, Object.keys(ENEMY_SPRITES).length - 1)
  })

  test('resposta sem a lista vira catálogo vazio', () => {
    assert.deepEqual(buildEnemyCatalog(undefined).enemies, {})
  })

  test('o catálogo de teste tem os 10 inimigos, todos com sprite', () => {
    assert.equal(Object.keys(TEST_ENEMIES).length, 10)
  })
})

describe('layouts: casas dos inimigos', () => {
  test('toda sala comum tem de 2 a 4 casas i, nenhuma colada numa porta', () => {
    const doorCells = [
      { col: 6, row: 0 },
      { col: 12, row: 3 },
      { col: 6, row: 6 },
      { col: 0, row: 3 },
    ]
    for (const layout of ROOM_LAYOUTS.filter((one) => one.type === 'comum')) {
      const { enemies } = getLayoutPoints(layout.id)
      assert.ok(enemies.length >= 2 && enemies.length <= 4, `${layout.id}: ${enemies.length} casas i`)
      for (const point of enemies) {
        const nearDoor = doorCells.some((door) => Math.abs(door.col - point.col) <= 1 && Math.abs(door.row - point.row) <= 1)
        assert.ok(!nearDoor, `${layout.id}: a casa (${point.col},${point.row}) fica colada numa porta`)
      }
    }
  })
})

describe('sorteio dos inimigos da sala', () => {
  const floor = generateFloor(1, 1)
  const room = findCommonRoom(floor)

  test('um inimigo em cada casa i, e a mesma sala sorteia sempre os mesmos', () => {
    const picked = pickRoomEnemies(1, 1, room, TEST_ENEMIES)
    assert.deepEqual(
      picked.map(({ col, row }) => ({ col, row })),
      getLayoutPoints(room.layoutId).enemies,
    )
    assert.deepEqual(pickRoomEnemies(1, 1, room, TEST_ENEMIES), picked)
  })

  test('só entram os inimigos que podem aparecer no andar (minFloor)', () => {
    for (let seed = 1; seed <= 40; seed++) {
      for (const one of generateFloor(seed, 1).rooms) {
        for (const { enemyId } of pickRoomEnemies(seed, 1, one, TEST_ENEMIES)) {
          assert.ok(FIRST_FLOOR_IDS.includes(enemyId), enemyId)
        }
      }
    }
  })

  test('no andar 4, todos os 10 aparecem em algum lugar', () => {
    const seen = new Set()
    for (let seed = 1; seed <= 40; seed++) {
      for (const one of generateFloor(seed, 4).rooms) {
        for (const { enemyId } of pickRoomEnemies(seed, 4, one, TEST_ENEMIES)) seen.add(enemyId)
      }
    }
    assert.equal(seen.size, 10)
  })

  test('sala que não é comum, ou catálogo vazio, não tem inimigos', () => {
    const start = floor.rooms.find((one) => one.type === 'inicial')
    assert.deepEqual(pickRoomEnemies(1, 1, start, TEST_ENEMIES), [])
    assert.deepEqual(pickRoomEnemies(1, 1, room, {}), [])
  })

  test('o inimigo nasce na casa dele, com a vida, o dano e a velocidade do catálogo', () => {
    const [first] = getLayoutPoints(room.layoutId).enemies
    const enemy = createEnemy(TEST_ENEMIES['formaggino-saltellino'], first.col, first.row)
    const cell = getCellRect(first.col, first.row)
    assert.equal(enemy.x, cell.x + cell.width / 2)
    assert.ok(enemy.y > cell.y && enemy.y < cell.y + cell.height, 'os pés ficam dentro da casa')
    assert.deepEqual([enemy.health, enemy.maxHealth, enemy.damage, enemy.speed], [6, 6, 1, 150])
    assert.equal(enemy.animation, 'parado')
    assert.equal(createRoomEnemies(1, 1, room, TEST_ENEMIES).length, getLayoutPoints(room.layoutId).enemies.length)
  })
})

describe('animação do inimigo', () => {
  const enemy = createEnemy(TEST_ENEMIES['formaggino-saltellino'], 6, 3)
  const { animations } = ENEMY_SPRITES['formaggino-saltellino']

  test('parado repete; com "reduzir movimento", fica no quadro 0', () => {
    const loop = getTotalDuration(animations.parado.durations)
    assert.deepEqual(getEnemyPose(enemy), { animation: 'parado', frame: 0, alpha: 1 })
    const later = { ...enemy, animationMs: loop + 1 }
    assert.deepEqual(getEnemyPose(later), { animation: 'parado', frame: 0, alpha: 1 }, 'voltou ao começo')
    const middle = { ...enemy, animationMs: 310 }
    assert.equal(getEnemyPose(middle).frame, 1)
    assert.equal(getEnemyPose(middle, true).frame, 0)
  })

  test('levou golpe: toca o "dano" e volta para o "parado"', () => {
    const hurt = damageTarget(enemy, 3)
    assert.deepEqual(getEnemyPose(hurt), { animation: 'dano', frame: 0, alpha: 1 })
    const after = { ...hurt, hurtMs: getTotalDuration(animations.dano.durations) }
    assert.equal(getEnemyPose(after).animation, 'parado')
  })

  test('morreu: toca a "morte" uma vez, o último quadro apaga aos poucos e ele some', () => {
    const dead = damageTarget(enemy, 99)
    const deathMs = getTotalDuration(animations.morte.durations)
    const last = animations.morte.durations.length - 1
    assert.deepEqual(getEnemyPose(dead), { animation: 'morte', frame: 0, alpha: 1 })
    assert.deepEqual(getEnemyPose({ ...dead, deadMs: deathMs }), { animation: 'morte', frame: last, alpha: 1 })
    assert.deepEqual(getEnemyPose({ ...dead, deadMs: deathMs + DEATH_FADE_MS / 2 }), { animation: 'morte', frame: last, alpha: 0.5 })
    assert.equal(getEnemyPose({ ...dead, deadMs: deathMs + DEATH_FADE_MS }), null)
  })
})

describe('contato', () => {
  const enemy = createEnemy(TEST_ENEMIES['formaggino-saltellino'], 6, 3)

  test('os pés do Tung em cima dos pés do inimigo encostam; por trás da cabeça, não', () => {
    assert.equal(findTouchingEnemy([enemy], { x: enemy.x, y: enemy.y }), enemy)
    const head = getTargetBox(enemy).y + 10
    assert.equal(findTouchingEnemy([enemy], { x: enemy.x, y: head }), null)
  })

  test('inimigo morto não machuca', () => {
    assert.equal(findTouchingEnemy([damageTarget(enemy, 99)], { x: enemy.x, y: enemy.y }), null)
  })

  test('a causa da morte tem o nome do inimigo', () => {
    assert.equal(getDeathCauseLabel('formaggino-saltellino'), 'o Formaggino Saltellino')
  })
})

describe('inimigos na run', () => {
  test('sala comum: os inimigos nascem, a sala não fica limpa e as portas ficam fechadas', () => {
    const run = runInCommonRoom()
    const room = getCurrentRoom(run)
    assert.equal(run.targets.length, getLayoutPoints(room.layoutId).enemies.length)
    assert.ok(run.targets.every((target) => target.enemyId && FIRST_FLOOR_IDS.includes(target.enemyId)))
    assert.equal(room.cleared, false)
    for (const door of getRoomDoors(run.floor, room)) {
      if (door.state !== 'locked') assert.equal(door.state, 'closed', door.side)
    }
  })

  test('sem o catálogo de inimigos, a sala comum continua limpa ao entrar (como antes)', () => {
    const run = runInCommonRoom({ enemyCatalog: {} })
    assert.deepEqual(run.targets, [])
    assert.equal(getCurrentRoom(run).cleared, true)
  })

  test('com a porta fechada, ele não sai da sala', () => {
    let run = runInCommonRoom()
    const door = getRoomDoors(run.floor, getCurrentRoom(run)).find((one) => one.state === 'closed')
    run.player = createPlayer(DOOR_EDGES[door.side])
    run = updateRun(run, { movement: SIDE_VECTORS[door.side], attackDirection: null }, STEP)
    assert.equal(run.transition, null)
  })

  test('o último inimigo morto limpa a sala: as portas abrem e a recompensa sai uma vez só', () => {
    let run = updateRun(killAll(runInCommonRoom()), IDLE, STEP)
    const room = getCurrentRoom(run)
    assert.equal(room.cleared, true)
    assert.equal(room.rewards, 1)
    assert.ok(getRoomDoors(run.floor, room).every((door) => door.state !== 'closed'))
    run = updateRun(run, IDLE, STEP)
    assert.equal(room.rewards, 1, 'não sai outra recompensa no quadro seguinte')
    assert.ok(areEnemiesDefeated(run.targets))
  })

  test('encostar num inimigo vivo tira o dano dele; sem vida, a causa da morte é ele', () => {
    let run = runInCommonRoom()
    const enemy = run.targets[0]
    run.player = createPlayer({ x: enemy.x, y: enemy.y })
    run = updateRun(run, IDLE, STEP)
    assert.equal(run.health, 6 - enemy.damage)
    assert.ok(run.player.hurt)

    run = runInCommonRoom({ health: 1 })
    run.player = createPlayer({ x: run.targets[0].x, y: run.targets[0].y })
    run = updateRun(run, IDLE, STEP)
    assert.deepEqual(run.death, { cause: run.targets[0].enemyId })
  })

  test('Caldo da Mamãe: entrar numa sala com inimigos arma o escudo', () => {
    const run = runInCommonRoom({ items: ['caldo-da-mamae'] })
    assert.equal(run.effects.shieldHits, 1)
  })

  test('sair da run no meio da luta: os inimigos voltam com a vida cheia', () => {
    let run = runInCommonRoom()
    run.targets = run.targets.map((target, index) => (index === 0 ? damageTarget(target, 3) : target))
    run = saveAndContinue(run)
    assert.equal(getCurrentRoom(run).cleared, false)
    assert.ok(run.targets.length > 0)
    assert.ok(run.targets.every((target) => target.health === target.maxHealth))
  })

  test('sala limpa continua limpa ao continuar a run', () => {
    let run = updateRun(killAll(runInCommonRoom()), IDLE, STEP)
    run = saveAndContinue(run)
    assert.deepEqual(run.targets, [])
    assert.equal(getCurrentRoom(run).cleared, true)
  })

  test('save antigo, sem a lista de salas limpas: as salas visitadas contam como limpas', () => {
    const room = findCommonRoom(generateFloor(1, 1))
    const run = createRun({ seed: 1, characterId: 'x', roomId: room.id, visitedRoomIds: [room.id], enemyCatalog: TEST_ENEMIES })
    assert.deepEqual(run.targets, [])
    assert.equal(getCurrentRoom(run).cleared, true)
  })

  test('entrar numa sala com inimigos: ela desliza com as portas fechadas e os inimigos aparecem no fim', () => {
    for (let seed = 1; seed < 50; seed++) {
      let run = createRun({ seed, characterId: 'x', catalog: TEST_CATALOG, enemyCatalog: TEST_ENEMIES })
      const door = getRoomDoors(run.floor, getCurrentRoom(run)).find((one) => {
        const target = run.floor.rooms.find((room) => room.id === one.targetId)
        return one.state === 'open' && target.type === 'comum'
      })
      if (!door) continue
      run.player = createPlayer(DOOR_EDGES[door.side])
      run = updateRun(run, { movement: SIDE_VECTORS[door.side], attackDirection: null }, STEP)
      const target = run.floor.rooms.find((room) => room.id === door.targetId)
      assert.equal(run.transition?.type, 'room')
      assert.equal(target.cleared, false, 'as portas da sala nova aparecem fechadas na transição')
      while (run.transition) run = updateRun(run, IDLE, STEP)
      assert.equal(run.roomId, target.id)
      assert.ok(run.targets.length > 0)
      return
    }
    assert.fail('nenhuma seed com uma sala comum ao lado da inicial')
  })
})
