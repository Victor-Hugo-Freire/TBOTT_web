import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { SHOP_PRICES } from '../src/data/economy.js'
import { PEDESTAL_SPRITES } from '../src/data/roomSprites.js'
import { overlaps } from '../src/utils/collision.js'
import { getEntryPosition, SIDES } from '../src/utils/doors.js'
import { generateFloor, LAST_FLOOR } from '../src/utils/floorGenerator.js'
import {
  assignPedestalItems,
  CHOICE_ROOM_TYPES,
  findNearbyPedestal,
  findTouchedPedestal,
  getPedestalSolids,
  getRoomPedestals,
  getRoomTypeItem,
  hasGoods,
  INFO_DISTANCE,
  PEDESTAL_VARIANTS,
} from '../src/utils/pedestals.js'
import { FIN_LAP_MS, getSharkFinPosition, isInPuddle, isNearFin } from '../src/utils/roomInteractions.js'
import { getLayoutPoints, ROOM_LAYOUTS } from '../src/utils/roomLayout.js'
import { getFeetBox } from '../src/utils/roomMovement.js'
import { TEST_CATALOG, TREASURE_ITEMS } from './helpers/testCatalog.js'

// Sala e run mínimas, só com o que getRoomPedestals lê. items = os itens dos pedestais da sala, na ordem das casas 't'.
function fakeRoom(layoutId, fields = {}) {
  const type = ROOM_LAYOUTS.find((layout) => layout.id === layoutId).type
  return { id: '4-4', type, layoutId, cleared: true, emptied: [], ...fields }
}
function fakeRun(room, items, fields = {}) {
  return { catalog: TEST_CATALOG, floor: { number: 1 }, items: [], pedestalItems: { [`1:${room.id}`]: items }, ...fields }
}
// Pedestais de um layout com itens de Tesouro em todas as casas 't'
function pedestalsOf(layoutId) {
  const room = fakeRoom(layoutId)
  const count = getLayoutPoints(layoutId).items.length
  return getRoomPedestals(fakeRun(room, TREASURE_ITEMS.slice(0, count)), room)
}
const PEDESTAL_LAYOUTS = ROOM_LAYOUTS.filter((layout) => PEDESTAL_VARIANTS[layout.type])

describe('pedestais nos layouts', () => {
  test('cada sala usa um pedestal que existe; o God e o Palco usam o pedestal comum', () => {
    for (const variant of Object.values(PEDESTAL_VARIANTS)) assert.ok(PEDESTAL_SPRITES[variant], variant)
    assert.deepEqual(PEDESTAL_VARIANTS, { tesouro: 'base', chefe: 'base', god: 'base', adega: 'adega', pacto: 'pacto', palco: 'base' })
  })

  test('todo layout de sala com item tem de 1 a 3 casas de pedestal; só o Pacto passa de 2', () => {
    for (const layout of PEDESTAL_LAYOUTS) {
      const count = getLayoutPoints(layout.id).items.length
      const max = layout.type === 'pacto' ? 3 : 2
      assert.ok(count >= 1 && count <= max, `${layout.id}: ${count}`)
    }
  })

  test('salas de escolha: Tesouro e God (no Pacto, cada item tem o seu custo e dá para pegar mais de um)', () => {
    assert.deepEqual(CHOICE_ROOM_TYPES, ['tesouro', 'god'])
  })

  test('o pedestal do Pacto fica na fileira 4: um pouco abaixo do meio da sala (y 525), longe da porta de baixo', () => {
    const [pedestal] = pedestalsOf('pacto')
    assert.ok(pedestal.y > 590 && pedestal.y < 640, `y = ${pedestal.y}`)
  })

  test('nenhum pedestal tapa a entrada de uma porta', () => {
    for (const layout of PEDESTAL_LAYOUTS) {
      for (const pedestal of pedestalsOf(layout.id)) {
        for (const side of SIDES) {
          assert.equal(overlaps(getFeetBox(getEntryPosition(side), 16), pedestal.box), false, `${layout.id} ${side}`)
        }
      }
    }
  })

  test('na Sala do Pacto, pegar qualquer item não leva o Tung para a poça nem para perto da barbatana', () => {
    for (const layout of PEDESTAL_LAYOUTS.filter((item) => item.type === 'pacto')) {
      for (const pedestal of pedestalsOf(layout.id)) {
        // pés encostados no pedestal por cima (o lado mais perto da poça) e pelos lados
        const touches = [
          { x: pedestal.x, y: pedestal.box.y - 1 },
          { x: pedestal.box.x - 27, y: pedestal.y },
          { x: pedestal.box.x + pedestal.box.width + 27, y: pedestal.y },
        ]
        for (const feet of touches) {
          assert.equal(isInPuddle(feet), false, layout.id)
          for (let finMs = 0; finMs < FIN_LAP_MS; finMs += 50) {
            assert.equal(isNearFin(feet, getSharkFinPosition(finMs)), false, `${layout.id}: barbatana aos ${finMs} ms`)
          }
        }
      }
    }
  })
})

