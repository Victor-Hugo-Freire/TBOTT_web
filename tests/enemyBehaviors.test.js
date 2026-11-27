import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { CHARACTER_STATS } from '../src/data/characterStats.js'
import { CANNOLO, FORMAGGINO, HAZARD_COOLDOWN_MS, PEPERONCINO, PINGUINO, POLPETTA, START_WAIT_MS } from '../src/data/enemyBehavior.js'
import { createEnemy, findTouchingEnemy, getEnemyPose, updateEnemies } from '../src/utils/enemies.js'
import { ENEMY_SPRITES } from '../src/data/enemySprites.js'
import { createIceTrail, explodeIfLit, getLayerVariant } from '../src/utils/enemyBehaviors.js'
import { generateFloor } from '../src/utils/floorGenerator.js'
import { createPlayer } from '../src/utils/player.js'
import { getFloorEffect } from '../src/utils/roomObstacles.js'
import { getCellRect } from '../src/utils/roomLayout.js'
import { ROOM_FLOOR, ROOM_WALLS } from '../src/utils/roomMovement.js'
import { createRun, updateRun } from '../src/utils/run.js'
import { damageTarget, findSwingHits, getTargetBox, stunTarget } from '../src/utils/targets.js'
import { TEST_CATALOG, TEST_ENEMIES } from './helpers/testCatalog.js'

const STEP = 1 / 50 // 20 ms
const STEP_MS = 20
const cell0 = getCellRect(0, 0) // tamanho de uma casa da grade

// Um inimigo do catálogo de teste na casa (col, row), já sem a espera do começo da sala
function spawn(id, col = 6, row = 3) {
  return { ...createEnemy(TEST_ENEMIES[id], col, row), waitMs: 0 }
}

// Roda `ms` de um inimigo sozinho na sala, com o Tung parado em `player`. Devolve o inimigo e o que ele fez
// (hits, flashes e floor somados de todos os quadros). until(enemy) para antes, se der true.
function simulate(enemy, player, ms, until = () => false, solids = ROOM_WALLS) {
  const done = { hits: [], flashes: [], floor: [], mobEvents: [] }
  for (let time = 0; time < ms; time += STEP_MS) {
    const world = { player, solids, deltaSeconds: STEP, hits: [], flashes: [], floor: [] }
    enemy = updateEnemies([enemy], world)[0]
    done.hits.push(...world.hits)
    done.flashes.push(...world.flashes)
    done.floor.push(...world.floor)
    done.mobEvents.push(...world.mobEvents)
    if (until(enemy)) break
  }
  return { enemy, ...done }
}

const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)

describe('todos os inimigos', () => {
  test('ao entrar na sala, esperam START_WAIT_MS parados e depois agem', () => {
    const enemy = createEnemy(TEST_ENEMIES['formaggino-saltellino'], 2, 3)
    const player = { x: 1300, y: 525 }
    const waited = simulate(enemy, player, START_WAIT_MS - 40).enemy
    assert.equal(waited.x, enemy.x, 'ainda parado')
    assert.equal(waited.animation, 'parado')
    const moving = simulate(waited, player, 200).enemy
    assert.ok(moving.x > enemy.x, 'depois anda')
  })

  test('preso pela Muçarela não age nem anima; lento anda mais devagar', () => {
    const player = { x: 1300, y: 525 }
    const stunned = stunTarget(spawn('formaggino-saltellino', 2, 3), 800)
    const world = { player, solids: ROOM_WALLS, deltaSeconds: STEP, hits: [], flashes: [], floor: [] }
    assert.deepEqual(updateEnemies([stunned], world)[0], stunned)

    const normal = simulate(spawn('formaggino-saltellino', 2, 3), player, 400).enemy
    const slow = simulate({ ...spawn('formaggino-saltellino', 2, 3), slowMultiplier: 0.5, slowMs: 5000 }, player, 400).enemy
    const start = spawn('formaggino-saltellino', 2, 3)
    assert.ok(Math.abs((slow.x - start.x) * 2 - (normal.x - start.x)) < 2, 'metade do caminho')
  })
})

