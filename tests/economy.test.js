import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { ARCADE_DOOR_PRICE, ARCADE_PLAY_PRICE, ARCADE_SPIN_MS, CELLAR_GRAINS, SHOP_PRICES } from '../src/data/economy.js'
import { getArcadeMachineBox, rollArcadePrize } from '../src/utils/arcade.js'
import { getRoomDoors, SIDE_VECTORS } from '../src/utils/doors.js'
import { DROP_APPEAR_MS } from '../src/utils/drops.js'
import { generateFloor } from '../src/utils/floorGenerator.js'
import { getRoomPedestals } from '../src/utils/pedestals.js'
import { createPlayer } from '../src/utils/player.js'
import { normalizeProgressPayload } from '../src/utils/progress.js'
import { getCellRect } from '../src/utils/roomLayout.js'
import { PLAYER_FEET_BOX, ROOM_PLAYER_BOUNDS } from '../src/utils/roomMovement.js'
import { createRun, createRunSnapshot, getCurrentRoom, giveRoomReward, updateRun } from '../src/utils/run.js'
import { TEST_CATALOG, TEST_ENEMIES } from './helpers/testCatalog.js'

const STEP = 1 / 20
const STEP_MS = 50
const IDLE = { movement: { x: 0, y: 0 }, attackDirection: null }
const { minX, maxX, minY, maxY } = ROOM_PLAYER_BOUNDS
// Pés encostados na parede, no meio do vão de cada porta
const DOOR_EDGES = { up: { x: 800, y: minY }, down: { x: 800, y: maxY }, left: { x: minX, y: 536 }, right: { x: maxX, y: 536 } }

function steps(run, count, input = IDLE) {
  for (let i = 0; i < count; i++) run = updateRun(run, input, STEP)
  return run
}

// Primeira seed (a partir de 1) com uma sala do tipo pedido no andar
function findSeed(floorNumber, type) {
  for (let seed = 1; seed < 1000; seed++) {
    const room = generateFloor(seed, floorNumber).rooms.find((one) => one.type === type)
    if (room) return { seed, roomId: room.id }
  }
  throw new Error('nenhuma seed serviu')
}

// Começa a run dentro de uma sala do tipo pedido
function runIn(type, fields = {}) {
  const { seed, roomId } = findSeed(1, type)
  return createRun({ seed, roomId, characterId: 'x', catalog: TEST_CATALOG, ...fields })
}

// Sai da run e volta: o que o jogo salva vira JSON (como na API) e a run é recriada com o que voltou
function saveAndContinue(run) {
  const progress = normalizeProgressPayload(JSON.parse(JSON.stringify(createRunSnapshot(run, 5000))))
  return createRun({
    catalog: run.catalog,
    items: progress.items,
    seed: progress.seed,
    floorNumber: progress.floor,
    roomId: progress.roomId,
    position: { x: 800, y: 700 },
    characterId: progress.characterId,
    visitedRoomIds: progress.visitedRoomIds,
    roomStates: progress.roomStates,
    health: progress.health,
    forks: progress.forks,
    grains: progress.grains,
  })
}

// Encosta os pés em alguma coisa no chão ou num pedestal e roda um quadro
function touch(run, x, y) {
  run.player = createPlayer({ x, y })
  return updateRun(run, IDLE, STEP)
}

describe('Adega: grãos e garfo no chão', () => {
  test(`começa com ${CELLAR_GRAINS} grãos e 1 garfo; encostar pega; o que foi pego não volta ao continuar`, () => {
    let run = runIn('adega', { grains: 0, forks: 0 })
    const room = getCurrentRoom(run)
    const [grains, fork] = room.drops
    assert.deepEqual([grains.kind, fork.kind], ['graos', 'garfo'])

    run = touch(run, grains.x, grains.y)
    assert.equal(run.grains, CELLAR_GRAINS)
    assert.equal(run.collecting.length, 1, 'a animação de pegar toca')
    assert.deepEqual(getCurrentRoom(run).drops.map((drop) => drop.kind), ['garfo'])

    let back = saveAndContinue(run)
    assert.deepEqual(getCurrentRoom(back).drops.map((drop) => drop.kind), ['garfo'], 'o garfo continua lá')
    assert.equal(back.grains, CELLAR_GRAINS)

    back = touch(back, fork.x, fork.y)
    assert.equal(back.forks, 1)
    assert.deepEqual(getCurrentRoom(saveAndContinue(back)).drops, [], 'a Adega vazia continua vazia')
  })
})