describe('itens dos pedestais da run (assignPedestalItems)', () => {
  test('a mesma seed dá sempre os mesmos itens nas mesmas salas', () => {
    assert.deepEqual(assignPedestalItems(42, TEST_CATALOG), assignPedestalItems(42, TEST_CATALOG))
  })

  test('nenhum item repete na run, nem nas salas de escolha', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const all = Object.values(assignPedestalItems(seed, TEST_CATALOG)).flat()
      assert.equal(new Set(all).size, all.length, `seed ${seed}`)
    }
  })

  test('cada sala recebe um item por casa de pedestal, enquanto a lista do tipo dela tiver itens', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const assigned = assignPedestalItems(seed, TEST_CATALOG)
      let treasureLeft = TREASURE_ITEMS.length
      for (let floorNumber = 1; floorNumber <= LAST_FLOOR; floorNumber++) {
        for (const room of generateFloor(seed, floorNumber).rooms.filter((item) => item.type === 'tesouro')) {
          const items = assigned[`${floorNumber}:${room.id}`]
          const expected = Math.min(getLayoutPoints(room.layoutId).items.length, treasureLeft)
          assert.equal(items.length, expected, `seed ${seed} andar ${floorNumber}`)
          for (const id of items) assert.ok(TREASURE_ITEMS.includes(id))
          treasureLeft -= items.length
        }
      }
    }
  })

  test('item de sala com um item só (Chefe): só a primeira sala daquele tipo recebe', () => {
    const seed = 5
    const assigned = assignPedestalItems(seed, TEST_CATALOG)
    const bossItems = []
    for (let floorNumber = 1; floorNumber <= LAST_FLOOR; floorNumber++) {
      const boss = generateFloor(seed, floorNumber).rooms.find((room) => room.type === 'chefe')
      bossItems.push(assigned[`${floorNumber}:${boss.id}`])
    }
    assert.deepEqual(bossItems, [['rolo-de-bronze'], [], [], [], []])
  })

  test('sem catálogo, nenhuma sala tem item', () => {
    for (const items of Object.values(assignPedestalItems(3, {}))) assert.deepEqual(items, [])
  })

  test('há salas de escolha (2 itens) entre as seeds', () => {
    let choices = 0
    for (let seed = 1; seed <= 40; seed++) {
      for (const items of Object.values(assignPedestalItems(seed, TEST_CATALOG))) if (items.length === 2) choices += 1
    }
    assert.ok(choices > 0)
  })
})

