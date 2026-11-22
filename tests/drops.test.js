import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { CELLAR_GRAINS, HEART_HEAL, MAX_GRAINS, ROOM_REWARD_CHANCES } from '../src/data/economy.js'
import {
  advanceDrops,
  collectDrops,
  createCellarDrops,
  DROP_APPEAR_MS,
  getDropBox,
  healWithHeart,
  placeDrops,
  rollRoomReward,
} from '../src/utils/drops.js'
import { generateFloor } from '../src/utils/floorGenerator.js'
import { getCellRect, getLayoutPoints } from '../src/utils/roomLayout.js'

// Uma sala comum qualquer do andar 1 (a recompensa só lê col, row e layoutId)
const ROOM = generateFloor(1, 1).rooms.find((room) => room.type === 'comum')

describe('recompensa da sala limpa (rollRoomReward)', () => {
  test('a mesma seed e a mesma sala dão sempre a mesma coisa; a tentativa da tecla G muda', () => {
    const first = rollRoomReward(123, 1, ROOM, 0, 0)
    assert.deepEqual(rollRoomReward(123, 1, ROOM, 0, 0), first)
    let differs = false
    for (let attempt = 1; attempt <= 20; attempt++) {
      if (JSON.stringify(rollRoomReward(123, 1, ROOM, 0, 0, attempt)) !== JSON.stringify(first)) differs = true
    }
    assert.ok(differs, 'sortear de novo muda o resultado em algumas tentativas')
  })

  test('em 1000 sorteios, as chances ficam perto das de economy.js; grão só em grupos de 1, 3 e 5', () => {
    const counts = { nada: 0, graos: 0, coracao: 0, garfo: 0 }
    for (let seed = 1; seed <= 1000; seed++) {
      const { reward, drops } = rollRoomReward(seed, 1, ROOM, 0, 0)
      counts[reward]++
      for (const drop of drops) if (drop.kind === 'graos') assert.ok([1, 3, 5].includes(drop.amount))
      assert.equal(drops.length, reward === 'nada' ? 0 : 1)
    }
    for (const [reward, expected] of Object.entries(ROOM_REWARD_CHANCES)) {
      assert.ok(Math.abs(counts[reward] / 1000 - expected) < 0.05, `${reward}: ${counts[reward]} em 1000`)
    }
  })

  test('Chifre da Sorte: cada abate pode somar 1 grão, mesmo quando a recompensa é "nada"', () => {
    let seed = 1
    while (rollRoomReward(seed, 1, ROOM, 0, 0).reward !== 'nada') seed++
    const { reward, drops } = rollRoomReward(seed, 1, ROOM, 4, 1) // chance 1: todo abate soma
    assert.equal(reward, 'nada')
    assert.deepEqual(drops.map((drop) => [drop.kind, drop.amount]), [['graos', 1], ['graos', 1], ['graos', 1], ['graos', 1]])
    assert.equal(rollRoomReward(seed, 1, ROOM, 4, 0).drops.length, 0, 'sem o Chifre, nada')
  })

  test('aparece no meio da sala, numa casa livre, com a animação de aparecer', () => {
    let seed = 1
    while (rollRoomReward(seed, 1, ROOM, 0, 0).reward === 'nada') seed++
    const [drop] = rollRoomReward(seed, 1, ROOM, 0, 0).drops
    assert.equal(drop.appearMs, 0)
    assert.ok(drop.x > 600 && drop.x < 1000, `x ${drop.x}`)
  })
})

describe('Adega: grãos e garfo no chão', () => {
  test(`um grupo de ${CELLAR_GRAINS} grãos e um garfo, em casas livres (fora do pedestal)`, () => {
    const drops = createCellarDrops('adega')
    assert.deepEqual(drops.map((drop) => [drop.kind, drop.amount]), [['graos', CELLAR_GRAINS], ['garfo', 1]])
    assert.ok(drops.every((drop) => drop.appearMs === undefined), 'já estão no chão')
    // nenhum cai na casa do pedestal do Elixir
    const pedestal = getLayoutPoints('adega').items[0]
    const pedestalCell = getCellRect(pedestal.col, pedestal.row)
    for (const drop of drops) {
      const inside = drop.x > pedestalCell.x && drop.x < pedestalCell.x + pedestalCell.width && drop.y > pedestalCell.y && drop.y < pedestalCell.y + pedestalCell.height
      assert.equal(inside, false, `${drop.kind} em ${drop.x}, ${drop.y}`)
    }
  })
})

describe('pegar o que está no chão (collectDrops)', () => {
  const [grains, fork] = placeDrops([{ kind: 'graos', amount: 3 }, { kind: 'garfo', amount: 1 }], 6, 3)
  const [heart] = placeDrops([{ kind: 'coracao', amount: 1 }], 6, 3)
  const counters = { grains: 2, forks: 1, health: 3, maxHealth: 6 }

  test('encostar pega: grão soma, garfo soma; longe, nada', () => {
    const near = collectDrops([grains, fork], { x: grains.x, y: grains.y }, counters)
    assert.deepEqual([near.grains, near.forks, near.drops], [5, 1, [fork]])
    assert.deepEqual(near.collected, [grains])
    const far = collectDrops([grains], { x: grains.x, y: grains.y + 200 }, counters)
    assert.deepEqual(far.drops, [grains])
  })

  test('o contador de grãos para em MAX_GRAINS', () => {
    assert.equal(collectDrops([grains], grains, { ...counters, grains: MAX_GRAINS - 1 }).grains, MAX_GRAINS)
  })

  test('coração: cura até 1 coração; faltando meio, cura meio e some inteiro; com a vida cheia, fica no chão', () => {
    assert.equal(collectDrops([heart], heart, { ...counters, health: 2 }).health, 2 + HEART_HEAL)
    const half = collectDrops([heart], heart, { ...counters, health: 5 })
    assert.deepEqual([half.health, half.drops], [6, []])
    const full = collectDrops([heart], heart, { ...counters, health: 6 })
    assert.deepEqual([full.health, full.drops], [6, [heart]])
    assert.equal(healWithHeart(1, 6), 1 + HEART_HEAL)
  })

  test('o que ainda não apareceu (prêmio do Fliperama esperando o tambor) não é pego', () => {
    const waiting = { ...grains, appearMs: -500 }
    assert.deepEqual(collectDrops([waiting], grains, counters).drops, [waiting])
  })

  test('a caixa de pegar fica em volta do ponto no chão', () => {
    const box = getDropBox(grains)
    assert.ok(box.x < grains.x && box.x + box.width > grains.x && box.y + box.height === grains.y)
  })
})

describe('animação de aparecer (advanceDrops)', () => {
  test('anda com o tempo, espera quando negativa e, no fim, a coisa fica só no chão', () => {
    const [drop] = placeDrops([{ kind: 'graos', amount: 1 }], 6, 3, -100)
    let drops = advanceDrops([drop], 50)
    assert.equal(drops[0].appearMs, -50)
    drops = advanceDrops(drops, 50 + DROP_APPEAR_MS)
    assert.equal(drops[0].appearMs, undefined)
    assert.deepEqual(advanceDrops(drops, 50), drops, 'já no chão, não muda')
  })
})
