import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { getTimedFrame, getTotalDuration, getWalkFrame, updateWalkDistance, WALK_STEP_DISTANCE } from '../src/utils/spriteAnimation.js'
import { getRoomMovement, moveRoomPlayer, ROOM_PLAYER_BOUNDS } from '../src/utils/roomMovement.js'

describe('getWalkFrame (distância andada -> quadro)', () => {
  test('um quadro a cada 32,5 u andadas', () => {
    assert.equal(WALK_STEP_DISTANCE, 32.5)
    assert.equal(getWalkFrame(0), 0)
    assert.equal(getWalkFrame(32.4), 0)
    assert.equal(getWalkFrame(32.5), 1)
    assert.equal(getWalkFrame(65), 2)
    assert.equal(getWalkFrame(97.5), 3)
  })

  test('depois do último quadro volta ao primeiro (ciclo de 130 u)', () => {
    assert.equal(getWalkFrame(130), 0)
    assert.equal(getWalkFrame(162.5), 1)
  })
})

describe('updateWalkDistance', () => {
  test('soma o que andou', () => {
    assert.equal(updateWalkDistance(10, 4), 14)
  })

  test('ao parar volta a zero, então o quadro é o 0 e não sobra quadro antigo', () => {
    const distance = updateWalkDistance(80, 0)
    assert.equal(distance, 0)
    assert.equal(getWalkFrame(distance), 0)
  })
})

describe('animação com a colisão', () => {
  // Simula quadros de 1/60 s e devolve a posição e a distância de animação
  function walk(start, keys, frames) {
    const movement = getRoomMovement(new Set(keys))
    let position = start
    let distance = 0
    for (let i = 0; i < frames; i++) {
      const next = moveRoomPlayer(position, movement, 1 / 60)
      distance = updateWalkDistance(distance, Math.hypot(next.x - position.x, next.y - position.y))
      position = next
    }
    return { position, distance }
  }

  test('andando livre, o quadro muda com a distância', () => {
    // 15 quadros de 1/60 s a 260 u/s = 65 u andadas = 2 passos
    const { distance } = walk({ x: 100, y: 400 }, ['KeyD'], 15)
    assert.ok(Math.abs(distance - 65) < 0.0001)
    assert.equal(getWalkFrame(distance + 0.001), 2)
  })

  test('empurrando a parede, a animação para no quadro 0', () => {
    const { distance } = walk({ x: ROOM_PLAYER_BOUNDS.maxX, y: 400 }, ['KeyD'], 30)
    assert.equal(distance, 0)
    assert.equal(getWalkFrame(distance), 0)
  })
})

describe('getTimedFrame (tempos diferentes por quadro)', () => {
  const durations = [70, 90, 40]

  test('devolve o quadro que está no ar naquele instante', () => {
    assert.equal(getTimedFrame(durations, 0), 0)
    assert.equal(getTimedFrame(durations, 69), 0)
    assert.equal(getTimedFrame(durations, 70), 1)
    assert.equal(getTimedFrame(durations, 159), 1)
    assert.equal(getTimedFrame(durations, 160), 2)
    assert.equal(getTimedFrame(durations, 199), 2)
  })

  test('depois do fim devolve -1', () => {
    assert.equal(getTimedFrame(durations, 200), -1)
  })

  test('getTotalDuration soma os tempos', () => {
    assert.equal(getTotalDuration(durations), 200)
  })
})
