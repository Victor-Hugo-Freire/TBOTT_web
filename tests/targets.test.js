import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { ROOM_WALLS } from '../src/utils/roomMovement.js'
import {
  createTarget,
  createTrainingTarget,
  damageTarget,
  DAMAGE_TEXT_MS,
  getTargetBox,
  PUSH_MS,
  pushTarget,
  slowTarget,
  stunTarget,
  swingAtTargets,
  TRAINING_HEALTH,
  TRAINING_RESPAWN_MS,
  updateTarget,
  updateTargets,
} from '../src/utils/targets.js'

const HOME = { x: 800, y: 500 }
const STEP = 1 / 50 // 20 ms

// Roda `ms` milissegundos de alvo, em passos de 20 ms
function wait(target, ms, solids = ROOM_WALLS) {
  for (let time = 0; time < ms; time += STEP * 1000) target = updateTarget(target, STEP, solids)
  return target
}

// Caixa de golpe em cima do alvo
function hitboxOn(target) {
  const box = getTargetBox(target)
  return { x: box.x + 10, y: box.y + 10, width: 20, height: 20 }
}

describe('alvo de treino', () => {
  test('nasce parado, com 30 de vida, sem efeitos, e guarda o lugar de onde saiu', () => {
    const target = createTrainingTarget(HOME)
    assert.equal(TRAINING_HEALTH, 30)
    assert.equal(target.health, 30)
    assert.equal(target.maxHealth, 30)
    assert.equal(target.training, true)
    assert.deepEqual(target.home, HOME)
    assert.deepEqual([target.x, target.y], [HOME.x, HOME.y])
    assert.deepEqual([target.dead, target.slowMs, target.stunMs, target.push], [false, 0, 0, null])
  })

  test('a caixa do golpe fica em cima da base (x, y)', () => {
    const box = getTargetBox(createTrainingTarget(HOME))
    assert.equal(box.x + box.width / 2, HOME.x)
    assert.equal(box.y + box.height, HOME.y)
  })
})

describe('dano no alvo', () => {
  test('cada dano tira pontos de vida e mostra o número, que some depois de DAMAGE_TEXT_MS', () => {
    let target = damageTarget(createTrainingTarget(HOME), 3)
    assert.equal(target.health, 27)
    assert.deepEqual(target.damageTexts, [{ amount: 3, ageMs: 0 }])
    target = wait(target, DAMAGE_TEXT_MS - 100)
    assert.equal(target.damageTexts.length, 1)
    target = wait(target, 200)
    assert.equal(target.damageTexts.length, 0)
  })

  test('com 0 de vida o alvo morre e não leva mais dano', () => {
    const target = damageTarget(createTarget({ id: 'a', x: 0, y: 0, width: 10, height: 10, health: 5 }), 7)
    assert.equal(target.health, 0)
    assert.equal(target.dead, true)
    assert.equal(damageTarget(target, 3), target)
  })

  test('o alvo de treino volta com a vida cheia TRAINING_RESPAWN_MS depois de morrer, no lugar de onde saiu', () => {
    assert.equal(TRAINING_RESPAWN_MS, 1000)
    let target = { ...createTrainingTarget(HOME), x: 900, y: 600 } // empurrado para longe
    target = damageTarget(target, 30)
    assert.equal(target.dead, true)
    target = wait(target, TRAINING_RESPAWN_MS - 100)
    assert.equal(target.dead, true, 'ainda morto antes de 1 s')
    target = wait(target, 200)
    assert.equal(target.dead, false)
    assert.equal(target.health, 30)
    assert.deepEqual([target.x, target.y], [HOME.x, HOME.y])
  })

  test('um alvo que não é de treino continua morto', () => {
    const target = wait(damageTarget(createTarget({ id: 'a', x: 800, y: 500, width: 10, height: 10, health: 3 }), 3), 3000)
    assert.equal(target.dead, true)
  })
})

describe('golpe nos alvos (swingAtTargets)', () => {
  test('acerta cada alvo uma vez por golpe, com o dano pedido', () => {
    const target = createTrainingTarget(HOME)
    const first = swingAtTargets([target], hitboxOn(target), 3, [])
    assert.equal(first.targets[0].health, 27)
    assert.deepEqual(first.hitIds, ['treino'])
    // a caixa continua em cima nos quadros seguintes do mesmo golpe: nada muda
    const again = swingAtTargets(first.targets, hitboxOn(target), 3, first.hitIds)
    assert.equal(again.targets[0].health, 27)
  })

  test('não acerta alvo longe da caixa do golpe nem alvo morto', () => {
    const target = createTrainingTarget(HOME)
    const far = swingAtTargets([target], { x: 0, y: 0, width: 20, height: 20 }, 3, [])
    assert.equal(far.targets[0].health, 30)
    assert.deepEqual(far.hitIds, [])
    const dead = damageTarget(target, 30)
    assert.equal(swingAtTargets([dead], hitboxOn(dead), 3, []).targets[0], dead)
  })

  test('conta o abate quando o golpe mata', () => {
    const target = { ...createTrainingTarget(HOME), health: 2 }
    const result = swingAtTargets([target], hitboxOn(target), 3, [])
    assert.equal(result.kills, 1)
    assert.equal(result.targets[0].dead, true)
  })
})

describe('lentidão, prisão e empurrão', () => {
  test('lento e preso duram o tempo pedido; o tempo maior vale', () => {
    let target = slowTarget(createTrainingTarget(HOME), 0.5, 2000)
    target = stunTarget(target, 800)
    target = stunTarget(target, 300) // menor: não encurta
    assert.deepEqual([target.slowMultiplier, target.slowMs, target.stunMs], [0.5, 2000, 800])
    target = wait(target, 1000)
    assert.equal(target.stunMs, 0)
    assert.ok(target.slowMs > 0)
    target = wait(target, 1100)
    assert.deepEqual([target.slowMs, target.slowMultiplier], [0, 1])
  })

  test('o empurrão anda a distância toda em PUSH_MS e para', () => {
    let target = pushTarget(createTrainingTarget(HOME), 1, 0, 120)
    assert.ok(target.push)
    target = wait(target, PUSH_MS + 40)
    assert.equal(target.push, null)
    assert.ok(Math.abs(target.x - (HOME.x + 120)) < 1e-6, `x = ${target.x}`)
    assert.equal(target.y, HOME.y)
  })

  test('o empurrão para na parede', () => {
    const nearWall = createTrainingTarget({ x: 1440, y: 500 }) // a parede da direita começa em x = 1482
    const target = wait(pushTarget(nearWall, 1, 0, 300), PUSH_MS + 40)
    assert.equal(target.push, null)
    assert.equal(target.x, 1482 - 22, 'a base encosta na parede')
  })

  test('alvo morto não fica lento, preso nem é empurrado', () => {
    const dead = damageTarget(createTrainingTarget(HOME), 30)
    assert.equal(slowTarget(dead, 0.5, 1000), dead)
    assert.equal(stunTarget(dead, 1000), dead)
    assert.equal(pushTarget(dead, 1, 0, 100), dead)
  })

  test('updateTargets avança todos os alvos', () => {
    const targets = updateTargets([stunTarget(createTrainingTarget(HOME), 100), createTrainingTarget(HOME)], 0.05, ROOM_WALLS)
    assert.equal(targets.length, 2)
    assert.equal(targets[0].stunMs, 50)
  })
})
