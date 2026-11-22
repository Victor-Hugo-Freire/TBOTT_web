import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { isLineBlocked } from '../src/utils/collision.js'
import { getEnemyContactBox } from '../src/utils/enemies.js'
import { hitObstacles, ROLL_DAMAGE, updateRollingObstacles } from '../src/utils/roomObstacles.js'
import { rollIntoTargets } from '../src/utils/run.js'
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

  test('passar rente à borda não bloqueia', () => {
    assert.equal(isLineBlocked({ x: 500, y: 400 }, { x: 800, y: 400 }, [rock]), false)
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
