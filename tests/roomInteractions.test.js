import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { getEntryPosition } from '../src/utils/doors.js'
import { buildRoomObstacles } from '../src/utils/roomLayout.js'
import {
  FIN_LAP_MS,
  getHammockBox,
  getPullPoint,
  getSharkFinPosition,
  getSleepFade,
  getSleepText,
  isInPuddle,
  isNearFin,
  isNearHammock,
  PUDDLE,
  SLEEP_FADE_MS,
  SLEEP_MS,
} from '../src/utils/roomInteractions.js'
import { PLAYER_FEET_BOX } from '../src/utils/roomMovement.js'

describe('poça do Tralalero', () => {
  test('pisar na poça conta; na borda, do lado de fora, não', () => {
    const top = PUDDLE.y - PUDDLE.radiusY
    assert.equal(isInPuddle({ x: PUDDLE.x, y: top + 5 }), true, 'logo depois da borda de cima')
    assert.equal(isInPuddle({ x: PUDDLE.x, y: top - 5 }), false, 'logo antes da borda de cima')
    assert.equal(isInPuddle({ x: PUDDLE.x + PUDDLE.radiusX + 5, y: PUDDLE.y }), false, 'do lado direito')
  })

  test('perto da barbatana conta; longe dela, não', () => {
    const fin = { x: 800, y: 450 }
    assert.equal(isNearFin({ x: 800, y: 372 }, fin), true, 'a 78 u (o caso da print do Victor)')
    assert.equal(isNearFin({ x: 800, y: 365 }, fin), false, 'a 85 u')
  })

  test('as entradas das portas ficam longe da poça e da volta da barbatana (entrar na sala não mata)', () => {
    // A Sala do Pacto nunca tem porta em cima (floorGenerator.test.js confere): só as outras três contam
    for (const side of ['down', 'left', 'right']) {
      const entry = getEntryPosition(side)
      assert.equal(isInPuddle(entry), false, `entrada da porta ${side}`)
      for (let finMs = 0; finMs < FIN_LAP_MS; finMs += 50) {
        assert.equal(isNearFin(entry, getSharkFinPosition(finMs)), false, `entrada da porta ${side}, barbatana em ${finMs} ms`)
      }
    }
  })

  test('as casas sólidas do layout do pacto ficam dentro da poça', () => {
    const solids = buildRoomObstacles('pacto', 'cucina').filter((obstacle) => obstacle.kind === 'cenario')
    assert.ok(solids.length > 0)
    for (const { box } of solids) {
      for (const corner of [{ x: box.x, y: box.y }, { x: box.x + box.width, y: box.y + box.height }]) {
        assert.ok(isInPuddle(corner), `canto ${corner.x}, ${corner.y}`)
      }
    }
  })

  test('a barbatana contorna a poça por dentro e olha para o lado em que nada', () => {
    let previous = getSharkFinPosition(0)
    for (let finMs = 50; finMs <= 10000; finMs += 50) {
      const fin = getSharkFinPosition(finMs)
      assert.ok(isInPuddle(fin), `${fin.x}, ${fin.y} em ${finMs} ms`)
      if (fin.x !== previous.x) assert.equal(fin.facingLeft, fin.x < previous.x, `direção em ${finMs} ms`)
      previous = fin
    }
  })

  test('nas pontas da volta a barbatana vira aos poucos (sem pular de um lado para o outro)', () => {
    let previous = getSharkFinPosition(0).turn
    for (let finMs = 50; finMs <= 10000; finMs += 50) {
      const { turn } = getSharkFinPosition(finMs)
      assert.ok(turn >= -1 && turn <= 1)
      assert.ok(Math.abs(turn - previous) < 0.35, `pulou de ${previous} para ${turn} em ${finMs} ms`)
      previous = turn
    }
  })

  test('ele é puxado para dentro da poça, do lado em que estava', () => {
    const above = getPullPoint({ x: PUDDLE.x, y: PUDDLE.y - 200 })
    assert.ok(isInPuddle(above) && above.y < PUDDLE.y)
    const right = getPullPoint({ x: PUDDLE.x + 500, y: PUDDLE.y })
    assert.ok(isInPuddle(right) && right.x > PUDDLE.x)
  })
})

describe('rede da Sala de Descanso', () => {
  test('o sono escurece, fica preto e clareia; acordado, nada', () => {
    assert.equal(getSleepFade(null), 0)
    assert.equal(getSleepFade({ elapsedMs: 0 }), 0)
    assert.equal(getSleepFade({ elapsedMs: SLEEP_FADE_MS / 2 }), 0.5)
    assert.equal(getSleepFade({ elapsedMs: SLEEP_MS / 2 }), 1)
    assert.equal(getSleepFade({ elapsedMs: SLEEP_MS - SLEEP_FADE_MS / 2 }), 0.5)
    assert.equal(getSleepFade({ elapsedMs: SLEEP_MS }), 0)
  })

  test('o "ZZZ...." aparece letra por letra com a tela preta e fica inteiro até acordar', () => {
    assert.equal(getSleepText(null), '')
    assert.equal(getSleepText({ elapsedMs: SLEEP_FADE_MS - 1 }), '', 'ainda escurecendo')
    assert.equal(getSleepText({ elapsedMs: SLEEP_FADE_MS }), 'Z')
    let previous = ''
    for (let elapsedMs = SLEEP_FADE_MS; elapsedMs <= SLEEP_MS; elapsedMs += 50) {
      const text = getSleepText({ elapsedMs })
      assert.ok(text.startsWith(previous), `${text} depois de ${previous}`)
      previous = text
    }
    assert.equal(previous, 'ZZZ....')
  })

  test('perto da rede conta; as entradas das portas ficam longe dela', () => {
    const hammock = getHammockBox()
    const below = hammock.y + hammock.height
    assert.equal(isNearHammock({ x: hammock.x + 50, y: below + 5 + PLAYER_FEET_BOX.height }), true)
    assert.equal(isNearHammock({ x: hammock.x + 50, y: below + 30 + PLAYER_FEET_BOX.height }), false)
    for (const side of ['up', 'down', 'left', 'right']) {
      assert.equal(isNearHammock(getEntryPosition(side)), false, `entrada da porta ${side}`)
    }
  })

  test('a caixa da rede é a das casas X do layout da descanso', () => {
    const solids = buildRoomObstacles('descanso', 'cucina').filter((obstacle) => obstacle.kind === 'cenario')
    const hammock = getHammockBox()
    const inside = solids.filter(({ box }) => box.x >= hammock.x - 1e-9 && box.x + box.width <= hammock.x + hammock.width + 1e-9)
    assert.equal(inside.length, 10, 'as 5 x 2 casas da rede')
  })
})
