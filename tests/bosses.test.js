import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { BOSS_BODIES, BOSS_STUN_MS } from '../src/data/bossBehavior.js'
import { getBossBar, LOST_CHUNK_MS } from '../src/pages/SalaInicial/scene/drawBossBar.js'
import { getMinimapRoomState } from '../src/pages/SalaInicial/scene/drawMinimap.js'
import { getBossPhase, pickRunBosses } from '../src/utils/bosses.js'
import { getRoomDoors, SIDE_VECTORS } from '../src/utils/doors.js'
import { createRoomBoss } from '../src/utils/enemies.js'
import { generateFloor, getPactRoomType, LAST_FLOOR, setPactRoomType } from '../src/utils/floorGenerator.js'
import { getDeathCauseLabel } from '../src/utils/health.js'
import { buildBossCatalog } from '../src/utils/itemCatalog.js'
import { getRoomPedestals } from '../src/utils/pedestals.js'
import { createPlayer, getAttackHitbox } from '../src/utils/player.js'
import { normalizeProgressPayload } from '../src/utils/progress.js'
import { getCellPoint, getLayout, getLayoutPoints } from '../src/utils/roomLayout.js'
import { getFeetBox, ROOM_PLAYER_BOUNDS } from '../src/utils/roomMovement.js'
import { overlaps } from '../src/utils/collision.js'
import { createRun, createRunSnapshot, getCurrentRoom, getDrumBox, isDrumVisible, updateRun } from '../src/utils/run.js'
import { damageTarget, stunTarget } from '../src/utils/targets.js'
import { TEST_BOSSES, TEST_CATALOG, TEST_ENEMIES } from './helpers/testCatalog.js'

const STEP = 1 / 20
const IDLE = { movement: { x: 0, y: 0 }, attackDirection: null }
const GROUP_A = ['brr-brr-patapim', 'chimpanzini-bananini', 'cinquecento-turbo', 'nonna-lasagnona'] // andares 1 e 2
const GROUP_B = ['ballerina-cappuccina', 'bombardiro-crocodilo', 'cappuccino-assassino'] // andares 3 e 4 (e a Nonna)
const { minX, maxX, minY, maxY } = ROOM_PLAYER_BOUNDS
// Pés encostados na parede, no meio do vão de cada porta
const DOOR_EDGES = { up: { x: 800, y: minY }, down: { x: 800, y: maxY }, left: { x: minX, y: 536 }, right: { x: maxX, y: 536 } }

// Primeira seed em que o andar tem uma sala que passa no `check`
function findSeed(floorNumber, check) {
  for (let seed = 1; seed < 1000; seed++) {
    if (generateFloor(seed, floorNumber).rooms.some(check)) return seed
  }
  throw new Error('nenhuma seed serviu')
}

function bossRoomOf(floor) {
  return floor.rooms.find((room) => room.type === 'chefe')
}

// Run começando na sala do chefe do andar, com o catálogo de teste (itens, inimigos e chefes)
function bossRun(seed, floorNumber, fields = {}) {
  const roomId = bossRoomOf(generateFloor(seed, floorNumber)).id
  return createRun({
    seed,
    floorNumber,
    roomId,
    characterId: 'tung-tung-sahur',
    catalog: TEST_CATALOG,
    enemyCatalog: TEST_ENEMIES,
    bossCatalog: TEST_BOSSES,
    ...fields,
  })
}

function steps(run, count, input = IDLE) {
  for (let i = 0; i < count; i++) run = updateRun(run, input, STEP)
  return run
}

function getBoss(run) {
  return run.targets.find((target) => target.boss)
}

// Mata o chefe de uma vez e roda um quadro (a sala fica limpa nesse quadro)
function killBoss(run) {
  run = { ...run, targets: run.targets.map((target) => (target.boss ? damageTarget(target, 999) : target)) }
  return updateRun(run, IDLE, STEP)
}

// Encosta no chefe por um quadro (os pés dentro da área de contato dele)
function touchBoss(run) {
  const boss = getBoss(run)
  run.player = createPlayer({ x: boss.x, y: boss.y - 10 })
  return updateRun(run, IDLE, STEP)
}

