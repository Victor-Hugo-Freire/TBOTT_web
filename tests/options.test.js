import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { DEFAULT_OPTIONS, parseOptions } from '../src/utils/options.js'

describe('parseOptions', () => {
  test('sem nada salvo usa o padrão', () => {
    assert.deepEqual(parseOptions(null), DEFAULT_OPTIONS)
    assert.deepEqual(parseOptions(''), DEFAULT_OPTIONS)
    assert.deepEqual(parseOptions('null'), DEFAULT_OPTIONS)
  })

  test('mantém os volumes válidos', () => {
    assert.deepEqual(parseOptions('{"musicVolume":0,"effectsVolume":35}'), { musicVolume: 0, effectsVolume: 35 })
  })

  test('limita o volume entre 0 e 100', () => {
    assert.deepEqual(parseOptions('{"musicVolume":150,"effectsVolume":-5}'), { musicVolume: 100, effectsVolume: 0 })
  })

  test('null, texto ou volume ausente voltam ao padrão em vez de virar 0', () => {
    assert.deepEqual(parseOptions('{"musicVolume":null,"effectsVolume":""}'), DEFAULT_OPTIONS)
    assert.deepEqual(parseOptions('{}'), DEFAULT_OPTIONS)
  })

  test('JSON quebrado lança erro', () => {
    assert.throws(() => parseOptions('{quebrado'))
  })
})
