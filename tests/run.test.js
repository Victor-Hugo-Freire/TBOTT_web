import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { getEntryPosition, getRoomDoors, OPPOSITE_SIDE, SIDE_VECTORS } from '../src/utils/doors.js'
import { generateFloor, LAST_FLOOR } from '../src/utils/floorGenerator.js'
import { createPlayer, getAttackHitbox } from '../src/utils/player.js'
import { ROOM_PLAYER_BOUNDS, ROOM_PLAYER_START } from '../src/utils/roomMovement.js'
import {
  BANNER_TOTAL_MS,
  createRun,
  createRunSnapshot,
  FLOOR_TRANSITION_MS,
  getCurrentRoom,
  getDrumBox,
  getObstacleTheme,
  getRoomTheme,
  isDrumVisible,
  isSecretMarkVisible,
  ROOM_TRANSITION_MS,
  updateRun,
} from '../src/utils/run.js'

// Passo de 1/20 s (50 ms, o maior passo que o jogador aceita): deixa os testes rápidos
const STEP = 1 / 20
const STEP_MS = 50
const IDLE = { movement: { x: 0, y: 0 }, attackDirection: null }
const { minX, maxX, minY, maxY } = ROOM_PLAYER_BOUNDS

// Pés encostados na parede, no meio do vão de cada porta
const DOOR_EDGES = {
  up: { x: 800, y: minY },
  down: { x: 800, y: maxY },
  left: { x: minX, y: 534.5 },
  right: { x: maxX, y: 534.5 },
}

const findRoom = (floor, id) => floor.rooms.find((room) => room.id === id)

function steps(run, count, input = IDLE) {
  for (let i = 0; i < count; i++) run = updateRun(run, input, STEP)
  return run
}

// Espera a transição acabar (ou a run terminar)
function waitTransition(run) {
  while (run.transition && !run.finished) run = updateRun(run, IDLE, STEP)
  return run
}

// Encosta o jogador na porta, aperta para fora e espera a troca de sala
function goThrough(run, side) {
  run.player = createPlayer(DOOR_EDGES[side])
  run = updateRun(run, { movement: SIDE_VECTORS[side], attackDirection: null }, STEP)
  assert.equal(run.transition?.type, 'room', `a porta ${side} da sala ${run.roomId} não abriu a transição`)
  return waitTransition(run)
}

// Um golpe inteiro na direção pedida: aperta a seta e espera o golpe acabar.
// Devolve a run e em quantos quadros a caixa do golpe ficou ativa.
function swing(run, direction) {
  run = updateRun(run, { movement: { x: 0, y: 0 }, attackDirection: direction }, STEP)
  let activeFrames = 0
  while (run.player.attack && !run.transition) {
    run = updateRun(run, IDLE, STEP)
    if (getAttackHitbox(run.player)) activeFrames++
  }
  return { run, activeFrames }
}

// Golpe no tambor, de baixo para cima (os pés logo abaixo dele)
function hitDrum(run) {
  const drum = getDrumBox()
  run.player = createPlayer({ x: drum.x + drum.width / 2, y: drum.y + drum.height + 45 })
  return swing(run, 'up')
}

// Golpe na parede da adega, da entrada daquele lado
function hitSecret(run, side) {
  run.player = createPlayer(getEntryPosition(side))
  return swing(run, side)
}

// Primeira seed (a partir de 1) cujo andar tem uma sala que passa no teste
function findSeed(floorNumber, check) {
  for (let seed = 1; seed < 1000; seed++) {
    const room = generateFloor(seed, floorNumber).rooms.find(check)
    if (room) return { seed, roomId: room.id }
  }
  throw new Error('nenhuma seed serviu')
}

