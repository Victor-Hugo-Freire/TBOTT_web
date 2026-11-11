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
      seed: null,
      floor: 1,
      finished: false,
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

  test('guarda a seed e o andar válidos', () => {
    const payload = normalizeProgressPayload({ seed: 2891336453, floor: 4, roomId: '3-5' })
    assert.equal(payload.seed, 2891336453)
    assert.equal(payload.floor, 4)
    assert.equal(payload.roomId, '3-5')
    assert.equal(normalizeProgressPayload({ seed: 0 }).seed, 0)
    assert.equal(normalizeProgressPayload({ seed: 4294967295 }).seed, 4294967295)
  })

  test('seed inválida vira null e andar inválido vira 1', () => {
    for (const seed of [-1, 4294967296, 1.5, '123', NaN, Infinity, {}, true]) {
      assert.equal(normalizeProgressPayload({ seed }).seed, null, String(seed))
    }
    for (const floor of [0, 6, 2.5, '3', null, NaN]) {
      assert.equal(normalizeProgressPayload({ floor }).floor, 1, String(floor))
    }
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
        seed: null,
        floor: 1,
        finished: false,
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
      seed: null,
      floor: 1,
      finished: false,
    })
  })

  test('inclui a seed e o andar', () => {
    const snapshot = createProgressSnapshot({ player: { x: 200, y: 330 }, roomId: '4-2', seed: 77, floor: 3 })
    assert.equal(snapshot.seed, 77)
    assert.equal(snapshot.floor, 3)
    assert.equal(snapshot.roomId, '4-2')
  })
})

describe('marca de fim da run', () => {
  test('só true de verdade conta como run encerrada', () => {
    assert.equal(normalizeProgressPayload({ finished: true }).finished, true)
    for (const value of [false, 'true', 1, null, undefined]) assert.equal(normalizeProgressPayload({ finished: value }).finished, false)
  })

  test('createProgressSnapshot guarda a marca de fim', () => {
    assert.equal(createProgressSnapshot({ finished: true }).finished, true)
    assert.equal(createProgressSnapshot({}).finished, false)
  })
})
