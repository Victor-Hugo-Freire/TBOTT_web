import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { BOSS_STUN_MS } from '../src/data/bossBehavior.js'
import { updatePuddles } from '../src/utils/itemEffects.js'
import { generateFloor } from '../src/utils/floorGenerator.js'
import { createPlayer, FLY_BOB, FLY_FALL_MS, FLY_HOVER, getHoverOffset } from '../src/utils/player.js'
import { PUDDLE } from '../src/utils/roomInteractions.js'
import { ROOM_PLAYER_BOUNDS, ROOM_WALLS } from '../src/utils/roomMovement.js'
import { getAirSolids, getFlyingSortY, getRoomSolids } from '../src/utils/roomObstacles.js'
import { createRun, getRoomObstacles, toggleTrainingTarget, updateRun } from '../src/utils/run.js'
import { getBaseStats } from '../src/utils/stats.js'
import { createTrainingTarget, getBaseBox, slowTarget } from '../src/utils/targets.js'
import { overlaps } from '../src/utils/collision.js'
import { createEnemy } from '../src/utils/enemies.js'
import { TEST_CATALOG, TEST_ENEMIES } from './helpers/testCatalog.js'

const STEP = 1 / 20
const IDLE = { movement: { x: 0, y: 0 }, attackDirection: null }
const SAHUR = 'tung-tung-sahur'
const SABOR = 'tung-tung-sabor'
const GOD = 'tung-tung-god'

function steps(run, count, input = IDLE) {
  for (let i = 0; i < count; i++) run = updateRun(run, input, STEP)
  return run
}

// ---------- voo do God ----------

// Barril montado à mão no meio do caminho, no formato de roomLayout.js
const BARREL = { id: 'barril', col: 0, row: 0, kind: 'barril', mechanic: 'solido', blocking: true, box: { x: 760, y: 470, width: 84, height: 60 } }

function walkAcrossBarrel(characterId) {
  const run = createRun({ seed: 1, characterId, catalog: TEST_CATALOG })
  run.obstacles = [BARREL]
  run.player = createPlayer({ x: 700, y: 500 })
  return steps(run, 40, { movement: { x: 1, y: 0 }, attackDirection: null }) // 2 s andando para a direita
}