describe('recompensa da sala limpa (tecla G e, depois, os inimigos)', () => {
  test('aparece no chão da sala, é a mesma para a mesma seed e conta no save', () => {
    let seed = 1
    let run = createRun({ seed, characterId: 'x', catalog: TEST_CATALOG })
    // primeira seed em que a sala inicial dá alguma coisa
    while (giveRoomReward(run) && getCurrentRoom(run).drops.length === 0) {
      seed++
      run = createRun({ seed, characterId: 'x', catalog: TEST_CATALOG })
    }
    const room = getCurrentRoom(run)
    assert.equal(room.rewards, 1)
    const again = createRun({ seed, characterId: 'x', catalog: TEST_CATALOG })
    giveRoomReward(again)
    assert.deepEqual(getCurrentRoom(again).drops, room.drops, 'mesma seed, mesma recompensa')

    // aparece com a animação (o Tung, longe, não pega) e fica no chão
    run.player = createPlayer({ x: 300, y: 700 })
    run = steps(run, DROP_APPEAR_MS / STEP_MS + 1)
    const [drop] = getCurrentRoom(run).drops
    assert.equal(drop.appearMs, undefined)
    const back = saveAndContinue(run)
    assert.equal(getCurrentRoom(back).rewards, 1)
    assert.equal(getCurrentRoom(back).drops.length, 1)
  })

  // Sala comum do andar 1 com os inimigos; o primeiro fica com 1 de vida e o Tung logo abaixo dele, batendo para cima
  function killFirstEnemy(items, catalog = TEST_CATALOG) {
    const room = generateFloor(1, 1).rooms.find((one) => one.type === 'comum')
    let run = createRun({ seed: 1, characterId: 'x', roomId: room.id, catalog, enemyCatalog: TEST_ENEMIES, items })
    const victim = { ...run.targets[0], health: 1 }
    run.targets = [victim, ...run.targets.slice(1)]
    run.player = createPlayer({ x: victim.x, y: victim.y + 45 })
    run = updateRun(run, { movement: { x: 0, y: 0 }, attackDirection: 'up' }, STEP)
    while (!run.targets[0].dead) run = updateRun(run, IDLE, STEP)
    return { run, victim }
  }

  test('Chifre da Sorte: o grão cai nos pés do inimigo que morreu, na hora, com o brilho da sorte', () => {
    const catalog = { ...TEST_CATALOG, 'chifre-da-sorte': { ...TEST_CATALOG['chifre-da-sorte'], effect: { extraCoinChance: 1 } } }
    const { run, victim } = killFirstEnemy(['chifre-da-sorte'], catalog)
    const grains = getCurrentRoom(run).drops
    assert.equal(grains.length, 1)
    assert.deepEqual([grains[0].kind, grains[0].amount, grains[0].x, grains[0].y], ['graos', 1, victim.x, victim.y])
    assert.ok(grains[0].appearMs < DROP_APPEAR_MS, 'aparecendo, com a animação de aparecer')
    assert.ok(run.flashes.some((flash) => flash.variant === 'brilho-da-sorte'))
  })

  test('Chifre da Sorte: sem o item, o inimigo morto não solta grão', () => {
    const { run } = killFirstEnemy([])
    assert.deepEqual(getCurrentRoom(run).drops, [])
  })
})

