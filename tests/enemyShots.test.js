import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { FENICOTTERO, MOKA, VESPINA, ZANZARINA } from '../src/data/enemyBehavior.js'
import { overlaps } from '../src/utils/collision.js'
import { createEnemy, updateEnemies } from '../src/utils/enemies.js'
import { getHazardBoxes } from '../src/utils/enemyPath.js'
import { createBomb, createHotCheese, createPizza, createSeed, createSteamRing, updateEnemyShots } from '../src/utils/enemyShots.js'
import { createPlayer } from '../src/utils/player.js'
import { getCellPoint, getCellRect } from '../src/utils/roomLayout.js'
import { ROOM_WALLS } from '../src/utils/roomMovement.js'
import { touchesHot } from '../src/utils/roomObstacles.js'
import { createRun, updateRun } from '../src/utils/run.js'
import { damageTarget, getBaseBox } from '../src/utils/targets.js'
import { TEST_ENEMIES } from './helpers/testCatalog.js'

const STEP = 1 / 50 // 20 ms
const STEP_MS = 20
const IDLE = { movement: { x: 0, y: 0 }, attackDirection: null }

// Caixa sólida de um obstáculo na casa (84 x 60 no meio dela, como em roomLayout.js)
function obstacle(col, row) {
  const rect = getCellRect(col, row)
  return { x: rect.x + (rect.width - 84) / 2, y: rect.y + (rect.height - 60) / 2, width: 84, height: 60 }
}
// Parede de obstáculos na coluna 6, das linhas 1 a 5
const WALL = [1, 2, 3, 4, 5].map((row) => obstacle(6, row))
const SOLIDS = [...ROOM_WALLS, ...WALL]

// Um inimigo do catálogo de teste na casa (col, row), já sem a espera do começo da sala
function spawn(id, col, row) {
  return { ...createEnemy(TEST_ENEMIES[id], col, row), waitMs: 0 }
}

// Roda `ms` dos inimigos e dos projéteis deles, como a run faz (run.js), com o Tung parado em `player`.
// Devolve os inimigos, os projéteis no ar e o que eles fizeram em todos os quadros. until(state) para antes.
function simulate(enemies, player, ms, until = () => false, solids = ROOM_WALLS) {
  let shots = []
  const done = { hits: [], flashes: [], floor: [], mobEvents: [] }
  for (let time = 0; time < ms; time += STEP_MS) {
    const world = { player, solids, deltaSeconds: STEP, hits: [], flashes: [], floor: [], shots: [] }
    enemies = updateEnemies(enemies, world)
    shots = [...updateEnemyShots(shots, world), ...world.shots]
    done.hits.push(...world.hits)
    done.flashes.push(...world.flashes)
    done.floor.push(...world.floor)
    done.mobEvents.push(...world.mobEvents)
    if (until({ enemies, shots, ...done, time })) break
  }
  return { enemies, shots, ...done }
}

// Só os projéteis, sem inimigos
function flyShots(shots, player, ms, solids = ROOM_WALLS) {
  const done = { hits: [], floor: [], mobEvents: [], bossEvents: [] }
  for (let time = 0; time < ms && shots.length > 0; time += STEP_MS) {
    const world = { player, solids, deltaSeconds: STEP, hits: [], flashes: [], floor: [], bossEvents: [] }
    shots = updateEnemyShots(shots, world)
    done.hits.push(...world.hits)
    done.floor.push(...world.floor)
    done.mobEvents.push(...world.mobEvents)
    done.bossEvents.push(...world.bossEvents)
  }
  return { shots, ...done }
}

const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)
const SHOOTER = { x: 400, y: 525, damage: 1, enemyId: 'pistacchio-sputacchio' }