// Sai da run e continua: o progresso vira JSON (como na API) e a run é recriada com o que voltou
function continueRun(run, change = (saved) => saved) {
  const saved = change(normalizeProgressPayload(JSON.parse(JSON.stringify(createRunSnapshot(run, 5000)))))
  return createRun({
    seed: saved.seed,
    floorNumber: saved.floor,
    roomId: saved.roomId,
    position: { x: saved.playerX, y: saved.playerY },
    characterId: saved.characterId,
    visitedRoomIds: saved.visitedRoomIds,
    clearedRoomIds: saved.clearedRoomIds,
    roomStates: saved.roomStates,
    health: saved.health,
    items: saved.items,
    catalog: TEST_CATALOG,
    enemyCatalog: TEST_ENEMIES,
    bossCatalog: TEST_BOSSES,
    pactRoomType: saved.pactRoomType,
  })
}

describe('pickRunBosses (o chefe de cada andar)', () => {
  test('a mesma seed dá sempre os mesmos chefes; seeds diferentes variam', () => {
    assert.deepEqual(pickRunBosses(42, TEST_BOSSES), pickRunBosses(42, TEST_BOSSES))
    const firstFloors = new Set()
    for (let seed = 1; seed <= 60; seed++) firstFloors.add(pickRunBosses(seed, TEST_BOSSES)[0])
    assert.deepEqual([...firstFloors].sort(), GROUP_A, 'os 4 chefes do grupo dos andares 1 e 2 aparecem no andar 1')
  })

  test('segue os andares do catálogo, sem repetir chefe, e o andar 5 é sempre o Tralalero', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const bosses = pickRunBosses(seed, TEST_BOSSES)
      assert.equal(bosses.length, LAST_FLOOR)
      assert.equal(new Set(bosses).size, LAST_FLOOR, `seed ${seed}: chefe repetido`)
      assert.ok(GROUP_A.includes(bosses[0]) && GROUP_A.includes(bosses[1]), `seed ${seed}: andares 1 e 2`)
      for (const floorBoss of [bosses[2], bosses[3]]) {
        const nonnaFree = floorBoss === 'nonna-lasagnona' && !bosses.slice(0, 2).includes('nonna-lasagnona')
        assert.ok(GROUP_B.includes(floorBoss) || nonnaFree, `seed ${seed}: andares 3 e 4`)
      }
      assert.equal(bosses[4], 'tralalero-tralala')
    }
  })

  test('a Nonna aparece nos andares 3 e 4 só quando não saiu nos andares 1 e 2', () => {
    let nonnaLate = 0
    for (let seed = 1; seed <= 300; seed++) {
      const bosses = pickRunBosses(seed, TEST_BOSSES)
      if (bosses[2] === 'nonna-lasagnona' || bosses[3] === 'nonna-lasagnona') nonnaLate++
    }
    assert.ok(nonnaLate > 0)
  })

  test('a ordem do catálogo da API não muda os chefes', () => {
    const reversed = Object.fromEntries(Object.entries(TEST_BOSSES).reverse())
    assert.deepEqual(pickRunBosses(7, reversed), pickRunBosses(7, TEST_BOSSES))
  })

  test('sem catálogo, nenhum andar tem chefe', () => {
    assert.deepEqual(pickRunBosses(1, {}), [null, null, null, null, null])
  })
})

