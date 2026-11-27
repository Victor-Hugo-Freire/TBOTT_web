import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import {
  BOSS_ATTACK_SOUND_CUES,
  captureBossAudioState,
  getBossInteractionSounds,
} from '../src/audio/AudioEffects/Boses/bossInteractionEffects.js'
import {
  BOSS_EFFECTS,
  registerBossEffects,
  unregisterBossEffects,
} from '../src/audio/AudioEffects/Boses/index.js'

const BOSS_IDS = [
  'cinquecento-turbo',
  'tralalero-tralala',
  'chimpanzini-bananini',
  'nonna-lasagnona',
  'brr-brr-patapim',
  'ballerina-cappuccina',
  'bombardiro-crocodilo',
  'cappuccino-assassino',
]

function target(overrides = {}) {
  return {
    id: 'boss-1',
    enemyId: 'cinquecento-turbo',
    boss: true,
    animation: 'parado',
    health: 100,
    dead: false,
    ...overrides,
  }
}

describe('efeitos sonoros dos chefes', () => {
  test('registra efeitos distintos para os oito chefes e sintetiza áudio não silencioso', () => {
    const registered = new Map()
    const manager = {
      registerEffect(name, createSource, options) {
        registered.set(name, { createSource, options })
      },
      unregisterEffect(name) {
        registered.delete(name)
      },
    }

    registerBossEffects(manager)
    const expectedNames = new Set(BOSS_IDS.flatMap((id) => [
      ...['aviso', 'dano', 'morte', 'ataque'].map((cue) => `boss-${id}-${cue}`),
      ...BOSS_ATTACK_SOUND_CUES[id].map((cue) => `boss-${id}-${cue}`),
    ]))
    assert.equal(BOSS_EFFECTS.length, expectedNames.size)
    assert.equal(registered.size, expectedNames.size)
    assert.equal(new Set(BOSS_EFFECTS.map(({ name }) => name)).size, BOSS_EFFECTS.length)
    assert.deepEqual(Object.keys(BOSS_ATTACK_SOUND_CUES).sort(), [...BOSS_IDS].sort())

    const context = {
      sampleRate: 22050,
      createBuffer(channelCount, length, sampleRate) {
        const channels = Array.from({ length: channelCount }, () => new Float32Array(length))
        return { length, sampleRate, getChannelData(index) { return channels[index] } }
      },
      createBufferSource() { return { buffer: null } },
    }
    for (const [name, effect] of registered) {
      const source = effect.createSource(context)
      const samples = source.buffer.getChannelData(0)
      assert.ok(samples.length > 0, `${name} deve criar áudio`)
      assert.ok(samples.some((sample) => Math.abs(sample) > 0.0001), `${name} não deve gerar silêncio`)
    }

    unregisterBossEffects(manager)
    assert.equal(registered.size, 0)
  })

  test('detecta aviso, dano e morte; ignora clones e prioriza morte no mesmo quadro', () => {
    const previous = captureBossAudioState({
      targets: [target(), target({ id: 'clone', boss: false, clone: true })],
    })
    const next = captureBossAudioState({
      targets: [
        target({ health: 90, animation: 'investida' }),
        target({ id: 'clone', boss: false, clone: true, health: 50, animation: 'atacando' }),
      ],
    })

    assert.deepEqual(getBossInteractionSounds(previous, next), [
      'boss-cinquecento-turbo-dano',
      'boss-cinquecento-turbo-aviso',
    ])

    const dead = captureBossAudioState({ targets: [target({ health: 0, dead: true })] })
    assert.deepEqual(getBossInteractionSounds(previous, dead), ['boss-cinquecento-turbo-morte'])
  })

  test('emite efeitos por hit e cues de ataque uma única vez por sequência', () => {
    const previous = captureBossAudioState({
      targets: [],
      player: { lastDamageEvent: { sequence: 4, cause: 'wall' } },
      bossEvents: [],
      bossEventSequence: 6,
    })
    const next = captureBossAudioState({
      targets: [],
      player: { lastDamageEvent: { sequence: 5, cause: 'bombardiro-crocodilo' } },
      bossEvents: [
        { enemyId: 'bombardiro-crocodilo', cue: 'explosao', sequence: 7 },
        { enemyId: 'cappuccino-assassino', cue: 'teleporte', sequence: 8 },
        { enemyId: 'bombardiro-crocodilo', cue: 'desconhecido', sequence: 9 },
      ],
      bossEventSequence: 9,
    })

    assert.deepEqual(getBossInteractionSounds(previous, next), [
      'boss-bombardiro-crocodilo-ataque',
      'boss-bombardiro-crocodilo-explosao',
      'boss-cappuccino-assassino-teleporte',
    ])
    assert.deepEqual(getBossInteractionSounds(next, next), [])
  })

  test('toca dano e desaparecimento dos clones do Cappuccino sem repetir cues', () => {
    const initial = captureBossAudioState({
      targets: [target({ id: 'clone-1', boss: false, clone: true, enemyId: 'cappuccino-assassino', health: 2 })],
    })
    const damaged = captureBossAudioState({
      targets: [target({ id: 'clone-1', boss: false, clone: true, enemyId: 'cappuccino-assassino', health: 1 })],
    })
    const dead = captureBossAudioState({
      targets: [target({ id: 'clone-1', boss: false, clone: true, enemyId: 'cappuccino-assassino', health: 0, dead: true })],
    })

    assert.deepEqual(getBossInteractionSounds(initial, damaged), [
      'boss-cappuccino-assassino-clone-dano',
    ])
    assert.deepEqual(getBossInteractionSounds(damaged, dead), [
      'boss-cappuccino-assassino-clone-dissolver',
    ])
    assert.deepEqual(getBossInteractionSounds(dead, dead), [])
  })
})
