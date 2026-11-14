import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import {
  DOOR_HIT_ZONES,
  DOOR_POINTS,
  getDoorKind,
  getEntryPosition,
  getExitSide,
  applyUnlocking,
  FORK_KNOT_MS,
  FORK_UNLOCK_MS,
  getRoomDoors,
  isNearDoor,
  needsFork,
  OPPOSITE_SIDE,
  SIDE_VECTORS,
  SIDES,
} from '../src/utils/doors.js'
import { CONSUMABLE_SPRITES } from '../src/data/itemSprites.js'
import { ROOM_PLAYER_BOUNDS } from '../src/utils/roomMovement.js'

// Sala no formato do andar, com os campos que as portas usam
function room(id, type, neighbors = {}, extra = {}) {
  return {
    id,
    type,
    neighbors: { up: null, right: null, down: null, left: null, ...neighbors },
    secret: null,
    cleared: false,
    hits: 0,
    ...extra,
  }
}

// Andar pequeno: inicial no meio, comum em cima, loja à direita, chefe embaixo com o pacto ao lado,
// e a adega escondida à esquerda da sala comum de cima.
function makeFloor() {
  return {
    startRoomId: '4-3',
    rooms: [
      room('4-3', 'inicial', { up: '4-2', right: '5-3', down: '4-4' }),
      room('4-2', 'comum', { down: '4-3' }, { secret: { side: 'left', roomId: '3-2' } }),
      room('3-2', 'adega', { right: '4-2' }),
      room('5-3', 'loja', { left: '4-3' }),
      room('4-4', 'chefe', { up: '4-3', down: '4-5' }),
      room('4-5', 'pacto', { up: '4-4' }),
    ],
  }
}

const findRoom = (floor, id) => floor.rooms.find((item) => item.id === id)
const openDoors = SIDES.map((side) => ({ side, state: 'open' }))

describe('lados e entradas', () => {
  test('lado oposto e vetor de cada lado', () => {
    for (const side of SIDES) {
      assert.equal(OPPOSITE_SIDE[OPPOSITE_SIDE[side]], side)
      const a = SIDE_VECTORS[side]
      const b = SIDE_VECTORS[OPPOSITE_SIDE[side]]
      assert.deepEqual({ x: a.x + b.x, y: a.y + b.y }, { x: 0, y: 0 })
    }
  })

  test('a entrada fica dentro da área dos pés', () => {
    for (const side of SIDES) {
      const { x, y } = getEntryPosition(side)
      assert.ok(x >= ROOM_PLAYER_BOUNDS.minX && x <= ROOM_PLAYER_BOUNDS.maxX, side)
      assert.ok(y >= ROOM_PLAYER_BOUNDS.minY && y <= ROOM_PLAYER_BOUNDS.maxY, side)
    }
  })

  test('sair por um lado leva à entrada do lado oposto, perto daquela porta', () => {
    assert.deepEqual(getEntryPosition(OPPOSITE_SIDE.up), { x: 800, y: 762 })
    assert.deepEqual(getEntryPosition(OPPOSITE_SIDE.left), { x: 1432, y: 536 })
    for (const side of SIDES) assert.ok(isNearDoor(getEntryPosition(OPPOSITE_SIDE[side]), OPPOSITE_SIDE[side]))
  })

  test('getEntryPosition devolve uma cópia', () => {
    getEntryPosition('up').x = 0
    assert.equal(getEntryPosition('up').x, 800)
  })
})

