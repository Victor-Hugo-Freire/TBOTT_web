import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { CHIMPANZINI, CINQUECENTO, NONNA, PATAPIM, TRALALERO } from '../src/data/bossBehavior.js'
import { getBossBar } from '../src/pages/SalaInicial/scene/drawBossBar.js'
import { createRoomBoss, findTouchingEnemy, getEnemyPose, updateEnemies } from '../src/utils/enemies.js'
import { createBanana, createRoots, updateEnemyShots } from '../src/utils/enemyShots.js'
import { generateFloor } from '../src/utils/floorGenerator.js'
import { ROOM_WALLS } from '../src/utils/roomMovement.js'
import { damageTarget, isTargetable } from '../src/utils/targets.js'
import { TEST_BOSSES, TEST_ENEMIES } from './helpers/testCatalog.js'

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
    const { boss, hits, flashes } = simulate(car, player, 1200)
    assert.deepEqual(hits, [{ damage: 1, cause: 'cinquecento-turbo' }])
    assert.ok(flashes.some((flash) => flash.effect === 'buzina'))
    assert.equal(boss.animation, 'parado', 'descansa depois de buzinar')
  })

  test('o aviso da buzina dura 620 ms: só os quadros do aviso aparecem e nada machuca antes', () => {
    let car = spawn('cinquecento-turbo')
    const player = { x: car.x + 120, y: car.y }
    let time = 0
    let hitAt = null
    while (hitAt === null && time < 2000) {
      const result = simulate(car, player, STEP_MS)
      car = result.boss
      time += STEP_MS
      if (result.hits.length > 0) hitAt = time
      else if (car.animation === 'atacando' && time < 600) assert.ok(getEnemyPose(car).frame <= 1, `quadro ${getEnemyPose(car).frame} em ${time} ms`)
    }
    assert.ok(hitAt >= CINQUECENTO.honkWarnMs + 220, `acertou em ${hitAt} ms`)
  })

  test('com o aviso maior, quem sai da onda até meio segundo depois do começo não leva a buzina', () => {
    const car = spawn('cinquecento-turbo')
    let { boss } = simulate(car, { x: car.x + 120, y: car.y }, 500) // começa a buzinar com ele perto
    assert.equal(boss.animation, 'atacando')
    const far = simulate(boss, { x: car.x + 400, y: car.y }, 800)
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
    assert.notEqual(fish.layerVariant, 'fase2', 'a troca para a fase 2 é desenhada na folha normal: ele põe os óculos')
    fish = simulate(fish, far(fish), 2000, (one) => one.animation !== 'transicao-fase2').boss
    assert.equal(fish.invincible, false)
    assert.equal(fish.layerVariant, 'fase2', 'dali em diante, a folha de óculos')
    assert.equal(isTargetable(fish), true)
  })

  test('a troca para a fase 3 também toca, já de óculos, e também é invencível', () => {
    let fish = { ...tralaleroReady(2, 0), layerVariant: 'fase2', health: 45 }
    fish = simulate(fish, far(fish), STEP_MS).boss
    assert.equal(fish.animation, 'transicao-fase2')
    assert.equal(fish.phase, 3)
    assert.equal(fish.invincible, true)
    assert.equal(fish.layerVariant, 'fase2')
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

  test('passar das duas marcas de uma vez: as duas trocas tocam, uma depois da outra', () => {
    let fish = { ...spawn('tralalero-tralala'), health: 40 }
    fish = simulate(fish, far(fish), STEP_MS).boss
    assert.equal(fish.animation, 'transicao-fase2')
    assert.equal(fish.phase, 2)
    assert.equal(fish.layerVariant, null, 'a 1ª troca (pôr os óculos) na folha normal')
    fish = simulate(fish, far(fish), 2000, (one) => one.phase === 3).boss
    assert.equal(fish.animation, 'transicao-fase2')
    assert.equal(fish.layerVariant, 'fase2', 'a 2ª troca já de óculos')
    assert.equal(fish.invincible, true)
    fish = simulate(fish, far(fish), 2000, (one) => one.animation !== 'transicao-fase2').boss
    assert.equal(fish.invincible, false)
    assert.equal(simulate(fish, far(fish), 200).boss.animation === 'transicao-fase2', false, 'não toca a troca de novo')
  })
})

