import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { CHARACTER_STATS } from '../src/data/characterStats.js'
import { getBaseStats, getPlayerStats, STAT_LIMITS } from '../src/utils/stats.js'

const TUNG = getBaseStats('tung-tung-sahur')

describe('ficha do personagem', () => {
  test('o Tung Tung: golpe de 3, velocidades normais, 3 corações, 1 s de invencibilidade, golpe de tamanho normal e não voa', () => {
    assert.deepEqual(TUNG, { name: 'Tung Tung Sahur', damage: 3, moveSpeed: 1, attackSpeed: 1, maxHealth: 6, invincibilityMs: 1000, attackArea: 1, flying: false })
  })

  test('o Sabor (garrafa lenta e resistente) e o God (rápido, frágil e voa) têm a ficha combinada', () => {
    assert.deepEqual(getBaseStats('tung-tung-sabor'), { name: 'Tung Tung Sabor', damage: 3, moveSpeed: 0.9, attackSpeed: 0.9, maxHealth: 8, invincibilityMs: 1000, attackArea: 1, flying: false })
    assert.deepEqual(getBaseStats('tung-tung-god'), { name: 'Tung Tung God', damage: 2.5, moveSpeed: 1.1, attackSpeed: 1, maxHealth: 4, invincibilityMs: 1000, attackArea: 1, flying: true })
  })

  test('só o God voa, e as fichas dos três ficam dentro dos limites', () => {
    for (const [id, stats] of Object.entries(CHARACTER_STATS)) {
      assert.equal(stats.flying, id === 'tung-tung-god', id)
      for (const [name, { min, max }] of Object.entries(STAT_LIMITS)) assert.ok(stats[name] >= min && stats[name] <= max, id + ' ' + name)
    }
  })

  test('id sem ficha (save antigo ou personagem que ainda não existe) usa a do Tung Tung', () => {
    for (const id of ['x', undefined, null, '']) assert.equal(getBaseStats(id), CHARACTER_STATS['tung-tung-sahur'], String(id))
  })

  test('a ficha do Tung fica dentro dos limites', () => {
    for (const [name, { min, max }] of Object.entries(STAT_LIMITS)) {
      assert.ok(TUNG[name] >= min && TUNG[name] <= max, name)
    }
  })
})

describe('getPlayerStats (atributos com bônus)', () => {
  test('sem bônus, os atributos são a ficha', () => {
    assert.deepEqual(getPlayerStats(TUNG), TUNG)
    assert.deepEqual(getPlayerStats(TUNG, []), TUNG)
  })

  test('bônus que somam: velocidades do golpe de itens diferentes se somam', () => {
    const stats = getPlayerStats(TUNG, [
      { stat: 'attackSpeed', add: 0.4 },
      { stat: 'attackSpeed', add: 0.25 },
    ])
    assert.ok(Math.abs(stats.attackSpeed - 1.65) < 1e-9)
  })

  test('bônus que multiplicam: 1,05 e 1,4 dão 1,47', () => {
    const stats = getPlayerStats(TUNG, [
      { stat: 'moveSpeed', multiply: 1.05 },
      { stat: 'moveSpeed', multiply: 1.4 },
    ])
    assert.ok(Math.abs(stats.moveSpeed - 1.47) < 1e-9)
  })

  test('primeiro somam, depois multiplicam (a ordem da lista não importa)', () => {
    const multiplyFirst = getPlayerStats(TUNG, [
      { stat: 'attackSpeed', multiply: 1.2 },
      { stat: 'attackSpeed', add: 0.5 },
    ])
    assert.ok(Math.abs(multiplyFirst.attackSpeed - 1.8) < 1e-9, '(1 + 0,5) x 1,2')
  })

  test('vida máxima menor: o bônus negativo tira meios corações', () => {
    assert.equal(getPlayerStats(TUNG, [{ stat: 'maxHealth', add: -2 }]).maxHealth, 4)
  })

  test('nenhum bônus passa dos limites', () => {
    const high = getPlayerStats(TUNG, [
      { stat: 'damage', add: 100 },
      { stat: 'moveSpeed', multiply: 10 },
      { stat: 'attackSpeed', add: 5 },
      { stat: 'maxHealth', add: 40 },
      { stat: 'invincibilityMs', multiply: 10 },
      { stat: 'attackArea', multiply: 10 },
    ])
    const low = getPlayerStats(TUNG, [
      { stat: 'damage', add: -100 },
      { stat: 'moveSpeed', multiply: 0.01 },
      { stat: 'attackSpeed', add: -5 },
      { stat: 'maxHealth', add: -40 },
      { stat: 'invincibilityMs', multiply: 0.01 },
      { stat: 'attackArea', multiply: 0.01 },
    ])
    for (const [name, { min, max }] of Object.entries(STAT_LIMITS)) {
      assert.equal(high[name], max, `${name} no máximo`)
      assert.equal(low[name], min, `${name} no mínimo`)
    }
  })

  test('a ficha não muda', () => {
    const copy = { ...TUNG }
    getPlayerStats(TUNG, [{ stat: 'damage', add: 2 }])
    assert.deepEqual(TUNG, copy)
  })
})