describe('createRun', () => {
  test('run nova: sala inicial, centro, faixa, 0 grão e 1 garfo', () => {
    const run = createRun({ seed: 1, characterId: 'tung-tung-sahur' })
    const room = getCurrentRoom(run)
    assert.equal(run.roomId, run.floor.startRoomId)
    assert.equal(run.floor.number, 1)
    assert.deepEqual({ x: run.player.x, y: run.player.y }, ROOM_PLAYER_START)
    assert.deepEqual(run.banner, { text: 'CANTINA', elapsedMs: 0 })
    assert.equal(run.grains, 0)
    assert.equal(run.forks, 1)
    assert.equal(run.transition, null)
    assert.equal(run.finished, false)
    assert.ok(room.visited && room.cleared)
  })

  test('respeita a sala e a posição salvas', () => {
    const floor = generateFloor(1, 1)
    const room = floor.rooms.find((item) => item.type === 'comum')
    const position = getEntryPosition(getRoomDoors(floor, room)[0].side)
    const run = createRun({ seed: 1, roomId: room.id, position, characterId: 'x' })
    assert.equal(run.roomId, room.id)
    assert.deepEqual({ x: run.player.x, y: run.player.y }, position)
    assert.equal(run.banner, null, 'a faixa só aparece na sala inicial')
  })

  test("'sala-inicial' e id que não existe caem na sala inicial", () => {
    for (const roomId of ['sala-inicial', 'nada', null]) {
      const run = createRun({ seed: 1, roomId, characterId: 'x' })
      assert.equal(run.roomId, run.floor.startRoomId, String(roomId))
    }
  })

  test('posição salva dentro de obstáculo vai para a entrada da primeira porta', () => {
    const { seed, roomId } = findSeed(1, (room) => room.type === 'comum' && /comum-(0[3-9]|10)/.test(room.layoutId))
    const blocker = createRun({ seed, roomId, characterId: 'x' }).obstacles.find((obstacle) => obstacle.blocking)
    const inside = { x: blocker.box.x + blocker.box.width / 2, y: blocker.box.y + blocker.box.height / 2 }
    const run = createRun({ seed, roomId, position: inside, characterId: 'x' })
    const expected = getEntryPosition(getRoomDoors(run.floor, getCurrentRoom(run))[0].side)
    assert.deepEqual({ x: run.player.x, y: run.player.y }, expected)

    // Sem posição ou fora da sala: também a entrada
    for (const position of [null, { x: -50, y: 400 }, { x: NaN, y: 400 }]) {
      const other = createRun({ seed, roomId, position, characterId: 'x' })
      assert.deepEqual({ x: other.player.x, y: other.player.y }, expected)
    }
  })

  test('salvar dentro da adega abre a parede secreta da origem', () => {
    const { seed, roomId } = findSeed(2, (room) => room.type === 'adega')
    const run = createRun({ seed, floorNumber: 2, roomId, characterId: 'x' })
    const origin = run.floor.rooms.find((room) => room.secret?.roomId === roomId)
    assert.equal(origin.hits, 3)
    assert.equal(getRoomDoors(run.floor, origin).find((door) => door.side === origin.secret.side).state, 'open')
  })

  test('tema da sala e dos obstáculos', () => {
    const floor = generateFloor(1, 3)
    assert.equal(getRoomTheme(floor, { type: 'comum' }), 'piazza')
    assert.equal(getRoomTheme(floor, { type: 'inicial' }), 'piazza')
    assert.equal(getRoomTheme(floor, { type: 'loja' }), 'loja')
    assert.equal(getObstacleTheme(floor, { type: 'adega' }), 'cantina')
    assert.equal(getObstacleTheme(floor, { type: 'loja' }), 'piazza')
  })

  test('createRunSnapshot guarda a seed, o andar e a sala', () => {
    const run = createRun({ seed: 99, floorNumber: 3, characterId: 'tung-tung-sahur' })
    assert.deepEqual(createRunSnapshot(run, 1234), {
      roomId: run.roomId,
      characterId: 'tung-tung-sahur',
      playerX: ROOM_PLAYER_START.x,
      playerY: ROOM_PLAYER_START.y,
      elapsedMs: 1234,
      seed: 99,
      floor: 3,
      finished: false,
    })
  })

  test('createRunSnapshot marca a run encerrada (a sala não deixa jogar de novo)', () => {
    const run = createRun({ seed: 99, floorNumber: 3, characterId: 'tung-tung-sahur' })
    assert.equal(createRunSnapshot({ ...run, finished: true }, 1).finished, true)
  })
})

