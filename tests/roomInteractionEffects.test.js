import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import {
  captureRoomAudioState,
  getRoomInteractionSounds,
} from '../src/audio/AudioEffects/rooms/roomInteractionEffects.js'
import {
  registerRoomInteractionEffects,
  ROOM_INTERACTION_EFFECTS,
  unregisterRoomInteractionEffects,
} from '../src/audio/AudioEffects/rooms/index.js'

function createRun({
  roomType = 'comum',
  hits = 0,
  cleared = false,
  unlocking = false,
  plays = 0,
  emptied = [],
  drops = [],
  obstacles = [],
  transition = null,
  arcadeSpin = null,
  drumDrop = null,
  sleep = null,
} = {}) {
  return {
    roomId: 'room-1',
    floor: { rooms: [{ id: 'room-1', type: roomType, hits, cleared, plays, emptied, drops }] },
    obstacles,
    unlocking,
    transition,
    arcadeSpin,
    drumDrop,
    sleep,
  }
}

describe('efeitos sonoros das interações da sala', () => {
  test('registra um módulo independente e uma forma de onda distinta para cada interação', () => {
    const registered = new Map()
    const manager = {
      registerEffect(name, createSource, options) {
        registered.set(name, { createSource, options })
      },
      unregisterEffect(name) {
        registered.delete(name)
      },
    }

    registerRoomInteractionEffects(manager)
    assert.equal(registered.size, 13)
    assert.equal(new Set(ROOM_INTERACTION_EFFECTS.map(({ name }) => name)).size, 13)

    const context = {
      sampleRate: 44100,
      createBuffer(channelCount, length, sampleRate) {
        const channels = Array.from({ length: channelCount }, () => new Float32Array(length))
        return {
          length,
          sampleRate,
          getChannelData(index) { return channels[index] },
        }
      },
      createBufferSource() {
        return { buffer: null }
      },
    }
    const lengths = ROOM_INTERACTION_EFFECTS.map(({ name }) => {
      const source = registered.get(name).createSource(context)
      assert.ok(source.buffer.length > 0, `${name} deve criar áudio`)
      return source.buffer.length
    })
    assert.equal(new Set(lengths).size, ROOM_INTERACTION_EFFECTS.length)

    unregisterRoomInteractionEffects(manager)
    assert.equal(registered.size, 0)
  })

  test('detecta quebra de vidro e início do rolamento apenas na mudança de estado', () => {
    const previous = captureRoomAudioState(createRun({
      obstacles: [
        { id: 'glass', kind: 'garrafao', mechanic: 'quebravel' },
        { id: 'barrel', kind: 'barril-deitado', mechanic: 'rolante' },
      ],
    }))
    const next = captureRoomAudioState(createRun({
      obstacles: [
        { id: 'glass', kind: 'cacos', mechanic: 'cacos' },
        { id: 'barrel', kind: 'barril-deitado', mechanic: 'rolante', rolling: { x: 1, y: 0 } },
      ],
    }))

    assert.deepEqual(getRoomInteractionSounds(previous, next), [
      'room-glass-break',
      'room-object-roll',
    ])
    assert.deepEqual(getRoomInteractionSounds(next, next), [])
  })

  test('detecta o impacto quando um objeto rolante quebra', () => {
    const previous = captureRoomAudioState(createRun({
      obstacles: [{ id: 'barrel', kind: 'barril-deitado', mechanic: 'rolante', rolling: { x: 1, y: 0 } }],
    }))
    const next = captureRoomAudioState(createRun({
      obstacles: [{ id: 'barrel', kind: 'barril-deitado', mechanic: 'rolante', rolling: { x: 1, y: 0 }, removed: true }],
    }))

    assert.deepEqual(getRoomInteractionSounds(previous, next), ['room-object-impact'])
  })

  test('preserva o estado anterior mesmo quando a sala é mutada ao acertar tambor ou parede', () => {
    const roomType = 'chefe'
    const run = createRun({ roomType })
    const previous = captureRoomAudioState(run)
    run.floor.rooms[0].hits += 1
    const next = captureRoomAudioState(run)

    assert.deepEqual(getRoomInteractionSounds(previous, next), ['room-drum-hit'])
  })

  test('toca ao desbloquear e atravessar a porta, sem duplicar a confirmação de sala limpa', () => {
    const previous = captureRoomAudioState(createRun())
    const next = captureRoomAudioState(createRun({
      cleared: true,
      unlocking: true,
      transition: { type: 'room' },
    }))

    assert.deepEqual(getRoomInteractionSounds(previous, next), [
      'room-door-open',
      'room-door-unlock',
    ])
  })

  test('detecta interações de fliperama, pedestal, rede e pouso do tambor', () => {
    const previous = captureRoomAudioState(createRun({ drumDrop: { elapsedMs: 500 } }))
    const next = captureRoomAudioState(createRun({
      plays: 1,
      emptied: ['pedestal-1'],
      sleep: { elapsedMs: 0 },
      drumDrop: { elapsedMs: 600 },
    }))

    assert.deepEqual(getRoomInteractionSounds(previous, next), [
      'room-arcade-spin',
      'room-pickup',
      'room-rest',
      'room-drum-land',
    ])
  })

  test('detecta coleta de drops no chão mesmo quando a animação de aparição avança', () => {
    const previous = captureRoomAudioState(createRun({
      drops: [{ kind: 'graos', amount: 3, x: 100, y: 200, appearMs: 120 }],
    }))
    const stillWaiting = captureRoomAudioState(createRun({
      drops: [{ kind: 'graos', amount: 3, x: 100, y: 200, appearMs: 140 }],
    }))
    const collected = captureRoomAudioState(createRun())

    assert.deepEqual(getRoomInteractionSounds(previous, stillWaiting), [])
    assert.deepEqual(getRoomInteractionSounds(stillWaiting, collected), ['room-pickup'])
  })

  test('toca um som quando a roleta do fliperama revela o resultado', () => {
    const previous = captureRoomAudioState(createRun({ arcadeSpin: { elapsedMs: 100 } }))
    const next = captureRoomAudioState(createRun())

    assert.deepEqual(getRoomInteractionSounds(previous, next), ['room-arcade-result'])
  })
})