// Roda `ms` da sala inteira (o chefe e quem ele chamou), com o catálogo de inimigos de teste. Devolve os alvos e o que
// fizeram (hits, flashes, shots e floor somados). until(targets) para antes, se der true.
function simulateRoom(targets, player, ms, until = () => false) {
  const done = { hits: [], flashes: [], shots: [], floor: [] }
  for (let time = 0; time < ms; time += STEP_MS) {
    const world = { player, solids: ROOM_WALLS, deltaSeconds: STEP, hits: [], flashes: [], floor: [], shots: [], enemyCatalog: TEST_ENEMIES }
    targets = updateEnemies(targets, world)
    done.hits.push(...world.hits)
    done.flashes.push(...world.flashes)
    done.shots.push(...world.shots)
    done.floor.push(...world.floor)
    if (until(targets)) break
  }
  return { targets, ...done }
}

// Faz os projéteis voarem até sumirem, com o Tung parado em `player` e o dono deles em `owner`. Devolve os acertos.
function flyShots(shots, player, owner) {
  const world = { player, solids: ROOM_WALLS, deltaSeconds: STEP, hits: [], floor: [], enemies: [owner] }
  let flying = shots
  for (let time = 0; time < 6000 && flying.length > 0; time += STEP_MS) flying = updateEnemyShots(flying, world)
  assert.equal(flying.length, 0, 'os projéteis sumiram')
  return world.hits
}

// O chefe andando há `walkMs`: o próximo passo começa o ataque de longe
function readyToAttack(id, walkMs) {
  return { ...spawn(id), animation: 'andando', animationMs: walkMs }
}

describe('Chimpanzini Bananini', () => {
  test('joga duas bananas-bumerangue: cada uma acerta o Tung parado na ida e na volta', () => {
    const chimp = readyToAttack('chimpanzini-bananini', CHIMPANZINI.walkMs)
    const player = { x: chimp.x + 300, y: chimp.y }
    const { boss, shots } = simulate(chimp, player, 1000, (one) => one.restMs > 0)
    assert.equal(shots.length, 2)
    assert.ok(shots.every((shot) => shot.kind === 'banana'))
    // 2 bananas x (ida + volta); na run, a invencibilidade depois do 1º acerto segura os outros
    assert.equal(flyShots(shots, player, boss).length, 4)
  })

  test('cada banana faz uma laçada: uma vai pela esquerda e a outra pela direita, as duas passam no Tung', () => {
    const chimp = readyToAttack('chimpanzini-bananini', CHIMPANZINI.walkMs)
    const player = { x: chimp.x + 300, y: chimp.y }
    const { boss, shots } = simulate(chimp, player, 1000, (one) => one.restMs > 0)
    const far = { x: 100, y: 100 } // o Tung longe do caminho: só o desenho do arco importa aqui
    const world = { player: far, solids: ROOM_WALLS, deltaSeconds: STEP, hits: [], floor: [], enemies: [boss] }
    const sides = []
    for (const shot of shots) {
      let banana = shot
      let outSide = 0 // o quanto ela se afastou da linha reta na ida (positivo de um lado, negativo do outro)
      let backSide = 0
      let closest = Infinity // o mais perto que ela chegou do ponto do Tung
      while (banana) {
        const side = banana.y - boss.y
        if (!banana.back && Math.abs(side) > Math.abs(outSide)) outSide = side
        if (banana.back && Math.abs(side) > Math.abs(backSide)) backSide = side
        closest = Math.min(closest, Math.hypot(banana.x - player.x, banana.y - player.y))
        banana = updateEnemyShots([banana], world)[0]
      }
      assert.ok(Math.abs(outSide) > CHIMPANZINI.bananaArc * 0.9, `afastou ${outSide} u da linha na ida`)
      assert.ok(Math.sign(backSide) === -Math.sign(outSide), 'volta pelo outro lado: a laçada fecha')
      assert.ok(closest < 15, `passou a ${closest} u do Tung`)
      sides.push(Math.sign(outSide))
    }
    assert.deepEqual(sides.sort(), [-1, 1], 'uma pela esquerda e a outra pela direita')
  })

  test('as bananas voltam para a mão dele mesmo com ele andando, e somem lá', () => {
    const chimp = spawn('chimpanzini-bananini')
    const banana = createBanana(chimp, { x: chimp.x + 300, y: chimp.y }, 1, 1)
    const moved = { ...chimp, x: chimp.x - 150, y: chimp.y + 60 }
    const world = { player: { x: 100, y: 100 }, solids: ROOM_WALLS, deltaSeconds: STEP, hits: [], floor: [], enemies: [moved] }
    let flying = banana
    let last = banana
    while (flying) {
      last = flying
      flying = updateEnemyShots([flying], world)[0]
    }
    assert.ok(Math.hypot(last.x - moved.x, last.y - moved.y) < 40, 'sumiu na mão dele, onde ele está agora')
  })

  test('na metade da vida se descasca: invencível, a casca fica no chão escorregadia, e ele termina descascado', () => {
    let chimp = { ...spawn('chimpanzini-bananini'), health: 30 }
    const player = { x: chimp.x + 500, y: chimp.y }
    chimp = simulate(chimp, player, STEP_MS).boss
    assert.equal(chimp.animation, 'descascar')
    assert.equal(chimp.invincible, true)
    assert.equal(chimp.layerVariant, null, 'a troca é desenhada na folha normal (a casca abrindo)')
    const result = simulateRoom([chimp], player, 2000, (list) => list[0].animation !== 'descascar')
    const [peel] = result.floor
    assert.equal(peel.kind, 'casca-escorregadia')
    assert.equal(peel.mechanic, 'escorregadio')
    const [peeled] = result.targets
    assert.equal(peeled.invincible, false)
    assert.equal(peeled.layerVariant, 'fase2')
    assert.equal(getBossBar([peeled]).state, 'fase2')
  })

  test('descascado, anda com fase2-andando e mais rápido', () => {
    const player = { x: 1400, y: 300 }
    const start = spawn('chimpanzini-bananini')
    const slow = simulate({ ...start, animation: 'andando' }, player, 400).boss
    const fast = simulate({ ...start, phase: 2, health: 30, layerVariant: 'fase2', animation: 'fase2-andando' }, player, 400).boss
    assert.equal(fast.animation, 'fase2-andando')
    const ratio = Math.hypot(fast.x - start.x, fast.y - start.y) / Math.hypot(slow.x - start.x, slow.y - start.y)
    assert.ok(Math.abs(ratio - CHIMPANZINI.phase2Speed) < 0.05, String(ratio))
  })
})

