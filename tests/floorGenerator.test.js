import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { OPPOSITE_SIDE, SIDE_VECTORS, SIDES } from '../src/utils/doors.js'
import {
  FLOOR_COLS,
  FLOOR_ROWS,
  FLOORS,
  generateFloor,
  getLinkedSides,
  LAST_FLOOR,
  PACT_ROOM_CHANCE,
  pickSpecialRooms,
  SPECIAL_ROOM_TYPES,
} from '../src/utils/floorGenerator.js'
import { createRandom, mixSeed } from '../src/utils/random.js'
import { findLayoutProblems, getLayout } from '../src/utils/roomLayout.js'

// Salas extras: ficam fora do mapa base do artigo
const EXTRA_TYPES = ['adega', 'pacto', 'god']

// 300 seeds x 5 andares, gerados uma vez só para todos os testes
const SEEDS = Array.from({ length: 300 }, (_, index) => mixSeed(2026, index))
const ALL_FLOORS = SEEDS.flatMap((seed) => FLOORS.map(({ number }) => generateFloor(seed, number)))

function getBaseRooms(floor) {
  return floor.rooms.filter((room) => !EXTRA_TYPES.includes(room.type))
}

// Ligações da sala (portas), contando a porta secreta da adega
function getLinks(room) {
  return getLinkedSides(room).map((side) => ({ side, id: room.neighbors[side] || room.secret.roomId }))
}

function findRoom(floor, id) {
  return floor.rooms.find((room) => room.id === id)
}

function countByType(floor, type) {
  return floor.rooms.filter((room) => room.type === type).length
}

// Rodar a mesma conferência em todos os andares e dizer qual falhou
function forEachFloor(check) {
  for (const floor of ALL_FLOORS) {
    try {
      check(floor)
    } catch (error) {
      error.message = `seed ${floor.seed}, andar ${floor.number}: ${error.message}`
      throw error
    }
  }
}

// Sala no formato do andar para montar plantas à mão
function room(col, row, type, neighbors = {}, distance = 1) {
  return { id: `${col}-${row}`, col, row, type, distance, neighbors: { up: null, right: null, down: null, left: null, ...neighbors } }
}

describe('generateFloor (seed)', () => {
  test('a mesma seed e o mesmo andar geram o mesmo andar', () => {
    assert.deepEqual(generateFloor(123, 3), generateFloor(123, 3))
  })

  test('os andares 1 a 5 da mesma seed são diferentes', () => {
    const floors = FLOORS.map(({ number }) => generateFloor(123, number))
    const maps = floors.map((floor) => JSON.stringify(floor.rooms))
    assert.equal(new Set(maps).size, LAST_FLOOR)
    assert.deepEqual(floors.map((floor) => floor.name), ['CANTINA', 'CUCINA', 'PIAZZA', 'PASTIFICIO', 'PORTO'])
  })

  test('o andar passa por JSON.stringify sem perder nada', () => {
    const floor = generateFloor(987654321, 2)
    assert.deepEqual(JSON.parse(JSON.stringify(floor)), floor)
  })

  test('andar fora de 1 a 5 dá erro', () => {
    assert.throws(() => generateFloor(1, 6), /Andar inválido/)
  })
})

