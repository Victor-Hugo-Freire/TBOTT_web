import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { AudioManager, ganhoDoVolume } from '../src/audio/AudioManager.js'

const db = (ganho) => 20 * Math.log10(ganho)

describe('curva de volume das Opções', () => {
  test('é perceptiva: 1% praticamente mudo, 10% baixo, 50% no meio e 100% cheio', () => {
    assert.equal(ganhoDoVolume(0), 0)
    assert.ok(db(ganhoDoVolume(1)) <= -79, `1% = ${db(ganhoDoVolume(1)).toFixed(1)} dB`)
    assert.ok(Math.abs(db(ganhoDoVolume(10)) + 40) < 0.01)
    assert.ok(Math.abs(db(ganhoDoVolume(50)) + 12.04) < 0.01)
    assert.equal(ganhoDoVolume(100), 1)
  })

  test('sobe sempre e não sai de 0 a 1, mesmo com valores fora da faixa', () => {
    let anterior = -1
    for (let volume = 0; volume <= 100; volume++) {
      const ganho = ganhoDoVolume(volume)
      assert.ok(ganho > anterior || (volume === 0 && ganho === 0))
      anterior = ganho
    }
    assert.equal(ganhoDoVolume(-10), 0)
    assert.equal(ganhoDoVolume(150), 1)
  })

  test('o AudioManager aplica a curva no volume de música e no de efeitos', () => {
    const ganhos = []
    const contexto = {
      state: 'running',
      destination: {},
      createGain() {
        const ganho = { gain: { value: 1 }, connect() {}, disconnect() {} }
        ganhos.push(ganho)
        return ganho
      },
    }
    const manager = new AudioManager({ createContext: () => contexto, fallbackOptions: { musicVolume: 50, effectsVolume: 10 } })
    manager.registerMusic('faixa', () => ({ connect() {}, start() {}, stop() {} }))
    manager.playMusic('faixa', { fadeMs: 0 })
    const [, efeitos, musica] = ganhos
    assert.equal(musica.gain.value, 0.25)
    assert.ok(Math.abs(efeitos.gain.value - 0.01) < 1e-12)
    manager.setMusicVolume(1)
    assert.ok(Math.abs(musica.gain.value - 0.0001) < 1e-12)
  })
})
