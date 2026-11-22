import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { createAudioLifecycleCleanup } from '../src/context/audioLifecycle.js'

describe('ciclo de vida do gerenciador de áudio', () => {
  test('não destrói na limpeza simulada seguida de novo setup', async () => {
    let destroyCalls = 0
    const lifecycle = createAudioLifecycleCleanup(() => { destroyCalls += 1 })

    lifecycle.activate()
    lifecycle.deactivate()
    lifecycle.activate()
    await Promise.resolve()

    assert.equal(destroyCalls, 0)
  })

  test('destrói uma vez após o desmontamento real', async () => {
    let destroyCalls = 0
    const lifecycle = createAudioLifecycleCleanup(() => { destroyCalls += 1 })

    lifecycle.activate()
    lifecycle.deactivate()
    await Promise.resolve()

    assert.equal(destroyCalls, 1)
  })

  test('desmontagens reais consecutivas não destróem duas vezes', async () => {
    let destroyCalls = 0
    const lifecycle = createAudioLifecycleCleanup(() => { destroyCalls += 1 })

    lifecycle.activate()
    lifecycle.deactivate()
    lifecycle.deactivate()
    await Promise.resolve()

    assert.equal(destroyCalls, 1)
  })
})