describe('generateFloor (mapa) em 300 seeds x 5 andares', () => {
  test('o total de salas do mapa base fica na faixa do andar e entre 9 e 13', () => {
    forEachFloor((floor) => {
      const { minRooms, maxRooms } = FLOORS[floor.number - 1]
      const total = getBaseRooms(floor).length
      assert.ok(total >= minRooms && total <= maxRooms, `total ${total}`)
      assert.ok(total >= 9 && total <= 13, `total ${total}`)
    })
  })

  test('as salas ficam na grade 9 x 8, com ids únicos no formato coluna-linha', () => {
    forEachFloor((floor) => {
      for (const item of floor.rooms) {
        assert.ok(item.col >= 0 && item.col < FLOOR_COLS && item.row >= 0 && item.row < FLOOR_ROWS, item.id)
        assert.equal(item.id, `${item.col}-${item.row}`)
      }
      assert.equal(new Set(floor.rooms.map((item) => item.id)).size, floor.rooms.length)
    })
  })

  test('as ligações valem nos dois sentidos e só entre casas vizinhas da grade', () => {
    forEachFloor((floor) => {
      for (const item of floor.rooms) {
        for (const { side, id } of getLinks(item)) {
          const target = findRoom(floor, id)
          assert.ok(target, `${item.id} liga a ${id}, que não existe`)
          assert.equal(target.col, item.col + SIDE_VECTORS[side].x)
          assert.equal(target.row, item.row + SIDE_VECTORS[side].y)
          const back = getLinks(target).find((link) => link.side === OPPOSITE_SIDE[side])
          assert.equal(back && back.id, item.id, `${id} não liga de volta a ${item.id}`)
        }
      }
    })
  })

  test('sem laços e com todas as salas alcançáveis da inicial; distance = passos até a inicial', () => {
    forEachFloor((floor) => {
      const links = floor.rooms.reduce((sum, item) => sum + getLinks(item).length, 0) / 2
      assert.equal(links, floor.rooms.length - 1)

      const steps = new Map([[floor.startRoomId, 0]])
      const queue = [findRoom(floor, floor.startRoomId)]
      while (queue.length > 0) {
        const current = queue.shift()
        for (const { id } of getLinks(current)) {
          if (steps.has(id)) continue
          steps.set(id, steps.get(current.id) + 1)
          queue.push(findRoom(floor, id))
        }
      }
      assert.equal(steps.size, floor.rooms.length)
      for (const item of floor.rooms) assert.equal(item.distance, steps.get(item.id), item.id)
    })
  })

  test('o mapa base é uma árvore pelo critério do artigo: casas vizinhas ocupadas estão sempre ligadas', () => {
    forEachFloor((floor) => {
      const base = getBaseRooms(floor)
      for (const item of base) {
        for (const side of SIDES) {
          const id = `${item.col + SIDE_VECTORS[side].x}-${item.row + SIDE_VECTORS[side].y}`
          if (base.some((other) => other.id === id)) assert.equal(item.neighbors[side], id, `${item.id} encosta em ${id} sem porta`)
        }
      }
    })
  })

  test('a sala inicial fica em (4,3) e nenhuma especial ocupa essa casa', () => {
    forEachFloor((floor) => {
      assert.equal(floor.startRoomId, '4-3')
      assert.equal(findRoom(floor, '4-3').type, 'inicial')
      assert.equal(countByType(floor, 'inicial'), 1)
    })
  })
})

