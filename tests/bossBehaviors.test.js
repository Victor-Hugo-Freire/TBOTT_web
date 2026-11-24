import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { CINQUECENTO, TRALALERO } from '../src/data/bossBehavior.js'
import { getBossBar } from '../src/pages/SalaInicial/scene/drawBossBar.js'
import { createRoomBoss, findTouchingEnemy, updateEnemies } from '../src/utils/enemies.js'
import { updateEnemyShots } from '../src/utils/enemyShots.js'
import { generateFloor } from '../src/utils/floorGenerator.js'
import { ROOM_WALLS } from '../src/utils/roomMovement.js'
import { damageTarget, isTargetable } from '../src/utils/targets.js'
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
  const done = { hits: [], flashes: [], shots: [] }
  for (let time = 0; time < ms; time += STEP_MS) {
    const world = { player, solids: ROOM_WALLS, deltaSeconds: STEP, hits: [], flashes: [], floor: [], shots: [] }
    boss = updateEnemies([boss], world)[0]
    done.hits.push(...world.hits)
    done.flashes.push(...world.flashes)
    done.shots.push(...world.shots)
    if (until(boss)) break
  }
  return { boss, ...done }
}

// O Tralalero já na fase `phase` (vida logo abaixo da marca), andando há walkMs: o próximo passo escolhe o ataque de
// número attackCount da lista da fase
function tralaleroReady(phase, attackCount) {
  const fish = spawn('tralalero-tralala')
  const health = { 1: fish.maxHealth, 2: 89, 3: 44 }[phase]
  return { ...fish, health, phase, attackCount, animation: 'andando', animationMs: TRALALERO.walkMs }
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

describe('Tralalero Tralala', () => {
  test('fase 1, longe: investida tripla (o dano da investida) e depois tropeça, com a barra em VULNERAVEL', () => {
    let fish = tralaleroReady(1, 0)
    const player = { x: fish.x + 600, y: fish.y }
    let dashes = 0
    let last = fish.animation
    for (let time = 0; time < 8000 && fish.animation !== 'tropeco-vulneravel'; time += STEP_MS) {
      fish = simulate(fish, player, STEP_MS).boss
      if (fish.animation === 'investida' && last !== 'investida') {
        dashes++
        assert.equal(fish.damage, 2, 'na investida, encostar tira o dano da investida')
      }
      last = fish.animation
    }
    assert.equal(dashes, TRALALERO.dashes)
    assert.equal(fish.animation, 'tropeco-vulneravel')
    assert.equal(getBossBar([fish]).state, 'vulneravel')
    fish = simulate(fish, player, 2000, (one) => one.animation !== 'tropeco-vulneravel').boss
    assert.equal(fish.animation, 'parado')
  })

  test('perto, morde uma vez, com o dano da mordida do catálogo', () => {
    const fish = spawn('tralalero-tralala')
    const { hits } = simulate(fish, { x: fish.x + 120, y: fish.y }, 700)
    assert.deepEqual(hits, [{ damage: 2, cause: 'tralalero-tralala' }])
  })

  test('aos 2/3 da vida põe os óculos: a transição não ataca, depois ele fica parado de óculos e a barra fica laranja', () => {
    const fish = { ...spawn('tralalero-tralala'), health: 90 }
    const player = { x: fish.x + 120, y: fish.y } // perto: sem a transição, ele morderia
    let result = simulate(fish, player, STEP_MS)
    assert.equal(result.boss.animation, 'transicao-fase2')
    assert.equal(result.boss.phase, 2)
    result = simulate(result.boss, player, 2000, (one) => one.animation !== 'transicao-fase2')
    assert.deepEqual(result.hits, [])
    assert.equal(result.boss.animation, 'parado-fase2')
    assert.equal(getBossBar([result.boss]).state, 'fase2')
  })

  test('fase 2, canto: 3 notas em leque na direção do Tung; a do meio acerta, com o dano do canto', () => {
    const fish = tralaleroReady(2, 1)
    const player = { x: fish.x + 400, y: fish.y }
    const { shots } = simulate(fish, player, 1000, (one) => one.animation !== 'canto-tralala' && one.attackCount === 2)
    assert.equal(shots.length, TRALALERO.notes)
    assert.ok(shots.every((shot) => shot.kind === 'nota'))
    const world = { player, solids: ROOM_WALLS, deltaSeconds: STEP, hits: [], floor: [] }
    let flying = shots
    for (let time = 0; time < 3000 && flying.length > 0; time += STEP_MS) flying = updateEnemyShots(flying, world)
    assert.deepEqual(world.hits, [{ damage: 1, cause: 'tralalero-tralala' }])
  })

  test('fase 2, pauta: aparece na fileira do Tung e machuca quem fica nela, uma vez', () => {
    const fish = tralaleroReady(2, 2)
    const player = { x: fish.x + 300, y: fish.y + 90 }
    const { hits, flashes } = simulate(fish, player, 1000)
    assert.ok(flashes.some((flash) => flash.effect === 'pauta'))
    assert.deepEqual(hits, [{ damage: 1, cause: 'tralalero-tralala' }])
  })

  test('fase 2, pauta: quem sai da fileira antes dos quadros de acerto não leva', () => {
    const fish = tralaleroReady(2, 2)
    let result = simulate(fish, { x: fish.x + 300, y: fish.y + 90 }, STEP_MS)
    assert.equal(result.boss.animation, 'pauta')
    result = simulate(result.boss, { x: fish.x + 300, y: fish.y - 60 }, 1000)
    assert.deepEqual(result.hits, [])
  })

  test('fase 2, pauta para a esquerda: o desenho espelha', () => {
    const fish = tralaleroReady(2, 2)
    const { flashes } = simulate(fish, { x: fish.x - 300, y: fish.y }, STEP_MS)
    assert.equal(flashes.find((flash) => flash.effect === 'pauta').mirror, true)
  })

  test('fase 3, mergulho: debaixo do chão nada o acerta nem machuca; a barbatana chega no Tung e ele sai mordendo', () => {
    const fish = tralaleroReady(3, 3)
    const player = { x: fish.x + 400, y: fish.y + 60 }
    let { boss } = simulate(fish, player, 3000, (one) => one.animation === 'barbatana')
    assert.equal(boss.hidden, true)
    assert.equal(isTargetable(boss), false)
    assert.equal(findTouchingEnemy([boss], { x: boss.x, y: boss.y - 10 }), null)
    boss = simulate(boss, player, 5000, (one) => one.animation === 'atacando').boss
    assert.equal(boss.hidden, false)
    assert.ok(Math.hypot(boss.x - player.x, boss.y - player.y) <= TRALALERO.emergeRange + 10, 'saiu embaixo do Tung')
    const { hits } = simulate(boss, player, 700)
    assert.deepEqual(hits, [{ damage: 2, cause: 'tralalero-tralala' }])
  })

  test('fase 3 é mais rápida que a fase 1', () => {
    const player = { x: 1400, y: 300 }
    const slow = simulate({ ...tralaleroReady(1, 0), animationMs: 0 }, player, 500).boss
    const fast = simulate({ ...tralaleroReady(3, 0), animationMs: 0 }, player, 500).boss
    const start = spawn('tralalero-tralala')
    const slowWalk = Math.hypot(slow.x - start.x, slow.y - start.y)
    const fastWalk = Math.hypot(fast.x - start.x, fast.y - start.y)
    assert.ok(Math.abs(fastWalk / slowWalk - TRALALERO.phase3Speed) < 0.05, `${fastWalk} / ${slowWalk}`)
  })
})

describe('Tralalero Tralala: troca de fase', () => {
  const far = (fish) => ({ x: fish.x + 400, y: fish.y })

  test('na troca para a fase 2 ele fica invencível; no fim, já de óculos, volta a levar dano', () => {
    let fish = { ...spawn('tralalero-tralala'), health: 90 }
    fish = simulate(fish, far(fish), STEP_MS).boss
    assert.equal(fish.animation, 'transicao-fase2')
    assert.equal(fish.invincible, true)
    assert.equal(isTargetable(fish), false)
    assert.equal(damageTarget(fish, 30).health, 90, 'o golpe não tira vida na troca')
    assert.notEqual(fish.glasses, true, 'a troca para a fase 2 é desenhada na folha normal: ele põe os óculos')
    fish = simulate(fish, far(fish), 2000, (one) => one.animation !== 'transicao-fase2').boss
    assert.equal(fish.invincible, false)
    assert.equal(fish.glasses, true, 'dali em diante, a folha de óculos')
    assert.equal(isTargetable(fish), true)
  })

  test('a troca para a fase 3 também toca, já de óculos, e também é invencível', () => {
    let fish = { ...tralaleroReady(2, 0), glasses: true, health: 45 }
    fish = simulate(fish, far(fish), STEP_MS).boss
    assert.equal(fish.animation, 'transicao-fase2')
    assert.equal(fish.phase, 3)
    assert.equal(fish.invincible, true)
    assert.equal(fish.glasses, true)
    fish = simulate(fish, far(fish), 2000, (one) => one.animation !== 'transicao-fase2').boss
    assert.equal(fish.invincible, false)
  })

  test('descansando, ele percebe na hora que chegou na marca', () => {
    let fish = spawn('tralalero-tralala')
    const near = { x: fish.x + 120, y: fish.y }
    fish = simulate(fish, near, 2000, (one) => one.restMs > 0).boss // mordeu e foi descansar
    assert.ok(fish.restMs > 0)
    fish = simulate({ ...fish, health: 90 }, near, STEP_MS).boss
    assert.equal(fish.animation, 'transicao-fase2')
  })

  test('passar das duas marcas de uma vez: uma troca só, já na fase 3', () => {
    let fish = { ...spawn('tralalero-tralala'), health: 40 }
    fish = simulate(fish, far(fish), STEP_MS).boss
    assert.equal(fish.animation, 'transicao-fase2')
    assert.equal(fish.phase, 3)
    fish = simulate(fish, far(fish), 2000, (one) => one.animation !== 'transicao-fase2').boss
    assert.equal(fish.glasses, true)
    assert.equal(simulate(fish, far(fish), 200).boss.animation === 'transicao-fase2', false, 'não toca a troca de novo')
  })
})
