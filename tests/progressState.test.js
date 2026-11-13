import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { createProgressSnapshot, normalizeProgressPayload } from '../src/utils/progress.js'
import { ROOM_PLAYER_BOUNDS } from '../src/utils/roomMovement.js'

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
      visitedRoomIds: [],
      roomStates: {},
      health: 6,
      deathCause: null,
      forks: 1,
    })
  })

  test('congela coordenadas dentro dos limites da sala', () => {
    const payload = normalizeProgressPayload({
      playerX: -999,
      playerY: 999999,
      elapsedMs: -10,
    })

    assert.equal(payload.playerX, ROOM_PLAYER_BOUNDS.minX)
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

  test('guarda as salas visitadas sem repetição e descarta o que não é id', () => {
    const payload = normalizeProgressPayload({ visitedRoomIds: ['3-3', '3-4', '3-3', 5, null, '', 'x'.repeat(40), '4-4'] })
    assert.deepEqual(payload.visitedRoomIds, ['3-3', '3-4', '4-4'])
  })

  test('salas visitadas inválidas viram lista vazia e a lista tem limite', () => {
    for (const value of [undefined, null, 'texto', 7, {}, true]) {
      assert.deepEqual(normalizeProgressPayload({ visitedRoomIds: value }).visitedRoomIds, [], String(value))
    }
    const many = Array.from({ length: 200 }, (_, index) => `${index}-0`)
    assert.equal(normalizeProgressPayload({ visitedRoomIds: many }).visitedRoomIds.length, 72)
  })

  test('ids de sala precisam ter o formato col-row', () => {
    const payload = normalizeProgressPayload({ visitedRoomIds: ['3-3', 'sala', '3', '3-3-3', '__proto__', '12-7'] })
    assert.deepEqual(payload.visitedRoomIds, ['3-3', '12-7'])
  })

  test('guarda o estado das salas: obstáculos quebrados e batidas', () => {
    const payload = normalizeProgressPayload({
      roomStates: {
        '3-3': { removed: ['2-1', '2-1', '9-4', 'lixo', 7], hits: 0 },
        '4-2': { removed: [], hits: 3 },
        '5-5': { removed: [], hits: 0 }, // nada mudou: não precisa ir
        '6-1': { removed: ['1-1'], hits: 99 }, // batidas acima de 3 ficam em 3
        '7-7': { removed: 'texto', hits: 2.5 }, // inválido: sem quebrados e sem batidas
        'sala-x': { removed: ['1-1'], hits: 1 }, // id de sala inválido
        '8-8': null,
      },
    })
    assert.deepEqual(payload.roomStates, {
      '3-3': { removed: ['2-1', '9-4'], hits: 0, unlocked: false },
      '4-2': { removed: [], hits: 3, unlocked: false },
      '6-1': { removed: ['1-1'], hits: 3, unlocked: false },
    })
  })

  test('estado das salas inválido vira objeto vazio (e não aceita chave perigosa)', () => {
    for (const value of [undefined, null, 'texto', 7, [], true]) {
      assert.deepEqual(normalizeProgressPayload({ roomStates: value }).roomStates, {}, String(value))
    }
    const tricky = JSON.parse('{"roomStates": {"__proto__": {"removed": ["1-1"], "hits": 1}, "constructor": {"hits": 2}}}')
    assert.deepEqual(normalizeProgressPayload(tricky).roomStates, {})
    assert.equal({}.hits, undefined)
  })

  test('guarda a vida de 0 a 6 e a causa da morte; valor inválido vira vida cheia e sem causa', () => {
    assert.equal(normalizeProgressPayload({ health: 0 }).health, 0)
    assert.equal(normalizeProgressPayload({ health: 3 }).health, 3)
    for (const health of [-1, 7, 2.5, '3', null]) assert.equal(normalizeProgressPayload({ health }).health, 6, String(health))
    assert.equal(normalizeProgressPayload({ deathCause: 'chapa' }).deathCause, 'chapa')
    for (const deathCause of ['', 'x'.repeat(33), 5, {}, undefined]) {
      assert.equal(normalizeProgressPayload({ deathCause }).deathCause, null, String(deathCause))
    }
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
        visitedRoomIds: [],
        roomStates: {},
        health: 6,
        deathCause: null,
        forks: 1,
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
      visitedRoomIds: [],
      roomStates: {},
      health: 6,
      deathCause: null,
      forks: 1,
    })
  })

  test('inclui a vida, a causa da morte e o estado das salas', () => {
    const snapshot = createProgressSnapshot({
      player: { x: 200, y: 330 },
      health: 3,
      deathCause: 'chapa',
      roomStates: { '3-3': { removed: ['2-1'], hits: 0 } },
    })
    assert.equal(snapshot.health, 3)
    assert.equal(snapshot.deathCause, 'chapa')
    assert.deepEqual(snapshot.roomStates, { '3-3': { removed: ['2-1'], hits: 0, unlocked: false } })
  })

  test('inclui as salas visitadas', () => {
    const snapshot = createProgressSnapshot({ player: { x: 200, y: 330 }, visitedRoomIds: ['3-3', '3-4'] })
    assert.deepEqual(snapshot.visitedRoomIds, ['3-3', '3-4'])
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

describe('garfos e salas trancadas no progresso', () => {
  test('forks: inteiro de 0 a 99; save antigo (sem o campo) começa com 1', () => {
    assert.equal(normalizeProgressPayload({}).forks, 1)
    assert.equal(normalizeProgressPayload({ forks: 0 }).forks, 0)
    assert.equal(normalizeProgressPayload({ forks: 3 }).forks, 3)
    assert.equal(normalizeProgressPayload({ forks: -2 }).forks, 0)
    assert.equal(normalizeProgressPayload({ forks: 500 }).forks, 99)
    assert.equal(normalizeProgressPayload({ forks: 2.5 }).forks, 1)
    assert.equal(normalizeProgressPayload({ forks: '2' }).forks, 1)
  })

  test('a sala aberta com garfo vai para o save, mesmo sem nada quebrado; só true conta', () => {
    const { roomStates } = normalizeProgressPayload({
      roomStates: { '4-2': { removed: [], hits: 0, unlocked: true }, '5-3': { removed: [], hits: 0, unlocked: 'sim' } },
    })
    assert.deepEqual(roomStates, { '4-2': { removed: [], hits: 0, unlocked: true } })
  })
})