describe('Loja: comprar com grãos', () => {
  const shopPedestals = (run) => getRoomPedestals(run, getCurrentRoom(run))

  test('com grãos, encostar compra: o garfo vai para o bolso, os grãos saem e o pedestal fica vazio', () => {
    let run = runIn('loja', { grains: 9, forks: 0 })
    const fork = shopPedestals(run)[0]
    run = touch(run, fork.x, fork.y + 21)
    assert.deepEqual([run.grains, run.forks], [9 - SHOP_PRICES.garfo, 1])
    assert.equal(shopPedestals(run)[0].consumable, null)
    run = steps(run, 4)
    assert.deepEqual([run.grains, run.forks], [9 - SHOP_PRICES.garfo, 1], 'cada pedestal vende uma vez')
  })

  test('sem grãos suficientes, não compra e mostra "Faltam grãos"', () => {
    let run = runIn('loja', { grains: TEST_CATALOG.tiramisu.price - 1 })
    const tiramisu = shopPedestals(run)[1]
    run = touch(run, tiramisu.x, tiramisu.y + 21)
    assert.equal(run.notice.text, 'Faltam grãos')
    assert.deepEqual([run.grains, run.items], [TEST_CATALOG.tiramisu.price - 1, []])
    assert.equal(shopPedestals(run)[1].itemId, 'tiramisu')
  })

  test('coração com a vida cheia: não compra e mostra "Vida cheia"; ferido, cura 1 coração', () => {
    let run = runIn('loja', { grains: 9 })
    const heart = shopPedestals(run)[2]
    run = touch(run, heart.x, heart.y + 21)
    assert.equal(run.notice.text, 'Vida cheia')
    assert.equal(run.grains, 9)

    run = runIn('loja', { grains: 9, health: 3 })
    run = touch(run, heart.x, heart.y + 21)
    assert.deepEqual([run.health, run.grains], [5, 9 - SHOP_PRICES.coracao])
  })

  test('o Tiramisu custa o preço do catálogo, entra nos itens com o banner, e a compra fica no save', () => {
    let run = runIn('loja', { grains: 20 })
    const tiramisu = shopPedestals(run)[1]
    run = touch(run, tiramisu.x, tiramisu.y + 21)
    assert.deepEqual(run.items, ['tiramisu'])
    assert.equal(run.grains, 20 - TEST_CATALOG.tiramisu.price)
    assert.ok(run.banner.subtitle)
    const back = saveAndContinue(run)
    const ids = getRoomPedestals(back, getCurrentRoom(back)).map((pedestal) => pedestal.id)
    assert.deepEqual(ids, ['4-3', '8-3'], 'o vendido não volta (e o pedestal vazio some ao continuar)')
  })
})

describe('Fliperama: a porta abre com grão', () => {
  // A sala vizinha do Fliperama, com a porta trancada dele
  function nextToArcade(grains) {
    for (let seed = 1; seed < 1000; seed++) {
      const floor = generateFloor(seed, 1)
      const arcade = floor.rooms.find((room) => room.type === 'fliperama')
      if (!arcade) continue
      const neighbor = floor.rooms.find((room) => Object.values(room.neighbors).includes(arcade.id) && room.type !== 'adega')
      if (!neighbor) continue
      const run = createRun({ seed, roomId: neighbor.id, characterId: 'x', grains })
      const door = getRoomDoors(run.floor, getCurrentRoom(run)).find((one) => one.targetId === arcade.id)
      if (door) return { run, door }
    }
    throw new Error('nenhuma seed serviu')
  }

  function push(run, side) {
    run.player = createPlayer(DOOR_EDGES[side])
    return updateRun(run, { movement: SIDE_VECTORS[side], attackDirection: null }, STEP)
  }

  test('a porta do Fliperama fica trancada pedindo grão', () => {
    const { door } = nextToArcade(0)
    assert.deepEqual([door.state, door.lock], ['locked', 'grao'])
  })

  test('sem grão, empurrar não abre; com grão, paga e abre para o resto da run', () => {
    let { run, door } = nextToArcade(0)
    run = push(run, door.side)
    assert.equal(run.unlocking, null)

    ;({ run, door } = nextToArcade(ARCADE_DOOR_PRICE + 1))
    run = push(run, door.side)
    assert.equal(run.unlocking?.side, door.side)
    assert.equal(run.grains, 1)
    assert.equal(run.floor.rooms.find((room) => room.id === door.targetId).unlocked, true)
  })
})

