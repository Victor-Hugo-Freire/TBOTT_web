import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { ARCADE_GRAIN_PRIZE, ARCADE_ITEM_REPEAT_GRAINS, ARCADE_PRIZE_CHANCES } from '../src/data/economy.js'
import { getArcadeMachineBox, isTouchingMachine, rollArcadePrize } from '../src/utils/arcade.js'
import { getCellRect, ROOM_LAYOUTS } from '../src/utils/roomLayout.js'
import { PLAYER_FEET_BOX } from '../src/utils/roomMovement.js'

const ROOM = { col: 3, row: 4 }

describe('prêmio do Fliperama (rollArcadePrize)', () => {
  test('a mesma seed, sala e jogada dão sempre o mesmo prêmio', () => {
    for (let play = 0; play < 10; play++) assert.deepEqual(rollArcadePrize(77, 2, ROOM, play, true), rollArcadePrize(77, 2, ROOM, play, true))
  })

  test('em 1000 jogadas, as chances ficam perto das de economy.js', () => {
    const counts = { item: 0, graos: 0, garfo: 0, nada: 0 }
    for (let play = 0; play < 1000; play++) counts[rollArcadePrize(5, 1, ROOM, play, true).kind]++
    for (const [kind, expected] of Object.entries(ARCADE_PRIZE_CHANCES)) {
      assert.ok(Math.abs(counts[kind] / 1000 - expected) < 0.05, `${kind}: ${counts[kind]} em 1000`)
    }
  })

  test('grão dá ARCADE_GRAIN_PRIZE; com o item já saído, o prêmio do item vira ARCADE_ITEM_REPEAT_GRAINS grãos', () => {
    let itemPlay = 0
    while (rollArcadePrize(5, 1, ROOM, itemPlay, true).kind !== 'item') itemPlay++
    assert.deepEqual(rollArcadePrize(5, 1, ROOM, itemPlay, false), { kind: 'graos', amount: ARCADE_ITEM_REPEAT_GRAINS })
    let grainPlay = 0
    while (rollArcadePrize(5, 1, ROOM, grainPlay, true).kind !== 'graos') grainPlay++
    assert.equal(rollArcadePrize(5, 1, ROOM, grainPlay, true).amount, ARCADE_GRAIN_PRIZE)
  })
})

describe('encostar na máquina', () => {
  const box = getArcadeMachineBox()

  test('a máquina cobre as casas das torres e do tambor: colunas 5 a 7, fileiras 1 a 3 (com o vão embaixo do funil)', () => {
    const first = getCellRect(5, 1)
    const last = getCellRect(7, 3)
    assert.deepEqual(box, { x: first.x, y: first.y, width: last.x + last.width - first.x, height: last.y + last.height - first.y })
    const tiles = ROOM_LAYOUTS.find((layout) => layout.id === 'fliperama').tiles
    assert.deepEqual([1, 2, 3].map((row) => tiles[row].slice(5, 8)), ['XXX', 'XXX', 'X.X'])
    assert.equal(tiles[4][6], 't', 'o pedestal do prêmio fica na frente da máquina')
  })

  test('os pés encostados embaixo da torre contam; um passo para trás, não', () => {
    const below = { x: box.x + 40, y: box.y + box.height + PLAYER_FEET_BOX.height + 2 }
    assert.equal(isTouchingMachine(below), true)
    assert.equal(isTouchingMachine({ x: below.x, y: below.y + 40 }), false)
  })
})
