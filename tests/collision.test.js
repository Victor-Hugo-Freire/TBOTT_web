import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { moveAndCollide, overlaps } from '../src/utils/collision.js'
import { getRoomMovement, moveRoomPlayer, PLAYER_FEET_BOX, ROOM_PLAYER_BOUNDS, ROOM_WALLS } from '../src/utils/roomMovement.js'

const box = (x, y, width = 10, height = 10) => ({ x, y, width, height })

describe('overlaps', () => {
  test('caixas que se invadem se sobrepõem', () => {
    assert.equal(overlaps(box(0, 0), box(5, 5)), true)
  })

  test('encostar na borda não é sobrepor', () => {
    assert.equal(overlaps(box(0, 0), box(10, 0)), false)
    assert.equal(overlaps(box(0, 0), box(0, 10)), false)
  })

  test('caixas separadas não se sobrepõem', () => {
    assert.equal(overlaps(box(0, 0), box(30, 30)), false)
  })
})

describe('moveAndCollide', () => {
  const wall = box(100, 0, 20, 200)

  test('sem sólido no caminho, anda tudo', () => {
    assert.deepEqual(moveAndCollide(box(0, 0), 5, 7, [wall]), box(5, 7))
  })

  test('encaixa exatamente na borda do sólido', () => {
    assert.equal(moveAndCollide(box(85, 50), 20, 0, [wall]).x, 90)
    assert.equal(moveAndCollide(box(125, 50), -20, 0, [wall]).x, 120)
  })

  test('desliza: bate no eixo X e continua andando em Y', () => {
    const next = moveAndCollide(box(90, 50), 5, 5, [wall])
    assert.equal(next.x, 90)
    assert.equal(next.y, 55)
  })

  test('encaixa também no eixo Y', () => {
    const floor = box(0, 100, 200, 20)
    assert.equal(moveAndCollide(box(50, 85), 0, 20, [floor]).y, 90)
    assert.equal(moveAndCollide(box(50, 125), 0, -20, [floor]).y, 120)
  })
})

describe('colisão com as paredes da sala', () => {
  test('os limites dos pés vêm das paredes e da caixa de 44x18', () => {
    assert.deepEqual(PLAYER_FEET_BOX, { width: 44, height: 18 })
    assert.deepEqual(ROOM_PLAYER_BOUNDS, { minX: 25, maxX: 1050, minY: 261, maxY: 656 })
  })

  test('as paredes são bem mais grossas que o passo máximo de um quadro', () => {
    const maxStep = 260 * 0.05
    for (const wall of ROOM_WALLS) assert.ok(Math.min(wall.width, wall.height) >= 100 && Math.min(wall.width, wall.height) > maxStep * 5)
  })

  test('60 quadros contra cada parede não mudam a posição', () => {
    const cases = [
      [{ x: ROOM_PLAYER_BOUNDS.maxX, y: 400 }, { x: 1, y: 0 }],
      [{ x: ROOM_PLAYER_BOUNDS.minX, y: 400 }, { x: -1, y: 0 }],
      [{ x: 500, y: ROOM_PLAYER_BOUNDS.minY }, { x: 0, y: -1 }],
      [{ x: 500, y: ROOM_PLAYER_BOUNDS.maxY }, { x: 0, y: 1 }],
    ]
    for (const [start, movement] of cases) {
      let position = start
      for (let frame = 0; frame < 60; frame++) position = moveRoomPlayer(position, movement, 1 / 60)
      assert.deepEqual(position, start)
    }
  })

  test('na diagonal contra a parede, desliza pela parede sem tremer', () => {
    const movement = getRoomMovement(new Set(['d', 's']))
    let position = { x: ROOM_PLAYER_BOUNDS.maxX, y: 300 }
    for (let frame = 0; frame < 30; frame++) {
      const next = moveRoomPlayer(position, movement, 1 / 60)
      assert.equal(next.x, ROOM_PLAYER_BOUNDS.maxX)
      assert.ok(next.y > position.y)
      position = next
    }
  })

  test('dt de 0,05 s (o máximo) não atravessa a parede, nem de canto', () => {
    const corners = [
      [{ x: 1049, y: 655 }, { x: 1, y: 1 }],
      [{ x: 26, y: 262 }, { x: -1, y: -1 }],
    ]
    for (const [start, movement] of corners) {
      let position = start
      for (let frame = 0; frame < 20; frame++) position = moveRoomPlayer(position, movement, 0.05)
      assert.ok(position.x >= ROOM_PLAYER_BOUNDS.minX && position.x <= ROOM_PLAYER_BOUNDS.maxX)
      assert.ok(position.y >= ROOM_PLAYER_BOUNDS.minY && position.y <= ROOM_PLAYER_BOUNDS.maxY)
    }
  })
})