describe('Pistacchio Sputacchio', () => {
  test('com a linha livre, cospe um caroço que voa até o Tung e acerta uma vez', () => {
    const player = getCellPoint(7, 3)
    const { hits, shots, mobEvents } = simulate([spawn('pistacchio-sputacchio', 3, 3)], player, 3000, (state) => state.hits.length > 0)
    assert.deepEqual(hits, [{ damage: 1, cause: 'pistacchio-sputacchio' }])
    assert.equal(shots.length, 0, 'o caroço some ao acertar')
    assert.ok(mobEvents.some(({ cue }) => cue === 'lancamento'))
  })

  test('o caroço sai no quadro do emits (o aviso de abrir a casca)', () => {
    const player = getCellPoint(7, 3)
    const early = simulate([spawn('pistacchio-sputacchio', 3, 3)], player, 200)
    assert.equal(early.shots.length, 0, 'ainda abrindo a casca')
    const later = simulate([spawn('pistacchio-sputacchio', 3, 3)], player, 340)
    assert.equal(later.shots.length, 1)
    assert.equal(later.shots[0].kind, 'caroco')
  })

  test('o caroço some ao bater num obstáculo, sem acertar o Tung', () => {
    const behindWall = getCellPoint(9, 3)
    const { hits, shots, mobEvents } = flyShots([createSeed({ ...SHOOTER, ...getCellPoint(3, 3) }, behindWall)], behindWall, 4000, SOLIDS)
    assert.equal(hits.length, 0)
    assert.equal(shots.length, 0)
    assert.ok(mobEvents.some(({ cue }) => cue === 'impacto'))
  })

  test('com um obstáculo no meio, não atira: anda até ter a linha livre', () => {
    const { enemies, shots } = simulate([spawn('pistacchio-sputacchio', 5, 3)], getCellPoint(8, 3), 400, () => false, SOLIDS)
    assert.equal(enemies[0].animation, 'andando')
    assert.equal(shots.length, 0)
  })
})

describe('Fenicottero Fornarino', () => {
  test('a pizza voa flightMs por cima dos obstáculos, cai onde o Tung estava, acerta e deixa queijo quente', () => {
    const player = getCellPoint(8, 3) // atrás da parede: a pizza passa por cima
    let thrownAt = null
    let landedAt = null
    const result = simulate([spawn('fenicottero-fornarino', 3, 3)], player, 4000, (state) => {
      if (thrownAt === null && state.shots.length > 0) thrownAt = state.time
      if (state.hits.length > 0) landedAt = state.time
      return landedAt !== null
    }, SOLIDS)
    assert.deepEqual(result.hits, [{ damage: 2, cause: 'fenicottero-fornarino' }])
    assert.ok(Math.abs(landedAt - thrownAt - FENICOTTERO.flightMs) <= STEP_MS, `voou ${landedAt - thrownAt} ms`)
    for (const cue of ['lancamento', 'voo', 'pouso']) {
      assert.ok(result.mobEvents.some((event) => event.cue === cue), `som de ${cue}`)
    }
    assert.equal(result.floor.length, 1)
    const cheese = result.floor[0]
    assert.equal(cheese.kind, 'queijo-quente')
    assert.equal(cheese.mechanic, 'quente')
    assert.deepEqual({ x: cheese.x, y: cheese.y }, player, 'no lugar do Tung')
    assert.ok(touchesHot([cheese], player), 'o queijo queima quem está nele')
    assert.equal(getHazardBoxes([cheese]).length, 1, 'os inimigos desviam dele')
  })

  test('a pizza leva flightMs para cair; o Tung que saiu da marca não leva dano, mas o queijo fica', () => {
    const thrower = { ...getCellPoint(3, 3), damage: 2, enemyId: 'fenicottero-fornarino' }
    const target = getCellPoint(8, 3)
    const pizza = createPizza(thrower, target)
    const inFlight = flyShots([pizza], target, FENICOTTERO.flightMs - 40)
    assert.equal(inFlight.shots.length, 1, 'ainda voando')
    assert.ok(inFlight.shots[0].height > 0)
    assert.ok(inFlight.mobEvents.some(({ cue }) => cue === 'voo'))
    const away = { x: target.x, y: target.y - 150 }
    const landed = flyShots([pizza], away, FENICOTTERO.flightMs + 40)
    assert.equal(landed.hits.length, 0)
    assert.equal(landed.floor.length, 1)
    assert.ok(landed.mobEvents.some(({ cue }) => cue === 'pouso'))
  })

  test('com o Tung perto demais, se afasta antes de lançar', () => {
    const enemy = spawn('fenicottero-fornarino', 6, 3)
    const player = { x: enemy.x + 100, y: enemy.y }
    const { enemies } = simulate([enemy], player, 200)
    assert.equal(enemies[0].animation, 'andando')
    assert.ok(enemies[0].x < enemy.x, 'andou para longe')
  })

  test('na run, o queijo quente queima o Tung e a causa da morte é o Fenicottero', () => {
    let run = createRun({ seed: 1, characterId: 'x' })
    run.player = createPlayer({ x: 600, y: 540 })
    run = { ...run, health: 1, enemyFloor: [createHotCheese(600, 540)] }
    run = updateRun(run, IDLE, STEP)
    assert.deepEqual(run.death, { cause: 'fenicottero-fornarino' })
  })
})

