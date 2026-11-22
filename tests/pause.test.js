import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { canPauseRun, getEffectivePauseState, togglePauseView } from '../src/utils/pause.js'

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

  test('ESC alterna entre fechado e menu sem alterar outros estados', () => {
    assert.equal(togglePauseView('closed'), 'menu')
    assert.equal(togglePauseView('menu'), 'closed')
    assert.equal(togglePauseView('options'), 'closed')
  })

  test('perda de foco mantém pausa efetiva até o jogador retomar', () => {
    assert.equal(getEffectivePauseState({ pauseView: 'closed', windowPaused: true }), true)
    assert.equal(getEffectivePauseState({ pauseView: 'menu', windowPaused: false }), true)
    assert.equal(getEffectivePauseState({ pauseView: 'closed', windowPaused: false }), false)
  })
})
