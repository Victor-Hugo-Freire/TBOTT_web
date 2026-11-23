import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { isLineBlocked, overlaps } from '../src/utils/collision.js'
import { getEnemyContactBox } from '../src/utils/enemies.js'
import { createPlayer, getAttackHitbox } from '../src/utils/player.js'
import { getCellRect } from '../src/utils/roomLayout.js'
import { getFeetBox } from '../src/utils/roomMovement.js'
import { getSwingBlockers, hitObstacles, ROLL_DAMAGE, updateRollingObstacles } from '../src/utils/roomObstacles.js'
import { createRun, rollIntoTargets, updateRun } from '../src/utils/run.js'
import { createTrainingTarget, findSwingHits, getTargetBox } from '../src/utils/targets.js'

// O golpe não atravessa obstáculo, e o que rola machuca inimigo (pedidos do Victor, 2026-11-22)

// Obstáculos montados à mão, no formato de roomLayout.js (a caixa é o que importa aqui)
const BLOCKING = ['solido', 'quebravel', 'rolante']
function obstacle(mechanic, x, y, width = 84, height = 60) {
  return { id: `${x}-${y}`, col: 0, row: 0, kind: mechanic, mechanic, blocking: BLOCKING.includes(mechanic), box: { x, y, width, height } }
}
// Caixa do golpe grande, que cobre tudo entre x0 e x1 na altura y
const wideHitbox = (x0, x1, y) => ({ x: x0, y: y - 60, width: x1 - x0, height: 120 })

describe('isLineBlocked (linha reta passando por dentro de uma caixa)', () => {
  const rock = { x: 600, y: 400, width: 84, height: 60 }

  test('a linha que atravessa a caixa é bloqueada; a que passa ao lado, não', () => {
    assert.equal(isLineBlocked({ x: 500, y: 430 }, { x: 800, y: 430 }, [rock]), true)
    assert.equal(isLineBlocked({ x: 500, y: 300 }, { x: 800, y: 300 }, [rock]), false)
  })

  test('perto das pontas não conta (pés encostados no obstáculo)', () => {
    assert.equal(isLineBlocked({ x: 680, y: 430 }, { x: 800, y: 430 }, [rock]), false, 'só os primeiros 4 u dentro da caixa')
    assert.equal(isLineBlocked({ x: 500, y: 430 }, { x: 610, y: 430 }, [rock]), false, 'só os últimos 10 u dentro da caixa')
  })

  test('duas caixas encostadas não deixam fresta entre elas', () => {
    const left = { x: 600, y: 400, width: 100, height: 60 }
    const right = { x: 700, y: 400, width: 100, height: 60 }
    assert.equal(isLineBlocked({ x: 700, y: 300 }, { x: 700, y: 560 }, [left, right]), true)
  })
})

describe('o golpe não atravessa obstáculo', () => {
  const rock = obstacle('solido', 600, 400)
  const player = { x: 520, y: 450 }

  test('alvo atrás da pedra não leva o golpe; o mesmo alvo sem a pedra leva', () => {
    const target = createTrainingTarget({ x: 760, y: 450 })
    const hitbox = getTargetBox(target)
    assert.deepEqual(findSwingHits([target], hitbox, [], player, [rock.box]), [])
    assert.deepEqual(findSwingHits([target], hitbox, [], player, []), [0])
  })

  test('quem voa está por cima da pedra: leva o golpe', () => {
    const flying = { ...createTrainingTarget({ x: 760, y: 450 }), flying: true }
    assert.deepEqual(findSwingHits([flying], getTargetBox(flying), [], player, [rock.box]), [0])
  })

  test('o vaso atrás da pedra não quebra; o da frente quebra', () => {
    const front = obstacle('quebravel', 400, 400)
    const behind = obstacle('quebravel', 760, 400)
    const fromLeft = { x: 330, y: 450 }
    const hit = hitObstacles([front, rock, behind], wideHitbox(350, 900, 430), 'right', fromLeft)
    assert.equal(hit[0].removed, true, 'o da frente quebrou')
    assert.equal(hit[2].removed, undefined, 'o de trás ficou')
  })

  test('o barril atrás de um pedestal não rola', () => {
    const barrel = obstacle('rolante', 760, 400)
    const pedestal = { x: 600, y: 400, width: 60, height: 60 }
    const hit = hitObstacles([barrel], wideHitbox(550, 900, 430), 'right', { x: 520, y: 450 }, [pedestal])
    assert.equal(hit[0].rolling, undefined)
  })
})