describe('Moka Scudiera', () => {
  test('protege o aliado mais perto sem escudo; o escudo anula o próximo dano e some', () => {
    const moka = spawn('moka-scudiera', 6, 3)
    const near = { ...spawn('formaggino-saltellino', 7, 2), waitMs: 99999 }
    const far = { ...spawn('formaggino-saltellino', 11, 6), waitMs: 99999 }
    const player = getCellPoint(1, 0)
    const { enemies, mobEvents } = simulate([moka, near, far], player, 1000, (state) => state.enemies.some((one) => one.shielded))
    const [mokaAfter, nearAfter, farAfter] = enemies
    assert.equal(mokaAfter.animation, 'escudo')
    assert.equal(nearAfter.shielded, true)
    assert.ok(!farAfter.shielded, 'um aliado por vez')
    assert.ok(!mokaAfter.shielded, 'ela não protege a si mesma')
    assert.ok(mobEvents.some(({ cue }) => cue === 'escudo'))

    const blocked = damageTarget(nearAfter, 3)
    assert.equal(blocked.health, nearAfter.health, 'o dano não passa')
    assert.equal(blocked.shielded, false, 'o escudo some')
    assert.equal(damageTarget(blocked, 3).health, nearAfter.health - 3)
  })

  test('sem aliado para proteger, chega perto e solta o anel, que acerta o Tung uma vez', () => {
    const moka = spawn('moka-scudiera', 6, 3)
    const player = { x: moka.x + 120, y: moka.y }
    const { hits, mobEvents } = simulate([moka], player, 1000)
    assert.deepEqual(hits, [{ damage: 1, cause: 'moka-scudiera' }])
    assert.ok(mobEvents.some(({ cue }) => cue === 'anel'))
  })

  test('o anel é achatado como o desenho: chega a ringRadius para os lados e menos para cima e para baixo', () => {
    const center = { x: 800, y: 500, damage: 1, enemyId: 'moka-scudiera' }
    const ringHits = (player) => flyShots([createSteamRing(center)], player, 1000).hits.length
    assert.equal(ringHits({ x: 800 + MOKA.ringRadius - 10, y: 500 }), 1)
    assert.equal(ringHits({ x: 800 + MOKA.ringRadius + 10, y: 500 }), 0)
    assert.equal(ringHits({ x: 800, y: 500 + 80 }), 1)
    assert.equal(ringHits({ x: 800, y: 500 + 120 }), 0)
  })
})

