import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { FORK_UNLOCK_MS, getEntryPosition, getRoomDoors, OPPOSITE_SIDE, SIDE_VECTORS } from '../src/utils/doors.js'
import { generateFloor, LAST_FLOOR } from '../src/utils/floorGenerator.js'
import { DAMAGE_LIGHT, MAX_HEALTH } from '../src/utils/health.js'
import { createPlayer, DEATH_DURATION_MS, getAttackHitbox, killPlayer } from '../src/utils/player.js'
import { normalizeProgressPayload } from '../src/utils/progress.js'
import { STICKY_SPEED } from '../src/utils/roomObstacles.js'
import { PLAYER_FEET_BOX, ROOM_PLAYER_BOUNDS, ROOM_PLAYER_START } from '../src/utils/roomMovement.js'
import {
  BANNER_TOTAL_MS,
  createRun,
  createRunSnapshot,
  DEATH_HOLD_MS,
  FLOOR_TRANSITION_MS,
  getCurrentRoom,
  getDrumBox,
  getObstacleTheme,
  getRestartFade,
  getRoomStates,
  getRoomTheme,
  getVisitedRoomIds,
  isDrumVisible,
  isSecretMarkVisible,
  RESTART_HOLD_MS,
  ROOM_TRANSITION_MS,
  STARTING_FORKS,
  updateRestartHold,
  updateRestartKey,
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
  left: { x: minX, y: 536 },
  right: { x: maxX, y: 536 },
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

// Empurra a porta trancada (gasta 1 garfo) e espera a animação de abrir acabar
function unlockDoor(run, side) {
  run.player = createPlayer(DOOR_EDGES[side])
  run = updateRun(run, { movement: SIDE_VECTORS[side], attackDirection: null }, STEP)
  assert.equal(run.unlocking?.side, side, `a porta trancada ${side} da sala ${run.roomId} não abriu`)
  while (run.unlocking) run = updateRun(run, IDLE, STEP)
  return run
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

// Sai da run e volta: o que o jogo salva vira JSON (como na API) e a run é recriada com o que voltou
function saveAndContinue(run) {
  const progress = normalizeProgressPayload(JSON.parse(JSON.stringify(createRunSnapshot(run, 5000))))
  return createRun({
    seed: progress.seed,
    floorNumber: progress.floor,
    roomId: progress.roomId,
    position: { x: progress.playerX, y: progress.playerY },
    characterId: progress.characterId,
    visitedRoomIds: progress.visitedRoomIds,
    roomStates: progress.roomStates,
    health: progress.health,
  })
}

// Primeira run (seed a partir de 1) numa sala comum do andar 1 que tem um obstáculo daquele tipo
function findRunWith(kind) {
  for (let seed = 1; seed < 200; seed++) {
    for (const room of generateFloor(seed, 1).rooms.filter((item) => item.type === 'comum')) {
      const run = createRun({ seed, roomId: room.id, characterId: 'x' })
      if (run.obstacles.some((obstacle) => obstacle.kind === kind)) return run
    }
  }
  throw new Error(`nenhuma sala com ${kind}`)
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
    assert.equal(run.health, MAX_HEALTH, 'começa com os 3 corações cheios')
    assert.equal(run.death, null)
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
      visitedRoomIds: [run.roomId],
      roomStates: {},
      health: MAX_HEALTH,
      deathCause: null,
      forks: 1,
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

  const hotPlate = () => obstacle('quente', { x: 900, y: 500, width: 84, height: 60 })
  const TOUCHING = { x: 900 - PLAYER_FEET_BOX.width / 2, y: 540 } // pés encostados à esquerda da chapa

  test('chapa quente: cada queimadura tira meio coração e a invencibilidade segura a próxima', () => {
    let run = runWith([hotPlate()], TOUCHING)
    assert.equal(run.health, MAX_HEALTH)
    run = updateRun(run, IDLE, STEP)
    assert.equal(run.health, MAX_HEALTH - DAMAGE_LIGHT)
    run = steps(run, 10) // 500 ms depois: ainda invencível
    assert.equal(run.health, 5)
    run = steps(run, 12) // passou de 1000 ms: queima de novo, uma vez só
    assert.equal(run.health, 4)
  })

  test('longe da chapa a vida não muda', () => {
    const run = steps(runWith([hotPlate()], { x: 600, y: 540 }), 40)
    assert.equal(run.health, MAX_HEALTH)
    assert.equal(run.death, null)
  })

  test('sem vida ele morre: animação de morte, controles ignorados e fim da run', () => {
    let run = { ...runWith([hotPlate()], TOUCHING), health: 1 }
    run = updateRun(run, IDLE, STEP)
    assert.equal(run.health, 0)
    assert.deepEqual(run.death, { cause: 'chapa' })
    assert.deepEqual(run.player.dead, { elapsed: 0 })
    assert.equal(run.player.hurt, null, 'a animação de dano não toca: vai direto para a morte')
    assert.equal(run.finished, false)

    const { x, y } = run.player
    run = updateRun(run, { movement: { x: -1, y: 0 }, attackDirection: 'left' }, STEP)
    assert.deepEqual({ x: run.player.x, y: run.player.y }, { x, y }, 'morto não anda')
    assert.equal(run.player.attack, null, 'nem ataca')
    assert.equal(run.health, 0)

    const total = DEATH_DURATION_MS + DEATH_HOLD_MS
    run = steps(run, Math.ceil(total / STEP_MS) - 2)
    assert.equal(run.finished, false, 'ainda está caindo ou deitado')
    run = steps(run, 2)
    assert.equal(run.finished, true)
    assert.deepEqual(run.death, { cause: 'chapa' }, 'a causa fica para o aviso')
    assert.equal(updateRun(run, IDLE, STEP), run, 'depois do fim nada muda')
  })

  test('o save feito durante a animação de morte já marca a run como encerrada, com a causa', () => {
    let run = { ...runWith([hotPlate()], TOUCHING), health: 1 }
    run = updateRun(run, IDLE, STEP)
    const snapshot = createRunSnapshot(run, 9000)
    assert.equal(snapshot.finished, true)
    assert.equal(snapshot.health, 0)
    assert.equal(snapshot.deathCause, 'chapa')
  })

  test('vivo, o save não tem causa de morte', () => {
    const snapshot = createRunSnapshot(updateRun(runWith([hotPlate()], TOUCHING), IDLE, STEP), 9000)
    assert.equal(snapshot.finished, false)
    assert.equal(snapshot.health, 5)
    assert.equal(snapshot.deathCause, null)
  })

  test('morto não atravessa porta nem passa de andar', () => {
    let run = createRun({ seed: 1, characterId: 'x' })
    const door = getRoomDoors(run.floor, getCurrentRoom(run))[0]
    run.player = killPlayer(createPlayer(DOOR_EDGES[door.side]))
    run.death = { cause: 'chapa' }
    run = updateRun(run, { movement: SIDE_VECTORS[door.side], attackDirection: null }, STEP)
    assert.equal(run.transition, null)
  })

  test('a vida continua de uma sala para outra, de um andar para outro e no save', () => {
    let run = createRun({ seed: 7, characterId: 'x', health: 3 })
    assert.equal(run.health, 3)
    run = goThrough(run, getRoomDoors(run.floor, getCurrentRoom(run))[0].side)
    assert.equal(run.health, 3)
    assert.equal(saveAndContinue(run).health, 3)

    const { seed, roomId } = findSeed(1, (room) => room.type === 'chefe')
    run = createRun({ seed, roomId, characterId: 'x', health: 2 })
    getCurrentRoom(run).hits = 3 // o tambor já foi batido
    run = steps(run, Math.ceil(FLOOR_TRANSITION_MS / STEP_MS) + 2)
    assert.equal(run.floor.number, 2)
    assert.equal(run.health, 2)
  })

  test('esteira empurra para a direita', () => {
    const run = updateRun(runWith([obstacle('esteira', { x: 700, y: 500, width: 105, height: 75 })], { x: 750, y: 540 }), IDLE, STEP)
    assert.ok(Math.abs(run.player.x - (750 + 130 * STEP)) < 1e-6)
    assert.equal(run.player.y, 540)
  })

  test('grudento deixa lento', () => {
    const run = updateRun(runWith([obstacle('grudento', { x: 600, y: 450, width: 300, height: 200 })], { x: 700, y: 540 }), right, STEP)
    assert.ok(Math.abs(run.player.x - (700 + 260 * STICKY_SPEED * STEP)) < 1e-6)
  })

  const ice = () => obstacle('escorregadio', { x: 500, y: 400, width: 600, height: 300 })

  test('escorregadio: entra andando sem tranco, solta a tecla e continua deslizando até parar', () => {
    let run = runWith([ice()], { x: 600, y: 540 })
    run = updateRun(run, right, STEP)
    assert.deepEqual(run.slip, { x: 1, y: 0 }, 'ao entrar, a velocidade é a das teclas')
    assert.ok(Math.abs(run.player.x - (600 + 260 * STEP)) < 1e-6)

    const before = run.player.x
    run = updateRun(run, IDLE, STEP)
    assert.ok(run.player.x > before, 'sem tecla, continua deslizando')
    assert.ok(run.slip.x < 1 && run.slip.x > 0, 'e freia aos poucos')

    run = steps(run, 26)
    assert.deepEqual(run.slip, { x: 0, y: 0 }, 'por fim para')
    assert.ok(run.player.x - 600 < 200, 'sem passar de ~160 u depois de soltar')
  })

  test('escorregadio: trocar de tecla muda a direção aos poucos, não de uma vez', () => {
    let run = runWith([ice()], { x: 600, y: 540 })
    run = steps(run, 4, right)
    const { x, y } = run.player
    run = updateRun(run, up, STEP)
    assert.ok(run.player.x > x, 'ainda vai para a direita')
    assert.ok(run.player.y < y, 'e já começa a subir')
    assert.ok(y - run.player.y < 260 * STEP * 0.5, 'mas sobe menos que a metade do passo cheio')
  })

  test('escorregadio: ao sair do líquido a sobra de velocidade some sem tranco e as teclas voltam', () => {
    let run = runWith([obstacle('escorregadio', { x: 500, y: 400, width: 200, height: 300 })], { x: 650, y: 540 })
    run = steps(run, 6, right) // sai do líquido (x = 700) com velocidade
    assert.ok(run.player.x > 700)
    run = steps(run, 6) // soltou as teclas: a sobra some
    assert.equal(run.slip, null)
    const x = run.player.x
    run = updateRun(run, right, STEP)
    assert.ok(Math.abs(run.player.x - (x + 260 * STEP)) < 1e-6, 'fora do líquido vale o andar normal')
  })

  test('escorregadio: o deslize sozinho não atravessa a porta, só com a tecla apertada', () => {
    let run = createRun({ seed: 1, characterId: 'x' })
    const door = getRoomDoors(run.floor, getCurrentRoom(run))[0]
    run.obstacles = [obstacle('escorregadio', { x: 0, y: 0, width: 1600, height: 853 })]
    run.player = createPlayer(DOOR_EDGES[door.side])
    run.slip = { ...SIDE_VECTORS[door.side] } // deslizando para a porta, sem tecla
    run = steps(run, 10)
    assert.equal(run.transition, null, 'sem tecla, nada de trocar de sala')
    run = updateRun(run, { movement: SIDE_VECTORS[door.side], attackDirection: null }, STEP)
    assert.equal(run.transition?.type, 'room', 'com a tecla apertada, troca')
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
    if (door.state === 'locked') run = unlockDoor(run, door.side)
    else if (door.state !== 'open') {
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

describe('estado das salas no progresso: o que quebrou não volta', () => {
  test('sala sem nada quebrado não entra no save', () => {
    assert.deepEqual(getRoomStates(createRun({ seed: 7, characterId: 'x' }).floor), {})
  })

  test('garrafão quebrado continua quebrado depois de sair da run e voltar', () => {
    let run = findRunWith('garrafao')
    const room = getCurrentRoom(run)
    const jar = run.obstacles.find((obstacle) => obstacle.kind === 'garrafao')
    run.player = createPlayer({ x: jar.box.x + jar.box.width / 2, y: jar.box.y + jar.box.height + 30 })
    run = swing(run, 'up').run
    assert.deepEqual(getRoomStates(run.floor), { [room.id]: { removed: [jar.id], hits: 0, unlocked: false } })

    const back = saveAndContinue(run)
    assert.equal(back.roomId, room.id)
    assert.equal(back.obstacles.some((obstacle) => obstacle.id === jar.id), false, 'o garrafão não voltou')
    assert.ok(getCurrentRoom(back).removed.includes(jar.id))
  })

  test('barril deitado: golpeado, não volta nem se o jogador sair com ele ainda rolando', () => {
    let run = findRunWith('barril-deitado')
    const room = getCurrentRoom(run)
    const barrel = run.obstacles.find((obstacle) => obstacle.kind === 'barril-deitado')
    run.player = createPlayer({ x: barrel.box.x + barrel.box.width / 2, y: barrel.box.y + barrel.box.height + 30 })
    run = updateRun(run, { movement: { x: 0, y: 0 }, attackDirection: 'up' }, STEP)
    const isRolling = () => run.obstacles.find((obstacle) => obstacle.id === barrel.id)?.rolling
    for (let frame = 0; frame < 12 && !isRolling(); frame++) run = updateRun(run, IDLE, STEP)
    assert.ok(isRolling(), 'o golpe pôs o barril para rolar')
    assert.ok(room.removed.includes(barrel.id), 'rolando, ele já conta como quebrado')

    // sai da run com o barril ainda no meio do caminho e volta
    const back = saveAndContinue(run)
    assert.equal(back.obstacles.some((obstacle) => obstacle.id === barrel.id), false, 'o barril não voltou ao continuar')

    // e também não volta ao sair da sala e entrar de novo
    const door = getRoomDoors(run.floor, room)[0]
    run = goThrough(run, door.side)
    run = goThrough(run, OPPOSITE_SIDE[door.side])
    assert.equal(run.roomId, room.id)
    assert.equal(run.obstacles.some((obstacle) => obstacle.id === barrel.id), false, 'o barril não voltou ao reentrar')
  })

  test('a adega aberta continua aberta (as batidas são salvas)', () => {
    const { seed, roomId } = findSeed(2, (room) => room.secret !== null)
    let run = createRun({ seed, floorNumber: 2, roomId, characterId: 'x' })
    const { side } = getCurrentRoom(run).secret
    for (let hit = 0; hit < 3; hit++) run = hitSecret(run, side).run
    assert.equal(getCurrentRoom(run).hits, 3)

    const back = saveAndContinue(run)
    const origin = getCurrentRoom(back)
    assert.equal(origin.hits, 3)
    assert.equal(getRoomDoors(back.floor, origin).find((door) => door.side === side).state, 'open')
  })

  test('uma batida só também é salva: a parede continua trincada', () => {
    const { seed, roomId } = findSeed(2, (room) => room.secret !== null)
    let run = createRun({ seed, floorNumber: 2, roomId, characterId: 'x' })
    const { side } = getCurrentRoom(run).secret
    run = hitSecret(run, side).run
    const back = saveAndContinue(run)
    assert.equal(getRoomDoors(back.floor, getCurrentRoom(back)).find((door) => door.side === side).state, 'cracked')
  })

  test('estado de sala que não existe neste andar é ignorado', () => {
    const run = createRun({ seed: 7, characterId: 'x', roomStates: { '99-99': { removed: ['1-1'], hits: 2 } } })
    assert.deepEqual(getRoomStates(run.floor), {})
  })

  test('o estado salvo não é o mesmo objeto da sala (mexer num não muda o outro)', () => {
    const states = { }
    const run = createRun({ seed: 7, characterId: 'x' })
    states[run.roomId] = { removed: ['1-1'], hits: 0 }
    const back = createRun({ seed: 7, characterId: 'x', roomStates: states })
    getCurrentRoom(back).removed.push('2-2')
    assert.deepEqual(states[run.roomId].removed, ['1-1'])
    getRoomStates(back.floor)[back.roomId].removed.push('3-3')
    assert.deepEqual(getCurrentRoom(back).removed, ['1-1', '2-2'])
  })
})

describe('recomeçar a run segurando R', () => {
  test('segurar por 1 s completa, e a tela escurece junto', () => {
    assert.equal(RESTART_HOLD_MS, 1000)
    let hold = 0
    assert.equal(getRestartFade(hold), 0)
    hold = updateRestartHold(hold, true, 250)
    assert.equal(hold, 250)
    assert.equal(getRestartFade(hold), 0.25)
    for (let frame = 0; frame < 60; frame++) hold = updateRestartHold(hold, true, 50)
    assert.equal(hold, RESTART_HOLD_MS, 'não passa do total')
    assert.equal(getRestartFade(hold), 1)
  })

  test('soltar antes desfaz, 3x mais rápido, e nunca fica negativo', () => {
    let hold = updateRestartHold(0, true, 600)
    hold = updateRestartHold(hold, false, 100)
    assert.equal(hold, 300)
    hold = updateRestartHold(hold, false, 500)
    assert.equal(hold, 0)
    assert.equal(updateRestartHold(0, false, 16), 0)
  })

  test('o escurecimento fica sempre entre 0 e 1', () => {
    for (const hold of [-50, 0, 400, 1000, 5000]) {
      const fade = getRestartFade(hold)
      assert.ok(fade >= 0 && fade <= 1, String(hold))
    }
  })
})

// Simula a página: quadros de 16 ms, o teclado repetindo o keydown a cada 33 ms enquanto a tecla está no fundo
// (como um teclado de verdade) e, no meio, os eventos de `extras` ({ ms, type }). Devolve quantas vezes recomeçou.
// Igual a SalaInicial.jsx: ao recomeçar, o tempo segurado volta a 0.
function holdR(totalMs, extras = []) {
  let held = updateRestartKey(false, 'press')
  let hold = 0
  let restarts = 0
  const pending = [...extras]
  for (let ms = 0; ms < totalMs; ms += 16) {
    while (pending.length > 0 && pending[0].ms <= ms) held = updateRestartKey(held, pending.shift().type)
    if (ms % 33 < 16) held = updateRestartKey(held, 'repeat')
    hold = updateRestartHold(hold, held, 16)
    if (held && hold >= RESTART_HOLD_MS) {
      restarts++
      hold = 0
    }
  }
  return restarts
}

describe('tecla R: segurando, a run recomeça uma atrás da outra', () => {
  test('segurar por 10 s recomeça a cada ~1 s (9 vezes, com quadros de 16 ms)', () => {
    assert.equal(holdR(10_000), 9)
    assert.equal(holdR(900), 0, 'antes de 1 s não recomeça')
  })

  test('soltar para de recomeçar; apertar de novo volta', () => {
    assert.equal(holdR(5000, [{ ms: 1500, type: 'release' }]), 1)
    assert.equal(holdR(5000, [{ ms: 1500, type: 'release' }, { ms: 2000, type: 'press' }]), 3)
  })

  test('perder o foco para, e o repeat do teclado não religa sozinho', () => {
    assert.equal(holdR(5000, [{ ms: 600, type: 'blur' }]), 0)
    assert.equal(holdR(5000, [{ ms: 1500, type: 'blur' }]), 1)
  })

  test('o repeat não liga a tecla sem um aperto de verdade', () => {
    assert.equal(updateRestartKey(false, 'repeat'), false)
    assert.equal(updateRestartKey(true, 'repeat'), true)
  })
})

describe('salas visitadas no progresso', () => {
  const sorted = (ids) => [...ids].sort()

  test('a run nova começa só com a sala inicial visitada', () => {
    const run = createRun({ seed: 7, characterId: 'x' })
    assert.deepEqual(getVisitedRoomIds(run.floor), [run.floor.startRoomId])
  })

  test('visitar salas, sair da run e voltar: as mesmas salas continuam visitadas', () => {
    let run = createRun({ seed: 7, characterId: 'x' })
    for (let i = 0; i < 3; i++) run = goThrough(run, getRoomDoors(run.floor, getCurrentRoom(run))[0].side)
    const visited = getVisitedRoomIds(run.floor)
    assert.ok(visited.length >= 2, 'visitou pelo menos duas salas')

    // O que o jogo salva e a API devolve (JSON), e a run recriada com isso
    const saved = JSON.parse(JSON.stringify(createRunSnapshot(run, 5000)))
    const progress = normalizeProgressPayload(saved)
    const back = createRun({
      seed: progress.seed,
      floorNumber: progress.floor,
      roomId: progress.roomId,
      characterId: progress.characterId,
      visitedRoomIds: progress.visitedRoomIds,
    })
    assert.deepEqual(sorted(getVisitedRoomIds(back.floor)), sorted(visited))
    // a fonte única: o campo que o minimapa lê (room.visited) é o mesmo
    for (const room of back.floor.rooms) assert.equal(room.visited, visited.includes(room.id), room.id)
  })

  test('save antigo, sem a lista: só a sala atual fica visitada', () => {
    const progress = normalizeProgressPayload({ seed: 7, floor: 1, roomId: 'sala-inicial' })
    const run = createRun({ seed: 7, characterId: 'x', visitedRoomIds: progress.visitedRoomIds })
    assert.deepEqual(getVisitedRoomIds(run.floor), [run.floor.startRoomId])
  })

  test('ids que não existem no andar são ignorados (os ids repetem entre andares)', () => {
    const run = createRun({ seed: 7, floorNumber: 2, characterId: 'x', visitedRoomIds: ['0-0', '99-99', 'lixo'] })
    const ids = run.floor.rooms.map((room) => room.id)
    assert.ok(getVisitedRoomIds(run.floor).every((id) => ids.includes(id)))
    assert.ok(getVisitedRoomIds(run.floor).includes(run.floor.startRoomId))
  })

  test('trocar de andar: o novo andar começa só com a sala inicial visitada', () => {
    const { seed, roomId } = findSeed(1, (room) => room.type === 'chefe')
    let run = createRun({ seed, roomId, characterId: 'x' })
    getCurrentRoom(run).hits = 3 // o tambor já foi batido
    run = steps(run, Math.ceil(FLOOR_TRANSITION_MS / STEP_MS) + 2)
    assert.equal(run.floor.number, 2)
    assert.deepEqual(getVisitedRoomIds(run.floor), [run.floor.startRoomId])

    // e o save do andar 2 volta com as salas do andar 2
    run = goThrough(run, getRoomDoors(run.floor, getCurrentRoom(run))[0].side)
    const progress = normalizeProgressPayload(JSON.parse(JSON.stringify(createRunSnapshot(run, 1))))
    const back = createRun({ seed, floorNumber: progress.floor, roomId: progress.roomId, characterId: 'x', visitedRoomIds: progress.visitedRoomIds })
    assert.equal(back.floor.number, 2)
    assert.deepEqual(sorted(getVisitedRoomIds(back.floor)), sorted(getVisitedRoomIds(run.floor)))
  })
})

describe('ponta a ponta', () => {
  test('300 seeds: todas as salas dos 5 andares pelas portas, adega aberta, trancadas abertas com garfo, tambor até o fim', () => {
    let cellars = 0
    for (let seed = 1; seed <= 300; seed++) {
      // garfos de sobra: o teste abre toda sala trancada (no máximo 2 por andar)
      let run = createRun({ seed, characterId: 'x', forks: 99 })
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

describe('portas trancadas: gastar o garfo', () => {
  // A 1ª seed com Sala do Tesouro no andar 2: começa a run na sala vizinha dela, de frente para a porta trancada
  function nextToTreasure(forks = 1) {
    for (let seed = 1; ; seed++) {
      const floor = generateFloor(seed, 2)
      const treasure = floor.rooms.find((room) => room.type === 'tesouro')
      if (!treasure) continue
      const back = Object.keys(treasure.neighbors).find((side) => treasure.neighbors[side])
      const run = createRun({ seed, floorNumber: 2, roomId: treasure.neighbors[back], characterId: 'x', forks })
      return { run, side: OPPOSITE_SIDE[back], treasureId: treasure.id }
    }
  }
  const push = (run, side) => {
    run.player = createPlayer(DOOR_EDGES[side])
    return updateRun(run, { movement: SIDE_VECTORS[side], attackDirection: null }, STEP)
  }
  const doorState = (run, side) => getRoomDoors(run.floor, getCurrentRoom(run)).find((door) => door.side === side).state

  test('a run começa com 1 garfo e a porta do tesouro (andar 2) trancada', () => {
    const { run, side } = nextToTreasure()
    assert.equal(run.forks, STARTING_FORKS)
    assert.equal(STARTING_FORKS, 1)
    assert.equal(doorState(run, side), 'locked')
  })

  test('empurrar com garfo gasta 1, toca a animação e só depois deixa passar', () => {
    let { run, side, treasureId } = nextToTreasure()
    run = push(run, side)
    assert.equal(run.forks, 0)
    assert.deepEqual(run.unlocking, { side, elapsedMs: 0 })
    assert.equal(run.transition, null, 'durante a animação a porta não deixa passar')
    // continua empurrando: a animação anda e ele não atravessa, nem gasta outro garfo
    for (let ms = 0; ms < FORK_UNLOCK_MS - 2 * STEP_MS; ms += STEP_MS) {
      run = updateRun(run, { movement: SIDE_VECTORS[side], attackDirection: null }, STEP)
      assert.equal(run.transition, null)
    }
    assert.equal(run.forks, 0)
    while (run.unlocking) run = updateRun(run, IDLE, STEP)
    run = goThrough(run, side)
    assert.equal(run.roomId, treasureId)
  })

  test('aberta, ela fica aberta: ao sair e voltar, e ao continuar a run pelo save', () => {
    let { run, side } = nextToTreasure()
    run = push(run, side)
    while (run.unlocking) run = updateRun(run, IDLE, STEP)
    run = goThrough(goThrough(run, side), OPPOSITE_SIDE[side])
    assert.equal(doorState(run, side), 'open')
    assert.equal(run.forks, 0)

    const saved = normalizeProgressPayload(createRunSnapshot(run, 1000))
    const again = createRun({ seed: saved.seed, floorNumber: saved.floor, roomId: saved.roomId, characterId: 'x', roomStates: saved.roomStates, forks: saved.forks })
    assert.equal(again.forks, 0, 'o garfo gasto não volta')
    assert.equal(doorState(again, side), 'open')
  })

  test('sem garfo, empurrar não faz nada', () => {
    let { run, side } = nextToTreasure(0)
    run = push(run, side)
    assert.equal(run.unlocking, null)
    assert.equal(run.transition, null)
    assert.equal(run.forks, 0)
    assert.equal(doorState(run, side), 'locked')
  })

  test('com 2 garfos, abrir uma porta gasta só 1', () => {
    let { run, side } = nextToTreasure(2)
    run = push(run, side)
    while (run.unlocking) run = updateRun(run, { movement: SIDE_VECTORS[side], attackDirection: null }, STEP)
    assert.equal(run.forks, 1)
  })
})
