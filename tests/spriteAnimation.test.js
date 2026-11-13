import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import {
  getTimedFrame,
  getTotalDuration,
  getWalkFrame,
  updateWalkDistance,
  WALK_CYCLE_DISTANCE,
  WALK_FRAME_COUNT,
  WALK_STEP_DISTANCE,
} from '../src/utils/spriteAnimation.js'
import { getRoomMovement, moveRoomPlayer, ROOM_PLAYER_BOUNDS } from '../src/utils/roomMovement.js'

describe('getWalkFrame (distância andada -> quadro)', () => {
  test('um quadro a cada 80/12 u andadas, em um ciclo de 12 quadros', () => {
    assert.equal(WALK_CYCLE_DISTANCE, 80)
    assert.equal(WALK_FRAME_COUNT, 12)
    assert.ok(Math.abs(WALK_STEP_DISTANCE - 6.6667) < 0.001)
    assert.equal(getWalkFrame(0), 0)
    assert.equal(getWalkFrame(6.6), 0)
    assert.equal(getWalkFrame(6.7), 1)
    assert.equal(getWalkFrame(40.1), 6)
    assert.equal(getWalkFrame(79.9), 11)
  })

  test('depois do último quadro volta ao primeiro (ciclo de 80 u)', () => {
    assert.equal(getWalkFrame(80.1), 0)
    assert.equal(getWalkFrame(87), 1)
  })

  test('na velocidade do personagem (260 u/s) são 6,5 passos por segundo', () => {
    // 2 passos por ciclo; mais devagar que isso o pé patina, mais rápido fica frenético
    const stepsPerSecond = (260 / WALK_CYCLE_DISTANCE) * 2
    assert.equal(stepsPerSecond, 6.5)
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
    // 15 quadros de 1/60 s a 260 u/s = 65 u andadas = quadro 9 (65 / 6,67)
    const { distance } = walk({ x: 300, y: 400 }, ['KeyD'], 15)
    assert.ok(Math.abs(distance - 65) < 0.0001)
    assert.equal(getWalkFrame(distance + 0.001), 9)
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
