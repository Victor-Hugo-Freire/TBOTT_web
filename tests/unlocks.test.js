import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { UNLOCK_HINTS } from '../src/data/characterUnlocks.js'
import {
  isCharacterLocked,
  PENDING_UNLOCKS_KEY,
  readPendingUnlocks,
  requestUnlock,
  sendPendingUnlocks,
} from '../src/utils/unlocks.js'

const SAHUR = { id: 'tung-tung-sahur', startsUnlocked: true }
const SABOR = { id: 'tung-tung-sabor', startsUnlocked: false }
const GOD = { id: 'tung-tung-god', startsUnlocked: false }

describe('isCharacterLocked (personagem bloqueado na seleção)', () => {
  test('o personagem que já começa liberado nunca fica bloqueado', () => {
    assert.equal(isCharacterLocked(SAHUR, []), false)
  })

  test('o que não começa liberado fica bloqueado até estar na lista de liberados', () => {
    assert.equal(isCharacterLocked(SABOR, []), true)
    assert.equal(isCharacterLocked(SABOR, ['tung-tung-sabor']), false)
    assert.equal(isCharacterLocked(GOD, ['tung-tung-sabor']), true)
  })

  test('com a API antiga (sem startsUnlocked), ninguém fica bloqueado', () => {
    assert.equal(isCharacterLocked({ id: 'tung-tung-god' }, []), false)
  })
})

describe('dicas de desbloqueio', () => {
  test('cada personagem que começa bloqueado tem a sua dica', () => {
    assert.ok(UNLOCK_HINTS[SABOR.id])
    assert.ok(UNLOCK_HINTS[GOD.id])
    assert.equal(UNLOCK_HINTS[SAHUR.id], undefined)
  })
})

// ---------- fila de desbloqueios ----------

// localStorage falso, só com o que a fila usa
function fakeStorage(initial = {}) {
  const data = { ...initial }
  return {
    data,
    getItem: (key) => data[key] ?? null,
    setItem: (key, value) => {
      data[key] = String(value)
    },
  }
}

// API falsa: guarda os ids que receberam POST. Um id que já foi liberado responde created: false, como a API de verdade.
function fakeApi({ failWith = null } = {}) {
  const api = { calls: [], unlocked: new Set() }
  api.post = async (id) => {
    api.calls.push(id)
    if (failWith) throw failWith
    const created = !api.unlocked.has(id)
    api.unlocked.add(id)
    return { unlock: { characterId: id }, created }
  }
  return api
}

describe('fila de desbloqueios (requestUnlock)', () => {
  test('libera o personagem, devolve que ele é novo e a fila fica vazia', async () => {
    const storage = fakeStorage()
    const api = fakeApi()
    assert.deepEqual(await requestUnlock('tung-tung-sabor', api.post, storage), ['tung-tung-sabor'])
    assert.deepEqual(api.calls, ['tung-tung-sabor'])
    assert.deepEqual(readPendingUnlocks(storage), [])
  })

  test('quem já tinha o personagem não recebe aviso (created: false), mas sai da fila', async () => {
    const storage = fakeStorage()
    const api = fakeApi()
    api.unlocked.add('tung-tung-god')
    assert.deepEqual(await requestUnlock('tung-tung-god', api.post, storage), [])
    assert.deepEqual(readPendingUnlocks(storage), [])
  })

  test('se a API falha, o id fica na fila (guardado no navegador) e a chamada não quebra a run', async () => {
    const storage = fakeStorage()
    const down = fakeApi({ failWith: new Error('Não foi possível conectar à API.') })
    assert.deepEqual(await requestUnlock('tung-tung-sabor', down.post, storage), [])
    assert.deepEqual(readPendingUnlocks(storage), ['tung-tung-sabor'])
    assert.equal(storage.data[PENDING_UNLOCKS_KEY], '["tung-tung-sabor"]')
  })

  test('a nova tentativa manda o que ficou na fila e avisa só quando ele é novo', async () => {
    const storage = fakeStorage()
    await requestUnlock('tung-tung-sabor', fakeApi({ failWith: Object.assign(new Error('503'), { status: 503 }) }).post, storage)
    const back = fakeApi()
    assert.deepEqual(await sendPendingUnlocks(back.post, storage), ['tung-tung-sabor'])
    assert.deepEqual(readPendingUnlocks(storage), [])
    assert.deepEqual(await sendPendingUnlocks(back.post, storage), [], 'fila vazia: nenhuma chamada nova')
    assert.deepEqual(back.calls, ['tung-tung-sabor'])
  })

  test('sessão vencida (401) e personagem ainda sem registro no banco (422) ficam na fila; corpo inválido (400) sai', async () => {
    for (const [status, stays] of [[401, true], [422, true], [503, true], [400, false]]) {
      const storage = fakeStorage()
      await requestUnlock('tung-tung-god', fakeApi({ failWith: Object.assign(new Error(`${status}`), { status }) }).post, storage)
      assert.equal(readPendingUnlocks(storage).includes('tung-tung-god'), stays, `status ${status}`)
    }
  })

  test('o mesmo id não entra duas vezes na fila e vários ids saem na ordem', async () => {
    const storage = fakeStorage()
    const down = fakeApi({ failWith: new Error('fora do ar') })
    await requestUnlock('tung-tung-sabor', down.post, storage)
    await requestUnlock('tung-tung-sabor', down.post, storage)
    await requestUnlock('tung-tung-god', down.post, storage)
    assert.deepEqual(readPendingUnlocks(storage), ['tung-tung-sabor', 'tung-tung-god'])
    const back = fakeApi()
    assert.deepEqual(await sendPendingUnlocks(back.post, storage), ['tung-tung-sabor', 'tung-tung-god'])
  })

  test('um id que entra na fila durante uma tentativa em andamento também é mandado', async () => {
    const storage = fakeStorage({ [PENDING_UNLOCKS_KEY]: '["tung-tung-sabor"]' })
    const api = fakeApi()
    const first = sendPendingUnlocks(api.post, storage) // a tentativa já leu a fila (só o Sabor)
    const second = requestUnlock('tung-tung-god', api.post, storage) // o God entra depois
    assert.deepEqual(await first, ['tung-tung-sabor'])
    assert.deepEqual(await second, ['tung-tung-god'])
    assert.deepEqual(api.calls.sort(), ['tung-tung-god', 'tung-tung-sabor'])
    assert.deepEqual(readPendingUnlocks(storage), [])
  })

  test('texto estragado no navegador ou sem localStorage valem fila vazia', () => {
    assert.deepEqual(readPendingUnlocks(fakeStorage({ [PENDING_UNLOCKS_KEY]: '{isso não é json' })), [])
    assert.deepEqual(readPendingUnlocks(fakeStorage({ [PENDING_UNLOCKS_KEY]: '{"a":1}' })), [])
    assert.deepEqual(readPendingUnlocks(fakeStorage({ [PENDING_UNLOCKS_KEY]: '[1, "tung-tung-god", ""]' })), ['tung-tung-god'])
    assert.deepEqual(readPendingUnlocks(undefined), [])
  })
})