describe('voo do Tung Tung God', () => {
  test('o Sahur para no obstáculo e o God passa por cima dele', () => {
    assert.ok(walkAcrossBarrel(SAHUR).player.x < BARREL.box.x, 'o Sahur ficou antes do barril')
    assert.ok(walkAcrossBarrel(GOD).player.x > BARREL.box.x + BARREL.box.width, 'o God passou do barril')
  })

  test('com o God, os inimigos continuam desviando dos obstáculos (só ele voa por cima deles)', () => {
    // Um muro alto entre o Formaggino (que persegue) e o Tung parado do outro lado: o inimigo tem de dar a volta
    const WALL = { id: 'muro', col: 0, row: 0, kind: 'barril', mechanic: 'solido', blocking: true, box: { x: 760, y: 330, width: 84, height: 380 } }
    for (const characterId of [SAHUR, GOD]) {
      let run = createRun({ seed: 1, characterId, catalog: TEST_CATALOG, enemyCatalog: TEST_ENEMIES })
      run.obstacles = [WALL]
      run.player = createPlayer({ x: 1000, y: 520 })
      const enemy = createEnemy(TEST_ENEMIES['formaggino-saltellino'], 1, 3)
      run.targets = [{ ...enemy, x: 600, y: 520, waitMs: 0 }]
      for (let i = 0; i < 80 && !run.death; i++) {
        run = updateRun(run, IDLE, STEP)
        assert.equal(overlaps(getBaseBox(run.targets[0]), WALL.box), false, `${characterId}: o inimigo entrou no muro (quadro ${i})`)
      }
    }
  })

  test('o God em cima de um perigo do chão (chapa quente ou cacos): os inimigos não se machucam tentando alcançá-lo', () => {
    const box = { x: 900, y: 500, width: 84, height: 60 }
    const hazards = [
      { id: 'chapa', col: 0, row: 0, kind: 'chapa', mechanic: 'quente', blocking: true, box },
      { id: 'cacos', col: 0, row: 0, kind: 'cacos', mechanic: 'cacos', blocking: false, box },
    ]
    const ids = ['formaggino-saltellino', 'pistacchio-sputacchio', 'cannolo-carica', 'pinguino-sorbettino', 'vespina-lambrettina']
    for (const hazard of hazards) {
      for (const id of ids) {
        let run = createRun({ seed: 1, characterId: GOD, catalog: TEST_CATALOG, enemyCatalog: TEST_ENEMIES })
        run.obstacles = [hazard]
        run.player = createPlayer({ x: box.x + box.width / 2, y: box.y + box.height / 2 }) // o God parado em cima do perigo
        run.targets = [{ ...createEnemy(TEST_ENEMIES[id], 1, 3), x: 500, y: 530, waitMs: 0 }]
        const health = run.targets[0].health
        run = steps(run, 200) // 10 s
        assert.equal(run.targets[0].health, health, `${id} se machucou em ${hazard.kind}`)
      }
    }
  })

  test('a parede continua bloqueando o God', () => {
    const run = createRun({ seed: 1, characterId: GOD, catalog: TEST_CATALOG })
    run.player = createPlayer({ x: 700, y: 500 })
    const after = steps(run, 80, { movement: { x: -1, y: 0 }, attackDirection: null }) // 4 s para a esquerda
    assert.ok(Math.abs(after.player.x - ROOM_PLAYER_BOUNDS.minX) < 1, `parou na parede (x = ${after.player.x})`)
  })

  test('getAirSolids: só as paredes e as caixas extras (os pedestais); os obstáculos ficam de fora', () => {
    const pedestal = { x: 100, y: 100, width: 50, height: 50 }
    assert.deepEqual(getAirSolids([pedestal]), [...ROOM_WALLS, pedestal])
    assert.deepEqual(getAirSolids(), ROOM_WALLS)
    assert.ok(getRoomSolids([BARREL]).length > getAirSolids().length, 'quem anda tem o barril a mais')
  })

  test('em cima de um obstáculo, o God é desenhado depois dele (o obstáculo não tapa as pernas)', () => {
    const over = { x: BARREL.box.x + 40, y: BARREL.box.y + 30 } // os pés dentro da caixa do barril
    const barrelBottom = BARREL.box.y + BARREL.box.height
    assert.ok(getFlyingSortY(over, [BARREL]) > barrelBottom, 'por cima do barril')
    const beside = { x: BARREL.box.x - 200, y: BARREL.box.y + 30 } // longe do barril: vale o y dos pés
    assert.equal(getFlyingSortY(beside, [BARREL]), beside.y)
    const broken = { ...BARREL, removed: true }
    assert.equal(getFlyingSortY(over, [broken]), over.y, 'barril quebrado não conta')
  })

  test('a poça do Tralalero (Sala do Pacto) mata quem anda e não o God, que sobrevoa', () => {
    let seed = 1
    while (!generateFloor(seed, 2).rooms.some((room) => room.type === 'pacto')) seed++
    const pact = generateFloor(seed, 2).rooms.find((room) => room.type === 'pacto')
    for (const [characterId, dies] of [[SAHUR, true], [GOD, false]]) {
      const run = createRun({ seed, floorNumber: 2, roomId: pact.id, characterId, catalog: TEST_CATALOG })
      run.player = createPlayer({ x: PUDDLE.x, y: PUDDLE.y })
      assert.equal(Boolean(steps(run, 2).death), dies, characterId)
    }
  })

  test('ao continuar, o God pode estar em cima de um obstáculo; o Sahur é tirado dele', () => {
    const floor = generateFloor(1, 1)
    const room = floor.rooms.find((item) => getRoomObstacles(floor, item).some((obstacle) => obstacle.blocking))
    const box = getRoomObstacles(floor, room).find((obstacle) => obstacle.blocking).box
    const position = { x: box.x + box.width / 2, y: box.y + box.height / 2 }
    const god = createRun({ seed: 1, roomId: room.id, position, characterId: GOD, catalog: TEST_CATALOG })
    const sahur = createRun({ seed: 1, roomId: room.id, position, characterId: SAHUR, catalog: TEST_CATALOG })
    assert.deepEqual([god.player.x, god.player.y], [position.x, position.y])
    assert.notDeepEqual([sahur.player.x, sahur.player.y], [position.x, position.y])
  })
})

