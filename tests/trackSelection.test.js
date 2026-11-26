import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { ROOM_TYPES } from '../src/utils/floorGenerator.js'
import {
  FAIXA_DO_MENU,
  FAIXAS_DOS_ANDARES,
  getFloorTrack,
  getPlannedTrack,
  getTrackForContext,
  isKnownTrack,
} from '../src/audio/music/trackSelection.js'

const SALAS_DO_ANDAR = ['inicial', 'comum', 'tesouro', 'adega']
const SALAS_PROPRIAS = { loja: 'loja', descanso: 'descanso', god: 'god', fliperama: 'fliperama', pacto: 'pacto' }
// O chefe e o palco têm faixas de sala (chefe.js e palco.js): veja salasDoChefeEPalco.test.js
const SALAS_DO_CHEFE_E_DO_PALCO = ['chefe', 'palco']
const FAIXAS_DAS_SALAS = ['chefe', 'chefe-fase2', 'chefe-vitoria', 'chefe-final', 'chefe-final-fase2', 'chefe-final-fase3', 'chefe-final-vitoria', 'palco', 'palco-show', 'palco-fim']
const TODAS = [...FAIXAS_DOS_ANDARES, ...Object.values(SALAS_PROPRIAS), ...FAIXAS_DAS_SALAS]

describe('seleção de faixa', () => {
  test('o plano cobre todos os tipos de sala do jogo', () => {
    assert.deepEqual([...SALAS_DO_ANDAR, ...SALAS_DO_CHEFE_E_DO_PALCO, ...Object.keys(SALAS_PROPRIAS)].sort(), [...ROOM_TYPES].sort())
  })

  for (let floorNumber = 1; floorNumber <= 5; floorNumber++) {
    test(`andar ${floorNumber}: salas comuns, tesouro e adega usam a faixa do andar`, () => {
      for (const roomType of SALAS_DO_ANDAR) {
        assert.equal(getPlannedTrack({ floorNumber, roomType }), FAIXAS_DOS_ANDARES[floorNumber - 1], roomType)
        assert.equal(getTrackForContext({ floorNumber, roomType }, TODAS), FAIXAS_DOS_ANDARES[floorNumber - 1], roomType)
      }
    })

    test(`andar ${floorNumber}: loja, descanso, God, fliperama e pacto têm faixa própria`, () => {
      for (const [roomType, faixa] of Object.entries(SALAS_PROPRIAS)) {
        assert.equal(getPlannedTrack({ floorNumber, roomType }), faixa)
        assert.equal(getTrackForContext({ floorNumber, roomType }, TODAS), faixa)
      }
    })
  }

  test('o chefe e o palco têm faixa própria (e o nome "chefe" é uma faixa conhecida)', () => {
    assert.equal(isKnownTrack('chefe'), true)
    for (let floorNumber = 1; floorNumber <= 5; floorNumber++) {
      assert.notEqual(getTrackForContext({ floorNumber, roomType: 'chefe' }, TODAS), FAIXAS_DOS_ANDARES[floorNumber - 1])
      assert.notEqual(getTrackForContext({ floorNumber, roomType: 'palco' }, TODAS), FAIXAS_DOS_ANDARES[floorNumber - 1])
    }
  })

  test('faixa ainda não composta: a sala usa a do andar, e o andar usa a Cantina', () => {
    const soCantina = ['a-vila-espera', 'andar-cantina']
    assert.equal(getTrackForContext({ floorNumber: 3, roomType: 'loja' }, soCantina), 'andar-cantina')
    assert.equal(getTrackForContext({ floorNumber: 4, roomType: 'comum' }, soCantina), 'andar-cantina')
    const comCucina = [...soCantina, 'andar-cucina']
    assert.equal(getTrackForContext({ floorNumber: 2, roomType: 'god' }, comCucina), 'andar-cucina')
    assert.equal(getFloorTrack(2, comCucina), 'andar-cucina')
    assert.equal(getFloorTrack(5, comCucina), 'andar-cantina')
  })

  test('andar fora da run (depois do último) não tem faixa', () => {
    assert.equal(getPlannedTrack({ floorNumber: 6, roomType: 'comum' }), null)
    assert.equal(getTrackForContext({ floorNumber: 6, roomType: 'comum' }, TODAS), null)
    assert.equal(getFloorTrack(0), null)
  })

  test('fora de /jogo toca a "A Vila Espera"', () => {
    for (const pathname of ['/', '/menu', '/ranking', '/opcoes', '/selecao-personagem']) {
      assert.equal(getTrackForContext({ pathname, floorNumber: 1, roomType: 'comum' }), FAIXA_DO_MENU)
    }
    assert.equal(getTrackForContext({ pathname: '/jogo', floorNumber: 1, roomType: 'comum' }), 'andar-cantina')
  })

  test('todas as faixas do plano estão no registro', () => {
    for (const faixa of TODAS) assert.equal(isKnownTrack(faixa), true, faixa)
  })
})