describe('portas e transição de sala', () => {
  test('encostar na porta e apertar para fora troca de sala em ROOM_TRANSITION_MS', () => {
    let run = createRun({ seed: 1, characterId: 'x' })
    const start = getCurrentRoom(run)
    const door = getRoomDoors(run.floor, start)[0]
    run.player = createPlayer(DOOR_EDGES[door.side])
    run = updateRun(run, { movement: SIDE_VECTORS[door.side], attackDirection: null }, STEP)

    const { transition } = run
    assert.equal(transition.type, 'room')
    assert.equal(transition.side, door.side)
    assert.equal(transition.fromRoomId, start.id)
    assert.equal(transition.toRoomId, door.targetId)
    assert.equal(transition.durationMs, ROOM_TRANSITION_MS)

    // Controles ignorados durante a transição
    const busy = { movement: { x: 1, y: 1 }, attackDirection: 'left' }
    const frames = ROOM_TRANSITION_MS / STEP_MS
    run = steps(run, frames - 1, busy)
    assert.ok(run.transition)
    assert.equal(run.roomId, start.id)
    assert.deepEqual(run.player, transition.fromPlayer)

    run = updateRun(run, busy, STEP)
    const target = getCurrentRoom(run)
    assert.equal(run.transition, null)
    assert.equal(run.roomId, door.targetId)
    assert.deepEqual({ x: run.player.x, y: run.player.y }, getEntryPosition(OPPOSITE_SIDE[door.side]))
    assert.equal(run.player.direction, door.side, 'virado para dentro da sala')
    assert.equal(run.player.attack, null)
    assert.equal(run.player.hurt, null)
    assert.equal(run.slip, null)
    assert.ok(target.visited && target.cleared)
  })

  test('andar encostado na porta sem apertar para fora não troca de sala', () => {
    let run = createRun({ seed: 1, characterId: 'x' })
    const door = getRoomDoors(run.floor, getCurrentRoom(run))[0]
    run.player = createPlayer(DOOR_EDGES[door.side])
    const sideways = door.side === 'up' || door.side === 'down' ? { x: 1, y: 0 } : { x: 0, y: 1 }
    run = updateRun(run, { movement: sideways, attackDirection: null }, STEP)
    assert.equal(run.transition, null)
  })
})

describe('faixa do andar', () => {
  test('some depois de BANNER_TOTAL_MS', () => {
    let run = createRun({ seed: 1, characterId: 'x' })
    run = steps(run, BANNER_TOTAL_MS / STEP_MS - 1)
    assert.ok(run.banner)
    run = updateRun(run, IDLE, STEP)
    assert.equal(run.banner, null)
  })

  test('continua contando durante a transição de sala', () => {
    let run = steps(createRun({ seed: 1, characterId: 'x' }), 20)
    const before = run.banner.elapsedMs
    run = goThrough(run, getRoomDoors(run.floor, getCurrentRoom(run))[0].side)
    // 1 quadro para sair + a transição inteira
    assert.ok(Math.abs(run.banner.elapsedMs - (before + STEP_MS + ROOM_TRANSITION_MS)) < 1e-6)
  })
})

describe('parede secreta: de longe, nada', () => {
  test('golpe que alcança a zona da parede, mas de longe da marca, não trinca a parede', () => {
    const { seed, roomId } = findSeed(3, (room) => room.secret?.side === 'left')
    let run = createRun({ seed, floorNumber: 3, roomId, characterId: 'x' })
    run.player = createPlayer({ x: 160, y: 700 }) // a 167 u do ponto da porta: a marca não aparece
    assert.equal(isSecretMarkVisible(run), false)
    run = swing(run, 'up').run
    assert.equal(getCurrentRoom(run).hits, 0)
  })

  test('continuar sem posição válida na sala de origem não põe o jogador colado na parede secreta', () => {
    for (const side of ['up', 'right']) {
      const found = findSeed(3, (room) => room.secret?.side === side)
      const run = createRun({ seed: found.seed, floorNumber: 3, roomId: found.roomId, position: { x: -1, y: -1 }, characterId: 'x' })
      assert.equal(isSecretMarkVisible(run), false, `lado secreto ${side}`)
    }
  })
})

