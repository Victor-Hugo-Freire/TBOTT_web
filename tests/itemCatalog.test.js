import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { ITEM_SPRITES } from '../src/data/itemSprites.js'
import { buildItemCatalog } from '../src/utils/itemCatalog.js'

// Formato de um item na resposta de GET /api/catalog
function apiItem(id, effect = { trigger: 'golpe' }) {
  return { id, name: `Item ${id}`, rarity: 'comum', effect, roomTypes: ['tesouro'], price: null }
}

const ALL_IDS = Object.keys(ITEM_SPRITES)

describe('buildItemCatalog (itens da API por id)', () => {
  test('os 12 itens com sprite entram, por id, com os dados da API', () => {
    const { items, missingSprite, missingInCatalog } = buildItemCatalog(ALL_IDS.map((id) => apiItem(id)))
    assert.equal(ALL_IDS.length, 12)
    assert.deepEqual(Object.keys(items), ALL_IDS)
    assert.deepEqual(items.tiramisu, apiItem('tiramisu'))
    assert.deepEqual([missingSprite, missingInCatalog], [[], []])
  })

  test('item do catálogo sem sprite no jogo fica de fora e é anotado', () => {
    const { items, missingSprite } = buildItemCatalog([...ALL_IDS.map((id) => apiItem(id)), apiItem('item-novo')])
    assert.equal(items['item-novo'], undefined)
    assert.deepEqual(missingSprite, ['item-novo'])
  })

  test('sprite sem item no catálogo também é anotado', () => {
    const { items, missingInCatalog } = buildItemCatalog([apiItem('tiramisu')])
    assert.deepEqual(Object.keys(items), ['tiramisu'])
    assert.equal(missingInCatalog.length, 11)
    assert.ok(!missingInCatalog.includes('tiramisu'))
  })

  test('a ordem é a da API (por nome)', () => {
    const { items } = buildItemCatalog([apiItem('tiramisu'), apiItem('batuta-do-maestro')])
    assert.deepEqual(Object.keys(items), ['tiramisu', 'batuta-do-maestro'])
  })

  test('resposta estranha não quebra: lista vazia e entradas inválidas são ignoradas', () => {
    for (const value of [undefined, null, {}, 'x']) {
      const { items, missingInCatalog } = buildItemCatalog(value)
      assert.deepEqual(items, {}, String(value))
      assert.equal(missingInCatalog.length, 12)
    }
    assert.deepEqual(Object.keys(buildItemCatalog([null, 3, { id: 7 }, apiItem('mucarela')]).items), ['mucarela'])
  })

  test('efeito ausente ou em formato estranho vira um efeito vazio', () => {
    for (const effect of [null, undefined, 'x', [1, 2]]) {
      const item = { ...apiItem('mucarela'), effect }
      assert.deepEqual(buildItemCatalog([item]).items.mucarela.effect, {}, String(effect))
    }
  })
})