describe('generateFloor (salas especiais) em 300 seeds x 5 andares', () => {
  test('exatamente 1 chefe, 1 tesouro e 1 loja', () => {
    forEachFloor((floor) => {
      for (const type of ['chefe', 'tesouro', 'loja']) assert.equal(countByType(floor, type), 1, type)
    })
  })

  test('o chefe é o beco mais distante (o primeiro criado no empate) e nunca fica colado na inicial', () => {
    forEachFloor((floor) => {
      const base = getBaseRooms(floor)
      const baseLinks = (item) => getLinks(item).filter(({ id }) => base.some((other) => other.id === id)).length
      const deadEnds = base.filter((item) => item.type !== 'inicial' && baseLinks(item) === 1)
      const farthest = Math.max(...deadEnds.map((item) => item.distance))
      const boss = deadEnds.find((item) => item.distance === farthest)
      assert.equal(boss.type, 'chefe')
      assert.ok(boss.distance >= 2)
    })
  })

  test('cada especial tem uma porta só (o chefe ganha a do pacto ou do God)', () => {
    forEachFloor((floor) => {
      for (const item of floor.rooms.filter((other) => SPECIAL_ROOM_TYPES.includes(other.type))) {
        // A porta do chefe para o pacto/God é extra: não conta aqui
        const links = getLinks(item).filter(({ id }) => item.type !== 'chefe' || !['pacto', 'god'].includes(findRoom(floor, id).type))
        assert.equal(links.length, 1, item.id)
      }
    })
  })

  test('palco só do andar 2 em diante', () => {
    forEachFloor((floor) => {
      if (floor.number === 1) assert.equal(countByType(floor, 'palco'), 0)
      assert.ok(countByType(floor, 'palco') <= 1)
    })
  })

  test('adega em todos os andares menos o 5º, uma por andar, escondida atrás de uma sala comum', () => {
    let far = 0
    let total = 0
    forEachFloor((floor) => {
      const cellars = floor.rooms.filter((item) => item.type === 'adega')
      const origins = floor.rooms.filter((item) => item.secret)
      assert.equal(origins.length, cellars.length)
      assert.equal(cellars.length, floor.number < 5 ? 1 : 0, `seed ${floor.seed}, andar ${floor.number}`)
      if (cellars.length === 0) return

      const [cellar] = cellars
      const [origin] = origins
      assert.equal(origin.type, 'comum')
      assert.ok(origin.distance >= 1)
      total++
      if (origin.distance >= 3) far++
      assert.equal(origin.secret.roomId, cellar.id)
      assert.equal(origin.neighbors[origin.secret.side], null)
      assert.deepEqual(getLinks(cellar), [{ side: OPPOSITE_SIDE[origin.secret.side], id: origin.id }])
    })
    // a origem prefere ficar a 3 ou mais passos do início; mais perto só quando não há outra
    assert.ok(far / total > 0.5, `só ${far} de ${total} adegas ficam longe do início`)
  })

  test('pacto ou God só nos andares 2 a 4 (nunca no 1º), ligado só à sala do chefe', () => {
    forEachFloor((floor) => {
      const pacts = floor.rooms.filter((item) => ['pacto', 'god'].includes(item.type))
      assert.ok(pacts.length <= 1)
      if (pacts.length === 0) return

      assert.ok(floor.number >= 2 && floor.number <= 4, `andar ${floor.number}`)
      const links = getLinks(pacts[0])
      assert.equal(links.length, 1)
      assert.equal(findRoom(floor, links[0].id).type, 'chefe')
      // Como no Isaac, ela nunca fica embaixo do chefe: a porta nunca é a de cima (a estátua e a poça ficam no alto)
      assert.ok(!pacts[0].neighbors.up, `${pacts[0].type} com porta em cima no andar ${floor.number}`)
    })
  })

  test('adega e pacto/God só encostam (na grade) na sala a que estão ligados', () => {
    forEachFloor((floor) => {
      for (const extra of floor.rooms.filter((item) => EXTRA_TYPES.includes(item.type))) {
        const touching = SIDES.map((side) => `${extra.col + SIDE_VECTORS[side].x}-${extra.row + SIDE_VECTORS[side].y}`)
          .filter((id) => findRoom(floor, id))
        assert.deepEqual(touching, getLinks(extra).map(({ id }) => id), extra.id)
      }
    })
  })

  test('o layout de cada sala existe, é do tipo dela e serve para as portas dela', () => {
    forEachFloor((floor) => {
      for (const item of floor.rooms) {
        const layout = getLayout(item.layoutId)
        assert.ok(layout, `${item.id}: layout ${item.layoutId} não existe`)
        assert.equal(layout.type, item.type)
        assert.deepEqual(findLayoutProblems(item.layoutId, getLinkedSides(item)), [])
      }
    })
  })

  test('frequências: pacto/God, fliperama e descanso aparecem em proporções razoáveis', () => {
    const floors2to4 = ALL_FLOORS.filter((floor) => floor.number >= 2 && floor.number <= 4)
    const pactRate = floors2to4.filter((floor) => countByType(floor, 'pacto') + countByType(floor, 'god') > 0).length / floors2to4.length

    // 3 em 4 de chance (PACT_ROOM_CHANCE), menos o quinto dos andares em que o chefe não tem casa livre: cerca de 60%
    assert.ok(pactRate >= 0.5 && pactRate <= 0.7, `pacto/God em ${pactRate}`)
    for (const type of ['pacto', 'god', 'fliperama', 'descanso', 'palco']) {
      assert.ok(ALL_FLOORS.some((floor) => countByType(floor, type) > 0), `${type} nunca aparece`)
    }
  })
})