describe('getHoverOffset (o desenho do God fica acima do chão)', () => {
  const player = createPlayer({ x: 500, y: 400 })

  test('quem anda não sobe', () => {
    assert.equal(getHoverOffset(player, getBaseStats(SAHUR), 1234), 0)
    assert.equal(getHoverOffset(player, getBaseStats(SABOR), 1234), 0)
  })

  test('o God fica FLY_HOVER u acima do chão e oscila só FLY_BOB u', () => {
    const god = getBaseStats(GOD)
    for (let timeMs = 0; timeMs < 3200; timeMs += 100) {
      const lift = getHoverOffset(player, god, timeMs)
      assert.ok(lift >= FLY_HOVER - FLY_BOB - 1e-9 && lift <= FLY_HOVER + FLY_BOB + 1e-9, `${timeMs} ms: ${lift}`)
    }
    assert.equal(FLY_HOVER, 22)
  })

  test('com reduzir movimento ele não oscila, mas continua no ar', () => {
    assert.equal(getHoverOffset(player, getBaseStats(GOD), 400, true), FLY_HOVER)
  })

  test('ao morrer ele cai até o chão em FLY_FALL_MS', () => {
    const god = getBaseStats(GOD)
    assert.equal(getHoverOffset({ ...player, dead: { elapsed: 0 } }, god, 0), FLY_HOVER)
    assert.ok(getHoverOffset({ ...player, dead: { elapsed: FLY_FALL_MS / 2 } }, god, 0) < FLY_HOVER / 2 + 1)
    assert.equal(getHoverOffset({ ...player, dead: { elapsed: FLY_FALL_MS } }, god, 0), 0)
    assert.equal(getHoverOffset({ ...player, dead: { elapsed: 5000 } }, god, 0), 0)
  })
})

// ---------- luz do cetro do God e respingo do taco do Sabor ----------

// Sala inicial com o alvo de treino A logo acima do Tung (o golpe para cima o acerta) e mais alvos ao lado dele.
// extra = [[id, dx]]: alvos na mesma linha de A, dx u para a direita (o golpe para cima cobre só uns 60 u de cada lado)
function runWithTargets(characterId, extra, items = []) {
  let run = toggleTrainingTarget(createRun({ seed: 1, characterId, catalog: TEST_CATALOG, items }))
  const a = run.targets[0]
  run.player = createPlayer({ x: a.x, y: a.y + 45 })
  run.targets = [a]
  for (const [id, dx] of extra) run.targets.push({ ...createTrainingTarget({ x: a.x + dx, y: a.y }), id })
  return run
}

// Um golpe inteiro para cima. Devolve a run, o primeiro efeito desenhado por código que apareceu durante o golpe e o
// maior stunMs que cada alvo teve durante o golpe (por id): o atordoamento de 0,5 s já acabou quando o golpe termina.
function swingUp(run) {
  let drawn = null
  const stun = {}
  run = updateRun(run, { movement: { x: 0, y: 0 }, attackDirection: 'up' }, STEP)
  while (run.player.attack) {
    run = updateRun(run, IDLE, STEP)
    drawn = drawn ?? run.flashes.find((flash) => flash.drawn) ?? null
    for (const target of run.targets) stun[target.id] = Math.max(stun[target.id] ?? 0, target.stunMs)
  }
  return { run, drawn, stun }
}

