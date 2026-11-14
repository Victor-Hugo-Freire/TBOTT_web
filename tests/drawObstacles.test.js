import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { drawFloorObstacles, getConveyorShift } from '../src/pages/SalaInicial/scene/drawObstacles.js'
import { CONVEYOR_SPEED } from '../src/utils/roomObstacles.js'

// Os pisos são desenhados em 104 u por uma grade de 20 casas: cada casa da grade tem 5,2 u
const UNITS_PER_GRID = 104 / 20

describe('getConveyorShift (setas da esteira)', () => {
  // Tempo para as setas andarem o espaçamento inteiro (5 casas da grade): o desenho se repete a cada período
  const PERIOD_MS = ((5 * UNITS_PER_GRID) / CONVEYOR_SPEED) * 1000

  test('começa em 0 e anda na velocidade do empurrão da esteira', () => {
    assert.equal(getConveyorShift(0), 0)
    // 20 ms a 220 u/s = 4,4 u (menos de 1 casa da grade, de 5,2 u)
    assert.ok(Math.abs(getConveyorShift(20) * UNITS_PER_GRID - CONVEYOR_SPEED * 0.02) < 1e-9)
    assert.ok(Math.abs(getConveyorShift(100) * UNITS_PER_GRID - CONVEYOR_SPEED * 0.1) < 1e-9)
  })

  test('o desenho se repete a cada período (5 casas de espaçamento)', () => {
    assert.ok(Math.abs(getConveyorShift(PERIOD_MS + 60) - getConveyorShift(60)) < 1e-9)
    assert.ok(Math.abs(getConveyorShift(3 * PERIOD_MS + 25) - getConveyorShift(25)) < 1e-9)
  })

  test('fica sempre entre 0 e o espaçamento das setas', () => {
    for (let time = 0; time < 5000; time += 7) {
      const shift = getConveyorShift(time)
      assert.ok(shift >= 0 && shift < 5, `${time} ms: ${shift}`)
    }
  })

  test('com reduzir movimento as setas ficam paradas', () => {
    for (const time of [0, 40, 123, 99999]) assert.equal(getConveyorShift(time, true), 0)
  })
})

describe('drawFloorObstacles com a esteira', () => {
  const conveyor = { id: '6-3', kind: 'esteira', mechanic: 'esteira', blocking: false, box: { x: 700, y: 500, width: 105, height: 75 } }

  // ctx falso: guarda o recorte, os espelhamentos (scale com x negativo) e os retângulos amarelos das setas
  // (a haste de cada seta tem 0,9 x 3 da grade)
  function arrowStems(obstacles, timeMs, reduceMotion) {
    const stems = []
    const clips = []
    const mirrors = []
    const ctx = new Proxy({}, {
      get(target, name) {
        if (name === 'rect') return (...args) => clips.push(args)
        if (name === 'scale') return (x, y) => { if (x < 0) mirrors.push([x, y]) }
        if (name === 'fillRect') return (x, y, width, height) => { if (target.fillStyle === '#e0b040' && width === 0.9 && height === 3) stems.push(x) }
        return target[name] ?? (() => {})
      },
      set(target, name, value) {
        target[name] = value
        return true
      },
    })
    drawFloorObstacles(ctx, obstacles, timeMs, reduceMotion)
    return { stems, clips, mirrors }
  }

  test('parada (reduzir movimento), mostra as setas de sempre: três visíveis em 4,5, 9,5 e 14,5', () => {
    const { stems, clips } = arrowStems([conveyor], 12345, true)
    assert.deepEqual(stems.filter((x) => x >= 3.5 && x <= 17), [4.5, 9.5, 14.5])
    assert.deepEqual(clips, [[3.5, 9.5, 13.5, 4]], 'recortadas dentro da lona')
  })

  test('em movimento, todas as setas andam para a frente junto com o relógio', () => {
    const still = arrowStems([conveyor], 0, false).stems
    const moved = arrowStems([conveyor], 20, false).stems
    const shift = getConveyorShift(20)
    assert.ok(shift > 0)
    moved.forEach((x, index) => assert.ok(Math.abs(x - (still[index] + shift)) < 1e-9))
  })

  test('virada para a esquerda, as mesmas setas são espelhadas em volta do meio da lona; para a direita, não', () => {
    const left = arrowStems([{ ...conveyor, direction: -1 }], 12345, true)
    assert.deepEqual(left.mirrors, [[-1, 1]])
    assert.deepEqual(left.stems.filter((x) => x >= 3.5 && x <= 17), [4.5, 9.5, 14.5], 'o desenho é o mesmo, só espelhado')
    assert.deepEqual(left.clips, [[3.5, 9.5, 13.5, 4]])
    assert.deepEqual(arrowStems([{ ...conveyor, direction: 1 }], 12345, true).mirrors, [])
    assert.deepEqual(arrowStems([conveyor], 12345, true).mirrors, [])
  })

  test('só a esteira tem setas', () => {
    const puddle = { id: '1-1', kind: 'vinho', mechanic: 'escorregadio', blocking: false, box: { x: 300, y: 300, width: 105, height: 75 } }
    assert.deepEqual(arrowStems([puddle], 0, false).stems, [])
  })
})