describe('golpes: tambor e parede secreta', () => {
  test('cada golpe conta uma vez no tambor; 3 golpes trocam de andar com a faixa', () => {
    const { seed, roomId } = findSeed(1, (room) => room.type === 'chefe')
    let run = createRun({ seed, roomId, characterId: 'x' })
    const boss = getCurrentRoom(run)
    assert.ok(isDrumVisible(boss))

    for (let hit = 1; hit <= 2; hit++) {
      const result = hitDrum(run)
      run = result.run
      assert.ok(result.activeFrames > 1, 'a caixa do golpe fica vários quadros em cima do tambor')
      assert.equal(boss.hits, hit)
      assert.equal(run.transition, null)
    }

    run = hitDrum(run).run
    assert.equal(boss.hits, 3)
    assert.equal(run.transition.type, 'floor')
    assert.equal(run.transition.durationMs, FLOOR_TRANSITION_MS)

    // Na metade, o andar 2 já está gerado com a mesma seed, no centro da sala inicial, com a faixa
    run = steps(run, FLOOR_TRANSITION_MS / 2 / STEP_MS)
    assert.equal(run.transition.switched, true)
    assert.equal(run.floor.number, 2)
    assert.equal(run.floor.seed, seed)
    assert.equal(run.roomId, run.floor.startRoomId)
    assert.deepEqual({ x: run.player.x, y: run.player.y }, ROOM_PLAYER_START)
    assert.deepEqual(run.banner, { text: 'CUCINA', elapsedMs: 0 })

    run = waitTransition(run)
    assert.equal(run.transition, null)
    assert.equal(run.finished, false)
  })

  test('no andar 5 o tambor termina a run e nada mais muda', () => {
    const { seed, roomId } = findSeed(LAST_FLOOR, (room) => room.type === 'chefe')
    let run = createRun({ seed, floorNumber: LAST_FLOOR, roomId, characterId: 'x' })
    for (let hit = 0; hit < 3; hit++) run = hitDrum(run).run
    run = waitTransition(run)
    assert.equal(run.finished, true)
    assert.equal(run.floor.number, LAST_FLOOR)
    assert.equal(updateRun(run, { movement: { x: 1, y: 0 }, attackDirection: 'up' }, STEP), run)
  })

  test('parede secreta: marca de perto, um golpe conta uma vez, 3 golpes abrem', () => {
    const { seed, roomId } = findSeed(2, (room) => room.secret !== null)
    let run = createRun({ seed, floorNumber: 2, roomId, characterId: 'x' })
    const origin = getCurrentRoom(run)
    const { side } = origin.secret
    const secretDoor = () => getRoomDoors(run.floor, origin).find((door) => door.side === side)

    run.player = createPlayer(ROOM_PLAYER_START)
    assert.equal(isSecretMarkVisible(run), false, 'de longe, nada')
    run.player = createPlayer(getEntryPosition(side))
    assert.equal(isSecretMarkVisible(run), true, 'de perto, a marca')

    const first = hitSecret(run, side)
    run = first.run
    assert.ok(first.activeFrames > 1)
    assert.equal(origin.hits, 1)
    assert.equal(secretDoor().state, 'cracked')
    run.player = createPlayer(ROOM_PLAYER_START)
    assert.equal(isSecretMarkVisible(run), true, 'trincada, aparece de longe')

    run = hitSecret(run, side).run
    run = hitSecret(run, side).run
    assert.equal(origin.hits, 3)
    assert.equal(secretDoor().state, 'open')
    run = hitSecret(run, side).run
    assert.equal(origin.hits, 3, 'não passa de 3')

    run = goThrough(run, side)
    assert.equal(getCurrentRoom(run).type, 'adega')
  })
})

describe('obstáculos na run', () => {
  test('garrafão quebrado some e não volta ao sair e entrar de novo', () => {
    // Sala comum da cantina (andar 1) com garrafão
    let run = null
    for (let s = 1; !run; s++) {
      for (const room of generateFloor(s, 1).rooms.filter((item) => item.type === 'comum')) {
        const candidate = createRun({ seed: s, roomId: room.id, characterId: 'x' })
        if (candidate.obstacles.some((obstacle) => obstacle.kind === 'garrafao')) {
          run = candidate
          break
        }
      }
    }

    const room = getCurrentRoom(run)
    const jar = run.obstacles.find((obstacle) => obstacle.kind === 'garrafao')
    run.player = createPlayer({ x: jar.box.x + jar.box.width / 2, y: jar.box.y + jar.box.height + 30 })
    run = swing(run, 'up').run
    assert.equal(run.obstacles.find((obstacle) => obstacle.id === jar.id).removed, true)
    assert.ok(room.removed.includes(jar.id))

    const door = getRoomDoors(run.floor, room)[0]
    run = goThrough(run, door.side)
    run = goThrough(run, OPPOSITE_SIDE[door.side])
    assert.equal(run.roomId, room.id)
    assert.equal(run.obstacles.some((obstacle) => obstacle.id === jar.id), false)
  })
})

