import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { getMenuNavigationAction } from '../src/utils/menuKeyboard.js'

describe('getMenuNavigationAction (menu principal)', () => {
  test('W navega pelas opções para cima', () => {
    assert.equal(getMenuNavigationAction('w'), 'up')
    assert.equal(getMenuNavigationAction('W'), 'up')
  })

  test('S navega pelas opções para baixo', () => {
    assert.equal(getMenuNavigationAction('s'), 'down')
    assert.equal(getMenuNavigationAction('S'), 'down')
  })

  test('D seleciona o cartão do usuário', () => {
    assert.equal(getMenuNavigationAction('d'), 'user')
    assert.equal(getMenuNavigationAction('D'), 'user')
  })

  test('A seleciona o botão de voltar', () => {
    assert.equal(getMenuNavigationAction('a'), 'back')
    assert.equal(getMenuNavigationAction('A'), 'back')
  })

  test('as setas navegam como o WASD', () => {
    assert.equal(getMenuNavigationAction('ArrowUp'), 'up')
    assert.equal(getMenuNavigationAction('ArrowDown'), 'down')
    assert.equal(getMenuNavigationAction('ArrowRight'), 'user')
    assert.equal(getMenuNavigationAction('ArrowLeft'), 'back')
  })

  test('teclas que não fazem parte da navegação são ignoradas', () => {
    assert.equal(getMenuNavigationAction('Enter'), null)
    assert.equal(getMenuNavigationAction(' '), null)
    assert.equal(getMenuNavigationAction(undefined), null)
  })
})
