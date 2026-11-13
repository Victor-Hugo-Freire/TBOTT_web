import { OPPOSITE_SIDE, SIDE_VECTORS, SIDES } from './doors.js'
import { chance, createRandom, mixSeed, pick, randomInt } from './random.js'
import { pickLayout } from './roomLayout.js'

// Geração do andar, seguindo o artigo do Boris the Brave sobre a geração de andares do Isaac:
// uma fila a partir da sala inicial cria salas vizinhas ao acaso, sem nunca fechar um laço.
// A função é pura: a mesma seed e o mesmo andar geram sempre o mesmo andar.

export const FLOORS = [
  { number: 1, name: 'CANTINA', theme: 'cantina', minRooms: 9, maxRooms: 10 },
  { number: 2, name: 'CUCINA', theme: 'cucina', minRooms: 9, maxRooms: 11 },
  { number: 3, name: 'PIAZZA', theme: 'piazza', minRooms: 10, maxRooms: 12 },
  { number: 4, name: 'PASTIFICIO', theme: 'pastificio', minRooms: 10, maxRooms: 12 },
  { number: 5, name: 'PORTO', theme: 'porto', minRooms: 11, maxRooms: 13 },
]

export const LAST_FLOOR = 5

export const ROOM_TYPES = ['inicial', 'comum', 'chefe', 'tesouro', 'loja', 'palco', 'fliperama', 'descanso', 'adega', 'pacto', 'mamae']
export const SPECIAL_ROOM_TYPES = ROOM_TYPES.filter((type) => type !== 'inicial' && type !== 'comum')

// Grade do andar: 9 colunas x 8 linhas. A sala inicial fica na mesma casa do Isaac.
export const FLOOR_COLS = 9
export const FLOOR_ROWS = 8
export const START_CELL = { col: 4, row: 3 }

// Não deve acontecer, mas evita um laço infinito se alguma regra mudar no futuro
const MAX_ATTEMPTS = 1000
// Quantas vezes a fila pode recomeçar com as salas que já existem antes de desistir da planta
const MAX_REFILLS = 3

export function getRoomId(col, row) {
  return `${col}-${row}`
}

function isInsideGrid(col, row) {
  return col >= 0 && col < FLOOR_COLS && row >= 0 && row < FLOOR_ROWS
}

// Casa vizinha da sala, do lado pedido
function getNextCell(room, side) {
  const vector = SIDE_VECTORS[side]
  return { col: room.col + vector.x, row: room.row + vector.y }
}

// Quantas casas vizinhas (na grade) já têm sala. `rooms` é um Map de id -> sala.
function countOccupiedNeighbors(rooms, col, row) {
  return SIDES.filter((side) => {
    const vector = SIDE_VECTORS[side]
    return rooms.has(getRoomId(col + vector.x, row + vector.y))
  }).length
}

function createRoom(col, row, type) {
  return {
    id: getRoomId(col, row),
    col,
    row,
    type,
    distance: 0,
    neighbors: { up: null, right: null, down: null, left: null },
    secret: null,
    layoutId: null,
    visited: false,
    cleared: false,
    removed: [],
    hits: 0,
    unlocked: false, // sala trancada já aberta com um garfo (fica aberta até o fim da run neste andar)
  }
}

// Liga duas salas vizinhas por uma porta, nos dois sentidos
function linkRooms(room, side, other) {
  room.neighbors[side] = other.id
  other.neighbors[OPPOSITE_SIDE[side]] = room.id
}

function countLinks(room) {
  return SIDES.filter((side) => room.neighbors[side]).length
}

// Mapa base, como no artigo: para cada sala da fila, olha os 4 vizinhos e desiste se a casa sai da grade,
// já tem sala, tem mais de um vizinho ocupado (isso impede laços), o andar já está cheio ou o sorteio de 50% falha.
// Devolve as salas na ordem em que foram criadas, ou null se não chegou ao total.
export function buildFloorPlan(total, random) {
  const start = createRoom(START_CELL.col, START_CELL.row, 'inicial')
  const rooms = new Map([[start.id, start]])
  let queue = [start]
  let refills = 0

  while (rooms.size < total) {
    if (queue.length === 0) {
      // A fila acabou antes do total: percorre as salas de novo (o artigo faz o mesmo nos andares grandes)
      if (refills === MAX_REFILLS) return null
      refills += 1
      queue = [...rooms.values()]
    }

    const room = queue.shift()
    for (const side of SIDES) {
      const { col, row } = getNextCell(room, side)
      if (!isInsideGrid(col, row)) continue
      if (rooms.has(getRoomId(col, row))) continue
      if (countOccupiedNeighbors(rooms, col, row) > 1) continue
      if (rooms.size >= total) break
      if (!chance(random, 0.5)) continue

      const newRoom = createRoom(col, row, 'comum')
      rooms.set(newRoom.id, newRoom)
      linkRooms(room, side, newRoom)
      queue.push(newRoom)
    }
  }

  return [...rooms.values()]
}

// Distância de cada sala = passos pelas portas até a sala inicial (busca em largura)
function setDistances(rooms) {
  const byId = new Map(rooms.map((room) => [room.id, room]))
  const start = rooms[0]
  const seen = new Set([start.id])
  const queue = [start]
  start.distance = 0

  while (queue.length > 0) {
    const room = queue.shift()
    for (const side of SIDES) {
      const id = room.neighbors[side]
      if (!id || seen.has(id)) continue
      const next = byId.get(id)
      next.distance = room.distance + 1
      seen.add(id)
      queue.push(next)
    }
  }
}

