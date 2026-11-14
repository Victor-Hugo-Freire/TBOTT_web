import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { overlaps } from '../src/utils/collision.js'
import { DOOR_CELLS, getEntryPosition, SIDES } from '../src/utils/doors.js'
import { createRandom } from '../src/utils/random.js'
import {
  buildRoomObstacles,
  CELL_HEIGHT,
  CELL_WIDTH,
  findLayoutProblems,
  getCellRect,
  getLayout,
  getLayoutPoints,
  GRID_COLS,
  GRID_ROWS,
  OBSTACLE_MECHANICS,
  pickLayout,
  ROOM_LAYOUTS,
  THEME_OBSTACLES,
} from '../src/utils/roomLayout.js'
import { PLAYER_FEET_BOX, ROOM_FLOOR, ROOM_PLAYER_START } from '../src/utils/roomMovement.js'

const THEMES = ['cantina', 'cucina', 'piazza', 'pastificio', 'porto']
const ROOM_TYPES = ['inicial', 'comum', 'chefe', 'tesouro', 'loja', 'pacto', 'mamae', 'fliperama', 'palco', 'adega', 'descanso']
const OBSTACLE_LETTERS = ['#', 'o', '~', '*']

const countObstacles = (layout) => layout.tiles.join('').split('').filter((letter) => OBSTACLE_LETTERS.includes(letter)).length
const countLetter = (layout, letter) => layout.tiles.join('').split(letter).length - 1

// As 15 combinações não vazias dos 4 lados
const ALL_SIDE_SETS = Array.from({ length: 15 }, (_, index) => SIDES.filter((_, bit) => (index + 1) & (1 << bit)))

// Lados que cada tipo de sala pode ter: comum e inicial, qualquer combinação (a porta secreta é um lado a mais);
// especiais são becos (1 lado); o chefe pode ganhar a porta do pacto ou da mamãe (2 lados).
function getPossibleSideSets(type) {
  if (type === 'comum' || type === 'inicial') return ALL_SIDE_SETS
  const single = SIDES.map((side) => [side])
  if (type !== 'chefe') return single
  return [...single, ...ALL_SIDE_SETS.filter((sides) => sides.length === 2)]
}

describe('grade da sala', () => {
  test('13 x 7 casas cobrem o piso inteiro', () => {
    assert.equal(GRID_COLS * CELL_WIDTH, ROOM_FLOOR.right - ROOM_FLOOR.left)
    assert.ok(Math.abs(GRID_ROWS * CELL_HEIGHT - (ROOM_FLOOR.bottom - ROOM_FLOOR.top)) < 1e-9)
    assert.deepEqual(getCellRect(0, 0), { x: 118, y: 265, width: CELL_WIDTH, height: CELL_HEIGHT })
  })
})