describe('Fliperama: o tambor', () => {
  const box = getArcadeMachineBox()
  const TOUCHING = { x: getCellRect(5, 3).x + 40, y: box.y + box.height + PLAYER_FEET_BOX.height + 2 }
  const AWAY = { x: TOUCHING.x, y: TOUCHING.y + 80 }

  // Encosta na máquina (vindo de longe) e roda um quadro
  function play(run) {
    run.player = createPlayer(AWAY)
    run = updateRun(run, IDLE, STEP)
    run.player = createPlayer(TOUCHING)
    return updateRun(run, IDLE, STEP)
  }

  test('encostar paga a jogada e o tambor gira; encostado, não joga de novo; afastar e voltar joga', () => {
    let run = runIn('fliperama', { grains: 9 })
    run = play(run)
    assert.equal(run.grains, 9 - ARCADE_PLAY_PRICE)
    assert.equal(getCurrentRoom(run).plays, 1)
    assert.ok(run.arcadeSpin)
    run = steps(run, ARCADE_SPIN_MS / STEP_MS + 2)
    assert.equal(run.arcadeSpin, null)
    assert.equal(run.grains, 9 - ARCADE_PLAY_PRICE, 'parado encostado, não joga de novo')
    run = play(run)
    assert.equal(getCurrentRoom(run).plays, 2)
  })

  test('sem grãos, não joga e mostra "Faltam grãos"', () => {
    const run = play(runIn('fliperama', { grains: ARCADE_PLAY_PRICE - 1 }))
    assert.equal(run.notice.text, 'Faltam grãos')
    assert.equal(getCurrentRoom(run).plays, 0)
  })

  test('o prêmio só aparece quando o tambor para; "nada" avisa; o Chifre sai uma vez e cai no pedestal', () => {
    let run = runIn('fliperama', { grains: 99 })
    const room = getCurrentRoom(run)
    const { seed } = run
    let sawNothing = false
    let sawDrop = false
    for (let turn = 0; turn < 20 && !(room.prize && sawNothing && sawDrop); turn++) {
      const expected = rollArcadePrize(seed, 1, room, room.plays, !room.prize)
      const dropsBefore = room.drops.length
      run = play(run)
      if (expected.kind === 'graos' || expected.kind === 'garfo') {
        assert.ok(room.drops[room.drops.length - 1].appearMs < 0, 'esperando o tambor')
        sawDrop = true
      }
      run = steps(run, ARCADE_SPIN_MS / STEP_MS + 2)
      if (expected.kind === 'nada') {
        assert.equal(run.notice?.text, 'Nada desta vez!')
        assert.equal(room.drops.length, dropsBefore)
        sawNothing = true
      }
      if (expected.kind === 'item') assert.equal(getRoomPedestals(run, room)[0].itemId, 'chifre-da-sorte')
    }
    assert.equal(room.prize, 'chifre-da-sorte', 'em 20 jogadas, o Chifre saiu')
    assert.ok(sawNothing && sawDrop)

    // pegar o Chifre: entra nos itens; depois disso, o prêmio do item vira grãos
    const pedestal = getRoomPedestals(run, room)[0]
    run = touch(run, pedestal.x, pedestal.y + 21)
    assert.ok(run.items.includes('chifre-da-sorte'))
    for (let play = room.plays; play < room.plays + 30; play++) {
      assert.notEqual(rollArcadePrize(seed, 1, room, play, false).kind, 'item')
    }
  })

  test('jogadas e o item no pedestal ficam no save', () => {
    let run = play(runIn('fliperama', { grains: 9 }))
    run = steps(run, ARCADE_SPIN_MS / STEP_MS + 2)
    const back = saveAndContinue(run)
    assert.equal(getCurrentRoom(back).plays, 1)
    assert.equal(back.grains, 9 - ARCADE_PLAY_PRICE)
  })
})

describe('grãos no progresso', () => {
  test('os grãos vão para o save e voltam ao continuar', () => {
    const run = createRun({ seed: 4, characterId: 'x', grains: 7 })
    assert.equal(createRunSnapshot(run, 0).grains, 7)
    assert.equal(saveAndContinue(run).grains, 7)
  })
})
