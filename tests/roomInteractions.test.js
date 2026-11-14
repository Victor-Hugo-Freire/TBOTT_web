import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { getEntryPosition } from '../src/utils/doors.js'
import { buildRoomObstacles } from '../src/utils/roomLayout.js'
import { FIN_LAP_MS, getPullPoint, getSharkFinPosition, isInPuddle, isNearFin, PUDDLE } from '../src/utils/roomInteractions.js'

describe('poça do Tralalero', () => {
  test('pisar na poça conta; na borda, do lado de fora, não', () => {
    const top = PUDDLE.y - PUDDLE.radiusY
    assert.equal(isInPuddle({ x: PUDDLE.x, y: top + 5 }), true, 'logo depois da borda de cima')
    assert.equal(isInPuddle({ x: PUDDLE.x, y: top - 5 }), false, 'logo antes da borda de cima')
    assert.equal(isInPuddle({ x: PUDDLE.x + PUDDLE.radiusX + 5, y: PUDDLE.y }), false, 'do lado direito')
  })

  test('perto da barbatana conta; longe dela, não', () => {
    const fin = { x: 800, y: 450 }
    assert.equal(isNearFin({ x: 800, y: 400 }, fin), true, 'a 50 u')
    assert.equal(isNearFin({ x: 800, y: 380 }, fin), false, 'a 70 u')
  })

  test('as entradas das portas ficam longe da poça e da volta da barbatana (entrar na sala não mata)', () => {
    for (const side of ['up', 'down', 'left', 'right']) {
      const entry = getEntryPosition(side)
      assert.equal(isInPuddle(entry), false, `entrada da porta ${side}`)
      for (let finMs = 0; finMs < FIN_LAP_MS; finMs += 50) {
        assert.equal(isNearFin(entry, getSharkFinPosition(finMs)), false, `entrada da porta ${side}, barbatana em ${finMs} ms`)
      }
    }
  })

  test('as casas sólidas do layout do pacto ficam dentro da poça', () => {
    const solids = buildRoomObstacles('pacto', 'cucina').filter((obstacle) => obstacle.kind === 'cenario')
    assert.ok(solids.length > 0)
    for (const { box } of solids) {
      for (const corner of [{ x: box.x, y: box.y }, { x: box.x + box.width, y: box.y + box.height }]) {
        assert.ok(isInPuddle(corner), `canto ${corner.x}, ${corner.y}`)
      }
    }
  })

  test('a barbatana contorna a poça por dentro e olha para o lado em que nada', () => {
    let previous = getSharkFinPosition(0)
    for (let finMs = 50; finMs <= 10000; finMs += 50) {
      const fin = getSharkFinPosition(finMs)
      assert.ok(isInPuddle(fin), `${fin.x}, ${fin.y} em ${finMs} ms`)
      if (fin.x !== previous.x) assert.equal(fin.facingLeft, fin.x < previous.x, `direção em ${finMs} ms`)
      previous = fin
    }
  })

  test('nas pontas da volta a barbatana vira aos poucos (sem pular de um lado para o outro)', () => {
    let previous = getSharkFinPosition(0).turn
    for (let finMs = 50; finMs <= 10000; finMs += 50) {
      const { turn } = getSharkFinPosition(finMs)
      assert.ok(turn >= -1 && turn <= 1)
      assert.ok(Math.abs(turn - previous) < 0.35, `pulou de ${previous} para ${turn} em ${finMs} ms`)
      previous = turn
    }
  })

  test('ele é puxado para dentro da poça, do lado em que estava', () => {
    const above = getPullPoint({ x: PUDDLE.x, y: PUDDLE.y - 200 })
    assert.ok(isInPuddle(above) && above.y < PUDDLE.y)
    const right = getPullPoint({ x: PUDDLE.x + 500, y: PUDDLE.y })
    assert.ok(isInPuddle(right) && right.x > PUDDLE.x)
  })
})
