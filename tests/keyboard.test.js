import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { isAdvanceKey } from '../src/utils/keyboard.js'

// Evento de teclado simplificado, só com o que isAdvanceKey usa
function keyEvent(key, extra = {}) {
  return { key, repeat: false, isComposing: false, ctrlKey: false, altKey: false, metaKey: false, shiftKey: false, ...extra }
}

describe('isAdvanceKey (tela inicial)', () => {
  test('aceita letras, números, Enter, Espaço e outras teclas comuns', () => {
    for (const key of ['a', 'Z', 'ç', '7', 'Enter', ' ', 'ArrowUp', 'Backspace', 'Delete', 'Dead']) {
      assert.equal(isAdvanceKey(keyEvent(key)), true, `"${key}" deveria avançar`)
    }
  })

  test('aceita letra digitada com Shift (maiúscula)', () => {
    assert.equal(isAdvanceKey(keyEvent('A', { shiftKey: true })), true)
  })

  test('ignora F1 a F12, incluindo o F5', () => {
    for (let number = 1; number <= 12; number++) {
      assert.equal(isAdvanceKey(keyEvent(`F${number}`)), false, `F${number} não deveria avançar`)
    }
  })

  test('ignora Ctrl, Alt, Shift e Meta (Windows) pressionadas sozinhas', () => {
    assert.equal(isAdvanceKey(keyEvent('Control', { ctrlKey: true })), false)
    assert.equal(isAdvanceKey(keyEvent('Alt', { altKey: true })), false)
    assert.equal(isAdvanceKey(keyEvent('AltGraph')), false)
    assert.equal(isAdvanceKey(keyEvent('Shift', { shiftKey: true })), false)
    assert.equal(isAdvanceKey(keyEvent('Meta', { metaKey: true })), false)
    assert.equal(isAdvanceKey(keyEvent('OS')), false)
  })

  test('ignora combinações com Ctrl, Alt ou Meta', () => {
    assert.equal(isAdvanceKey(keyEvent('a', { ctrlKey: true })), false) // Ctrl+A
    assert.equal(isAdvanceKey(keyEvent('Tab', { altKey: true })), false) // Alt+Tab
    assert.equal(isAdvanceKey(keyEvent('r', { metaKey: true })), false) // Windows+R
    assert.equal(isAdvanceKey(keyEvent('I', { ctrlKey: true, shiftKey: true })), false) // Ctrl+Shift+I
    assert.equal(isAdvanceKey(keyEvent('Enter', { altKey: true })), false) // Alt+Enter
  })

  test('ignora Tab, Escape e teclas de trava e sistema', () => {
    for (const key of ['Tab', 'Escape', 'CapsLock', 'NumLock', 'ScrollLock', 'ContextMenu', 'PrintScreen', 'Pause']) {
      assert.equal(isAdvanceKey(keyEvent(key)), false, `"${key}" não deveria avançar`)
    }
  })

  test('ignora a repetição de uma tecla segurada', () => {
    assert.equal(isAdvanceKey(keyEvent('a', { repeat: true })), false)
    assert.equal(isAdvanceKey(keyEvent('Enter', { repeat: true })), false)
  })

  test('ignora eventos que não representam uma tecla válida', () => {
    assert.equal(isAdvanceKey(keyEvent(undefined)), false)
    assert.equal(isAdvanceKey(keyEvent('Unidentified')), false)
    assert.equal(isAdvanceKey(keyEvent('Process')), false)
    assert.equal(isAdvanceKey(keyEvent('a', { isComposing: true })), false)
  })
})