describe('buildBossCatalog e o chefe criado', () => {
  test('os 8 chefes com sprite entram por id; sem sprite (ou sem catálogo) são anotados', () => {
    const { bosses, missingSprite, missingInCatalog } = buildBossCatalog([...Object.values(TEST_BOSSES), { id: 'pizza-margheritron' }])
    assert.equal(Object.keys(bosses).length, 8)
    assert.deepEqual(missingSprite, ['pizza-margheritron'])
    assert.deepEqual(missingInCatalog, [])
    assert.deepEqual(buildBossCatalog(null).missingInCatalog.length, 8)
  })

  test('o chefe nasce na casa "i" da sala do chefe, com a vida, o dano e o nome do catálogo', () => {
    const floor = generateFloor(1, 1)
    const room = bossRoomOf(floor)
    const [boss] = createRoomBoss('cinquecento-turbo', TEST_BOSSES, room)
    const { col, row } = getLayoutPoints(room.layoutId).enemies[0]
    assert.deepEqual({ x: boss.x, y: boss.y }, getCellPoint(col, row))
    assert.equal(boss.boss, true)
    assert.equal(boss.health, 60)
    assert.equal(boss.damage, 1)
    assert.equal(boss.name, 'Cinquecento Turbo')
    assert.equal(boss.width, BOSS_BODIES['cinquecento-turbo'].width)
    assert.ok(boss.base.width > 44, 'a base do chefe é maior que a dos inimigos')
    assert.deepEqual(createRoomBoss(null, TEST_BOSSES, room), [])
  })

  test('a Muçarela prende o chefe só por BOSS_STUN_MS', () => {
    const [boss] = createRoomBoss('cinquecento-turbo', TEST_BOSSES, bossRoomOf(generateFloor(1, 1)))
    assert.equal(stunTarget(boss, 2000).stunMs, BOSS_STUN_MS)
  })

  test('a fase do chefe muda nas marcas da barra', () => {
    const [tralalero] = createRoomBoss('tralalero-tralala', TEST_BOSSES, bossRoomOf(generateFloor(1, 5)))
    assert.equal(getBossPhase(tralalero), 1)
    assert.equal(getBossPhase({ ...tralalero, health: 81 }), 2) // 60%
    assert.equal(getBossPhase({ ...tralalero, health: 40 }), 3) // 30%
    const [car] = createRoomBoss('cinquecento-turbo', TEST_BOSSES, bossRoomOf(generateFloor(1, 1)))
    assert.equal(getBossPhase({ ...car, health: 1 }), 1, 'o Cinquecento tem uma fase só')
  })

  test('morrer para um chefe tem o nome dele no aviso', () => {
    assert.equal(getDeathCauseLabel('cinquecento-turbo'), 'o Cinquecento Turbo')
    assert.equal(getDeathCauseLabel('nonna-lasagnona'), 'a Nonna Lasagnona')
  })
})

describe('luta na sala do chefe', () => {
  test('ao entrar: o chefe sorteado do andar, portas fechadas, sem tambor e sem pedestal', () => {
    const run = bossRun(1, 1)
    const room = getCurrentRoom(run)
    const boss = getBoss(run)
    assert.equal(boss.enemyId, run.bosses[0])
    assert.equal(room.cleared, false)
    assert.ok(getRoomDoors(run.floor, room).every((door) => door.state === 'closed'))
    assert.equal(isDrumVisible(room), false)
    assert.equal(run.drumDrop, null)
    assert.ok(!run.obstacles.some((obstacle) => obstacle.mechanic === 'tambor'), 'o tambor não é parede invisível')
    assert.deepEqual(getRoomPedestals(run, room), [])
  })

  test('encostar no chefe machuca com o dano dele', () => {
    const run = touchBoss(bossRun(1, 1))
    assert.equal(run.health, 6 - TEST_BOSSES[run.bosses[0]].damage)
  })

  test('o chefe morre: a sala fica limpa, as portas abrem, o tambor cai, o Rolo aparece e sai a recompensa', () => {
    let run = killBoss(bossRun(1, 1))
    const room = getCurrentRoom(run)
    assert.equal(room.cleared, true)
    assert.ok(getRoomDoors(run.floor, room).every((door) => door.state === 'open'))
    assert.ok(run.drumDrop, 'o tambor está caindo')
    assert.ok(run.obstacles.some((obstacle) => obstacle.mechanic === 'tambor'))
    assert.equal(room.rewards, 1)
    assert.deepEqual(getRoomPedestals(run, room).map((pedestal) => pedestal.itemId), ['rolo-de-bronze'])
    run = steps(run, 40)
    assert.equal(run.drumDrop, null, 'o tambor terminou de cair')
  })

  test('sem catálogo de chefes a sala do chefe fica limpa ao entrar (como antes da luta)', () => {
    const run = bossRun(1, 1, { bossCatalog: {} })
    assert.equal(getCurrentRoom(run).cleared, true)
    assert.equal(getBoss(run), undefined)
    assert.ok(run.drumDrop)
  })

  test('o Tung em cima do lugar do tambor quando o chefe morre vai para a casa livre mais perto', () => {
    let run = bossRun(1, 1)
    const drum = getDrumBox()
    run.player = createPlayer({ x: drum.x + drum.width / 2, y: drum.y + drum.height - 2 })
    run = killBoss(run)
    assert.ok(!overlaps(getFeetBox(run.player), drum), 'ele não ficou preso dentro do tambor')
  })

  test('a porta para a sala do chefe abre com ela ainda não limpa (a luta começa ao chegar)', () => {
    const seed = 1
    const floor = generateFloor(seed, 1)
    const bossRoom = bossRoomOf(floor)
    const [side, neighborId] = Object.entries(bossRoom.neighbors).find(([, id]) => id)
    let run = createRun({ seed, roomId: neighborId, clearedRoomIds: [neighborId], characterId: 'x', bossCatalog: TEST_BOSSES })
    const towardBoss = { up: 'down', down: 'up', left: 'right', right: 'left' }[side]
    run.player = createPlayer(DOOR_EDGES[towardBoss])
    run = updateRun(run, { movement: SIDE_VECTORS[towardBoss], attackDirection: null }, STEP)
    assert.equal(run.transition?.type, 'room')
    assert.equal(bossRoomOf(run.floor).cleared, false, 'as portas aparecem fechadas no deslize')
    while (run.transition) run = updateRun(run, IDLE, STEP)
    assert.equal(getBoss(run).health, getBoss(run).maxHealth)
  })

  test('andar 5: o tambor só aparece com o Tralalero morto e as 3 batidas terminam a run', () => {
    let run = bossRun(1, LAST_FLOOR)
    assert.equal(getBoss(run).enemyId, 'tralalero-tralala')
    run = killBoss(run)
    while (run.drumDrop) run = updateRun(run, IDLE, STEP)
    const drum = getDrumBox()
    for (let hit = 0; hit < 3; hit++) {
      run.player = createPlayer({ x: drum.x + drum.width / 2, y: drum.y + drum.height + 45 })
      run = updateRun(run, { movement: { x: 0, y: 0 }, attackDirection: 'up' }, STEP)
      while (run.player.attack && !run.transition) run = updateRun(run, IDLE, STEP)
    }
    while (run.transition && !run.finished) run = updateRun(run, IDLE, STEP)
    assert.equal(run.finished, true)
    assert.equal(run.death, null)
  })
})

