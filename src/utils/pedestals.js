import { overlaps } from './collision.js'
import { generateFloor, LAST_FLOOR } from './floorGenerator.js'
import { createRandom, mixSeed, shuffle } from './random.js'
import { getCellRect, getLayoutPoints } from './roomLayout.js'
import { getFeetBox } from './roomMovement.js'

// Pedestais dos itens nas salas especiais. Funções puras (sem React, sem canvas), para testar com node:test.
// Os pedestais ficam nas casas 't' do layout da sala (src/data/roomLayouts.json).
// - No Tesouro e no God, sala com 2 casas 't' é uma sala de ESCOLHA: pegar um item esvazia os dois pedestais,
//   e o outro item some (não aparece mais na run).
// - No Pacto, cada pedestal é como um da Loja, mas pago com coração (vida máxima): dá para pegar todos os itens
//   que der para pagar, cada um com o seu custo.
// Cada item vem do catálogo da API: o campo roomTypes diz em que sala ele aparece.
// A Loja e o Fliperama ganham os pedestais deles depois; o Palco só quando houver inimigos.

// Salas com pedestal de item e a imagem do pedestal de cada uma (PEDESTAL_SPRITES, em roomSprites.js).
// A sala do God não tem pedestal próprio: usa o comum.
export const PEDESTAL_VARIANTS = { tesouro: 'base', chefe: 'base', god: 'base', adega: 'adega', pacto: 'pacto' }

// Salas de escolha: pegar um item esvazia todos os pedestais da sala
export const CHOICE_ROOM_TYPES = ['tesouro', 'god']

// Caixa sólida do pedestal (o desenho tem cerca de 68 x 36 u, com a base em x, y): bloqueia o jogador,
// que pega o item ao encostar nela
const PEDESTAL_BOX = { width: 64, height: 30 }

// Folga em volta dos pés para contar como "encostou" no pedestal (ele é sólido: os pés param na borda)
const TOUCH_MARGIN = 4

// Até esta distância (dos pés à base do pedestal) aparece a caixa com a descrição do item
export const INFO_DISTANCE = 230

// Número que separa o sorteio dos itens dos outros sorteios da run (os andares usam mixSeed(seed, 1 a 5))
const ITEM_DRAW_SEED = 9100

// Itens de cada pedestal da run inteira, decididos uma vez no começo dela (createRun).
// Os itens de cada tipo de sala são embaralhados pela seed. Depois, do andar 1 ao 5, cada sala com pedestal
// pega os próximos itens da lista do tipo dela, um por casa 't' do layout. Assim nenhum item repete na run,
// nem nas salas de escolha; quando a lista acaba, a sala fica com menos pedestais (ou nenhum).
// Devolve { 'andar:idDaSala': [ids dos itens, na ordem das casas 't'] }. Não vai para o save: sai da seed.
export function assignPedestalItems(seed, catalog) {
  const random = createRandom(mixSeed(seed, ITEM_DRAW_SEED))
  const pools = {}
  for (const type of Object.keys(PEDESTAL_VARIANTS)) {
    const candidates = []
    for (const id of Object.keys(catalog)) {
      const { roomTypes } = catalog[id]
      if (Array.isArray(roomTypes) && roomTypes.includes(type)) candidates.push(id)
    }
    pools[type] = shuffle(random, candidates)
  }

  const assigned = {}
  for (let floorNumber = 1; floorNumber <= LAST_FLOOR; floorNumber++) {
    for (const room of generateFloor(seed, floorNumber).rooms) {
      const pool = pools[room.type]
      if (!pool) continue
      const count = getLayoutPoints(room.layoutId).items.length
      const items = []
      for (let i = 0; i < count && pool.length > 0; i++) items.push(pool.shift())
      assigned[`${floorNumber}:${room.id}`] = items
    }
  }
  return assigned
}

// Pedestais da sala. Cada um: { id, x, y, box, variant, itemId, maxHealthCost }.
// - id = a casa ('col-row'); x, y = o meio da base; box = a caixa sólida;
// - itemId = o item em cima, ou null se o item já foi pego nesta sala (o pedestal fica vazio);
// - maxHealthCost = quanto de vida máxima o item cobra ao ser pego (Sala do Pacto), em meios corações; 0 = de graça.
// Não aparece pedestal: na sala sem item, na sala do chefe antes de ela ficar limpa e quando o item já saiu
// na run por outro caminho (as recompensas de "repetição" dos item.md ficam de fora, por decisão do Victor).
export function getRoomPedestals(run, room) {
  const variant = PEDESTAL_VARIANTS[room.type]
  if (!variant) return []
  if (room.type === 'chefe' && !room.cleared) return []

  const items = run.pedestalItems[`${run.floor.number}:${room.id}`] ?? []
  const points = getLayoutPoints(room.layoutId).items
  const pedestals = []
  for (let index = 0; index < items.length; index++) {
    const itemId = items[index]
    const { col, row } = points[index]
    const id = `${col}-${row}`
    const emptied = room.emptied.includes(id)
    if (!emptied && run.items.includes(itemId)) continue

    const rect = getCellRect(col, row)
    const x = rect.x + rect.width / 2
    const y = rect.y + rect.height * 0.75
    const box = { x: x - PEDESTAL_BOX.width / 2, y: y - PEDESTAL_BOX.height, width: PEDESTAL_BOX.width, height: PEDESTAL_BOX.height }
    const maxHealthCost = run.catalog[itemId]?.effect?.maxHealthCost ?? 0
    pedestals.push({ id, x, y, box, variant, itemId: emptied ? null : itemId, maxHealthCost })
  }
  return pedestals
}

// Pedestal com item em que os pés do jogador encostam, ou null
export function findTouchedPedestal(pedestals, position) {
  const feet = getFeetBox(position, TOUCH_MARGIN)
  for (const pedestal of pedestals) {
    if (pedestal.itemId && overlaps(feet, pedestal.box)) return pedestal
  }
  return null
}

// Pedestal com item mais perto dos pés, até INFO_DISTANCE, ou null: a caixa de descrição mostra o item dele
export function findNearbyPedestal(pedestals, position) {
  let nearest = null
  let nearestDistance = INFO_DISTANCE
  for (const pedestal of pedestals) {
    if (!pedestal.itemId) continue
    const distance = Math.hypot(pedestal.x - position.x, pedestal.y - position.y)
    if (distance <= nearestDistance) {
      nearest = pedestal
      nearestDistance = distance
    }
  }
  return nearest
}

// Caixas sólidas dos pedestais, para juntar às paredes e aos obstáculos (getRoomSolids)
export function getPedestalSolids(pedestals) {
  const boxes = []
  for (const pedestal of pedestals) boxes.push(pedestal.box)
  return boxes
}
