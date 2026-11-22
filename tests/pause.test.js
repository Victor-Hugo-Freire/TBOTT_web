import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { canPauseRun } from '../src/utils/pause.js'

describe('regra da pausa', () => {
  test('permite pausar somente uma run ativa', () => {
    assert.equal(canPauseRun({ finished: false, death: null, transition: null, sleep: null }), true)
  })

  test('bloqueia transição, sono, morte e fim', () => {
    assert.equal(canPauseRun({ finished: false, death: null, transition: { type: 'room' }, sleep: null }), false)
    assert.equal(canPauseRun({ finished: false, death: null, transition: null, sleep: {} }), false)
    assert.equal(canPauseRun({ finished: false, death: { cause: 'teste' }, transition: null, sleep: null }), false)
    assert.equal(canPauseRun({ finished: true, death: null, transition: null, sleep: null }), false)
  })

  test('sem run (ainda carregando), não pausa', () => {
    assert.equal(canPauseRun(null), false)
  })
})