describe('roomLayouts.json (formato)', () => {
  test('cada layout tem 7 linhas de 13 letras válidas', () => {
    for (const layout of ROOM_LAYOUTS) {
      assert.equal(layout.tiles.length, GRID_ROWS, layout.id)
      for (const line of layout.tiles) assert.match(line, /^[.#o~*XDit]{13}$/, layout.id)
    }
  })

  test('os ids são únicos e todo tipo de sala tem pelo menos 1 layout', () => {
    const ids = ROOM_LAYOUTS.map((layout) => layout.id)
    assert.equal(new Set(ids).size, ids.length)
    assert.equal(ids.length, 21)
    for (const type of ROOM_TYPES) assert.ok(ROOM_LAYOUTS.some((layout) => layout.type === type), type)
    assert.deepEqual([...new Set(ROOM_LAYOUTS.map((layout) => layout.type))].sort(), [...ROOM_TYPES].sort())
  })

  test('as casas de porta estão vazias em todo layout', () => {
    for (const layout of ROOM_LAYOUTS) {
      for (const { col, row } of Object.values(DOOR_CELLS)) assert.equal(layout.tiles[row][col], '.', layout.id)
    }
  })

  test('no máximo 12 obstáculos; X só nas especiais; D só no chefe', () => {
    for (const layout of ROOM_LAYOUTS) {
      assert.ok(countObstacles(layout) <= 12, layout.id)
      if (['inicial', 'comum', 'tesouro'].includes(layout.type)) assert.equal(countLetter(layout, 'X'), 0, layout.id)
      if (layout.type !== 'chefe') assert.equal(countLetter(layout, 'D'), 0, layout.id)
    }
  })

  test('comuns: 2 vazias, 3 leves (2 a 4), 3 médias (5 a 8) e 2 cheias (9 a 12)', () => {
    const counts = ROOM_LAYOUTS.filter((layout) => layout.type === 'comum').map(countObstacles)
    assert.equal(counts.length, 10)
    assert.equal(counts.filter((count) => count === 0).length, 2)
    assert.equal(counts.filter((count) => count >= 2 && count <= 4).length, 3)
    assert.equal(counts.filter((count) => count >= 5 && count <= 8).length, 3)
    assert.equal(counts.filter((count) => count >= 9 && count <= 12).length, 2)
  })

  test('tesouro: até 6 obstáculos e item no centro (6,2)', () => {
    const treasures = ROOM_LAYOUTS.filter((layout) => layout.type === 'tesouro')
    assert.equal(treasures.length, 2)
    for (const layout of treasures) {
      assert.ok(countObstacles(layout) <= 6, layout.id)
      assert.deepEqual(getLayoutPoints(layout.id).items, [{ col: 6, row: 2 }])
    }
  })

  test('chefe: tambor em (6,3), inimigo em (6,2), item em (4,3) e nenhum obstáculo', () => {
    const boss = getLayout('chefe')
    assert.equal(boss.tiles[3][6], 'D')
    assert.equal(countObstacles(boss), 0)
    assert.deepEqual(getLayoutPoints('chefe'), { enemies: [{ col: 6, row: 2 }], items: [{ col: 4, row: 3 }] })
  })

  test('salas especiais: pontos de item nas posições do spawn.md e cenário X', () => {
    const expected = {
      loja: [{ col: 4, row: 2 }, { col: 6, row: 2 }, { col: 8, row: 2 }],
      pacto: [{ col: 6, row: 2 }],
      mamae: [{ col: 10, row: 2 }],
      fliperama: [{ col: 6, row: 3 }],
      palco: [{ col: 6, row: 2 }],
      adega: [{ col: 6, row: 2 }],
      descanso: [],
    }
    for (const [id, items] of Object.entries(expected)) {
      assert.deepEqual(getLayoutPoints(id).items, items, id)
      assert.ok(countLetter(getLayout(id), 'X') > 0, id)
    }
    // Só a adega tem obstáculos (barris, garrafão e vinho da cantina)
    for (const id of ['loja', 'pacto', 'mamae', 'fliperama', 'palco', 'descanso']) assert.equal(countObstacles(getLayout(id)), 0, id)
  })
})

describe('buildRoomObstacles (obstáculos no tema do andar)', () => {
  test('cada tema tem as 4 letras e todo obstáculo tem mecânica', () => {
    for (const theme of THEMES) {
      assert.deepEqual(Object.keys(THEME_OBSTACLES[theme]).sort(), ['#', '*', 'o', '~'].sort())
      for (const kind of Object.values(THEME_OBSTACLES[theme])) assert.ok(OBSTACLE_MECHANICS[kind], kind)
    }
  })

  test('a letra vira o obstáculo do andar, com a caixa certa', () => {
    const cantina = buildRoomObstacles('comum-01', 'cantina')
    const barrel = cantina.find((item) => item.id === '1-1')
    assert.equal(barrel.kind, 'barril')
    assert.equal(barrel.mechanic, 'solido')
    assert.equal(barrel.blocking, true)
    assert.deepEqual([barrel.box.width, barrel.box.height], [84, 60])

    const wine = cantina.find((item) => item.id === '9-2')
    assert.equal(wine.blocking, false)
    assert.deepEqual(wine.box, getCellRect(9, 2))

    const porto = buildRoomObstacles('comum-01', 'porto')
    assert.equal(porto.find((item) => item.id === '5-1').kind, 'rede')
    assert.equal(porto.find((item) => item.id === '5-1').blocking, false)
  })

  test('cenário X bloqueia com a casa inteira e o tambor é sólido', () => {
    const shop = buildRoomObstacles('loja', 'piazza')
    const counter = shop.find((item) => item.id === '3-0')
    assert.equal(counter.mechanic, 'cenario')
    assert.equal(counter.blocking, true)
    assert.deepEqual(counter.box, getCellRect(3, 0))

    const drum = buildRoomObstacles('chefe', 'porto').find((item) => item.kind === 'tambor')
    assert.equal(drum.id, '6-3')
    assert.equal(drum.blocking, true)
  })

  test('a adega usa sempre os obstáculos da cantina', () => {
    const kinds = buildRoomObstacles('adega', 'porto').map((item) => item.kind)
    assert.ok(kinds.includes('barril'))
    assert.ok(kinds.includes('garrafao'))
    assert.ok(kinds.includes('vinho'))
    assert.ok(!kinds.includes('caixote-peixe'))
  })

  test('o centro da sala inicial é livre', () => {
    const { x, y } = ROOM_PLAYER_START
    assert.deepEqual({ x, y }, { x: 800, y: 560 })
    const feet = { x: x - PLAYER_FEET_BOX.width / 2, y: y - PLAYER_FEET_BOX.height, ...PLAYER_FEET_BOX }
    for (const theme of THEMES) {
      for (const obstacle of buildRoomObstacles('inicial', theme)) assert.ok(!overlaps(feet, obstacle.box))
    }
  })
})

describe('findLayoutProblems (nenhuma sala prende o jogador)', () => {
  test('todo layout x tema x combinação de portas possível tem caminho', () => {
    for (const layout of ROOM_LAYOUTS) {
      // A validação usa o pior caso (o * sempre bloqueia). Em cada tema, o que bloqueia de verdade
      // tem que estar dentro do que foi validado, então o caminho vale nos 5 andares.
      const validated = buildRoomObstacles(layout.id, 'cantina').map((item) => item.id)
      for (const theme of THEMES) {
        for (const obstacle of buildRoomObstacles(layout.id, theme).filter((item) => item.blocking)) {
          assert.ok(validated.includes(obstacle.id), `${layout.id} ${theme} ${obstacle.id}`)
        }
        for (const sides of getPossibleSideSets(layout.type)) {
          assert.deepEqual(findLayoutProblems(layout.id, sides), [], `${layout.id} ${theme} ${sides.join(',')}`)
        }
      }
    }
  })

  test('entrada com 16 u de folga em todo layout', () => {
    for (const layout of ROOM_LAYOUTS) {
      for (const side of SIDES) {
        const { x, y } = getEntryPosition(side)
        const box = { x: x - 22 - 16, y: y - 18 - 16, width: 44 + 32, height: 18 + 32 }
        for (const theme of THEMES) {
          for (const obstacle of buildRoomObstacles(layout.id, theme).filter((item) => item.blocking)) {
            assert.ok(!overlaps(box, obstacle.box), `${layout.id} ${side} ${obstacle.id}`)
          }
        }
      }
    }
  })

  test('recusa um layout que ocupa a casa de uma porta', () => {
    const fake = { id: 'falso-porta', type: 'comum', tiles: ['......#......', ...getLayout('comum-09').tiles.slice(1)] }
    assert.ok(findLayoutProblems(fake, ['down']).length > 0)
  })

  test('recusa um layout com a porta fechada por uma parede de obstáculos', () => {
    // Fila de cenário na linha 1: a porta de cima fica isolada das outras
    const fake = { id: 'falso-parede', type: 'comum', tiles: ['.............', 'XXXXXXXXXXXXX', ...getLayout('comum-09').tiles.slice(2)] }
    assert.deepEqual(findLayoutProblems(fake, ['down', 'left']), [])
    const problems = findLayoutProblems(fake, ['up', 'down'])
    assert.ok(problems.some((text) => text.includes('não se liga')), problems.join('; '))
  })

  test('recusa um layout com ponto de item cercado', () => {
    const fake = {
      id: 'falso-item',
      type: 'tesouro',
      tiles: ['.............', '.....###.....', '.....#t#.....', '.....###.....', '.............', '.............', '.............'],
    }
    const problems = findLayoutProblems(fake, ['left'])
    assert.ok(problems.some((text) => text.includes('(6,2)')), problems.join('; '))
  })

  test('recusa um layout sem folga na entrada', () => {
    const fake = { id: 'falso-folga', type: 'comum', tiles: [...getLayout('comum-09').tiles] }
    // Com as casas de porta vazias a folga sempre sobra; só um bloco na casa da porta a tira
    fake.tiles[0] = '......#......'
    const problems = findLayoutProblems(fake, ['up'])
    assert.ok(problems.some((text) => text.includes('folga')), problems.join('; '))
  })
})

describe('pickLayout (sorteio do layout)', () => {
  test('é determinístico com a mesma seed', () => {
    const first = Array.from({ length: 20 }, (_, index) => pickLayout('comum', ['up', 'left'], createRandom(index)))
    const again = Array.from({ length: 20 }, (_, index) => pickLayout('comum', ['up', 'left'], createRandom(index)))
    assert.deepEqual(first, again)
    assert.ok(new Set(first).size > 1)
  })

  test('devolve só layouts do tipo pedido', () => {
    const random = createRandom(77)
    for (const type of ROOM_TYPES) {
      for (let i = 0; i < 10; i++) assert.equal(getLayout(pickLayout(type, ['down'], random)).type, type)
    }
  })

  test('lança erro quando nenhum layout serve', () => {
    assert.throws(() => pickLayout('inexistente', ['up'], createRandom(1)), /Nenhum layout/)
  })
})