describe('pedestais da sala (getRoomPedestals)', () => {
  test('um pedestal em cada casa t do layout, com os itens na ordem', () => {
    const pedestals = pedestalsOf('tesouro-03')
    assert.deepEqual(pedestals.map((item) => item.id), ['3-3', '9-3'])
    assert.deepEqual(pedestals.map((item) => item.itemId), TREASURE_ITEMS.slice(0, 2))
    assert.equal(pedestals[0].variant, 'base')
    assert.equal(pedestals[0].box.y + pedestals[0].box.height, pedestals[0].y)
  })

  test('salas sem pedestal de item: inicial, comum e Descanso', () => {
    for (const type of ['inicial', 'comum', 'descanso']) {
      assert.deepEqual(getRoomPedestals(fakeRun({ id: '4-4' }, ['tiramisu']), { id: '4-4', type, layoutId: type === 'comum' ? 'comum-01' : type, cleared: true, emptied: [] }), [], type)
    }
  })

  test('na sala do chefe o pedestal só aparece junto com o tambor (depois da luta)', () => {
    const dirty = fakeRoom('chefe', { cleared: false })
    assert.deepEqual(getRoomPedestals(fakeRun(dirty, ['rolo-de-bronze']), dirty), [])
    const waiting = fakeRoom('chefe', { drumDropped: false })
    assert.deepEqual(getRoomPedestals(fakeRun(waiting, ['rolo-de-bronze']), waiting), [], 'chefe morto, tambor ainda no ar')
    const clean = fakeRoom('chefe', { drumDropped: true })
    assert.equal(getRoomPedestals(fakeRun(clean, ['rolo-de-bronze']), clean).length, 1)
  })

  test('item pego nesta visita: o pedestal fica vazio enquanto ele está na sala', () => {
    const room = fakeRoom('adega', { emptied: ['6-2'] })
    const here = { items: ['elixir-eletrico'], roomId: room.id, emptiedHere: ['6-2'] }
    const [pedestal] = getRoomPedestals(fakeRun(room, ['elixir-eletrico'], here), room)
    assert.equal(pedestal.itemId, null)
  })

  test('pedestal vazio de outra visita (saiu e voltou, ou continuou a run): não aparece mais', () => {
    const room = fakeRoom('adega', { emptied: ['6-2'] })
    assert.deepEqual(getRoomPedestals(fakeRun(room, ['elixir-eletrico'], { items: ['elixir-eletrico'], roomId: room.id }), room), [])
    // e na sala que entra deslizando (ainda não é a sala atual) ele também não aparece
    const sliding = { items: ['elixir-eletrico'], roomId: 'outra', emptiedHere: ['6-2'] }
    assert.deepEqual(getRoomPedestals(fakeRun(room, ['elixir-eletrico'], sliding), room), [])
  })

  test('item que já saiu na run por outro caminho: o pedestal dele não aparece', () => {
    const room = fakeRoom('tesouro-03')
    const pedestals = getRoomPedestals(fakeRun(room, ['cafe-duplo', 'mucarela'], { items: ['cafe-duplo'] }), room)
    assert.deepEqual(pedestals.map((item) => item.itemId), ['mucarela'])
  })

  test('o pedestal do Pacto mostra o custo em vida máxima; os outros são de graça', () => {
    const pact = fakeRoom('pacto')
    assert.equal(getRoomPedestals(fakeRun(pact, ['dente-de-tubarao']), pact)[0].maxHealthCost, 2)
    assert.equal(pedestalsOf('tesouro-01')[0].maxHealthCost, 0)
  })

  test('as caixas sólidas são as dos pedestais', () => {
    const pedestals = pedestalsOf('tesouro-04')
    assert.deepEqual(getPedestalSolids(pedestals), [pedestals[0].box, pedestals[1].box])
  })
})

describe('perto do pedestal: encostar e ler a descrição', () => {
  const [pedestal] = pedestalsOf('tesouro-01')

  test('os pés encostados na borda de baixo do pedestal contam; longe, não', () => {
    assert.equal(findTouchedPedestal([pedestal], { x: pedestal.x, y: pedestal.y + 21 }), pedestal)
    assert.equal(findTouchedPedestal([pedestal], { x: pedestal.x, y: pedestal.y + 80 }), null)
  })

  test('pedestal vazio não conta', () => {
    assert.equal(findTouchedPedestal([{ ...pedestal, itemId: null }], { x: pedestal.x, y: pedestal.y + 21 }), null)
  })

  test('a descrição aparece até INFO_DISTANCE do pedestal, do mais perto', () => {
    const [left, right] = pedestalsOf('tesouro-03')
    assert.equal(findNearbyPedestal([left, right], { x: left.x + 10, y: left.y + 30 }), left)
    assert.equal(findNearbyPedestal([left, right], { x: right.x, y: right.y + INFO_DISTANCE - 1 }), right)
    assert.equal(findNearbyPedestal([left, right], { x: 800, y: right.y + INFO_DISTANCE + 50 }), null)
    assert.equal(findNearbyPedestal([{ ...left, itemId: null }], { x: left.x, y: left.y + 30 }), null)
  })
})