describe('regeneração', () => {
  test('pickSpecialRooms recusa uma planta com menos de 3 becos', () => {
    // Uma linha: (4,1) - (4,2) - inicial (4,3) - (4,4). Becos: só (4,1) e (4,4).
    const rooms = [
      room(4, 3, 'inicial', { up: '4-2', down: '4-4' }, 0),
      room(4, 2, 'comum', { up: '4-1', down: '4-3' }, 1),
      room(4, 1, 'comum', { down: '4-2' }, 2),
      room(4, 4, 'comum', { up: '4-3' }, 1),
    ]
    assert.equal(pickSpecialRooms(rooms, 1, createRandom(1)), null)
    assert.ok(rooms.every((item) => ['inicial', 'comum'].includes(item.type)))
  })

  test('pickSpecialRooms recusa uma planta em que o chefe ficaria colado na inicial', () => {
    // Uma cruz: 4 becos, todos a 1 passo do início
    const rooms = [
      room(4, 3, 'inicial', { up: '4-2', right: '5-3', down: '4-4', left: '3-3' }, 0),
      room(4, 2, 'comum', { down: '4-3' }),
      room(5, 3, 'comum', { left: '4-3' }),
      room(4, 4, 'comum', { up: '4-3' }),
      room(3, 3, 'comum', { right: '4-3' }),
    ]
    assert.equal(pickSpecialRooms(rooms, 1, createRandom(1)), null)
  })

  test('alguma seed precisa de mais de uma tentativa e o andar sai válido', () => {
    const retried = ALL_FLOORS.find((floor) => floor.attempts > 1)
    assert.ok(retried, 'nenhum andar precisou de outra tentativa')
    assert.equal(countByType(retried, 'chefe'), 1)
    assert.deepEqual(generateFloor(retried.seed, retried.number), retried)
  })
})