describe('mecânicas do piso na run', () => {
  // Run na sala inicial (vazia) com obstáculos montados à mão
  const BLOCKING = ['solido', 'quebravel', 'rolante', 'quente', 'cenario', 'tambor']
  function obstacle(mechanic, box) {
    return { id: `${box.x}-${box.y}`, col: 0, row: 0, kind: mechanic, mechanic, blocking: BLOCKING.includes(mechanic), box }
  }
  function runWith(obstacles, position) {
    const run = createRun({ seed: 1, characterId: 'x' })
    run.obstacles = obstacles
    run.player = createPlayer(position)
    return run
  }
  const right = { movement: { x: 1, y: 0 }, attackDirection: null }
  const up = { movement: { x: 0, y: -1 }, attackDirection: null }

  test('chapa quente: encostar dá dano', () => {
    const run = updateRun(runWith([obstacle('quente', { x: 900, y: 500, width: 84, height: 60 })], { x: 878, y: 540 }), IDLE, STEP)
    assert.ok(run.player.hurt)
  })

  test('esteira empurra para a direita', () => {
    const run = updateRun(runWith([obstacle('esteira', { x: 700, y: 500, width: 105, height: 75 })], { x: 750, y: 540 }), IDLE, STEP)
    assert.ok(Math.abs(run.player.x - (750 + 130 * STEP)) < 1e-6)
    assert.equal(run.player.y, 540)
  })

  test('grudento deixa lento', () => {
    const run = updateRun(runWith([obstacle('grudento', { x: 600, y: 450, width: 300, height: 200 })], { x: 700, y: 540 }), right, STEP)
    assert.ok(Math.abs(run.player.x - (700 + 260 * 0.5 * STEP)) < 1e-6)
  })

  test('escorregadio segue a direção em que entrou', () => {
    let run = runWith([obstacle('escorregadio', { x: 500, y: 400, width: 600, height: 300 })], { x: 600, y: 540 })
    run = updateRun(run, right, STEP)
    assert.deepEqual(run.slip, { x: 1, y: 0 })
    const x = run.player.x
    run = updateRun(run, up, STEP)
    assert.ok(run.player.x > x, 'continua para a direita')
    assert.equal(run.player.y, 540, 'ignora a tecla para cima')
  })
})

// ---------- ponta a ponta ----------

// O andar é uma árvore (a adega só se liga à origem e o pacto só ao chefe):
// esta porta leva, por algum caminho, até a sala do chefe?
function leadsToBoss(floor, roomId, parentId) {
  const room = findRoom(floor, roomId)
  if (room.type === 'chefe') return true
  return getRoomDoors(floor, room).some((door) => door.targetId !== parentId && leadsToBoss(floor, door.targetId, room.id))
}

// Percorre o andar pelas portas (busca em profundidade), deixando o caminho do chefe por último.
// Abre a adega quando encontra a parede secreta e termina batendo 3 vezes no tambor.
function explore(run, parentId, seen) {
  const { floor } = run
  const room = getCurrentRoom(run)
  seen.add(room.id)
  const doors = getRoomDoors(floor, room).filter((door) => door.targetId !== parentId)
  const bossDoor = doors.find((door) => leadsToBoss(floor, door.targetId, room.id))

  for (const door of doors) {
    if (door === bossDoor) continue
    if (door.state !== 'open') {
      for (let hit = 0; hit < 3; hit++) run = hitSecret(run, door.side).run
    }
    run = goThrough(run, door.side)
    run = explore(run, room.id, seen)
    run = goThrough(run, OPPOSITE_SIDE[door.side])
  }

  if (bossDoor) return explore(goThrough(run, bossDoor.side), room.id, seen)
  if (room.type === 'chefe') {
    for (let hit = 0; hit < 3; hit++) run = hitDrum(run).run
    assert.equal(run.transition?.type, 'floor')
  }
  return run
}

describe('ponta a ponta', () => {
  test('300 seeds: todas as salas dos 5 andares pelas portas, adega aberta, tambor até o fim', () => {
    let cellars = 0
    for (let seed = 1; seed <= 300; seed++) {
      let run = createRun({ seed, characterId: 'x' })
      for (let number = 1; number <= LAST_FLOOR; number++) {
        const { floor } = run
        assert.equal(floor.number, number)
        assert.equal(run.roomId, floor.startRoomId)
        const seen = new Set()
        run = explore(run, null, seen)
        assert.equal(seen.size, floor.rooms.length, `seed ${seed}, andar ${number}: salas sem visitar`)
        assert.ok(floor.rooms.every((room) => room.visited))
        if (floor.rooms.some((room) => room.type === 'adega')) cellars++
        run = waitTransition(run)
      }
      assert.equal(run.finished, true, `seed ${seed} não terminou`)
    }
    assert.ok(cellars > 0, 'alguma seed tem adega')
  })
})