describe('Pacto ou Tung Tung God depois do chefe', () => {
  const PACT_SEED = findSeed(2, (room) => room.type === 'pacto') // a geração do andar 2 pôs o Pacto

  test('vencer sem perder vida faz a sala ao lado ser a do God (mesmo que a geração tenha posto o Pacto)', () => {
    const run = killBoss(bossRun(PACT_SEED, 2))
    assert.equal(getPactRoomType(run.floor), 'god')
    const layout = getLayout(run.floor.rooms.find((room) => room.type === 'god').layoutId)
    assert.equal(layout.type, 'god')
  })

  test('perder vida na luta faz a sala ser o Pacto', () => {
    const run = killBoss(touchBoss(bossRun(findSeed(2, (room) => room.type === 'god'), 2)))
    assert.equal(getPactRoomType(run.floor), 'pacto')
  })

  test('um golpe anulado pelo escudo do Caldo não conta como dano', () => {
    let run = bossRun(PACT_SEED, 2, { items: ['caldo-da-mamae'] })
    run = touchBoss(run)
    assert.equal(run.health, 6, 'o escudo anulou o dano')
    run = killBoss(run)
    assert.equal(getPactRoomType(run.floor), 'god')
  })

  test('a troca muda só a sala do Pacto/God: o resto do andar fica igual', () => {
    const floor = generateFloor(PACT_SEED, 2)
    const before = JSON.parse(JSON.stringify(floor.rooms))
    setPactRoomType(floor, 'god')
    for (let index = 0; index < floor.rooms.length; index++) {
      if (before[index].type === 'pacto') continue
      assert.deepEqual(floor.rooms[index], before[index])
    }
    assert.equal(getPactRoomType(floor), 'god')
  })

  test('no minimapa, a sala do Pacto/God só aparece com o chefe vencido', () => {
    let run = bossRun(PACT_SEED, 2)
    const pact = run.floor.rooms.find((room) => room.type === 'pacto')
    assert.equal(getMinimapRoomState(run.floor, pact, run.roomId), 'hidden')
    run = killBoss(run)
    const decided = run.floor.rooms.find((room) => room.id === pact.id)
    assert.equal(getMinimapRoomState(run.floor, decided, run.roomId), 'seen')
  })
})