describe('chance da sala do Pacto/God (3 em 4)', () => {
  // Fotografia da versão com 1 chance em 2, quando a chance subiu: de cada andar, o tipo da sala do Pacto/God e as outras
  // salas (sem o chefe, que pode mudar de layout para abrir a porta nova) com tipo e layout. Seeds 12345 e 3.
  const BEFORE = {
    3: {
      1: { branch: null, rooms: '4-3:inicial:inicial|4-2:comum:comum-02|3-3:comum:comum-09|4-1:comum:comum-10|5-2:comum:comum-06|3-4:loja:loja|2-3:comum:comum-10|6-2:tesouro:tesouro-03|2-2:adega:adega' },
      2: { branch: 'god', rooms: '4-3:inicial:inicial|5-3:comum:comum-09|4-4:palco:palco|6-3:comum:comum-08|7-3:loja:loja|6-4:comum:comum-08|6-5:comum:comum-01|7-5:comum:comum-06|5-5:comum:comum-02|5-6:tesouro:tesouro-05|7-6:adega:adega' },
      3: { branch: null, rooms: '4-3:inicial:inicial|5-3:comum:comum-03|3-3:comum:comum-10|5-2:comum:comum-10|6-3:comum:comum-05|3-4:tesouro:tesouro-05|2-3:comum:comum-07|5-1:comum:comum-04|7-3:palco:palco|1-3:loja:loja|4-1:adega:adega' },
      4: { branch: 'god', rooms: '4-3:inicial:inicial|4-2:comum:comum-09|3-3:comum:comum-07|4-1:comum:comum-01|5-2:comum:comum-01|3-4:tesouro:tesouro-05|4-0:palco:palco|3-1:comum:comum-10|6-2:loja:loja|2-3:adega:adega' },
      5: { branch: null, rooms: '4-3:inicial:inicial|4-2:palco:palco|5-3:comum:comum-09|5-4:comum:comum-03|6-4:comum:comum-10|7-4:comum:comum-03|7-3:comum:comum-06|7-5:comum:comum-10|7-2:comum:comum-09|8-3:comum:comum-03|8-5:tesouro:tesouro-05|7-6:loja:loja' },
    },
    12345: {
      1: { branch: null, rooms: '4-3:inicial:inicial|4-2:comum:comum-07|4-4:comum:comum-05|4-1:comum:comum-05|5-4:comum:comum-09|5-1:comum:comum-02|3-1:loja:loja|6-4:tesouro:tesouro-05|5-5:comum:comum-01|6-1:adega:adega' },
      2: { branch: 'god', rooms: '4-3:inicial:inicial|4-2:comum:comum-03|5-3:loja:loja|4-4:comum:comum-04|3-2:comum:comum-08|3-4:palco:palco|2-2:comum:comum-09|2-3:tesouro:tesouro-02|1-2:adega:adega' },
      3: { branch: null, rooms: '4-3:inicial:inicial|5-3:comum:comum-03|5-2:comum:comum-03|6-3:palco:palco|5-4:comum:comum-10|5-1:comum:comum-08|5-5:comum:comum-06|6-1:comum:comum-03|4-5:comum:comum-04|7-1:tesouro:tesouro-03|4-6:loja:loja|4-1:adega:adega' },
      4: { branch: null, rooms: '4-3:inicial:inicial|4-4:comum:comum-02|5-4:tesouro:tesouro-01|4-2:comum:comum-01|4-5:comum:comum-06|3-2:comum:comum-03|4-6:comum:comum-03|3-5:palco:palco|2-2:comum:comum-02|5-6:comum:comum-05|1-2:loja:loja|6-6:adega:adega' },
      5: { branch: null, rooms: '4-3:inicial:inicial|5-3:palco:palco|4-4:comum:comum-08|3-3:comum:comum-09|4-5:comum:comum-06|3-2:comum:comum-10|3-5:comum:comum-10|2-5:comum:comum-09|3-1:tesouro:tesouro-04|3-6:loja:loja' },
    },
  }
  const isBranch = (room) => room.type === 'pacto' || room.type === 'god'
  const signature = (floor) => floor.rooms.filter((room) => !isBranch(room) && room.type !== 'chefe').map((room) => `${room.id}:${room.type}:${room.layoutId}`).join('|')

  test('a chance é de 3 em 4 e os andares 1 e 5 continuam sem a sala', () => {
    assert.equal(PACT_ROOM_CHANCE, 0.75)
    for (const floor of ALL_FLOORS) {
      if (floor.number === 1 || floor.number === LAST_FLOOR) assert.equal(floor.rooms.filter(isBranch).length, 0, `andar ${floor.number}`)
    }
  })

  test('os andares que já existiam não mudam: quem tinha a sala fica com ela (mesmo tipo) e as outras salas ficam iguais', () => {
    for (const [seed, floors] of Object.entries(BEFORE)) {
      for (const [number, before] of Object.entries(floors)) {
        const floor = generateFloor(Number(seed), Number(number))
        const branch = floor.rooms.find(isBranch)
        if (before.branch) assert.equal(branch?.type, before.branch, `seed ${seed} andar ${number}: a sala do ${before.branch} sumiu ou mudou`)
        assert.equal(signature(floor), before.rooms, `seed ${seed} andar ${number}: as outras salas mudaram`)
      }
    }
  })

  test('é decidido pela seed: o mesmo andar sai sempre igual', () => {
    for (const seed of [3, 12345, 2026]) {
      for (let number = 1; number <= LAST_FLOOR; number++) {
        assert.deepEqual(generateFloor(seed, number), generateFloor(seed, number), `seed ${seed} andar ${number}`)
      }
    }
  })
})