describe('o golpe não passa pela quina nem pela folga do obstáculo (o caso do andar 3)', () => {
  // Uma mesa de verdade na casa (6,3): a caixa sólida (84 x 60) é menor que a casa (105 x 74) e que o desenho (92 x 92)
  const cell = getCellRect(6, 3)
  const solid = { x: cell.x + (cell.width - 84) / 2, y: cell.y + (cell.height - 60) / 2, width: 84, height: 60 }
  const table = { id: '6-3', col: 6, row: 3, kind: 'mesa', mechanic: 'solido', blocking: true, box: solid }
  const inCell = (point) => point.x >= cell.x && point.x < cell.x + cell.width && point.y >= cell.y && point.y < cell.y + cell.height

  // A linha dos pés do Tung até os pés do alvo passa por dentro da casa da mesa (longe das pontas)? Raspar a quina
  // não conta: o ponto tem que estar a pelo menos 4 u para dentro da casa (o desenho nem chega à quina da casa).
  const inner = { x: cell.x + 4, y: cell.y + 4, width: cell.width - 8, height: cell.height - 8 }
  function crossesTable(from, to) {
    const length = Math.hypot(to.x - from.x, to.y - from.y)
    for (let i = 1; i < 100; i++) {
      const point = { x: from.x + ((to.x - from.x) * i) / 100, y: from.y + ((to.y - from.y) * i) / 100 }
      const fromEnds = Math.min(i, 100 - i) * (length / 100)
      const inside = point.x > inner.x && point.x < inner.x + inner.width && point.y > inner.y && point.y < inner.y + inner.height
      if (fromEnds > 20 && inside) return true
    }
    return false
  }

  // Golpes (Tung parado em volta da mesa, nas 4 direções) em que a caixa do golpe toca o alvo e a mesa está no meio
  function findThroughTable(step) {
    const found = []
    for (const direction of ['up', 'down', 'left', 'right']) {
      for (let px = cell.x - 150; px <= cell.x + cell.width + 150; px += step) {
        for (let py = cell.y - 150; py <= cell.y + cell.height + 150; py += step) {
          const feet = { x: px, y: py }
          if (inCell(feet) || overlaps(getFeetBox(feet), solid)) continue
          const hitbox = getAttackHitbox({ ...createPlayer(feet), attack: { direction, elapsed: 200, area: 1 } })
          for (let ex = cell.x - 150; ex <= cell.x + cell.width + 150; ex += step) {
            for (let ey = cell.y - 150; ey <= cell.y + cell.height + 200; ey += step) {
              const target = createTrainingTarget({ x: ex, y: ey })
              if (inCell(target) || !overlaps(hitbox, getTargetBox(target)) || !crossesTable(feet, target)) continue
              found.push({ direction, feet, target })
            }
          }
        }
      }
    }
    return found
  }
  const cases = findThroughTable(15)

  test('nenhum golpe acerta com a mesa no meio, nem passando pela folga entre a caixa sólida e a casa', () => {
    assert.ok(cases.length > 100, `casos testados: ${cases.length}`)
    for (const { direction, feet, target } of cases) {
      const hitbox = getAttackHitbox({ ...createPlayer(feet), attack: { direction, elapsed: 200, area: 1 } })
      assert.deepEqual(findSwingHits([target], hitbox, [], feet, getSwingBlockers([table])), [], `${direction} ${JSON.stringify(feet)}`)
    }
  })

  test('na run: o golpe de verdade não tira vida do alvo atrás da quina da mesa', () => {
    // Um caso em que a caixa sólida sozinha deixaria passar (era o defeito)
    const leak = cases.find(({ direction, feet, target }) => {
      const hitbox = getAttackHitbox({ ...createPlayer(feet), attack: { direction, elapsed: 200, area: 1 } })
      return findSwingHits([target], hitbox, [], feet, [solid]).length > 0
    })
    assert.ok(leak, 'a caixa sólida sozinha deixava o golpe passar')
    let run = createRun({ seed: 1, characterId: 'tung-tung-sahur' })
    run = { ...run, obstacles: [table], targets: [leak.target], player: createPlayer(leak.feet) }
    run = updateRun(run, { movement: { x: 0, y: 0 }, attackDirection: leak.direction }, 1 / 50)
    while (run.player.attack) run = updateRun(run, { movement: { x: 0, y: 0 }, attackDirection: null }, 1 / 50)
    assert.equal(run.targets[0].health, leak.target.health)
  })

  test('encostado na mesa (os pés na folga da casa), o golpe para o lado livre acerta', () => {
    const feet = { x: cell.x + cell.width / 2, y: solid.y + solid.height + 5 } // logo abaixo da mesa, dentro da casa
    const target = createTrainingTarget({ x: feet.x + 60, y: feet.y + 30 })
    const hitbox = getAttackHitbox({ ...createPlayer(feet), attack: { direction: 'right', elapsed: 200, area: 1 } })
    assert.deepEqual(findSwingHits([target], hitbox, [], feet, getSwingBlockers([table])), [0])
  })
})

