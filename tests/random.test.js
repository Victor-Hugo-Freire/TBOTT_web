import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { chance, createRandom, createRunSeed, mixSeed, pick, randomInt, shuffle } from '../src/utils/random.js'

const take = (random, count) => Array.from({ length: count }, () => random())

describe('createRandom (sorteio com seed)', () => {
  test('a mesma seed gera sempre a mesma sequência', () => {
    assert.deepEqual(take(createRandom(42), 20), take(createRandom(42), 20))
  })

  test('seeds diferentes geram sequências diferentes', () => {
    assert.notDeepEqual(take(createRandom(1), 10), take(createRandom(2), 10))
  })

  test('os números ficam entre 0 (incluído) e 1 (excluído)', () => {
    for (const value of take(createRandom(7), 5000)) assert.ok(value >= 0 && value < 1)
  })

  test('aceita a seed máxima de 32 bits e números negativos', () => {
    assert.ok(createRandom(4294967295)() < 1)
    assert.deepEqual(take(createRandom(-1), 5), take(createRandom(4294967295), 5))
  })
})

describe('ajudantes do sorteio', () => {
  test('randomInt fica entre min e max e sorteia os dois extremos', () => {
    const random = createRandom(3)
    const values = new Set(Array.from({ length: 500 }, () => randomInt(random, 2, 5)))
    assert.deepEqual([...values].sort(), [2, 3, 4, 5])
  })

  test('chance 0 nunca acontece e chance 1 sempre acontece', () => {
    const random = createRandom(9)
    for (let i = 0; i < 100; i++) {
      assert.equal(chance(random, 0), false)
      assert.equal(chance(random, 1), true)
    }
  })

  test('pick escolhe um item da lista', () => {
    const random = createRandom(5)
    for (let i = 0; i < 50; i++) assert.ok(['a', 'b', 'c'].includes(pick(random, ['a', 'b', 'c'])))
  })

  test('shuffle devolve os mesmos itens em outra ordem, sem mudar a lista original', () => {
    const list = [1, 2, 3, 4, 5, 6, 7, 8]
    const shuffled = shuffle(createRandom(11), list)
    assert.deepEqual([...shuffled].sort(), list)
    assert.deepEqual(list, [1, 2, 3, 4, 5, 6, 7, 8])
    assert.deepEqual(shuffle(createRandom(11), list), shuffled)
  })
})

describe('mixSeed e createRunSeed', () => {
  test('a mesma seed com números diferentes dá seeds diferentes, sempre iguais para os mesmos dados', () => {
    const seeds = [1, 2, 3, 4, 5].map((floor) => mixSeed(123456, floor))
    assert.equal(new Set(seeds).size, 5)
    assert.deepEqual(seeds, [1, 2, 3, 4, 5].map((floor) => mixSeed(123456, floor)))
  })

  test('as seeds são inteiros de 32 bits sem sinal', () => {
    for (const seed of [0, 1, 4294967295, mixSeed(9, 9), createRunSeed()]) {
      assert.ok(Number.isInteger(seed) && seed >= 0 && seed <= 4294967295, String(seed))
    }
  })
})
