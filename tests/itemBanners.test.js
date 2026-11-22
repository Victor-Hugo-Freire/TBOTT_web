import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { ITEM_BANNERS } from '../src/data/itemBanners.js'
import { ITEM_SPRITES } from '../src/data/itemSprites.js'
import { removeAccents, SMALL_FONT } from '../src/utils/pixelFont.js'

describe('frases do banner dos itens', () => {
  test('todo item com sprite tem frase, e só ele', () => {
    assert.deepEqual(Object.keys(ITEM_BANNERS).sort(), Object.keys(ITEM_SPRITES).sort())
  })

  test('as frases são curtas, para caber numa linha da faixa', () => {
    for (const [id, text] of Object.entries(ITEM_BANNERS)) assert.ok(text.length > 0 && text.length <= 32, id)
  })
})

describe('nome do item na faixa (fonte em pixel do jogo)', () => {
  test('sem os acentos, todo nome do catálogo só usa letras que a fonte tem', () => {
    const names = ['Batuta do Maestro', 'Café Duplo', 'Caldo da Mamãe', 'Chifre da Sorte', 'Concha Longa', 'Dente de Tubarão']
    names.push('Elixir Elétrico', 'Muçarela', 'Palitos de Pão', 'Parmesão Curado', 'Rolo de Bronze', 'Tiramisu')
    for (const name of names) {
      for (const char of removeAccents(name)) assert.ok(char.toUpperCase() in SMALL_FONT.glyphs, `${name}: "${char}"`)
    }
  })
})

describe('removeAccents (a fonte não tem acentos)', () => {
  test('troca as letras acentuadas dos nomes dos itens pela letra sem acento', () => {
    assert.equal(removeAccents('Café Duplo'), 'Cafe Duplo')
    assert.equal(removeAccents('Muçarela'), 'Mucarela')
    assert.equal(removeAccents('Parmesão Curado'), 'Parmesao Curado')
    assert.equal(removeAccents('Elixir Elétrico'), 'Elixir Eletrico')
    assert.equal(removeAccents('Caldo da Mamãe'), 'Caldo da Mamae')
  })

  test('maiúsculas acentuadas também, e o resto do texto não muda', () => {
    assert.equal(removeAccents('ÁGUA, PÃO!'), 'aGUA, PaO!')
    assert.equal(removeAccents('Tiramisu 4'), 'Tiramisu 4')
  })
})