describe('Formaggino Saltellino', () => {
  test('longe, anda até o Tung; perto, salta jumpDistance e descansa ao pousar', () => {
    const player = { x: 1100, y: 525 }
    let { enemy } = simulate(spawn('formaggino-saltellino', 2, 3), player, 5000, (one) => one.animation === 'atacando')
    assert.equal(enemy.animation, 'atacando')
    assert.ok(distance(enemy, player) <= FORMAGGINO.attackRange)
    const before = { x: enemy.x, y: enemy.y }
    enemy = simulate(enemy, player, 2000, (one) => one.animation !== 'atacando').enemy
    assert.ok(Math.abs(distance(enemy, before) - FORMAGGINO.jumpDistance) < 10, `saltou ${distance(enemy, before)}`)
    assert.equal(enemy.animation, 'parado')
    assert.equal(enemy.waitMs, FORMAGGINO.restMs)
    const attack = simulate({ ...enemy, waitMs: 0 }, player, 2000)
    assert.ok(attack.mobEvents.some(({ cue }) => cue === 'mordida'))
    assert.ok(attack.mobEvents.some(({ cue }) => cue === 'pouso'))
  })
})

describe('Cannolo Carica', () => {
  test('perto, raspa o pé, investe em linha reta e, batendo na parede, fica atordoado com as estrelas', () => {
    const player = { x: 400, y: 525 } // à esquerda: a investida passa por ele e bate na parede
    let { enemy } = simulate(spawn('cannolo-carica', 6, 3), player, 5000, (one) => one.animation === 'preparando')
    assert.equal(enemy.animation, 'preparando')
    assert.ok(enemy.side && enemy.facingLeft, 'de lado, virado para a esquerda')
    assert.equal(getEnemyPose(enemy).animation, 'preparando-lado')
    const standing = enemy.x
    const windup = simulate(enemy, player, 590)
    enemy = windup.enemy
    assert.equal(enemy.x, standing, 'raspando o pé, não sai do lugar')

    const charge = simulate(enemy, player, 3000, (one) => one.animation === 'atordoado')
    assert.equal(charge.enemy.animation, 'atordoado')
    assert.ok(charge.enemy.x < 200, `foi até a parede (${charge.enemy.x})`)
    assert.ok(charge.flashes.some((flash) => flash.effect === 'impacto'))
    assert.ok(charge.flashes.some((flash) => flash.effect === 'estrela-atordoado' && flash.loop))
    assert.deepEqual([...windup.mobEvents, ...charge.mobEvents].map(({ cue }) => cue), ['investida', 'impacto'])

    const after = simulate(charge.enemy, player, CANNOLO.stunnedMs + 40).enemy
    assert.equal(after.animation, 'parado')
    assert.equal(after.waitMs > 0, true)
  })
})

describe('Polpetta Sotterranea', () => {
  test('afunda e, escondida, nada a acerta, nem encostar machuca; emerge embaixo do Tung', () => {
    const player = { x: 900, y: 600 }
    let { enemy } = simulate(spawn('polpetta-sotterranea', 6, 3), player, 3000, (one) => one.hidden)
    assert.equal(enemy.animation, 'escondida')
    assert.deepEqual(findSwingHits([enemy], getTargetBox(enemy), []), [])
    assert.equal(damageTarget(enemy, 3), enemy, 'o golpe não tira vida')
    assert.equal(findTouchingEnemy([enemy], { x: enemy.x, y: enemy.y }), null)

    enemy = simulate(enemy, player, POLPETTA.hiddenMs + 100, (one) => !one.hidden).enemy
    assert.equal(enemy.animation, 'emergindo')
    assert.ok(distance(enemy, player) <= POLPETTA.emergeRange + 5, 'emergiu embaixo do Tung')
    assert.notEqual(damageTarget(enemy, 3), enemy, 'emergindo, o golpe acerta')
    const attack = simulate(enemy, player, 2000)
    assert.ok(attack.mobEvents.some(({ cue }) => cue === 'mordida'))
    assert.ok(attack.mobEvents.some(({ cue }) => cue === 'afundar'))
  })

  test('sem alcançar o Tung, emerge depois de hiddenMs', () => {
    const player = { x: 1400, y: 300 }
    let { enemy } = simulate(spawn('polpetta-sotterranea', 1, 5), player, 3000, (one) => one.hidden)
    enemy = simulate(enemy, player, POLPETTA.hiddenMs + 100, (one) => !one.hidden).enemy
    assert.equal(enemy.animation, 'emergindo')
    assert.ok(distance(enemy, player) > POLPETTA.emergeRange)
  })
})