// Escolhe as salas especiais entre os becos (salas com uma porta só, fora a inicial).
// Muda o tipo das salas escolhidas e devolve a lista, ou null quando a planta não serve
// (menos de 3 becos, ou o chefe ficaria colado na inicial): aí o andar é gerado de novo.
export function pickSpecialRooms(rooms, number, random) {
  const deadEnds = rooms.filter((room) => room.type !== 'inicial' && countLinks(room) === 1)
  if (deadEnds.length < 3) return null

  // Chefe: o beco mais distante. No empate fica o primeiro criado (o reduce só troca com ">").
  const boss = deadEnds.reduce((best, room) => (room.distance > best.distance ? room : best))
  if (boss.distance < 2) return null
  boss.type = 'chefe'

  let free = deadEnds.filter((room) => room !== boss)
  function takeDeadEnd(type) {
    const room = pick(random, free)
    room.type = type
    free = free.filter((other) => other !== room)
  }

  takeDeadEnd('tesouro')
  takeDeadEnd('loja')
  if (number >= 2 && free.length > 0) takeDeadEnd('palco')
  if (free.length > 0 && chance(random, 1 / 3)) takeDeadEnd('fliperama')
  if (free.length > 0 && chance(random, 1 / 4)) takeDeadEnd('descanso')
  // Beco que sobra continua sala comum
  return rooms
}

// Lados da sala com casa livre para uma sala extra: dentro da grade, vazia
// e com esta sala como ÚNICA vizinha ocupada (assim a extra só encosta na sala de onde sai).
function getFreeSides(occupied, room) {
  return SIDES.filter((side) => {
    const { col, row } = getNextCell(room, side)
    if (!isInsideGrid(col, row) || occupied.has(getRoomId(col, row))) return false
    return countOccupiedNeighbors(occupied, col, row) === 1
  })
}

// Adega secreta (andares 2 a 5, 1 chance em 2): ao lado de uma sala comum a 3 ou mais passos do início.
// A sala de origem NÃO guarda a adega em `neighbors`: a passagem é a porta secreta (`secret`),
// que só abre com 3 golpes. A adega guarda a origem em `neighbors` (a porta de volta).
function addCellar(rooms, occupied, number, random) {
  if (number < 2 || !chance(random, 0.5)) return

  const origins = rooms.filter((room) => room.type === 'comum' && room.distance >= 3 && getFreeSides(occupied, room).length > 0)
  if (origins.length === 0) return

  const origin = pick(random, origins)
  const side = pick(random, getFreeSides(occupied, origin))
  const { col, row } = getNextCell(origin, side)
  const cellar = createRoom(col, row, 'adega')
  cellar.distance = origin.distance + 1
  cellar.neighbors[OPPOSITE_SIDE[side]] = origin.id
  origin.secret = { side, roomId: cellar.id }
  rooms.push(cellar)
  occupied.set(cellar.id, cellar)
}

// Pacto ou Mamãe (andares 2 a 4, 1 chance em 2): ao lado da sala do chefe. Nunca no andar 1 (pedido do Victor).
// Enquanto não há luta, a seed escolhe uma das duas, meio a meio.
// A porta é normal nos dois sentidos; quem esconde a porta até o chefe ficar limpo é doors.js.
function addPactRoom(rooms, occupied, number, random) {
  // A chance é sorteada também no andar 1 (e descartada): assim o resto do sorteio do andar 1 quase não muda
  const rolled = chance(random, 0.5)
  if (number < 2 || number > 4 || !rolled) return

  const boss = rooms.find((room) => room.type === 'chefe')
  const sides = getFreeSides(occupied, boss)
  if (sides.length === 0) return

  const side = pick(random, sides)
  const { col, row } = getNextCell(boss, side)
  const pact = createRoom(col, row, pick(random, ['pacto', 'mamae']))
  pact.distance = boss.distance + 1
  linkRooms(boss, side, pact)
  rooms.push(pact)
  occupied.set(pact.id, pact)
}

// Lados com porta, contando a porta secreta da adega (o layout tem que deixar o caminho livre até ela)
export function getLinkedSides(room) {
  return SIDES.filter((side) => room.neighbors[side] || (room.secret && room.secret.side === side))
}

// Gera o andar `number` (1 a 5) da run com a seed `seed`. Tudo sai de um sorteio só,
// criado com a seed do andar, do começo ao fim (inclusive o layout de cada sala).
export function generateFloor(seed, number) {
  const info = FLOORS.find((floor) => floor.number === number)
  if (!info) throw new Error(`Andar inválido: ${number}`)

  const floorSeed = mixSeed(seed, number)
  const random = createRandom(floorSeed)

  for (let attempts = 1; attempts <= MAX_ATTEMPTS; attempts++) {
    const total = randomInt(random, info.minRooms, info.maxRooms)
    const rooms = buildFloorPlan(total, random)
    if (!rooms) continue

    setDistances(rooms)
    if (!pickSpecialRooms(rooms, number, random)) continue

    const occupied = new Map(rooms.map((room) => [room.id, room]))
    addCellar(rooms, occupied, number, random)
    addPactRoom(rooms, occupied, number, random)

    for (const room of rooms) {
      room.layoutId = room.type === 'inicial' ? 'inicial' : pickLayout(room.type, getLinkedSides(room), random)
    }

    return {
      seed,
      number,
      name: info.name,
      theme: info.theme,
      floorSeed,
      attempts,
      startRoomId: rooms[0].id,
      rooms,
    }
  }

  throw new Error(`O andar ${number} da seed ${seed} não foi gerado em ${MAX_ATTEMPTS} tentativas`)
}