describe('getExitSide (atravessar a porta)', () => {
  const { minX, maxX, minY, maxY } = ROOM_PLAYER_BOUNDS

  test('atravessa encostado na parede, dentro do vão e apertando para fora', () => {
    assert.equal(getExitSide({ x: 800, y: minY }, { x: 0, y: -1 }, openDoors), 'up')
    assert.equal(getExitSide({ x: 835, y: maxY }, { x: 0, y: 1 }, openDoors), 'down')
    assert.equal(getExitSide({ x: minX, y: 536 }, { x: -1, y: 0 }, openDoors), 'left')
    assert.equal(getExitSide({ x: maxX, y: 586.5 }, { x: 1, y: 0 }, openDoors), 'right')
  })

  test('não atravessa fora do vão, longe da parede ou andando de lado', () => {
    assert.equal(getExitSide({ x: 836, y: minY }, { x: 0, y: -1 }, openDoors), null) // o vão é de 800 ± 35
    assert.equal(getExitSide({ x: 800, y: minY + 1 }, { x: 0, y: -1 }, openDoors), null)
    assert.equal(getExitSide({ x: 800, y: minY }, { x: 1, y: 0 }, openDoors), null)
    assert.equal(getExitSide({ x: minX, y: 480 }, { x: -1, y: 0 }, openDoors), null)
    assert.equal(getExitSide({ x: minX, y: 536 }, { x: 0, y: 1 }, openDoors), null)
  })

  test('só atravessa porta aberta', () => {
    for (const state of ['closed', 'hidden', 'cracked']) {
      assert.equal(getExitSide({ x: 800, y: minY }, { x: 0, y: -1 }, [{ side: 'up', state }]), null, state)
    }
    assert.equal(getExitSide({ x: 800, y: minY }, { x: 0, y: -1 }, [{ side: 'down', state: 'open' }]), null)
  })
})

describe('perto da porta e zona de golpe', () => {
  test('de perto = até 120 u do ponto da porta', () => {
    const left = DOOR_POINTS.left
    assert.equal(isNearDoor({ x: left.x, y: left.y + 120 }, 'left'), true)
    assert.equal(isNearDoor({ x: left.x, y: left.y + 121 }, 'left'), false)
    assert.equal(isNearDoor({ x: 800, y: 560 }, 'up'), false)
  })

  test('as zonas de golpe têm o vão de 122 u', () => {
    assert.equal(DOOR_HIT_ZONES.up.width, 122)
    assert.equal(DOOR_HIT_ZONES.left.height, 122)
  })
})

describe('getRoomDoors e getDoorKind', () => {
  test('porta só nos lados com ligação, aberta com a sala limpa e fechada sem', () => {
    const floor = makeFloor()
    const start = findRoom(floor, '4-3')
    assert.deepEqual(getRoomDoors(floor, start).map((door) => [door.side, door.targetId, door.state]), [
      ['up', '4-2', 'closed'],
      ['right', '5-3', 'closed'],
      ['down', '4-4', 'closed'],
    ])
    start.cleared = true
    assert.ok(getRoomDoors(floor, start).every((door) => door.state === 'open'))
  })

  test('o tipo da porta é o da sala especial, dos dois lados', () => {
    const floor = makeFloor()
    const start = findRoom(floor, '4-3')
    assert.equal(getDoorKind(floor, start, 'right'), 'loja')
    assert.equal(getDoorKind(floor, start, 'down'), 'chefe')
    assert.equal(getDoorKind(floor, start, 'up'), 'comum')
    assert.equal(getDoorKind(floor, findRoom(floor, '5-3'), 'left'), 'loja')
    assert.equal(getDoorKind(floor, findRoom(floor, '4-4'), 'up'), 'chefe')
    assert.equal(getDoorKind(floor, findRoom(floor, '4-4'), 'down'), 'pacto')
    // Entre o chefe e o pacto vale a do pacto dos dois lados: dentro do pacto, a porta de volta é a do tubarão
    assert.equal(getDoorKind(floor, findRoom(floor, '4-5'), 'up'), 'pacto')
  })

  test('porta secreta: escondida, trincada e aberta pelas batidas', () => {
    const floor = makeFloor()
    const origin = findRoom(floor, '4-2')
    origin.cleared = true
    const secretState = () => getRoomDoors(floor, origin).find((door) => door.side === 'left')
    assert.deepEqual(secretState(), { side: 'left', kind: 'adega', targetId: '3-2', state: 'hidden' })
    for (const [hits, state] of [[1, 'cracked'], [2, 'cracked'], [3, 'open'], [5, 'open']]) {
      origin.hits = hits
      assert.equal(secretState().state, state, String(hits))
    }
    // A porta de volta, dentro da adega, é normal e temática
    const cellar = findRoom(floor, '3-2')
    cellar.cleared = true
    assert.deepEqual(getRoomDoors(floor, cellar), [{ side: 'right', kind: 'adega', targetId: '4-2', state: 'open' }])
  })

  test('a porta do chefe para o pacto só aparece com a sala limpa', () => {
    const floor = makeFloor()
    const boss = findRoom(floor, '4-4')
    assert.deepEqual(getRoomDoors(floor, boss).map((door) => door.side), ['up'])
    boss.cleared = true
    assert.deepEqual(getRoomDoors(floor, boss).map((door) => [door.side, door.kind, door.state]), [
      ['up', 'chefe', 'open'],
      ['down', 'pacto', 'open'],
    ])
  })
})