describe('Peperoncino Kamikaze', () => {
  test('perto, acende, explode uma vez (dano no Tung perto) e some', () => {
    const player = { x: 900, y: 525 }
    let { enemy } = simulate(spawn('peperoncino-kamikaze', 2, 3), player, 5000, (one) => one.animation === 'aceso')
    assert.ok(distance(enemy, player) <= PEPERONCINO.fuseRange)
    const boom = simulate(enemy, player, 3000, (one) => one.dead)
    assert.deepEqual(boom.hits, [{ damage: 2, cause: 'peperoncino-kamikaze' }])
    assert.equal(boom.flashes.filter((flash) => flash.effect === 'explosao').length, 1)
    assert.ok(boom.mobEvents.some(({ cue }) => cue === 'explosao'))
    assert.ok(boom.enemy.dead && boom.enemy.vanished)
    assert.equal(getEnemyPose(boom.enemy), null, 'a explosão toma o lugar da morte')
  })

  test('o Tung longe da explosão não leva dano', () => {
    let { enemy } = simulate(spawn('peperoncino-kamikaze', 2, 3), { x: 900, y: 525 }, 5000, (one) => one.animation === 'aceso')
    const boom = simulate(enemy, { x: 1400, y: 300 }, 3000, (one) => one.dead)
    assert.deepEqual(boom.hits, [])
  })

  test('morto antes de acender não explode; morto aceso, explode na hora', () => {
    const world = { player: { x: 900, y: 525 }, solids: ROOM_WALLS, deltaSeconds: STEP, hits: [], flashes: [], floor: [] }
    const running = damageTarget(spawn('peperoncino-kamikaze'), 99)
    assert.equal(explodeIfLit(running, world), running)
    const lit = damageTarget({ ...spawn('peperoncino-kamikaze'), animation: 'aceso' }, 99)
    assert.ok(explodeIfLit(lit, world).vanished)
    assert.equal(world.flashes.length, 1)
  })
})

