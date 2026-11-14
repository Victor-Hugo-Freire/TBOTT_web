import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import {
  CONVEYOR_SPEED,
  getFloorEffect,
  getRoomSolids,
  getSlipMovement,
  hitObstacles,
  pushPlayer,
  ROLL_SPEED,
  SLIP_ACCELERATION,
  SLIP_EXIT_DECAY,
  SLIP_SPEED,
  STICKY_SPEED,
  stopBlockedAxes,
  touchesHot,
  updateRollingObstacles,
} from '../src/utils/roomObstacles.js'
import { overlaps } from '../src/utils/collision.js'
import { createRandom, pick } from '../src/utils/random.js'
import { buildRoomObstacles, getConveyorDirection, ROOM_LAYOUTS } from '../src/utils/roomLayout.js'
import { getFeetBox, moveRoomPlayer, PLAYER_FEET_BOX, ROOM_FLOOR, ROOM_PLAYER_BOUNDS, ROOM_WALLS } from '../src/utils/roomMovement.js'

// Obstáculos montados à mão, no formato de roomLayout.js (a caixa é o que importa aqui)
const BLOCKING = ['solido', 'quebravel', 'rolante', 'quente', 'cenario', 'tambor']
function obstacle(mechanic, x, y, width = 84, height = 60) {
  return { id: `${x}-${y}`, col: 0, row: 0, kind: mechanic, mechanic, blocking: BLOCKING.includes(mechanic), box: { x, y, width, height } }
}

// Caixa do golpe que cobre um ponto (o tamanho não importa, só se toca ou não)
const hitboxAt = (x, y) => ({ x: x - 5, y: y - 5, width: 10, height: 10 })
const FEET = PLAYER_FEET_BOX

describe('sólido', () => {
  test('bloqueia: o jogador para encostado na caixa', () => {
    const block = obstacle('solido', 600, 400)
    const solids = getRoomSolids([block])
    assert.deepEqual(solids, [...ROOM_WALLS, block.box])
    let position = { x: 500, y: 440 }
    for (let frame = 0; frame < 60; frame++) position = moveRoomPlayer(position, { x: 1, y: 0 }, 1 / 60, 1, solids)
    assert.equal(position.x, 600 - FEET.width / 2)
  })

  test('o golpe não muda o sólido', () => {
    const obstacles = [obstacle('solido', 600, 400)]
    assert.deepEqual(hitObstacles(obstacles, hitboxAt(620, 420), 'right'), obstacles)
  })

  test('caixas extras (ex.: o tambor) entram nos sólidos', () => {
    const drum = { x: 10, y: 10, width: 5, height: 5 }
    assert.deepEqual(getRoomSolids([], [drum]), [...ROOM_WALLS, drum])
  })
})

describe('quebrável', () => {
  test('bloqueia e some com um golpe que toca a caixa', () => {
    const jar = obstacle('quebravel', 600, 400)
    assert.ok(getRoomSolids([jar]).includes(jar.box))
    const [hit] = hitObstacles([jar], hitboxAt(605, 405), 'up')
    assert.equal(hit.removed, true)
    assert.equal(jar.removed, undefined, 'não muda a lista recebida')
  })

  test('golpe que não toca não quebra', () => {
    const jar = obstacle('quebravel', 600, 400)
    // a caixa do golpe encosta na borda sem invadir: não conta (mesma regra de overlaps)
    const touching = { x: 600 + 84, y: 400, width: 10, height: 10 }
    assert.equal(hitObstacles([jar], touching, 'left')[0].removed, undefined)
    assert.equal(hitObstacles([jar], null, 'left')[0].removed, undefined)
  })

  test('obstáculo removido não bloqueia nem tem efeito', () => {
    const jar = { ...obstacle('quebravel', 600, 400), removed: true }
    assert.deepEqual(getRoomSolids([jar]), ROOM_WALLS)
    const position = moveRoomPlayer({ x: 570, y: 440 }, { x: 1, y: 0 }, 0.05, 1, getRoomSolids([jar]))
    assert.equal(position.x, 570 + 13)
    const ice = { ...obstacle('escorregadio', 600, 400), removed: true }
    assert.equal(getFloorEffect([ice], { x: 620, y: 420 }).slippery, false)
  })
})

