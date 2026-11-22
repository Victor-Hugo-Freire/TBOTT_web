import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { CINQUECENTO } from '../src/data/bossBehavior.js'
import { getBossBar } from '../src/pages/SalaInicial/scene/drawBossBar.js'
import { createRoomBoss, updateEnemies } from '../src/utils/enemies.js'
import { generateFloor } from '../src/utils/floorGenerator.js'
import { ROOM_WALLS } from '../src/utils/roomMovement.js'
import { TEST_BOSSES } from './helpers/testCatalog.js'

const STEP = 1 / 50 // 20 ms
const STEP_MS = 20
const BOSS_ROOM = generateFloor(1, 1).rooms.find((room) => room.type === 'chefe')

// O chefe na casa "i" da sala do chefe, já sem a espera do começo da sala
function spawn(id) {
  return { ...createRoomBoss(id, TEST_BOSSES, BOSS_ROOM)[0], waitMs: 0 }
}

// Roda `ms` do chefe sozinho na sala, com o Tung parado em `player`. Devolve o chefe e o que ele fez (hits e
// flashes somados de todos os quadros). until(boss) para antes, se der true.
function simulate(boss, player, ms, until = () => false) {
  const done = { hits: [], flashes: [] }
  for (let time = 0; time < ms; time += STEP_MS) {
    const world = { player, solids: ROOM_WALLS, deltaSeconds: STEP, hits: [], flashes: [], floor: [], shots: [] }
    boss = updateEnemies([boss], world)[0]
    done.hits.push(...world.hits)
    done.flashes.push(...world.flashes)
    if (until(boss)) break
  }
  return { boss, ...done }
}

describe('Cinquecento Turbo', () => {
  test('perto do Tung, buzina: a onda machuca uma vez, com o dano da buzina do catálogo', () => {
    const car = spawn('cinquecento-turbo')
    const player = { x: car.x + 120, y: car.y }
    const { boss, hits, flashes } = simulate(car, player, 600)
    assert.deepEqual(hits, [{ damage: 1, cause: 'cinquecento-turbo' }])
    assert.ok(flashes.some((flash) => flash.effect === 'buzina'))
    assert.equal(boss.animation, 'parado', 'descansa depois de buzinar')
  })

  test('quem sai da onda antes dos quadros de acerto não leva a buzina', () => {
    const car = spawn('cinquecento-turbo')
    let { boss } = simulate(car, { x: car.x + 120, y: car.y }, STEP_MS) // começa a buzinar com ele perto
    assert.equal(boss.animation, 'atacando')
    const far = simulate(boss, { x: car.x + 400, y: car.y }, 600)
    assert.deepEqual(far.hits, [])
  })

  test('depois de buzinar, com o Tung ainda perto, prepara a investida (não buzina de novo)', () => {
    const car = spawn('cinquecento-turbo')
    const player = { x: car.x + 120, y: car.y }
    const { boss } = simulate(car, player, 3000, (one) => one.animation === 'preparando-investida')
    assert.equal(boss.animation, 'preparando-investida')
  })

  test('longe, anda walkMs, avisa e investe; ricocheteia nas paredes e, na última batida, abre o capô', () => {
    const car = spawn('cinquecento-turbo')
    const player = { x: car.x + 500, y: car.y + 100 }
    let { boss } = simulate(car, player, 5000, (one) => one.animation === 'investida')
    assert.equal(boss.animation, 'investida')
    assert.equal(boss.damage, 2, 'na investida, encostar tira o dano da investida')
    assert.ok(boss.aim.x > 0 && boss.aim.y > 0, 'mira no Tung')

    // Primeira batida: só um eixo da direção inverte
    const before = boss.aim
    boss = simulate(boss, player, 5000, (one) => one.bounces === 1).boss
    const flippedX = boss.aim.x === -before.x && boss.aim.y === before.y
    const flippedY = boss.aim.x === before.x && boss.aim.y === -before.y
    assert.ok(flippedX || flippedY, `ricochete: ${JSON.stringify(before)} -> ${JSON.stringify(boss.aim)}`)

    const cooling = simulate(boss, player, 8000, (one) => one.animation === 'esfriando')
    boss = cooling.boss
    assert.equal(boss.animation, 'esfriando')
    assert.equal(boss.bounces, CINQUECENTO.bounces + 1)
    assert.ok(cooling.flashes.some((flash) => flash.effect === 'impacto'))
    assert.equal(boss.damage, 1, 'parado, volta o dano de encostar')
    assert.equal(getBossBar([boss]).state, 'vulneravel', 'capô aberto: a barra mostra VULNERAVEL')

    boss = simulate(boss, player, 2000, (one) => one.animation !== 'esfriando').boss
    assert.equal(boss.animation, 'parado')
    assert.equal(boss.waitMs, CINQUECENTO.restMs)
  })

  test('a investida nunca sai da sala', () => {
    const car = spawn('cinquecento-turbo')
    const player = { x: car.x - 300, y: car.y - 200 }
    const { boss } = simulate(car, player, 10000, (one) => one.animation === 'esfriando')
    assert.equal(boss.animation, 'esfriando')
    for (const wall of ROOM_WALLS) {
      const base = { x: boss.x - boss.base.width / 2, y: boss.y - boss.base.height, width: boss.base.width, height: boss.base.height }
      const inside = base.x < wall.x + wall.width && base.x + base.width > wall.x && base.y < wall.y + wall.height && base.y + base.height > wall.y
      assert.equal(inside, false)
    }
  })
})
