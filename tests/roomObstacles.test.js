import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import {
  CONVEYOR_SPEED,
  getFloorEffect,
  getRoomSolids,
  getSlipMovement,
  hitObstacles,
  isBlockedStep,
  pushPlayer,
  ROLL_SPEED,
  STICKY_SPEED,
  touchesHot,
  updateRollingObstacles,
} from '../src/utils/roomObstacles.js'
import { moveRoomPlayer, PLAYER_FEET_BOX, ROOM_FLOOR, ROOM_PLAYER_BOUNDS, ROOM_WALLS } from '../src/utils/roomMovement.js'

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

  test('ao entrar andando, guarda a direção e segue nela ignorando as teclas', () => {
    const effect = { slippery: true, speedMultiplier: 1, push: { x: 0, y: 0 } }
    let state = getSlipMovement(null, effect, { x: 1, y: 0 })
    assert.deepEqual(state, { slip: { x: 1, y: 0 }, movement: { x: 1, y: 0 } })
    state = getSlipMovement(state.slip, effect, { x: 0, y: -1 })
    assert.deepEqual(state.movement, { x: 1, y: 0 })
    state = getSlipMovement(state.slip, effect, { x: 0, y: 0 })
    assert.deepEqual(state.movement, { x: 1, y: 0 }, 'soltar as teclas não para')
  })

  test('parado ao entrar, espera a tecla para começar a escorregar', () => {
    const effect = { slippery: true, speedMultiplier: 1, push: { x: 0, y: 0 } }
    assert.deepEqual(getSlipMovement(null, effect, { x: 0, y: 0 }), { slip: null, movement: { x: 0, y: 0 } })
    assert.deepEqual(getSlipMovement(null, effect, { x: 0, y: 1 }).slip, { x: 0, y: 1 })
  })

  test('ao sair do piso, volta a obedecer às teclas', () => {
    const outside = { slippery: false, speedMultiplier: 1, push: { x: 0, y: 0 } }
    assert.deepEqual(getSlipMovement({ x: 1, y: 0 }, outside, { x: -1, y: 0 }), { slip: null, movement: { x: -1, y: 0 } })
  })

  test('bateu: volta a obedecer às teclas', () => {
    const effect = { slippery: true, speedMultiplier: 1, push: { x: 0, y: 0 } }
    assert.deepEqual(getSlipMovement({ x: 1, y: 0 }, effect, { x: 0, y: 1 }, true), { slip: null, movement: { x: 0, y: 1 } })
  })

  test('isBlockedStep: eixo com movimento e sem mudança de posição', () => {
    assert.equal(isBlockedStep({ x: 10, y: 10 }, { x: 10, y: 12 }, { x: 1, y: 1 }), true)
    assert.equal(isBlockedStep({ x: 10, y: 10 }, { x: 11, y: 12 }, { x: 1, y: 1 }), false)
    assert.equal(isBlockedStep({ x: 10, y: 10 }, { x: 10, y: 12 }, { x: 0, y: 1 }), false)
  })

  test('isBlockedStep: um quadro sem tempo (dt 0) não conta como bloqueio', () => {
    assert.equal(isBlockedStep({ x: 10, y: 10 }, { x: 10, y: 10 }, { x: 1, y: 0 }, 0), false)
    assert.equal(isBlockedStep({ x: 10, y: 10 }, { x: 10, y: 10 }, { x: 1, y: 0 }, 1 / 60), true)
  })

  test('escorregando contra um bloco, o jogador não fica preso', () => {
    // piso escorregadio grande, com um bloco à direita: escorrega até o bloco e depois sobe com a tecla W
    const floor = obstacle('escorregadio', 300, 300, 800, 400)
    const block = obstacle('solido', 800, 450)
    const obstacles = [floor, block]
    const solids = getRoomSolids(obstacles)
    let position = { x: 500, y: 500 }
    let slip = null
    let blocked = false
    let keys = { x: 1, y: 0 }
    for (let frame = 0; frame < 120; frame++) {
      if (frame === 10) keys = { x: 0, y: -1 } // troca de tecla no meio: não muda nada enquanto escorrega
      const state = getSlipMovement(slip, getFloorEffect(obstacles, position), keys, blocked)
      const next = moveRoomPlayer(position, state.movement, 1 / 60, 1, solids)
      blocked = isBlockedStep(position, next, state.movement)
      slip = state.slip
      position = next
    }
    assert.ok(position.y < 450 - 60, `subiu depois de bater (y = ${position.y})`)
    assert.equal(position.x, 800 - FEET.width / 2, 'parou encostado no bloco antes de subir')
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
  test('não bloqueia e deixa o jogador a 50%', () => {
    const net = obstacle('grudento', 400, 400, 100, 75)
    assert.deepEqual(getRoomSolids([net]), ROOM_WALLS)
    assert.equal(STICKY_SPEED, 0.5)
    assert.equal(getFloorEffect([net], { x: 450, y: 450 }).speedMultiplier, 0.5)
    assert.equal(getFloorEffect([net], { x: 450, y: 475 }).speedMultiplier, 1, 'a borda de baixo já é a casa vizinha')
  })
})

describe('esteira', () => {
  const belt = obstacle('esteira', 400, 400, 100, 75)

  test('não bloqueia e empurra para a direita a 130 u/s', () => {
    assert.deepEqual(getRoomSolids([belt]), ROOM_WALLS)
    assert.equal(CONVEYOR_SPEED, 130)
    assert.deepEqual(getFloorEffect([belt], { x: 450, y: 450 }).push, { x: 130, y: 0 })
    assert.deepEqual(getFloorEffect([belt], { x: 350, y: 450 }).push, { x: 0, y: 0 })
  })

  test('o empurrão anda 130 u/s', () => {
    const next = pushPlayer({ x: 450, y: 450 }, { x: CONVEYOR_SPEED, y: 0 }, 0.02)
    assert.ok(Math.abs(next.x - (450 + 130 * 0.02)) < 1e-9)
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