describe('rolante', () => {
  test('parado bloqueia; com um golpe rola na direção do golpe e deixa de bloquear', () => {
    const barrel = obstacle('rolante', 600, 400)
    assert.ok(getRoomSolids([barrel]).includes(barrel.box))
    const [hit] = hitObstacles([barrel], hitboxAt(605, 420), 'right')
    assert.deepEqual(hit.rolling, { x: 1, y: 0 })
    assert.deepEqual(getRoomSolids([hit]), ROOM_WALLS)
  })

  test('cada direção do golpe vira o vetor certo', () => {
    const expected = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } }
    for (const [direction, vector] of Object.entries(expected)) {
      const [hit] = hitObstacles([obstacle('rolante', 600, 400)], hitboxAt(620, 420), direction)
      assert.deepEqual(hit.rolling, vector, direction)
    }
  })

  test('rolando, outro golpe não muda a direção', () => {
    const rolling = { ...obstacle('rolante', 600, 400), rolling: { x: 1, y: 0 } }
    assert.deepEqual(hitObstacles([rolling], hitboxAt(620, 420), 'left')[0].rolling, { x: 1, y: 0 })
  })

  test('rola a 520 u/s', () => {
    const rolling = { ...obstacle('rolante', 600, 400), rolling: { x: 0, y: 1 } }
    const [moved] = updateRollingObstacles([rolling], 0.02)
    assert.equal(ROLL_SPEED, 520)
    assert.equal(moved.box.y, 400 + 520 * 0.02)
    assert.equal(moved.box.x, 600)
    assert.equal(moved.removed, undefined)
  })

  test('quebra ao bater na borda do piso', () => {
    let obstacles = [{ ...obstacle('rolante', 600, 400), rolling: { x: -1, y: 0 } }]
    for (let frame = 0; frame < 120 && !obstacles[0].removed; frame++) {
      obstacles = updateRollingObstacles(obstacles, 1 / 60)
      if (!obstacles[0].removed) assert.ok(obstacles[0].box.x >= ROOM_FLOOR.left)
    }
    assert.equal(obstacles[0].removed, true)
  })

  test('quebra ao bater em outro obstáculo que bloqueia, e o outro fica', () => {
    const block = obstacle('solido', 900, 400)
    let obstacles = [{ ...obstacle('rolante', 600, 400), rolling: { x: 1, y: 0 } }, block]
    for (let frame = 0; frame < 120 && !obstacles[0].removed; frame++) obstacles = updateRollingObstacles(obstacles, 1 / 60)
    assert.equal(obstacles[0].removed, true)
    assert.ok(obstacles[0].box.x + 84 > 900 && obstacles[0].box.x < 900, 'quebrou encostando no bloco')
    assert.equal(obstacles[1], block)
  })

  test('passa por cima de obstáculo quebrado e de piso que não bloqueia', () => {
    const broken = { ...obstacle('quebravel', 700, 400), removed: true }
    const floor = obstacle('escorregadio', 800, 400)
    let obstacles = [{ ...obstacle('rolante', 600, 400), rolling: { x: 1, y: 0 } }, broken, floor]
    for (let frame = 0; frame < 30; frame++) obstacles = updateRollingObstacles(obstacles, 1 / 60)
    assert.equal(obstacles[0].removed, undefined)
    assert.ok(obstacles[0].box.x > 800)
  })
})

