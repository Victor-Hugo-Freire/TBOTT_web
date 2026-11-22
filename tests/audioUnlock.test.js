import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { installAudioUnlock } from '../src/context/audioUnlock.js'

const flushPromises = () => new Promise((resolve) => setImmediate(resolve))

function createTarget() {
  const listeners = new Map()
  return {
    listeners,
    addEventListener(type, listener) {
      if (!listeners.has(type)) listeners.set(type, new Set())
      listeners.get(type).add(listener)
    },
    removeEventListener(type, listener) {
      listeners.get(type)?.delete(listener)
    },
    dispatch(type, event = {}) {
      for (const listener of [...(listeners.get(type) || [])]) {
        listener({ type, repeat: false, ...event })
      }
    },
  }
}

describe('desbloqueio global de áudio', () => {
  test('desbloqueia na primeira interação por teclado', async () => {
    const target = createTarget()
    let unlockCalls = 0

    installAudioUnlock(target, async () => {
      unlockCalls += 1
      return { unlocked: true, reason: 'running' }
    })
    target.dispatch('keydown')
    await flushPromises()

    assert.equal(unlockCalls, 1)
    assert.equal(target.listeners.get('keydown')?.size || 0, 0)
    assert.equal(target.listeners.get('pointerdown')?.size || 0, 0)
  })

  test('desbloqueia na primeira interação por ponteiro', async () => {
    const target = createTarget()
    let unlockCalls = 0

    installAudioUnlock(target, async () => {
      unlockCalls += 1
      return { unlocked: true, reason: 'running' }
    })
    target.dispatch('pointerdown')
    await flushPromises()

    assert.equal(unlockCalls, 1)
    assert.equal(target.listeners.get('keydown')?.size || 0, 0)
    assert.equal(target.listeners.get('pointerdown')?.size || 0, 0)
  })

  test('mantém os listeners após falha e permite retry na próxima interação', async () => {
    const target = createTarget()
    let unlockCalls = 0

    installAudioUnlock(target, async () => {
      unlockCalls += 1
      return unlockCalls === 1
        ? { unlocked: false, reason: 'blocked' }
        : { unlocked: true, reason: 'resumed' }
    })

    target.dispatch('pointerdown')
    await flushPromises()

    assert.equal(unlockCalls, 1)
    assert.equal(target.listeners.get('keydown')?.size || 0, 1)
    assert.equal(target.listeners.get('pointerdown')?.size || 0, 1)

    target.dispatch('keydown')
    await flushPromises()

    assert.equal(unlockCalls, 2)
    assert.equal(target.listeners.get('keydown')?.size || 0, 0)
    assert.equal(target.listeners.get('pointerdown')?.size || 0, 0)
  })

  test('ignora keydown repetido e remove os listeners no cleanup', () => {
    const target = createTarget()
    let unlockCalls = 0

    const cleanup = installAudioUnlock(target, () => { unlockCalls += 1 })
    target.dispatch('keydown', { repeat: true })

    assert.equal(unlockCalls, 0)
    assert.equal(target.listeners.get('keydown')?.size || 0, 1)

    cleanup()
    assert.equal(target.listeners.get('keydown')?.size || 0, 0)
    assert.equal(target.listeners.get('pointerdown')?.size || 0, 0)
  })

  test('evita chamadas simultâneas enquanto o unlock está pendente', async () => {
    const target = createTarget()
    let unlockCalls = 0
    let resolveUnlock

    installAudioUnlock(target, () => {
      unlockCalls += 1
      return new Promise((resolve) => { resolveUnlock = resolve })
    })

    target.dispatch('keydown')
    target.dispatch('pointerdown')

    await flushPromises()
    assert.equal(unlockCalls, 1)

    resolveUnlock({ unlocked: true, reason: 'resumed' })
    await flushPromises()

    assert.equal(target.listeners.get('keydown')?.size || 0, 0)
    assert.equal(target.listeners.get('pointerdown')?.size || 0, 0)
  })

  test('cleanup ignora o resultado de uma tentativa pendente', async () => {
    const target = createTarget()
    let resolveUnlock

    const cleanup = installAudioUnlock(target, () => (
      new Promise((resolve) => { resolveUnlock = resolve })
    ))

    target.dispatch('pointerdown')
    await flushPromises()
    cleanup()
    resolveUnlock({ unlocked: true, reason: 'resumed' })
    await flushPromises()

    assert.equal(target.listeners.get('keydown')?.size || 0, 0)
    assert.equal(target.listeners.get('pointerdown')?.size || 0, 0)
  })

  test('exceção mantém listeners para uma interação futura', async () => {
    const target = createTarget()
    let unlockCalls = 0

    installAudioUnlock(target, async () => {
      unlockCalls += 1
      throw new Error('bloqueado')
    })

    target.dispatch('pointerdown')
    await flushPromises()

    assert.equal(unlockCalls, 1)
    assert.equal(target.listeners.get('keydown')?.size || 0, 1)
    assert.equal(target.listeners.get('pointerdown')?.size || 0, 1)
  })

  test('resultado terminal remove os listeners', async () => {
    const target = createTarget()

    installAudioUnlock(target, async () => ({
      unlocked: false,
      reason: 'unsupported',
    }))

    target.dispatch('pointerdown')
    await flushPromises()

    assert.equal(target.listeners.get('keydown')?.size || 0, 0)
    assert.equal(target.listeners.get('pointerdown')?.size || 0, 0)
  })
})
