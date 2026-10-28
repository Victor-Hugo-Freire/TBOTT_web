import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { getMenuNavigationAction } from '../src/utils/menuKeyboard.js'

describe('getMenuNavigationAction (menu principal)', () => {
  test('W e seta para cima navegam pelas opções para cima', () => {
    assert.equal(getMenuNavigationAction('w'), 'up')
    assert.equal(getMenuNavigationAction('W'), 'up')
    assert.equal(getMenuNavigationAction('ArrowUp'), 'up')
  })

  test('S e seta para baixo navegam pelas opções para baixo', () => {
    assert.equal(getMenuNavigationAction('s'), 'down')
    assert.equal(getMenuNavigationAction('S'), 'down')
    assert.equal(getMenuNavigationAction('ArrowDown'), 'down')
  })

  test('D e seta para direita selecionam o cartão do usuário', () => {
    assert.equal(getMenuNavigationAction('d'), 'user')
    assert.equal(getMenuNavigationAction('D'), 'user')
    assert.equal(getMenuNavigationAction('ArrowRight'), 'user')
  })

  test('A e seta para esquerda selecionam o botão de voltar', () => {
    assert.equal(getMenuNavigationAction('a'), 'back')
    assert.equal(getMenuNavigationAction('A'), 'back')
    assert.equal(getMenuNavigationAction('ArrowLeft'), 'back')
  })

  test('teclas que não fazem parte da navegação são ignoradas', () => {
    assert.equal(getMenuNavigationAction('Enter'), null)
    assert.equal(getMenuNavigationAction(' '), null)
    assert.equal(getMenuNavigationAction(undefined), null)
  })
})
