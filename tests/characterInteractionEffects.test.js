import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import {
  captureCharacterAudioState,
  getCharacterInteractionSounds,
} from '../src/audio/AudioEffects/Characters/characterInteractionEffects.js'
import {
  CHARACTER_EFFECTS,
  registerCharacterEffects,
  unregisterCharacterEffects,
} from '../src/audio/AudioEffects/Characters/index.js'

function createRun({
  characterId = 'tung-tung-sahur',
  player = { walkDistance: 0 },
  swingCount = 0,
  hitIds = [],
  items = [],
  flashes = [],
  itemAudioEvents = [],
  itemAudioEventSequence = 0,
  death = null,
} = {}) {
  return {
    characterId,
    player,
    effects: { swingCount },
    swing: { hitIds },
    items,
    flashes,
    itemAudioEvents,
    itemAudioEventSequence,
    death,
  }
}

function createAudioContext() {
  return {
    sampleRate: 44100,
    createBuffer(channelCount, length, sampleRate) {
      const channels = Array.from({ length: channelCount }, () => new Float32Array(length))
      return { length, sampleRate, getChannelData(index) { return channels[index] } }
    },
    createBufferSource() { return { buffer: null } },
  }
}

describe('efeitos sonoros do Tung Tung Sahur', () => {
  test('toca passos ao completar cada meia passada, sem repetir no mesmo intervalo', () => {
    const previous = captureCharacterAudioState(createRun({ player: { walkDistance: 39 } }))
    const next = captureCharacterAudioState(createRun({ player: { walkDistance: 40 } }))

    assert.deepEqual(getCharacterInteractionSounds(previous, next), ['character-tung-tung-sahur-passo'])
    assert.deepEqual(getCharacterInteractionSounds(next, next), [])
  })

  test('toca o golpe ao começar e o impacto quando acerta um alvo', () => {
    const idle = captureCharacterAudioState(createRun())
    const attack = captureCharacterAudioState(createRun({ swingCount: 1 }))
    const hit = captureCharacterAudioState(createRun({ swingCount: 1, hitIds: ['target-1'] }))

    assert.deepEqual(getCharacterInteractionSounds(idle, attack), ['character-tung-tung-sahur-ataque'])
    assert.deepEqual(getCharacterInteractionSounds(attack, hit), ['character-tung-tung-sahur-acerto'])
  })

  test('toca sons de dano, coleta e ativação dos itens da build', () => {
    const previous = captureCharacterAudioState(createRun())
    const next = captureCharacterAudioState(createRun({
      player: { walkDistance: 0, lastDamageEvent: { sequence: 1, cause: 'cannolo-carica' } },
      items: ['cafe-duplo'],
      flashes: [{ itemId: 'palitos-de-pao', variant: 'estalo', elapsedMs: 0 }],
    }))

    assert.deepEqual(getCharacterInteractionSounds(previous, next), [
      'character-tung-tung-sahur-dano',
      'character-tung-tung-sahur-item-coleta',
      'character-tung-tung-sahur-item-efeito',
    ])
    assert.deepEqual(getCharacterInteractionSounds(next, next), [])
  })

  test('toca cues específicos de procs novos uma vez e ignora eventos não registrados', () => {
    const previous = captureCharacterAudioState(createRun())
    const next = captureCharacterAudioState(createRun({
      itemAudioEventSequence: 9,
      itemAudioEvents: [
        { itemId: 'caldo-da-mamae', cue: 'escudo', sequence: 1 },
        { itemId: 'caldo-da-mamae', cue: 'cura', sequence: 2 },
        { itemId: 'cafe-duplo', cue: 'impulso', sequence: 3 },
        { itemId: 'tiramisu', cue: 'ativacao', sequence: 4 },
        { itemId: 'concha-longa', cue: 'poca', sequence: 5 },
        { itemId: 'parmesao-curado', cue: 'lancamento', sequence: 6 },
        { itemId: 'parmesao-curado', cue: 'impacto', sequence: 7 },
        { itemId: 'dente-de-tubarao', cue: 'frenesi', sequence: 8 },
        { itemId: 'item-desconhecido', cue: 'som', sequence: 9 },
      ],
    }))

    assert.deepEqual(getCharacterInteractionSounds(previous, next), [
      'character-tung-tung-sahur-item-escudo',
      'character-tung-tung-sahur-item-cura',
      'character-tung-tung-sahur-item-cafe-impulso',
      'character-tung-tung-sahur-item-tiramisu',
      'character-tung-tung-sahur-item-concha-poca',
      'character-tung-tung-sahur-item-parmesao-lancamento',
      'character-tung-tung-sahur-item-parmesao-impacto',
      'character-tung-tung-sahur-item-dente-frenesi',
    ])
    assert.deepEqual(getCharacterInteractionSounds(next, next), [])
  })

  test('prioriza o som de morte e ignora outros personagens', () => {
    const alive = captureCharacterAudioState(createRun())
    const dead = captureCharacterAudioState(createRun({
      player: { walkDistance: 40, lastDamageEvent: { sequence: 1 } },
      death: { cause: 'chapa' },
    }))
    const otherCharacter = captureCharacterAudioState(createRun({ characterId: 'outro-personagem' }))

    assert.deepEqual(getCharacterInteractionSounds(alive, dead), ['character-tung-tung-sahur-morte'])
    assert.deepEqual(getCharacterInteractionSounds(alive, otherCharacter), [])
  })

  test('registra efeitos distintos e cada um gera áudio', () => {
    const registered = new Map()
    const manager = {
      registerEffect(name, createSource, options) {
        registered.set(name, { createSource, options })
      },
      unregisterEffect(name) {
        registered.delete(name)
      },
    }

    registerCharacterEffects(manager)
    assert.equal(registered.size, CHARACTER_EFFECTS.length)
    assert.equal(new Set(CHARACTER_EFFECTS.map(({ name }) => name)).size, CHARACTER_EFFECTS.length)
    const lengths = CHARACTER_EFFECTS.map(({ name }) => {
      const source = registered.get(name).createSource(createAudioContext())
      const samples = source.buffer.getChannelData(0)
      assert.ok(samples.some((sample) => Math.abs(sample) > 0.0001), `${name} não deve gerar silêncio`)
      return source.buffer.length
    })
    assert.equal(new Set(lengths).size, CHARACTER_EFFECTS.length)

    unregisterCharacterEffects(manager)
    assert.equal(registered.size, 0)
  })
})