describe('escorregadio', () => {
  const ice = obstacle('escorregadio', 400, 400, 300, 200)

  test('não bloqueia e marca os pés em cima como escorregando', () => {
    assert.deepEqual(getRoomSolids([ice]), ROOM_WALLS)
    assert.equal(getFloorEffect([ice], { x: 500, y: 500 }).slippery, true)
    assert.equal(getFloorEffect([ice], { x: 399, y: 500 }).slippery, false)
  })

  const SLIPPING = { slippery: true, speedMultiplier: 1, push: { x: 0, y: 0 } }
  const OUTSIDE = { slippery: false, speedMultiplier: 1, push: { x: 0, y: 0 } }
  const NO_KEYS = { x: 0, y: 0 }
  const DT = 1 / 60

  test('ao pisar no líquido andando, escorrega: a velocidade pula para 1,4 vez a do andar', () => {
    assert.equal(SLIP_SPEED, 1.4)
    const state = getSlipMovement(null, SLIPPING, { x: 1, y: 0 }, DT)
    assert.deepEqual(state, { slip: { x: 1.4, y: 0 }, movement: { x: 1.4, y: 0 } })
    // na diagonal também: a direção é a das teclas
    const diagonal = getSlipMovement(null, SLIPPING, { x: Math.SQRT1_2, y: -Math.SQRT1_2 }, DT).movement
    assert.ok(Math.abs(Math.hypot(diagonal.x, diagonal.y) - 1.4) < 1e-9)
  })

  test('uma poça de uma casa (105 u): pisou e soltou a tecla, ele só para bem depois dela', () => {
    const puddle = obstacle('escorregadio', 400, 400, 105, 75)
    let position = { x: 395, y: 440 }
    let slip = null
    for (let frame = 0; frame < 6; frame++) ({ position, slip } = slideFrame([puddle], ROOM_WALLS, position, slip, { x: 1, y: 0 }))
    assert.ok(position.x > 400 && position.x < 505, 'está em cima da poça')
    for (let frame = 0; frame < 120; frame++) ({ position, slip } = slideFrame([puddle], ROOM_WALLS, position, slip, NO_KEYS))
    assert.equal(slip, null, 'parou')
    const past = position.x - 505
    assert.ok(past > 90 && past < 200, `parou ${past.toFixed(0)} u depois da poça`)
  })

  test('parado em cima do líquido, acelera aos poucos até a velocidade do andar em 1,25 s', () => {
    let state = getSlipMovement(null, SLIPPING, NO_KEYS, DT)
    assert.deepEqual(state.slip, { x: 0, y: 0 }, 'parado em cima guarda velocidade 0 (e não volta às teclas)')
    state = getSlipMovement(state.slip, SLIPPING, { x: 1, y: 0 }, DT)
    assert.ok(Math.abs(state.movement.x - SLIP_ACCELERATION * DT) < 1e-9, 'o primeiro quadro anda só 0,8/60 da velocidade')
    let frames = 1
    while (state.movement.x < 1) {
      state = getSlipMovement(state.slip, SLIPPING, { x: 1, y: 0 }, DT)
      frames++
    }
    assert.ok(frames * DT >= 1.24 && frames * DT <= 1.27, `levou ${frames} quadros`)
  })

  test('soltar as teclas: continua deslizando, freia aos poucos e para depois de cerca de 160 u', () => {
    let slip = { x: 1, y: 0 }
    let position = { x: 500, y: 500 }
    let previous = 1
    for (let frame = 0; frame < 100; frame++) {
      const state = getSlipMovement(slip, SLIPPING, NO_KEYS, DT)
      assert.ok(state.movement.x <= previous && state.movement.x >= 0, 'só freia, nunca volta para trás')
      previous = state.movement.x
      position = moveRoomPlayer(position, state.movement, DT, 1, ROOM_WALLS)
      slip = state.slip
    }
    const slid = position.x - 500
    assert.ok(slid > 150 && slid < 175, `deslizou ${slid.toFixed(1)} u`)
    assert.deepEqual(slip, { x: 0, y: 0 }, 'parou de vez')
  })

  test('ao sair do líquido, o embalo some em até 0,9 s, sem salto', () => {
    let slip = { x: SLIP_SPEED, y: 0 }
    let previous = SLIP_SPEED
    let frames = 0
    while (slip) {
      const state = getSlipMovement(slip, OUTSIDE, NO_KEYS, DT)
      assert.ok(previous - state.movement.x <= SLIP_EXIT_DECAY * DT + 1e-9, 'a velocidade cai no máximo 1,6 por segundo')
      previous = state.movement.x
      slip = state.slip
      frames++
      assert.ok(frames < 90, 'o slip acaba')
    }
    assert.ok(frames * DT <= 0.9, `levou ${frames} quadros`)
    assert.equal(previous, 0)
  })

  test('ao sair do líquido andando para o mesmo lado, a velocidade volta à do andar e o slip acaba', () => {
    let state = getSlipMovement({ x: SLIP_SPEED, y: 0 }, OUTSIDE, { x: 1, y: 0 }, DT)
    assert.ok(state.movement.x < SLIP_SPEED && state.movement.x > 1, 'desacelera aos poucos')
    for (let frame = 0; frame < 30 && state.slip; frame++) state = getSlipMovement(state.slip, OUTSIDE, { x: 1, y: 0 }, DT)
    assert.deepEqual(state, { slip: null, movement: { x: 1, y: 0 } })
    // já na velocidade do andar, as teclas valem na hora
    assert.deepEqual(getSlipMovement({ x: 1, y: 0 }, OUTSIDE, { x: 1, y: 0 }, DT), { slip: null, movement: { x: 1, y: 0 } })
  })

  test('fora do líquido e sem velocidade, valem as teclas', () => {
    assert.deepEqual(getSlipMovement(null, OUTSIDE, { x: -1, y: 0 }, DT), { slip: null, movement: { x: -1, y: 0 } })
  })

  test('o módulo da velocidade nunca passa de SLIP_SPEED (passo máximo de 18,2 u, menor que a caixa dos pés)', () => {
    assert.ok(260 * SLIP_SPEED * 0.05 < FEET.height, 'o passo mais longo não pula nenhum sólido')
    let slip = null
    const keys = [{ x: 1, y: 0 }, { x: 0, y: -1 }, { x: -Math.SQRT1_2, y: Math.SQRT1_2 }, NO_KEYS]
    for (let frame = 0; frame < 400; frame++) {
      const state = getSlipMovement(slip, frame % 90 < 70 ? SLIPPING : OUTSIDE, keys[Math.floor(frame / 20) % keys.length], DT)
      assert.ok(Math.hypot(state.movement.x, state.movement.y) <= SLIP_SPEED + 1e-9)
      slip = state.slip
    }
  })

  test('sem tecla, a velocidade pequena demais vira 0 (senão ele nunca ficaria parado)', () => {
    assert.deepEqual(getSlipMovement({ x: 0.005, y: 0 }, SLIPPING, NO_KEYS, DT).movement, { x: 0, y: 0 })
  })

  test('o tempo do quadro é limitado a 0,05 s (como no andar)', () => {
    const state = getSlipMovement({ x: 0, y: 0 }, SLIPPING, { x: 1, y: 0 }, 5)
    assert.ok(Math.abs(state.movement.x - SLIP_ACCELERATION * 0.05) < 1e-9)
  })

  test('stopBlockedAxes: só o eixo em que a posição não mudou perde a velocidade', () => {
    assert.deepEqual(stopBlockedAxes({ x: 1, y: 0.5 }, { x: 10, y: 10 }, { x: 10, y: 12 }, DT), { x: 0, y: 0.5 })
    assert.deepEqual(stopBlockedAxes({ x: 1, y: 0.5 }, { x: 10, y: 10 }, { x: 11, y: 12 }, DT), { x: 1, y: 0.5 })
    assert.equal(stopBlockedAxes(null, { x: 10, y: 10 }, { x: 10, y: 10 }, DT), null)
  })

  test('stopBlockedAxes: um quadro sem tempo (dt 0) não conta como bloqueio', () => {
    assert.deepEqual(stopBlockedAxes({ x: 1, y: 0 }, { x: 10, y: 10 }, { x: 10, y: 10 }, 0), { x: 1, y: 0 })
  })

  // Anda um quadro com o deslize, como run.js faz. Devolve a posição e o slip novos.
  function slideFrame(obstacles, solids, position, slip, keys) {
    const effect = getFloorEffect(obstacles, position)
    const state = getSlipMovement(slip, effect, keys, DT)
    const next = moveRoomPlayer(position, state.movement, DT, effect.speedMultiplier, solids)
    return { position: next, slip: stopBlockedAxes(state.slip, position, next, DT) }
  }

  test('escorregando contra um bloco, o jogador não fica preso', () => {
    // piso escorregadio grande, com um bloco à direita: escorrega até o bloco e depois sobe com a tecla W
    const floor = obstacle('escorregadio', 300, 300, 800, 400)
    const block = obstacle('solido', 800, 450)
    const obstacles = [floor, block]
    const solids = getRoomSolids(obstacles)
    let position = { x: 500, y: 500 }
    let slip = null
    let keys = { x: 1, y: 0 }
    for (let frame = 0; frame < 240; frame++) {
      if (frame === 90) keys = { x: 0, y: -1 } // troca de tecla no meio do deslize
      ;({ position, slip } = slideFrame(obstacles, solids, position, slip, keys))
    }
    assert.ok(position.y < 450 - 60, `subiu depois de bater (y = ${position.y})`)
    assert.equal(position.x, 800 - FEET.width / 2, 'parou encostado no bloco antes de subir')
  })

  test('em todo layout com líquido, 900 quadros de teclas sorteadas nunca atravessam nada nem prendem', () => {
    const random = createRandom(2026)
    const options = [NO_KEYS, { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }, { x: Math.SQRT1_2, y: Math.SQRT1_2 }, { x: -Math.SQRT1_2, y: -Math.SQRT1_2 }]
    const { minX, maxX, minY, maxY } = ROOM_PLAYER_BOUNDS
    const layouts = ROOM_LAYOUTS.filter((layout) => layout.tiles.join('').includes('~'))
    assert.equal(layouts.length, 7, 'comum-01, 02, 04, 05, 07, tesouro-02 e adega têm líquido')

    for (const layout of layouts) {
      for (const theme of ['cantina', 'cucina', 'piazza', 'porto']) {
        const obstacles = buildRoomObstacles(layout.id, theme)
        const solids = getRoomSolids(obstacles)
        const liquid = obstacles.find((item) => item.mechanic === 'escorregadio')
        // começa sobre um líquido; se o ponto cair dentro de um obstáculo, usa um canto livre do piso
        let position = { x: liquid.box.x + 10, y: liquid.box.y + 20 }
        if (solids.some((solid) => overlaps(getFeetBox(position), solid))) position = { x: minX + 30, y: maxY - 30 }
        let slip = null
        let keys = NO_KEYS
        for (let frame = 0; frame < 900; frame++) {
          if (frame % 25 === 0) keys = pick(random, options)
          ;({ position, slip } = slideFrame(obstacles, solids, position, slip, keys))
          const where = `${layout.id} ${theme} quadro ${frame}`
          assert.ok(position.x >= minX && position.x <= maxX && position.y >= minY && position.y <= maxY, `fora dos limites: ${where}`)
          assert.ok(!solids.some((solid) => overlaps(getFeetBox(position), solid)), `dentro de um sólido: ${where}`)
          if (slip) assert.ok(Math.hypot(slip.x, slip.y) <= SLIP_SPEED + 1e-9, `velocidade acima do escorregão: ${where}`)
        }
        // sem teclas ele para (não desliza para sempre) e, de lá, pelo menos um lado anda
        for (let frame = 0; frame < 120; frame++) ({ position, slip } = slideFrame(obstacles, solids, position, slip, NO_KEYS))
        const stopped = position
        const moves = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }].filter((direction) => {
          let probe = { position: stopped, slip: null }
          for (let frame = 0; frame < 30; frame++) probe = slideFrame(obstacles, solids, probe.position, probe.slip, direction)
          return Math.hypot(probe.position.x - stopped.x, probe.position.y - stopped.y) > 1
        })
        assert.ok(moves.length > 0, `preso: ${layout.id} ${theme}`)
      }
    }
  })

  test('os 4 líquidos (vinho, azeite, sorvete e poça) são escorregadios', () => {
    for (const [theme, kind] of [['cantina', 'vinho'], ['cucina', 'azeite'], ['piazza', 'sorvete'], ['porto', 'poca']]) {
      const liquids = buildRoomObstacles('comum-02', theme).filter((item) => item.kind === kind)
      assert.ok(liquids.length > 0 && liquids.every((item) => item.mechanic === 'escorregadio' && !item.blocking), kind)
    }
  })
})

