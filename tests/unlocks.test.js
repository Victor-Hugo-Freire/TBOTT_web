import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { UNLOCK_HINTS } from '../src/data/characterUnlocks.js'
import { isCharacterLocked } from '../src/utils/unlocks.js'

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
