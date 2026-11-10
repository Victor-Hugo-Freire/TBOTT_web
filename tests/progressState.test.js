import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { createProgressSnapshot, normalizeProgressPayload } from '../src/utils/progress.js'

describe('normalizeProgressPayload', () => {
  test('mantém o payload mínimo e usa padrões seguros', () => {
    const payload = normalizeProgressPayload({
      playerX: 420,
      playerY: 520,
      elapsedMs: 12345,
    })

    assert.deepEqual(payload, {
      roomId: 'sala-inicial',
      characterId: 'tung-tung-sahur',
      playerX: 420,
      playerY: 520,
      elapsedMs: 12345,
    })
  })

  test('congela coordenadas dentro dos limites da sala', () => {
    const payload = normalizeProgressPayload({
      playerX: -999,
      playerY: 999999,
      elapsedMs: -10,
    })

    assert.equal(payload.playerX, 140)
    assert.equal(payload.playerY, 786)
    assert.equal(payload.elapsedMs, 0)
  })
})

describe('normalizeProgressPayload com dados estranhos', () => {
  test('valor que não é objeto vira a partida inicial', () => {
    for (const value of [null, undefined, 'texto', 42, []]) {
      assert.deepEqual(normalizeProgressPayload(value), {
        roomId: 'sala-inicial',
        characterId: 'tung-tung-sahur',
        playerX: 800,
        playerY: 560,
        elapsedMs: 0,
      })
    }
  })
})

describe('createProgressSnapshot', () => {
  test('monta o estado completo da run em coordenadas lógicas da sala', () => {
    const snapshot = createProgressSnapshot({
      player: { x: 200, y: 330 },
      elapsedMs: 4500,
      characterId: 'tung-tung-sahur',
    })

    assert.deepEqual(snapshot, {
      roomId: 'sala-inicial',
      characterId: 'tung-tung-sahur',
      playerX: 200,
      playerY: 330,
      elapsedMs: 4500,
    })
  })
})