describe('Nonna Lasagnona', () => {
  test('perto, a colherada: a onda de choque machuca uma vez, com o dano da colherada', () => {
    const nonna = spawn('nonna-lasagnona')
    const { hits, flashes } = simulate(nonna, { x: nonna.x + 120, y: nonna.y }, 800)
    assert.deepEqual(hits, [{ damage: 2, cause: 'nonna-lasagnona' }])
    assert.ok(flashes.some((flash) => flash.effect === 'onda-choque'))
  })

  test('longe, invoca exatamente 2 almôndegas (Polpettas)', () => {
    const player = { x: 1450, y: 300 }
    const { targets } = simulateRoom([readyToAttack('nonna-lasagnona', NONNA.walkMs)], player, 1500, (list) => list.length > 1)
    assert.equal(NONNA.meatballs, 2)
    assert.equal(targets.length, 3)
    assert.ok(targets.slice(1).every((one) => one.enemyId === 'polpetta-sotterranea' && one.minion))
  })

  test('com uma almôndega viva ela não invoca (nunca passam de 2); sem nenhuma, invoca as 2 de novo', () => {
    const player = { x: 1450, y: 300 }
    const first = simulateRoom([readyToAttack('nonna-lasagnona', NONNA.walkMs)], player, 1500, (list) => list.length > 1).targets
    const ready = { ...first[0], restMs: 0, waitMs: 0, animation: 'andando', animationMs: NONNA.walkMs }
    const oneAlive = [ready, first[1], damageTarget(first[2], 999)]
    const result = simulateRoom(oneAlive, player, 3000)
    assert.equal(result.targets.length, 3, 'nenhuma almôndega nova')
    assert.equal(result.targets.filter((one) => one.minion && !one.dead).length <= 2, true)
    const noneAlive = [ready, damageTarget(first[1], 999), damageTarget(first[2], 999)]
    const again = simulateRoom(noneAlive, player, 1500, (list) => list.length > 3).targets
    assert.equal(again.filter((one) => one.minion && !one.dead).length, 2)
  })

  test('a cada marca perde uma camada: invencível na troca, e depois a folha com menos camadas', () => {
    let nonna = spawn('nonna-lasagnona')
    const player = { x: nonna.x + 500, y: nonna.y }
    const marks = [
      [54, 'perde-camada', 'camadas3'],
      [36, 'perde-camada-3', 'camadas2'],
      [18, 'perde-camada-2', 'camadas1'],
    ]
    for (const [health, animation, variant] of marks) {
      nonna = simulate({ ...nonna, health }, player, STEP_MS).boss
      assert.equal(nonna.animation, animation)
      assert.equal(nonna.invincible, true)
      assert.equal(isTargetable(nonna), false)
      nonna = simulate(nonna, player, 1000, (one) => one.animation !== animation).boss
      assert.equal(nonna.layerVariant, variant)
      assert.equal(nonna.invincible, false)
    }
  })

  test('o golpe que passa da marca mostra a camada caindo (e não ela inteira levando dano)', () => {
    let nonna = { ...spawn('nonna-lasagnona'), phase: 2, layerVariant: 'camadas3', health: 40 }
    const player = { x: nonna.x + 500, y: nonna.y }
    nonna = damageTarget(nonna, 4) // 36: chega na marca de 50%
    nonna = simulate(nonna, player, STEP_MS).boss
    const pose = getEnemyPose(nonna)
    assert.equal(pose.animation, 'perde-camada-3', 'a troca aparece desde o começo')
    assert.equal(pose.frame, 0)
  })

  test('levando dano nas outras fases, ela aparece com as camadas que sobraram', () => {
    let nonna = { ...spawn('nonna-lasagnona'), phase: 3, layerVariant: 'camadas2', health: 30 }
    nonna = damageTarget(nonna, 3)
    nonna = simulate(nonna, { x: nonna.x + 500, y: nonna.y }, STEP_MS).boss
    assert.equal(getEnemyPose(nonna).animation, 'dano')
    assert.equal(nonna.layerVariant, 'camadas2', 'o dano é desenhado na folha de 2 camadas')
  })

  test('quando ela morre, as almôndegas morrem junto', () => {
    const nonna = damageTarget(spawn('nonna-lasagnona'), 999)
    const meatball = { ...spawn('nonna-lasagnona'), enemyId: 'polpetta-sotterranea', id: 'almondega-0', boss: false, minion: true, hidden: true }
    const world = { player: { x: 100, y: 300 }, solids: ROOM_WALLS, deltaSeconds: STEP, hits: [], flashes: [], floor: [], shots: [] }
    const after = updateEnemies([nonna, meatball], world)[1]
    assert.equal(after.dead, true)
    assert.equal(after.hidden, false, 'aparece morrendo, até a escondida')
  })
})