describe('o que rola machuca o inimigo e quebra', () => {
  test(`encostar num alvo tira ${ROLL_DAMAGE} dele e o barril quebra ali`, () => {
    const target = createTrainingTarget({ x: 800, y: 460 })
    const contact = getEnemyContactBox(target)
    const barrel = { ...obstacle('rolante', contact.x - 40, contact.y - 10), rolling: { x: 1, y: 0 } }
    const result = rollIntoTargets([barrel], [target])
    assert.equal(result.targets[0].health, target.health - ROLL_DAMAGE)
    assert.equal(result.obstacles[0].removed, true)
  })

  test('cada barril acerta um alvo só; longe de todos, ele continua rolando', () => {
    const near = createTrainingTarget({ x: 800, y: 460 })
    const alsoNear = { ...createTrainingTarget({ x: 810, y: 460 }), id: 'outro' }
    const contact = getEnemyContactBox(near)
    const barrel = { ...obstacle('rolante', contact.x - 40, contact.y - 10), rolling: { x: 1, y: 0 } }
    const result = rollIntoTargets([barrel], [near, alsoNear])
    assert.equal(result.targets[0].health, near.health - ROLL_DAMAGE)
    assert.equal(result.targets[1].health, alsoNear.health)

    const far = { ...obstacle('rolante', 200, 200), rolling: { x: 1, y: 0 } }
    assert.equal(rollIntoTargets([far], [near]).obstacles[0], far)
  })

  test('passa por baixo de quem voa', () => {
    const flying = { ...createTrainingTarget({ x: 800, y: 460 }), flying: true }
    const contact = getEnemyContactBox(flying)
    const barrel = { ...obstacle('rolante', contact.x - 40, contact.y - 10), rolling: { x: 1, y: 0 } }
    const result = rollIntoTargets([barrel], [flying])
    assert.equal(result.targets[0].health, flying.health)
    assert.equal(result.obstacles[0].removed, undefined)
  })

  test('quebra ao bater num pedestal', () => {
    const pedestal = { x: 760, y: 400, width: 60, height: 60 }
    let obstacles = [{ ...obstacle('rolante', 600, 400), rolling: { x: 1, y: 0 } }]
    for (let frame = 0; frame < 60 && !obstacles[0].removed; frame++) obstacles = updateRollingObstacles(obstacles, 1 / 60, [pedestal])
    assert.equal(obstacles[0].removed, true)
    assert.ok(obstacles[0].box.x < 760, 'quebrou encostando no pedestal')
  })
})
