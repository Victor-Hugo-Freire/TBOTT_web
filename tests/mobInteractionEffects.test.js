import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import {
  MOB_ATTACK_SOUND_CUES,
  captureMobAudioState,
  getMobInteractionSounds,
} from '../src/audio/AudioEffects/mobs/mobInteractionEffects.js'
import {
  MOB_EFFECTS,
  registerMobEffects,
  unregisterMobEffects,
} from '../src/audio/AudioEffects/mobs/index.js'
import { MOB_SOUND_PROFILES } from '../src/audio/AudioEffects/mobs/profileRegistry.js'
import { createProceduralAudioSource } from '../src/audio/AudioEffects/createProceduralAudioSource.js'

const MOB_IDS = [
  'cannolo-carica',
  'fenicottero-fornarino',
  'formaggino-saltellino',
  'moka-scudiera',
  'peperoncino-kamikaze',
  'pinguino-sorbettino',
  'pistacchio-sputacchio',
  'polpetta-sotterranea',
  'vespina-lambrettina',
  'zanzarina-tarantella',
]

function target(overrides = {}) {
  return {
    id: 'enemy-1',
    enemyId: 'cannolo-carica',
    animation: 'parado',
    health: 3,
    dead: false,
    ...overrides,
  }
}

describe('efeitos sonoros dos inimigos comuns', () => {
  test('aplica uma cauda suave sem cortar o som abruptamente', () => {
    const sampleRate = 10000
    const context = {
      sampleRate,
      createBuffer(channelCount, length, rate) {
        const channels = Array.from({ length: channelCount }, () => new Float32Array(length))
        return { getChannelData(index) { return channels[index] }, sampleRate: rate }
      },
      createBufferSource() { return { buffer: null } },
    }
    const source = createProceduralAudioSource(context, {
      duration: 0.2,
      frequency: 100,
      gain: 0.8,
      noise: 0,
      reverb: 0,
      attack: 0.008,
      release: 0.06,
      partials: [{ ratio: 1, level: 1, decay: 2 }],
    })
    const drySamples = Math.round(0.2 * sampleRate)
    const samples = source.buffer.getChannelData(0)

    assert.ok(Math.abs(samples[drySamples - 1]) < 0.001)
    assert.ok(Math.max(...samples.slice(0, drySamples - 1000).map(Math.abs)) > 0.1)
  })

  test('registra efeitos distintos de aviso, dano, morte e ataque para cada inimigo', () => {
    const registered = new Map()
    const manager = {
      registerEffect(name, createSource, options) {
        registered.set(name, { createSource, options })
      },
      unregisterEffect(name) {
        registered.delete(name)
      },
    }

    registerMobEffects(manager)
    const expectedEffectNames = MOB_IDS.flatMap((id) => [
      ...['aviso', 'dano', 'morte', 'ataque'].map((event) => `mob-${id}-${event}`),
      ...MOB_ATTACK_SOUND_CUES[id].map((cue) => `mob-${id}-${cue}`),
    ])
    assert.equal(MOB_EFFECTS.length, expectedEffectNames.length)
    assert.equal(registered.size, expectedEffectNames.length)
    assert.equal(new Set(MOB_EFFECTS.map(({ name }) => name)).size, MOB_EFFECTS.length)
    assert.deepEqual(Object.keys(MOB_SOUND_PROFILES).sort(), [...MOB_IDS].sort())
    assert.equal(
      new Set(Object.values(MOB_SOUND_PROFILES).map(({ partials }) =>
        partials.map(({ ratio }) => ratio).join(','))).size,
      MOB_IDS.length,
      'cada mob deve ter uma assinatura harmônica própria',
    )

    for (const id of MOB_IDS) {
      for (const event of ['aviso', 'dano', 'morte', 'ataque']) {
        assert.ok(registered.has(`mob-${id}-${event}`))
      }
      for (const cue of MOB_ATTACK_SOUND_CUES[id]) {
        assert.ok(registered.has(`mob-${id}-${cue}`))
      }
    }

    const context = {
      sampleRate: 44100,
      createBuffer(channelCount, length, sampleRate) {
        const channels = Array.from({ length: channelCount }, () => new Float32Array(length))
        return { length, sampleRate, getChannelData(index) { return channels[index] } }
      },
      createBufferSource() { return { buffer: null } },
    }
    const lengths = MOB_EFFECTS.map(({ name }) => {
      const source = registered.get(name).createSource(context)
      assert.ok(source.buffer.length > 0, `${name} deve criar áudio`)
      assert.ok(
        source.buffer.getChannelData(0).some((sample) => Math.abs(sample) > 0.0001),
        `${name} não deve gerar silêncio`,
      )
      return source.buffer.length
    })
    assert.equal(new Set(lengths).size, MOB_EFFECTS.length)

    unregisterMobEffects(manager)
    assert.equal(registered.size, 0)
  })

  test('detecta aviso e dano em mudanças de estado sem repetir o efeito no quadro seguinte', () => {
    const previous = captureMobAudioState({ targets: [target()] })
    const next = captureMobAudioState({
      targets: [target({ animation: 'preparando', health: 2 })],
    })

    assert.deepEqual(getMobInteractionSounds(previous, next), [
      'mob-cannolo-carica-dano',
      'mob-cannolo-carica-aviso',
    ])
    assert.deepEqual(getMobInteractionSounds(next, next), [])
  })

  test('prioriza morte sobre dano quando o inimigo morre no mesmo quadro', () => {
    const previous = captureMobAudioState({ targets: [target()] })
    const next = captureMobAudioState({
      targets: [target({ health: 0, dead: true })],
    })

    assert.deepEqual(getMobInteractionSounds(previous, next), ['mob-cannolo-carica-morte'])
  })

  test('ignora chefes e clones, mas inclui inimigos comuns invocados como minions', () => {
    const previous = captureMobAudioState({
      targets: [
        target({ id: 'boss', enemyId: 'boss-id', boss: true }),
        target({ id: 'clone', enemyId: 'boss-id', clone: true }),
        target({ id: 'special', enemyId: 'special-target' }),
        target({ id: 'minion', minion: true }),
      ],
    })
    const next = captureMobAudioState({
      targets: [
        target({ id: 'boss', enemyId: 'boss-id', boss: true, health: 2 }),
        target({ id: 'clone', enemyId: 'boss-id', clone: true, health: 2 }),
        target({ id: 'special', enemyId: 'special-target', health: 2 }),
        target({ id: 'minion', minion: true, health: 2 }),
      ],
    })

    assert.deepEqual(getMobInteractionSounds(previous, next), ['mob-cannolo-carica-dano'])
  })

  test('toca o ataque somente quando um mob causa dano real ao jogador', () => {
    const previous = captureMobAudioState({
      targets: [target()],
      player: { lastDamageEvent: { sequence: 1, cause: 'chapa' } },
    })
    const hit = captureMobAudioState({
      targets: [target()],
      player: { lastDamageEvent: { sequence: 2, cause: 'cannolo-carica' } },
    })

    assert.deepEqual(getMobInteractionSounds(previous, hit), ['mob-cannolo-carica-ataque'])
    assert.deepEqual(getMobInteractionSounds(hit, hit), [])

    const nextHit = captureMobAudioState({
      targets: [target()],
      player: { lastDamageEvent: { sequence: 3, cause: 'cannolo-carica' } },
    })
    assert.deepEqual(getMobInteractionSounds(hit, nextHit), ['mob-cannolo-carica-ataque'])
  })

  test('toca eventos de fase uma vez e ignora eventos de mobs não registrados', () => {
    const previous = captureMobAudioState({ targets: [], mobEvents: [], mobEventSequence: 4 })
    const next = captureMobAudioState({
      targets: [],
      mobEvents: [
        { enemyId: 'fenicottero-fornarino', cue: 'voo', sequence: 5 },
        { enemyId: 'pinguino-sorbettino', cue: 'gelo', sequence: 6 },
        { enemyId: 'cannolo-carica', cue: 'som-desconhecido', sequence: 7 },
      ],
      mobEventSequence: 7,
    })

    assert.deepEqual(getMobInteractionSounds(previous, next), [
      'mob-fenicottero-fornarino-voo',
      'mob-pinguino-sorbettino-gelo',
    ])
    assert.deepEqual(getMobInteractionSounds(next, next), [])
  })
})