describe('Pinguino Sorbettino', () => {
  test('perto, se joga de barriga e desliza em linha reta deixando gelo; batendo, descansa', () => {
    const player = { x: 500, y: 525 }
    const windup = simulate(spawn('pinguino-sorbettino', 8, 3), player, 5000, (one) => one.animation === 'deslizando')
    let { enemy } = windup
    assert.equal(enemy.animation, 'deslizando')
    const slide = simulate(enemy, player, 3000, (one) => one.animation !== 'deslizando')
    assert.ok(slide.floor.length >= 3, `${slide.floor.length} pedaços de gelo`)
    assert.ok(slide.floor.every((trail) => trail.mechanic === 'escorregadio'))
    assert.ok(windup.mobEvents.some(({ cue }) => cue === 'deslize'))
    assert.ok(slide.mobEvents.some(({ cue }) => cue === 'gelo'))
    assert.ok(slide.mobEvents.some(({ cue }) => cue === 'pouso'))
    assert.ok(slide.enemy.x < player.x, 'passou pelo Tung')
    assert.equal(slide.enemy.waitMs, PINGUINO.restMs)
  })

  test('parado, mostra as bolas de sorvete que restam: cada golpe de 3 derruba uma', () => {
    let enemy = spawn('pinguino-sorbettino')
    const idle = (one) => updateEnemies([{ ...one, waitMs: 100 }], { player: { x: 0, y: 0 }, solids: ROOM_WALLS, deltaSeconds: STEP, hits: [], flashes: [], floor: [] })[0].animation
    assert.equal(idle(enemy), 'parado')
    enemy = damageTarget(enemy, 3)
    assert.equal(idle(enemy), 'parado-2')
    enemy = damageTarget(enemy, 3)
    assert.equal(idle(enemy), 'parado-1')
  })

  test('andando, atacando e deslizando também mostra só as bolas que restam (a versão da folha)', () => {
    // Era o defeito: só o parado tinha menos bolas; andando ou deslizando, as 3 voltavam
    let enemy = spawn('pinguino-sorbettino')
    assert.equal(getLayerVariant(enemy), null)
    enemy = damageTarget(enemy, 3)
    assert.equal(getLayerVariant(enemy), 'bolas2')
    enemy = damageTarget(enemy, 3)
    assert.equal(getLayerVariant({ ...enemy, animation: 'deslizando' }), 'bolas1')
    assert.equal(getLayerVariant(damageTarget(enemy, 3)), 'bolas1', 'morrendo, a da última bola')
    const { variantLayers } = ENEMY_SPRITES['pinguino-sorbettino']
    assert.ok(variantLayers.bolas2.tronco && variantLayers.bolas1.pernas)
  })

  test('na run, o gelo no chão faz o Tung escorregar', () => {
    let run = createRun({ seed: 1, characterId: 'x', catalog: TEST_CATALOG })
    run.player = createPlayer({ x: 800, y: 560 })
    run.enemyFloor = [createIceTrail(800, 570)]
    assert.equal(getFloorEffect(run.enemyFloor, run.player).slippery, true)
    run = updateRun(run, { movement: { x: 1, y: 0 }, attackDirection: null }, STEP)
    assert.ok(run.slip, 'deslizando no gelo')
  })
})

describe('na run', () => {
  test('a esteira da sala empurra o inimigo que está em cima dela', () => {
    const room = generateFloor(1, 1).rooms.find((one) => one.type === 'comum')
    let run = createRun({ seed: 1, roomId: room.id, characterId: 'x', catalog: TEST_CATALOG, enemyCatalog: TEST_ENEMIES })
    const enemy = run.targets[0]
    const cell = getCellRect(Math.floor((enemy.x - ROOM_FLOOR.left) / cell0.width), Math.floor((enemy.y - ROOM_FLOOR.top) / cell0.height))
    run.obstacles = [...run.obstacles, { id: 'esteira', kind: 'esteira', mechanic: 'esteira', direction: -1, blocking: false, box: cell }]
    run.player = createPlayer({ x: 800, y: 760 })
    for (let i = 0; i < 5; i++) run = updateRun(run, { movement: { x: 0, y: 0 }, attackDirection: null }, STEP)
    assert.ok(run.targets[0].x < enemy.x - 15, `empurrado para a esquerda (${Math.round(run.targets[0].x - enemy.x)} u)`)
  })

  test('a explosão do Peperoncino tira vida do Tung pelo damagePlayer, com a causa certa', () => {
    const room = generateFloor(1, 4).rooms.find((one) => one.type === 'comum')
    const enemyCatalog = { 'peperoncino-kamikaze': TEST_ENEMIES['peperoncino-kamikaze'] }
    let run = createRun({ seed: 1, floorNumber: 4, roomId: room.id, characterId: 'x', catalog: TEST_CATALOG, enemyCatalog, health: 2 })
    const idle = { movement: { x: 0, y: 0 }, attackDirection: null }
    for (let time = 0; time < 6000 && !run.death; time += STEP_MS) run = updateRun(run, idle, STEP)
    assert.deepEqual(run.death, { cause: 'peperoncino-kamikaze' })
  })
})