describe('luz do cetro do God', () => {
  test('o alvo leva o dano do golpe (2,5) mais 1 da luz; os vizinhos até 160 u levam 1; os longe, nada', () => {
    const { run } = swingUp(runWithTargets(GOD, [['perto', 105], ['medio', 150], ['longe', 300]]))
    const [alvo, perto, medio, longe] = run.targets
    assert.equal(alvo.health, 30 - 2.5 - 1)
    assert.equal(perto.health, 30 - 1)
    assert.equal(medio.health, 30 - 1, 'a 150 u: o alcance novo é 160')
    assert.equal(longe.health, 30)
  })

  test('contra um inimigo sozinho a luz também vale (antes só havia dano com vizinhos)', () => {
    assert.equal(swingUp(runWithTargets(GOD, [])).run.targets[0].health, 30 - 2.5 - 1)
  })

  test('quem o próprio golpe já acertou leva só a luz do próprio golpe, não a dos outros alvos por cima', () => {
    const { run } = swingUp(runWithTargets(GOD, [['junto', 40]])) // dentro da caixa do golpe
    assert.equal(run.targets[0].health, 30 - 2.5 - 1)
    assert.equal(run.targets[1].health, 30 - 2.5 - 1)
  })

  test('a luz atordoa o alvo e os vizinhos (não os longe) e depois ninguém é atordoado de novo por 2 s', () => {
    const { run, stun } = swingUp(runWithTargets(GOD, [['perto', 105], ['longe', 300]]))
    assert.ok(stun.treino > 0 && stun.treino <= 500, `alvo: ${stun.treino}`)
    assert.ok(stun.perto > 0 && stun.perto <= 500, `vizinho: ${stun.perto}`)
    assert.equal(stun.longe, 0)
    assert.ok(run.targets[0].stunImmuneMs > 0, 'o alvo ficou imune ao atordoamento por um tempo')
    assert.equal(run.targets[2].stunImmuneMs, 0, 'o longe não foi atordoado')
  })

  test('o chefe fica atordoado no máximo BOSS_STUN_MS', () => {
    const run = runWithTargets(GOD, [])
    run.targets[0] = { ...run.targets[0], boss: true }
    const { stun } = swingUp(run)
    assert.ok(stun.treino > 0 && stun.treino <= BOSS_STUN_MS, `chefe: ${stun.treino}`)
  })

  test('o anel de luz aparece (desenhado por código) e só para o God', () => {
    const light = swingUp(runWithTargets(GOD, [])).drawn
    assert.equal(light?.drawn, 'luz')
    assert.equal(light.range, 160)
    assert.equal(swingUp(runWithTargets(SAHUR, [])).drawn, null)
  })

  test('o Sahur não solta luz: não tira vida nem atordoa os vizinhos', () => {
    const { run, stun } = swingUp(runWithTargets(SAHUR, [['perto', 105]]))
    assert.equal(run.targets[0].health, 30 - 3)
    assert.equal(run.targets[1].health, 30)
    assert.equal(stun.perto, 0)
  })
})

