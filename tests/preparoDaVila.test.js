import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { faixasParaPreparar } from '../src/audio/music/mesaDoJogo.js'

const contexto = (mudancas = {}) => ({
  seed: 1, floorNumber: 2, roomType: 'comum', floorChange: false, bossPhase: 1, bossState: 'luta', palco: null, paused: false, dead: false, finished: false, ...mudancas,
})

describe('a "A Vila Espera" fica pronta quando a run acaba', () => {
  test('na morte e no fim da run, pede só a Vila', () => {
    assert.deepEqual(faixasParaPreparar(contexto({ dead: true }), null), ['a-vila-espera'])
    assert.deepEqual(faixasParaPreparar(contexto({ finished: true }), null), ['a-vila-espera'])
  })

  test('durante a run, pede a faixa do andar e a do próximo (cada andar tem a sua)', () => {
    // Nos andares, o chefe do andar também fica pronto (o beco do chefe é longe, e a faixa já está lá)
    assert.deepEqual(faixasParaPreparar(contexto(), 'andar-cucina'), ['andar-cucina', 'andar-piazza', 'chefe'])
    assert.deepEqual(faixasParaPreparar(contexto({ floorNumber: 4 }), 'andar-pastificio'), ['andar-pastificio', 'andar-porto', 'chefe'])
    assert.deepEqual(faixasParaPreparar(contexto({ floorNumber: 5 }), 'andar-porto'), ['andar-porto', 'chefe-final'])
  })
})