describe('Loja: o balcão vende garfo, o item da Loja e coração, por grãos', () => {
  test('da esquerda para a direita: garfo (7), Tiramisu (preço do catálogo, 15) e coração (5), no pedestal da Loja (a plaquinha da arte só tem o grão)', () => {
    const shop = fakeRoom('loja')
    const pedestals = getRoomPedestals(fakeRun(shop, []), shop)
    assert.deepEqual(
      pedestals.map((pedestal) => [pedestal.id, pedestal.consumable, pedestal.itemId, pedestal.price, pedestal.variant]),
      [
        ['4-3', 'garfo', null, SHOP_PRICES.garfo, 'loja'],
        ['6-3', null, 'tiramisu', TEST_CATALOG.tiramisu.price, 'loja'],
        ['8-3', 'coracao', null, SHOP_PRICES.coracao, 'loja'],
      ],
    )
  })

  test('com o Tiramisu já pego, o pedestal do meio vende um coração', () => {
    const shop = fakeRoom('loja')
    const middle = getRoomPedestals(fakeRun(shop, [], { items: ['tiramisu'] }), shop)[1]
    assert.deepEqual([middle.consumable, middle.itemId, middle.price], ['coracao', null, SHOP_PRICES.coracao])
  })

  test('cada pedestal vende uma vez: o vendido fica vazio (e some ao sair da sala), os outros continuam', () => {
    const shop = fakeRoom('loja', { emptied: ['4-3'] })
    assert.equal(getRoomPedestals(fakeRun(shop, []), shop).length, 2, 'de outra visita, o vendido sumiu')
    const pedestals = getRoomPedestals(fakeRun(shop, [], { roomId: shop.id, emptiedHere: ['4-3'] }), shop)
    assert.equal(hasGoods(pedestals[0]), false)
    assert.equal(pedestals[0].price, 0)
    assert.equal(hasGoods(pedestals[1]), true)
    assert.equal(findTouchedPedestal([pedestals[0]], { x: pedestals[0].x, y: pedestals[0].y + 21 }), null)
    assert.equal(findTouchedPedestal([pedestals[2]], { x: pedestals[2].x, y: pedestals[2].y + 21 }), pedestals[2], 'garfo e coração contam ao encostar')
  })
})

describe('Fliperama: o pedestal à frente do tambor', () => {
  test('sem prêmio, não tem pedestal', () => {
    const arcade = fakeRoom('fliperama', { prize: null })
    assert.deepEqual(getRoomPedestals(fakeRun(arcade, []), arcade), [])
  })

  test('com o prêmio, o pedestal aparece na frente da máquina; enquanto o tambor gira, ainda não', () => {
    const arcade = fakeRoom('fliperama', { prize: 'chifre-da-sorte' })
    const [pedestal] = getRoomPedestals(fakeRun(arcade, []), arcade)
    assert.deepEqual([pedestal.id, pedestal.itemId], ['6-4', 'chifre-da-sorte'])
    const spinning = fakeRun(arcade, [], { arcadeSpin: { roomId: arcade.id, elapsedMs: 300 } })
    assert.deepEqual(getRoomPedestals(spinning, arcade), [])
  })

  test('pego o item, o pedestal fica vazio enquanto ele está na sala e some depois', () => {
    const taken = fakeRoom('fliperama', { prize: 'chifre-da-sorte', emptied: ['6-4'] })
    const here = fakeRun(taken, [], { roomId: taken.id, emptiedHere: ['6-4'] })
    assert.equal(getRoomPedestals(here, taken)[0].itemId, null)
    assert.deepEqual(getRoomPedestals(fakeRun(taken, [], { roomId: taken.id }), taken), [])
  })

  test('o item do tipo da sala: o primeiro do catálogo que o jogador ainda não tem', () => {
    assert.equal(getRoomTypeItem({ catalog: TEST_CATALOG, items: [] }, 'fliperama'), 'chifre-da-sorte')
    assert.equal(getRoomTypeItem({ catalog: TEST_CATALOG, items: ['chifre-da-sorte'] }, 'fliperama'), null)
    assert.equal(getRoomTypeItem({ catalog: TEST_CATALOG, items: [] }, 'loja'), 'tiramisu')
  })
})