describe('Vespina Lambrettina', () => {
  test('acelera parada soltando a fumaça, que fica na sala, e depois mergulha atrás do Tung', () => {
    const vespina = spawn('vespina-lambrettina', 3, 3)
    const player = getCellPoint(6, 3)
    let { enemies, flashes, mobEvents } = simulate([vespina], player, 540)
    assert.equal(enemies[0].animation, 'acelerando')
    assert.equal(enemies[0].x, vespina.x, 'parada')
    assert.equal(flashes.length, 1)
    assert.equal(flashes[0].effect, 'fumaca')
    assert.equal(flashes[0].hold, true)
    assert.equal(flashes[0].durationMs, VESPINA.smokeMs)
    assert.ok(flashes[0].x < vespina.x, 'atrás dela (o Tung está à direita)')
    assert.ok(mobEvents.some(({ cue }) => cue === 'motor'))
    const dive = simulate(enemies, player, 200)
    enemies = dive.enemies
    assert.equal(enemies[0].animation, 'atacando')
    assert.ok(enemies[0].x > vespina.x + 50, 'mergulhou na direção do Tung')
    assert.ok(dive.mobEvents.some(({ cue }) => cue === 'mergulho'))
  })

  test('mergulha, faz uma curva fechada, mergulha de volta e descansa depois do último mergulho', () => {
    const player = getCellPoint(5, 3)
    const seen = []
    const { enemies, mobEvents } = simulate([spawn('vespina-lambrettina', 2, 3)], player, 4000, (state) => {
      const { animation } = state.enemies[0]
      if (seen[seen.length - 1] !== animation) seen.push(animation)
      return state.enemies[0].waitMs > 0
    })
    assert.deepEqual(seen, ['acelerando', 'atacando', 'curva', 'atacando', 'parado'])
    assert.ok(enemies[0].aim.x < 0, 'a curva a virou de volta para o Tung')
    assert.ok(mobEvents.some(({ cue }) => cue === 'curva'))
    assert.ok(mobEvents.filter(({ cue }) => cue === 'mergulho').length >= 2)
  })
})

describe('Zanzarina Tarantella', () => {
  test('voa dançando por cima dos obstáculos até o Tung e mergulha cobrindo diveDistance', () => {
    const player = getCellPoint(9, 3)
    let overObstacle = false
    let minY = Infinity
    let maxY = -Infinity
    const flying = simulate([spawn('zanzarina-tarantella', 3, 3)], player, 6000, (state) => {
      const zanzarina = state.enemies[0]
      if (WALL.some((box) => overlaps(getBaseBox(zanzarina), box))) overObstacle = true
      minY = Math.min(minY, zanzarina.y)
      maxY = Math.max(maxY, zanzarina.y)
      return zanzarina.animation === 'atacando'
    }, SOLIDS)
    assert.ok(overObstacle, 'passou por cima da parede de obstáculos')
    assert.ok(maxY - minY > 20, `balançou para os lados (${Math.round(maxY - minY)} u)`)

    const start = flying.enemies[0]
    const { enemies, mobEvents } = simulate(flying.enemies, player, 2000, (state) => state.enemies[0].animation !== 'atacando', SOLIDS)
    assert.ok(Math.abs(distance(enemies[0], start) - ZANZARINA.diveDistance) < 10, `mergulhou ${distance(enemies[0], start)}`)
    assert.ok(mobEvents.some(({ cue }) => cue === 'mergulho'))
  })
})

describe('Bombardiro Crocodilo', () => {
  test('a bomba emite o som da explosão mesmo quando não acerta o Tung', () => {
    const bomb = createBomb(400, 525, 2, 'bombardiro-crocodilo', STEP_MS)
    const result = flyShots([bomb], { x: 100, y: 100 }, STEP_MS * 2)

    assert.deepEqual(result.hits, [])
    assert.ok(result.bossEvents.some(({ enemyId, cue }) =>
      enemyId === 'bombardiro-crocodilo' && cue === 'explosao'))
  })
})