describe('portas trancadas com garfo', () => {
  // Inicial no meio, tesouro em cima, descanso à direita e loja à esquerda
  function lockedFloor(number) {
    return {
      number,
      startRoomId: '4-3',
      rooms: [
        room('4-3', 'inicial', { up: '4-2', right: '5-3', left: '3-3' }, { cleared: true }),
        room('4-2', 'tesouro', { down: '4-3' }, { cleared: true }),
        room('5-3', 'descanso', { left: '4-3' }, { cleared: true }),
        room('3-3', 'loja', { right: '4-3' }, { cleared: true }),
      ],
    }
  }
  const stateOf = (floor, id, side) => getRoomDoors(floor, findRoom(floor, id)).find((door) => door.side === side).state

  test('tesouro tranca do andar 2 em diante, descanso sempre, loja nunca', () => {
    const floor1 = lockedFloor(1)
    const floor2 = lockedFloor(2)
    assert.equal(needsFork(floor1, findRoom(floor1, '4-2')), false)
    assert.equal(needsFork(floor2, findRoom(floor2, '4-2')), true)
    assert.equal(needsFork(floor1, findRoom(floor1, '5-3')), true)
    assert.equal(needsFork(floor2, findRoom(floor2, '3-3')), false)
    assert.equal(needsFork(floor2, findRoom(floor2, '4-3')), false)
  })

  test('só a porta para a sala trancada fica "locked"; aberta com garfo, fica "open"', () => {
    const floor = lockedFloor(2)
    assert.deepEqual(['up', 'right', 'left'].map((side) => stateOf(floor, '4-3', side)), ['locked', 'locked', 'open'])
    findRoom(floor, '4-2').unlocked = true
    assert.equal(stateOf(floor, '4-3', 'up'), 'open')
    assert.equal(stateOf(floor, '4-3', 'right'), 'locked', 'abrir uma não abre a outra')
  })

  test('de dentro da sala trancada, a porta de volta fica aberta', () => {
    const floor = lockedFloor(2)
    assert.equal(stateOf(floor, '4-2', 'down'), 'open')
    assert.equal(stateOf(floor, '5-3', 'left'), 'open')
  })

  test('não dá para atravessar a porta trancada', () => {
    const doors = [{ side: 'up', state: 'locked' }]
    const edge = { x: 800, y: ROOM_PLAYER_BOUNDS.minY }
    assert.equal(getExitSide(edge, { x: 0, y: -1 }, doors), null)
    assert.equal(getExitSide(edge, { x: 0, y: -1 }, doors, 'locked'), 'up', 'mas dá para saber que ele está empurrando ela')
  })

  test('a porta que está abrindo vira "unlocking", com o tempo da animação', () => {
    const doors = [{ side: 'up', state: 'open' }, { side: 'left', state: 'open' }]
    assert.equal(applyUnlocking(doors, null), doors)
    assert.deepEqual(applyUnlocking(doors, { side: 'up', elapsedMs: 300 }), [
      { side: 'up', state: 'unlocking', unlockMs: 300 },
      { side: 'left', state: 'open' },
    ])
    assert.ok(FORK_UNLOCK_MS > FORK_KNOT_MS, 'o nó e depois as folhas abrindo')
  })

  test('o tempo do nó é o da folha do garfo na porta (os 8 quadros)', () => {
    const { durations } = CONSUMABLE_SPRITES.garfo.variants['porta-trancada'].animations['porta-trancada']
    assert.equal(durations.length, 8)
    assert.equal(durations.reduce((total, ms) => total + ms, 0), FORK_KNOT_MS)
  })
})