describe('progresso salvo com o chefe', () => {
  const PACT_SEED = findSeed(2, (room) => room.type === 'pacto')

  test('sair no meio da luta: ao continuar, o chefe volta com a vida cheia', () => {
    let run = bossRun(1, 1)
    run.targets = run.targets.map((target) => (target.boss ? damageTarget(target, 30) : target))
    run = updateRun(run, IDLE, STEP)
    const snapshot = createRunSnapshot(run, 5000)
    assert.ok(!snapshot.clearedRoomIds.includes(run.roomId))
    assert.equal(snapshot.pactRoomType, null)
    const again = continueRun(run)
    assert.equal(getBoss(again).health, getBoss(again).maxHealth)
    assert.equal(getCurrentRoom(again).cleared, false)
  })

  test('depois da vitória, continuar mantém a sala que a luta decidiu', () => {
    const run = killBoss(bossRun(PACT_SEED, 2))
    assert.equal(createRunSnapshot(run, 5000).pactRoomType, 'god')
    const again = continueRun(run)
    assert.equal(getPactRoomType(again.floor), 'god')
    assert.equal(getBoss(again), undefined, 'o chefe vencido não volta')
  })

  test('save antigo, sem o campo: vale a sala da geração do andar', () => {
    const run = killBoss(bossRun(PACT_SEED, 2))
    const again = continueRun(run, (saved) => ({ ...saved, pactRoomType: null }))
    assert.equal(getPactRoomType(again.floor), 'pacto')
  })

  test('tipo estranho no save vira null', () => {
    assert.equal(normalizeProgressPayload({ pactRoomType: 'loja' }).pactRoomType, null)
    assert.equal(normalizeProgressPayload({ pactRoomType: 'god' }).pactRoomType, 'god')
  })
})

describe('getBossBar (barra de vida do chefe)', () => {
  function barOf(boss) {
    return getBossBar([boss])
  }
  const [nonna] = createRoomBoss('nonna-lasagnona', TEST_BOSSES, bossRoomOf(generateFloor(1, 1)))

  test('nome sem acento em maiúsculas, vida cheia, marcas das fases e estado normal', () => {
    const bar = barOf(nonna)
    assert.equal(bar.name, 'NONNA LASAGNONA')
    assert.equal(bar.health, 1)
    assert.deepEqual(bar.marks, [0.75, 0.5, 0.25])
    assert.equal(bar.state, 'normal')
    assert.equal(bar.low, false)
  })

  test('o pedaço perdido aparece logo depois do golpe e apaga em LOST_CHUNK_MS', () => {
    const hit = damageTarget(nonna, 9)
    const bar = barOf(hit)
    assert.equal(bar.health, 63 / 72)
    assert.equal(bar.lost, 1)
    assert.equal(bar.lostAlpha, 1)
    const later = barOf({ ...hit, damageTexts: hit.damageTexts.map((text) => ({ ...text, ageMs: LOST_CHUNK_MS })) })
    assert.equal(later.lost, later.health)
  })

  test('fase 2 depois da 1ª marca, pouca vida abaixo de 20% e vulnerável na janela de bater', () => {
    assert.equal(barOf({ ...nonna, health: 50 }).state, 'fase2')
    assert.equal(barOf({ ...nonna, health: 10 }).low, true)
    const [car] = createRoomBoss('cinquecento-turbo', TEST_BOSSES, bossRoomOf(generateFloor(1, 1)))
    assert.equal(barOf({ ...car, animation: 'esfriando' }).state, 'vulneravel')
  })

  test('morto: a barra fica vazia e some quando a morte dele acaba', () => {
    const dead = damageTarget(nonna, 999)
    assert.equal(barOf(dead).state, 'vazia')
    assert.equal(barOf({ ...dead, deadMs: 999999 }), null)
    assert.equal(getBossBar([]), null)
  })
})

describe('o tambor fica fora da luta', () => {
  test('o golpe no lugar do tambor, com o chefe vivo, não conta batida', () => {
    let run = bossRun(1, LAST_FLOOR)
    // O chefe vai para o canto: encostar nele machucaria e cortaria o golpe
    run.targets = run.targets.map((target) => (target.boss ? { ...target, x: 300 } : target))
    const drum = getDrumBox()
    run.player = createPlayer({ x: drum.x + drum.width / 2, y: drum.y + drum.height + 45 })
    run = updateRun(run, { movement: { x: 0, y: 0 }, attackDirection: 'up' }, STEP)
    let activeFrames = 0
    while (run.player.attack) {
      run = updateRun(run, IDLE, STEP)
      if (getAttackHitbox(run.player)) activeFrames++
    }
    assert.ok(activeFrames > 0, 'o golpe passou pelo lugar do tambor')
    assert.equal(getCurrentRoom(run).hits, 0)
  })
})