describe('quente', () => {
  const plate = obstacle('quente', 600, 400)

  test('bloqueia', () => {
    assert.ok(getRoomSolids([plate]).includes(plate.box))
  })

  test('encostar (até 2 u) queima; a 3 u não', () => {
    // pés encostados à esquerda da chapa: borda direita da caixa dos pés em x = 600
    assert.equal(touchesHot([plate], { x: 600 - FEET.width / 2, y: 440 }), true)
    assert.equal(touchesHot([plate], { x: 600 - FEET.width / 2 - 1.9, y: 440 }), true)
    assert.equal(touchesHot([plate], { x: 600 - FEET.width / 2 - 3, y: 440 }), false)
    // por baixo: o topo da caixa dos pés (y - 18) encosta na borda de baixo da chapa (460)
    assert.equal(touchesHot([plate], { x: 640, y: 460 + FEET.height }), true)
  })

  test('outros obstáculos encostados não queimam', () => {
    assert.equal(touchesHot([obstacle('solido', 600, 400)], { x: 600 - FEET.width / 2, y: 440 }), false)
    assert.equal(touchesHot([{ ...plate, removed: true }], { x: 600 - FEET.width / 2, y: 440 }), false)
  })
})

describe('grudento', () => {
  test('não bloqueia e deixa o jogador a 35%', () => {
    const net = obstacle('grudento', 400, 400, 100, 75)
    assert.deepEqual(getRoomSolids([net]), ROOM_WALLS)
    assert.equal(STICKY_SPEED, 0.35)
    assert.equal(getFloorEffect([net], { x: 450, y: 450 }).speedMultiplier, 0.35)
    assert.equal(getFloorEffect([net], { x: 450, y: 475 }).speedMultiplier, 1, 'a borda de baixo já é a casa vizinha')
  })
})