describe('o piso vale para os inimigos', () => {
  const WHOLE_FLOOR = { x: ROOM_FLOOR.left, y: ROOM_FLOOR.top, width: ROOM_FLOOR.right - ROOM_FLOOR.left, height: ROOM_FLOOR.bottom - ROOM_FLOOR.top }

  // Roda `ms` com o piso pedido (floorObstacles) e o Tung parado em `player`
  function onFloor(enemy, floorObstacles, ms, player = { x: 1400, y: 525 }) {
    for (let time = 0; time < ms; time += STEP_MS) {
      const world = { player, solids: ROOM_WALLS, deltaSeconds: STEP, hits: [], flashes: [], floor: [], floorObstacles }
      enemy = updateEnemies([enemy], world)[0]
    }
    return enemy
  }

  test('a esteira empurra, mesmo com o inimigo parado esperando', () => {
    const conveyor = { mechanic: 'esteira', direction: 1, box: getCellRect(6, 3), removed: false }
    const start = { ...spawn('formaggino-saltellino'), waitMs: 1000 }
    const after = onFloor(start, [conveyor], 200)
    assert.ok(after.x > start.x + 30, `empurrado (${Math.round(after.x - start.x)} u)`)
    assert.equal(after.animation, 'parado', 'e continua esperando')
  })

  test('o grudento deixa lento', () => {
    const sticky = { mechanic: 'grudento', box: WHOLE_FLOOR, removed: false }
    const start = spawn('formaggino-saltellino', 2, 3)
    const normal = onFloor(start, [], 300)
    const slow = onFloor(start, [sticky], 300)
    assert.ok(Math.abs((slow.x - start.x) / (normal.x - start.x) - 0.35) < 0.02)
  })

  test('no líquido escorrega: pisa embalado e, parado, continua deslizando', () => {
    const liquid = { mechanic: 'escorregadio', box: WHOLE_FLOOR, removed: false }
    const start = spawn('formaggino-saltellino', 2, 3)
    const normal = onFloor(start, [], 200)
    const slipping = onFloor(start, [liquid], 200)
    assert.ok(slipping.x - start.x > (normal.x - start.x) * 1.3, 'o escorregão: mais rápido que andando')
    const coasting = onFloor({ ...slipping, waitMs: 1000 }, [liquid], 200)
    assert.ok(coasting.x > slipping.x + 10, 'parado esperando, o embalo leva ele para a frente')
  })

  test('o Pinguino não escorrega, e a Polpetta escondida não sente o piso', () => {
    const liquid = { mechanic: 'escorregadio', box: WHOLE_FLOOR, removed: false }
    const penguin = spawn('pinguino-sorbettino', 2, 3)
    const player = { x: 1400, y: 300 } // longe: ele só anda
    assert.equal(Math.round(onFloor(penguin, [liquid], 200, player).x), Math.round(onFloor(penguin, [], 200, player).x))

    const conveyor = { mechanic: 'esteira', direction: 1, box: WHOLE_FLOOR, removed: false }
    const hidden = { ...spawn('polpetta-sotterranea'), animation: 'escondida', hidden: true, waitMs: 1000 }
    assert.equal(onFloor(hidden, [conveyor], 200).x, hidden.x)
  })
})

