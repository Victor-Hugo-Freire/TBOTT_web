import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { createPlayer, getAttackHitbox } from '../src/utils/player.js'
import { ROOM_WALLS } from '../src/utils/roomMovement.js'
import {
  createTarget,
  createTrainingTarget,
  damageTarget,
  DAMAGE_TEXT_MS,
  findNewKills,
  findSwingHits,
  findTargetsNear,
  getTargetBox,
  PUSH_MS,
  pushTarget,
  slowTarget,
  stunTarget,
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

describe('golpe e área (findSwingHits, findTargetsNear) e abates (findNewKills)', () => {
  test('o golpe acha o alvo que a caixa toca, uma vez por golpe', () => {
    const target = createTrainingTarget(HOME)
    assert.deepEqual(findSwingHits([target], hitboxOn(target), []), [0])
    // já acertado por este golpe: os quadros seguintes não acertam de novo
    assert.deepEqual(findSwingHits([target], hitboxOn(target), ['treino']), [])
  })

  test('não acha alvo longe da caixa do golpe nem alvo morto', () => {
    const target = createTrainingTarget(HOME)
    assert.deepEqual(findSwingHits([target], { x: 0, y: 0, width: 20, height: 20 }, []), [])
    const dead = damageTarget(target, 30)
    assert.deepEqual(findSwingHits([dead], hitboxOn(dead), []), [])
  })

  test('alvos vivos perto de um ponto', () => {
    const near = createTarget({ id: 'a', x: 100, y: 100, width: 10, height: 10, health: 3 })
    const far = createTarget({ id: 'b', x: 300, y: 100, width: 10, height: 10, health: 3 })
    const dead = damageTarget(createTarget({ id: 'c', x: 110, y: 100, width: 10, height: 10, health: 3 }), 3)
    assert.deepEqual(findTargetsNear([near, far, dead], 120, 100, 50), [0])
  })

  test('conta os alvos que morreram no quadro; o alvo de treino que voltou não conta', () => {
    const alive = createTrainingTarget(HOME)
    const dead = damageTarget(alive, 30)
    assert.deepEqual(findNewKills([alive, alive], [dead, alive]), [dead])
    assert.deepEqual(findNewKills([dead], [{ ...alive }]), [])
  })
})

describe('lentidão, prisão e empurrão', () => {
  test('preso com intervalo: só pode ser preso de novo depois de immuneMs, contados da prisão', () => {
    let target = stunTarget(createTrainingTarget(HOME), 800, 2000)
    assert.deepEqual([target.stunMs, target.stunImmuneMs], [800, 2000])
    target = wait(target, 1000)
    assert.equal(stunTarget(target, 800, 2000), target, 'em menos de 2 s, nada muda')
    target = wait(target, 1000)
    assert.equal(stunTarget(target, 800, 2000).stunMs, 800, 'passados 2 s, prende de novo')
  })

  test('levar dano zera o tempo desde o último dano (a animação "dano" dos inimigos)', () => {
    let target = createTrainingTarget(HOME)
    assert.equal(target.hurtMs, Infinity)
    target = damageTarget(target, 3)
    assert.equal(target.hurtMs, 0)
    assert.equal(wait(target, 100).hurtMs, 100)
  })

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
    assert.equal(target.health, 30, 'sem dano de parede, a batida não machuca')
  })

  test('empurrão com dano de parede: bater tira o dano e marca a batida (bumped) só naquele quadro', () => {
    let target = pushTarget(createTrainingTarget({ x: 1440, y: 500 }), 1, 0, 300, 2)
    let bumpedFrames = 0
    for (let time = 0; time < PUSH_MS + 100; time += STEP * 1000) {
      target = updateTarget(target, STEP, ROOM_WALLS)
      if (target.bumped) bumpedFrames++
    }
    assert.equal(target.health, 28)
    assert.equal(bumpedFrames, 1)
  })

  test('longe da parede, o empurrão com dano de parede não machuca', () => {
    const target = wait(pushTarget(createTrainingTarget(HOME), 1, 0, 120, 2), PUSH_MS + 40)
    assert.equal(target.health, 30)
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

describe('fundura da caixa que o golpe acerta (chefes altos)', () => {
  // Golpe para baixo no meio da janela de acerto, com os pés do Tung `above` u acima dos pés do alvo
  function swingDownFrom(above) {
    return { ...createPlayer({ x: 800, y: 600 - above }), attack: { direction: 'down', elapsed: 250, area: 1 } }
  }
  const TRALALERO = createTarget({ id: 'tralalero', x: 800, y: 600, width: 301, height: 354, health: 100 })

  test('de cima, o golpe para baixo alcança um chefe alto como um inimigo comum (a cabeça desenhada não é fundura)', () => {
    assert.deepEqual(findSwingHits([TRALALERO], getAttackHitbox(swingDownFrom(170)), []), [0], 'perto: acerta')
    assert.deepEqual(findSwingHits([TRALALERO], getAttackHitbox(swingDownFrom(250)), []), [], 'a 250 u acima dos pés: não')
  })

  test('os inimigos comuns e o alvo de treino não mudam: a caixa vai do pé até o alto do corpo', () => {
    const enemy = createTarget({ id: 'e', x: 800, y: 600, width: 108, height: 136, health: 5 })
    assert.deepEqual(getTargetBox(enemy), { x: 746, y: 464, width: 108, height: 136 })
    assert.equal(getTargetBox(createTrainingTarget(HOME)).height, 120)
  })

  test('o chefe continua levando o golpe de lado e de baixo para cima', () => {
    const side = { ...createPlayer({ x: 800 - 150, y: 600 }), attack: { direction: 'right', elapsed: 250, area: 1 } }
    assert.deepEqual(findSwingHits([TRALALERO], getAttackHitbox(side), []), [0])
    const below = { ...createPlayer({ x: 800, y: 700 }), attack: { direction: 'up', elapsed: 250, area: 1 } }
    assert.deepEqual(findSwingHits([TRALALERO], getAttackHitbox(below), []), [0])
  })
})