describe('esteira', () => {
  const belt = obstacle('esteira', 400, 400, 100, 75)

  test('não bloqueia e empurra a 220 u/s, para a direita ou para a esquerda (direction)', () => {
    assert.deepEqual(getRoomSolids([belt]), ROOM_WALLS)
    assert.equal(CONVEYOR_SPEED, 220)
    assert.ok(CONVEYOR_SPEED < 260, 'mais devagar que o andar: dá para andar contra ela')
    assert.deepEqual(getFloorEffect([belt], { x: 450, y: 450 }).push, { x: 220, y: 0 })
    assert.deepEqual(getFloorEffect([{ ...belt, direction: 1 }], { x: 450, y: 450 }).push, { x: 220, y: 0 })
    assert.deepEqual(getFloorEffect([{ ...belt, direction: -1 }], { x: 450, y: 450 }).push, { x: -220, y: 0 })
    assert.deepEqual(getFloorEffect([belt], { x: 350, y: 450 }).push, { x: 0, y: 0 })
  })

  test('nas salas, há esteiras para os dois lados; vizinhas na mesma linha empurram juntas', () => {
    const directions = new Set()
    for (const layout of ROOM_LAYOUTS) {
      const belts = buildRoomObstacles(layout.id, 'pastificio').filter((item) => item.mechanic === 'esteira')
      for (const item of belts) {
        assert.ok(item.direction === 1 || item.direction === -1, `${layout.id} ${item.id}`)
        assert.equal(item.direction, getConveyorDirection(item.col, item.row))
        directions.add(item.direction)
        const next = belts.find((other) => other.row === item.row && other.col === item.col + 1)
        if (next) assert.equal(next.direction, item.direction, `${layout.id}: ${item.id} e ${next.id} empurram um contra o outro`)
      }
    }
    assert.deepEqual([...directions].sort(), [-1, 1])
    // os outros obstáculos não ganham direção
    assert.ok(buildRoomObstacles('comum-01', 'cantina').every((item) => !('direction' in item)))
  })

  test('o empurrão anda 220 u/s', () => {
    const next = pushPlayer({ x: 450, y: 450 }, { x: CONVEYOR_SPEED, y: 0 }, 0.02)
    assert.ok(Math.abs(next.x - (450 + 220 * 0.02)) < 1e-9)
    assert.equal(next.y, 450)
    assert.deepEqual(pushPlayer({ x: 450, y: 450 }, { x: 0, y: 0 }, 0.02), { x: 450, y: 450 })
  })

  test('o empurrão não atravessa parede nem obstáculo', () => {
    let position = { x: ROOM_PLAYER_BOUNDS.maxX - 5, y: 500 }
    for (let frame = 0; frame < 60; frame++) position = pushPlayer(position, { x: CONVEYOR_SPEED, y: 0 }, 0.05)
    assert.equal(position.x, ROOM_PLAYER_BOUNDS.maxX)

    const solids = getRoomSolids([obstacle('solido', 600, 400)])
    position = { x: 560, y: 440 }
    for (let frame = 0; frame < 60; frame++) position = pushPlayer(position, { x: CONVEYOR_SPEED, y: 0 }, 0.05, solids)
    assert.equal(position.x, 600 - FEET.width / 2)
  })
})