describe('respingo do taco do Sabor', () => {
  test('cada acerto deixa o alvo e os vizinhos (a até 110 u) a 60% da velocidade por 1,5 s; os longe não', () => {
    const { run } = swingUp(runWithTargets(SABOR, [['perto', 105], ['longe', 300]]))
    const [alvo, perto, longe] = run.targets
    assert.equal(alvo.health, 30 - 3)
    assert.equal(alvo.slowMultiplier, 0.6, 'o alvo acertado também fica lento')
    assert.ok(alvo.slowMs > 0 && alvo.slowMs <= 1500)
    assert.equal(perto.slowMultiplier, 0.6)
    assert.ok(perto.slowMs > 0 && perto.slowMs <= 1500, `slowMs = ${perto.slowMs}`)
    assert.equal(perto.health, 30, 'o respingo só deixa lento, sem dano')
    assert.equal(longe.slowMs, 0)
  })

  test('o respingo desenhado por código aparece só para o Sabor', () => {
    assert.ok(['respingo', 'mancha'].includes(swingUp(runWithTargets(SABOR, [])).drawn?.drawn))
    assert.equal(swingUp(runWithTargets(SAHUR, [['perto', 105]])).run.targets[1].slowMs, 0)
  })

  test('todo acerto do Sabor deixa uma mancha de whisky no chão, do tamanho do alcance, nos pés do alvo', () => {
    let run = runWithTargets(SABOR, [])
    const alvo = run.targets[0]
    let stain = null
    run = updateRun(run, { movement: { x: 0, y: 0 }, attackDirection: 'up' }, STEP)
    while (run.player.attack && !stain) {
      run = updateRun(run, IDLE, STEP)
      stain = run.flashes.find((flash) => flash.drawn === 'mancha') ?? null
    }
    assert.ok(stain, 'a mancha apareceu')
    assert.deepEqual([stain.x, stain.y, stain.range], [alvo.x, alvo.y, 110])
  })

  test('todo inimigo acertado e os vizinhos ficam marcados de whisky (tinge e pinga) pelo tempo da lentidão, e a marca some depois', () => {
    let { run } = swingUp(runWithTargets(SABOR, [['perto', 105], ['longe', 300]]))
    assert.ok(run.targets[0].whiskyMs > 0, 'o alvo do golpe')
    assert.ok(run.targets[1].whiskyMs > 0, 'o vizinho')
    assert.equal(run.targets[2].whiskyMs, 0, 'o longe, não')
    run = steps(run, 40) // 2 s
    for (const target of run.targets) {
      assert.equal(target.whiskyMs, 0)
      assert.equal(target.slowMultiplier, 1)
    }
  })

  test('o Sahur e o God não deixam ninguém com whisky', () => {
    for (const characterId of [SAHUR, GOD]) {
      const { run } = swingUp(runWithTargets(characterId, [['perto', 105]]))
      for (const target of run.targets) assert.equal(target.whiskyMs, 0, characterId)
    }
  })
})

describe('lentidão e a poça da Concha Longa', () => {
  test('slowTarget: vale a lentidão mais forte e o tempo maior, nas duas ordens', () => {
    const base = createTrainingTarget({ x: 500, y: 500 })
    const weakThenStrong = slowTarget(slowTarget(base, 0.6, 1500), 0.4, 100)
    const strongThenWeak = slowTarget(slowTarget(base, 0.4, 100), 0.6, 1500)
    for (const target of [weakThenStrong, strongThenWeak]) {
      assert.equal(target.slowMultiplier, 0.4)
      assert.equal(target.slowMs, 1500)
    }
  })

  test('sem lentidão em andamento, a nova vale mesmo que seja mais fraca que a anterior', () => {
    const base = createTrainingTarget({ x: 500, y: 500 })
    assert.equal(slowTarget({ ...base, slowMs: 0, slowMultiplier: 0.3 }, 0.8, 100).slowMultiplier, 0.8)
  })

  test('a poça da Concha deixa o alvo a 0,5 (Sahur e God) e a 0,4 com o Sabor', () => {
    for (const [characterId, speed] of [[SAHUR, 0.5], [GOD, 0.5], [SABOR, 0.4]]) {
      const run = createRun({ seed: 1, characterId, catalog: TEST_CATALOG, items: ['concha-longa'] })
      const inside = createTrainingTarget({ x: 500, y: 505 })
      const after = updatePuddles({ ...run, puddles: [{ x: 500, y: 505, ms: 2000, ageMs: 0 }], targets: [inside] }, 50)
      assert.equal(after.targets[0].slowMultiplier, speed, characterId)
    }
  })

  test('Sabor com a Concha: o respingo (0,6) e a poça (0,4) não se somam, vale a mais forte', () => {
    const run = createRun({ seed: 1, characterId: SABOR, catalog: TEST_CATALOG, items: ['concha-longa'] })
    const splashed = slowTarget(createTrainingTarget({ x: 500, y: 505 }), 0.6, 1500)
    const after = updatePuddles({ ...run, puddles: [{ x: 500, y: 505, ms: 2000, ageMs: 0 }], targets: [splashed] }, 50)
    assert.equal(after.targets[0].slowMultiplier, 0.4)
    assert.equal(after.targets[0].slowMs, 1500)
  })
})