describe('Brr Brr Patapim', () => {
  test('perto, o pisão: a onda de choque machuca uma vez, com o dano do pisão', () => {
    const boss = spawn('brr-brr-patapim')
    const { hits, flashes } = simulate(boss, { x: boss.x + 150, y: boss.y }, 800)
    assert.deepEqual(hits, [{ damage: 2, cause: 'brr-brr-patapim' }])
    assert.ok(flashes.some((flash) => flash.effect === 'onda-choque'))
  })

  test('longe, as raízes brotam em linha até o Tung: na linha, acertam uma vez; fora dela, não', () => {
    const boss = readyToAttack('brr-brr-patapim', PATAPIM.walkMs)
    const player = { x: boss.x + 400, y: boss.y }
    const { shots } = simulate(boss, player, 1000, (one) => one.animation !== 'raizes' && one.waitMs > 0)
    assert.equal(shots.length, 1)
    assert.equal(shots[0].kind, 'raizes')
    assert.deepEqual(flyShots(shots, player, boss), [{ damage: 1, cause: 'brr-brr-patapim' }])
    assert.deepEqual(flyShots(shots, { x: player.x, y: player.y - 150 }, boss), [])
  })

  test('os ataques revezam: com o Tung sempre perto, depois do pisão vêm as raízes, e depois outro pisão', () => {
    let boss = spawn('brr-brr-patapim')
    const player = { x: boss.x + 150, y: boss.y }
    const attacks = []
    for (let time = 0; time < 6000 && attacks.length < 3; time += STEP_MS) {
      const before = boss.animation
      boss = simulate(boss, player, STEP_MS).boss
      const started = boss.animation !== before && (boss.animation === 'atacando' || boss.animation === 'raizes')
      if (started) attacks.push(boss.animation)
    }
    assert.deepEqual(attacks, ['atacando', 'raizes', 'atacando'])
  })

  test('as raízes de perto também acertam o Tung', () => {
    const boss = { ...spawn('brr-brr-patapim'), stomped: true }
    const player = { x: boss.x + 150, y: boss.y }
    const { shots } = simulate(boss, player, 1000, (one) => one.animation !== 'raizes' && one.waitMs > 0)
    assert.deepEqual(flyShots(shots, player, boss), [{ damage: 1, cause: 'brr-brr-patapim' }])
  })

  test('as raízes param na borda do piso', () => {
    const boss = { ...spawn('brr-brr-patapim'), x: 300 }
    const roots = createRoots(boss, { x: 0, y: boss.y }, 1)
    assert.ok(roots.points.length < PATAPIM.rootCount)
    assert.ok(roots.points.every((point) => point.x > 0))
  })
})