describe('perigos do chão (chapa quente e cacos)', () => {
  // Cacos do garrafão quebrado na casa (col, row): não bloqueiam, mas machucam quem pisa
  function shards(col, row) {
    const rect = getCellRect(col, row)
    return { mechanic: 'cacos', kind: 'cacos', blocking: false, box: { x: rect.x + 10, y: rect.y + 7, width: 84, height: 60 } }
  }

  function onHazards(enemy, floorObstacles, ms, player = { x: 1400, y: 525 }, solids = ROOM_WALLS) {
    for (let time = 0; time < ms; time += STEP_MS) {
      const world = { player, solids, deltaSeconds: STEP, hits: [], flashes: [], floor: [], floorObstacles }
      enemy = updateEnemies([enemy], world)[0]
    }
    return enemy
  }

  test('pisar nos cacos tira 1 de vida, e só tira de novo depois de HAZARD_COOLDOWN_MS', () => {
    const start = { ...spawn('cannolo-carica'), waitMs: 5000 } // parado em cima dos cacos
    const floor = [shards(6, 3)]
    let enemy = onHazards(start, floor, STEP_MS)
    assert.equal(enemy.health, start.health - 1)
    enemy = onHazards(enemy, floor, HAZARD_COOLDOWN_MS - 2 * STEP_MS)
    assert.equal(enemy.health, start.health - 1, 'dentro do intervalo, não')
    enemy = onHazards(enemy, floor, 3 * STEP_MS)
    assert.equal(enemy.health, start.health - 2, 'depois do intervalo, de novo')
  })

  test('encostar na chapa quente tira 1 de vida', () => {
    const rect = getCellRect(7, 3)
    const plate = { mechanic: 'quente', kind: 'chapa', blocking: true, box: { x: rect.x + 10, y: rect.y + 7, width: 84, height: 60 } }
    // o Cannolo à esquerda da chapa, andando até o Tung do outro lado: encosta nela
    const start = spawn('cannolo-carica', 6, 3)
    const touching = { ...start, x: plate.box.x - 22, waitMs: 5000 }
    assert.equal(onHazards(touching, [plate], STEP_MS, undefined, [...ROOM_WALLS, plate.box]).health, start.health - 1)
  })

  test('o inimigo dá a volta nos cacos para chegar ao Tung, sem se ferir', () => {
    const floor = [1, 2, 3, 4, 5].map((row) => shards(6, row))
    let enemy = spawn('formaggino-saltellino', 3, 3)
    const player = { x: getCellRect(9, 3).x + 52, y: getCellRect(9, 3).y + 55 }
    for (let time = 0; time < 10000 && enemy.animation !== 'atacando'; time += STEP_MS) enemy = onHazards(enemy, floor, STEP_MS, player)
    assert.equal(enemy.animation, 'atacando', 'chegou perto do Tung')
    assert.equal(enemy.health, enemy.maxHealth, 'sem pisar nos cacos')
  })

  test('quem voa (a Zanzarina) não se fere nos cacos nem é empurrado pela esteira', () => {
    const flyer = { ...spawn('zanzarina-tarantella'), waitMs: 5000 }
    assert.equal(flyer.flying, true)
    assert.equal(spawn('vespina-lambrettina').flying, false, 'a Vespina anda de lambreta')
    const conveyor = { mechanic: 'esteira', direction: 1, box: getCellRect(6, 3), removed: false }
    const after = onHazards(flyer, [shards(6, 3), conveyor], 500)
    assert.deepEqual([after.x, after.health], [flyer.x, flyer.maxHealth])
  })
})

describe('personagem que voa (para os personagens futuros)', () => {
  test('com flying na ficha, a chapa e os cacos não machucam e a esteira não empurra', () => {
    CHARACTER_STATS['teste-voador'] = { ...CHARACTER_STATS['tung-tung-sahur'], flying: true }
    try {
      for (const flying of [false, true]) {
        const characterId = flying ? 'teste-voador' : 'tung-tung-sahur'
        let run = createRun({ seed: 1, characterId, catalog: TEST_CATALOG })
        const rect = getCellRect(6, 3)
        run.obstacles = [
          { id: 'cacos', kind: 'cacos', mechanic: 'cacos', blocking: false, box: rect },
          { id: 'esteira', kind: 'esteira', mechanic: 'esteira', direction: 1, blocking: false, box: rect },
        ]
        run.player = createPlayer({ x: rect.x + rect.width / 2, y: rect.y + rect.height - 5 })
        const startX = run.player.x
        run = updateRun(run, { movement: { x: 0, y: 0 }, attackDirection: null }, STEP)
        assert.equal(run.health < 6, !flying, flying ? 'voando, sem dano' : 'andando, o caco machuca')
        assert.equal(run.player.x > startX, !flying, flying ? 'voando, a esteira não empurra' : 'andando, a esteira empurra')
      }
    } finally {
      delete CHARACTER_STATS['teste-voador']
    }
  })
})
