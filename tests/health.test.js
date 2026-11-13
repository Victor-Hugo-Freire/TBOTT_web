import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { HEART_PIXELS } from '../src/data/heartPixels.js'
import { drawHearts, getHeartsHeight } from '../src/pages/SalaInicial/scene/drawHearts.js'
import { getCountersTop } from '../src/pages/SalaInicial/scene/drawHud.js'
import {
  applyDamage,
  DAMAGE_HEAVY,
  DAMAGE_LIGHT,
  getDeathCauseLabel,
  getHeartStates,
  MAX_HEALTH,
  normalizeHealth,
} from '../src/utils/health.js'

describe('vida em meios corações', () => {
  test('o personagem tem 3 corações: 6 meios corações', () => {
    assert.equal(MAX_HEALTH, 6)
    assert.equal(getHeartStates(MAX_HEALTH).length, 3)
  })

  test('batida de inimigo tira meio coração; explosão e ataque pesado tiram 1 coração inteiro', () => {
    assert.equal(DAMAGE_LIGHT, 1)
    assert.equal(DAMAGE_HEAVY, 2)
    assert.equal(applyDamage(MAX_HEALTH, DAMAGE_LIGHT), 5)
    assert.equal(applyDamage(MAX_HEALTH, DAMAGE_HEAVY), 4)
  })

  test('a vida nunca fica abaixo de zero', () => {
    assert.equal(applyDamage(1, DAMAGE_HEAVY), 0)
    assert.equal(applyDamage(0, DAMAGE_LIGHT), 0)
  })

  test('6 batidas leves (ou 3 pesadas) acabam com os 3 corações', () => {
    let health = MAX_HEALTH
    for (let hit = 0; hit < 6; hit++) health = applyDamage(health, DAMAGE_LIGHT)
    assert.equal(health, 0)
    health = MAX_HEALTH
    for (let hit = 0; hit < 3; hit++) health = applyDamage(health, DAMAGE_HEAVY)
    assert.equal(health, 0)
  })
})

describe('normalizeHealth (vida salva no progresso)', () => {
  test('aceita os inteiros de 0 a 6', () => {
    for (let health = 0; health <= MAX_HEALTH; health++) assert.equal(normalizeHealth(health), health)
  })

  test('valor inválido ou save antigo (sem vida) vira vida cheia', () => {
    for (const value of [undefined, null, -1, 7, 2.5, '3', NaN, Infinity, {}, true]) {
      assert.equal(normalizeHealth(value), MAX_HEALTH, String(value))
    }
  })
})

describe('getHeartStates (corações do HUD)', () => {
  test('cada coração fica cheio, pela metade ou vazio, da esquerda para a direita', () => {
    assert.deepEqual(getHeartStates(6), ['full', 'full', 'full'])
    assert.deepEqual(getHeartStates(5), ['full', 'full', 'half'])
    assert.deepEqual(getHeartStates(4), ['full', 'full', 'empty'])
    assert.deepEqual(getHeartStates(3), ['full', 'half', 'empty'])
    assert.deepEqual(getHeartStates(2), ['full', 'empty', 'empty'])
    assert.deepEqual(getHeartStates(1), ['half', 'empty', 'empty'])
    assert.deepEqual(getHeartStates(0), ['empty', 'empty', 'empty'])
  })

  test('com mais vida máxima aparecem mais corações', () => {
    assert.deepEqual(getHeartStates(7, 8), ['full', 'full', 'full', 'half'])
  })
})

describe('getDeathCauseLabel (aviso de morte)', () => {
  test('diz o que matou, completando a frase "morreu para ..."', () => {
    assert.equal(getDeathCauseLabel('chapa'), 'a chapa quente')
  })

  test('causa desconhecida (ou save sem causa) tem um texto genérico', () => {
    for (const cause of [null, undefined, 'coisa-que-nao-existe']) assert.equal(getDeathCauseLabel(cause), 'um perigo da sala')
  })
})

describe('HEART_PIXELS (desenho dos corações)', () => {
  const STATES = ['full', 'half', 'empty']
  const { width, height, palette } = HEART_PIXELS

  test('os três estados têm o mesmo tamanho e só usam cores da paleta', () => {
    for (const state of STATES) {
      const rows = HEART_PIXELS[state]
      assert.equal(rows.length, height, state)
      for (const line of rows) {
        assert.equal(line.length, width, state)
        for (const char of line) assert.ok(char === '.' || char in palette, `${state}: cor "${char}" fora da paleta`)
      }
    }
  })

  test('os três estados têm o mesmo contorno e a mesma silhueta', () => {
    const outline = (rows) => rows.map((line) => [...line].map((char) => (char === '#' || char === '.' ? char : 'o')).join(''))
    assert.deepEqual(outline(HEART_PIXELS.half), outline(HEART_PIXELS.full))
    assert.deepEqual(outline(HEART_PIXELS.empty), outline(HEART_PIXELS.full))
  })

  test('cheio, meio e vazio são diferentes: o meio só tem madeira na metade esquerda', () => {
    assert.notDeepEqual(HEART_PIXELS.full, HEART_PIXELS.half)
    assert.notDeepEqual(HEART_PIXELS.half, HEART_PIXELS.empty)
    // cores de madeira = as que o coração cheio tem e o vazio não tem
    const emptyColors = new Set(HEART_PIXELS.empty.join(''))
    const woodColors = new Set([...HEART_PIXELS.full.join('')].filter((char) => !emptyColors.has(char)))
    assert.ok(woodColors.size >= 3, 'o cheio tem luz, base e sombra próprias')
    const middle = Math.floor(width / 2)
    for (const line of HEART_PIXELS.half) {
      ;[...line].forEach((char, col) => {
        if (woodColors.has(char)) assert.ok(col <= middle, `madeira na coluna ${col} do meio coração`)
      })
    }
    // e a metade esquerda do meio coração é igual à do cheio
    HEART_PIXELS.half.forEach((line, row) => assert.equal(line.slice(0, middle), HEART_PIXELS.full[row].slice(0, middle), `linha ${row}`))
  })

  test('cabe no HUD: no máximo 13 x 12 pixels', () => {
    assert.ok(width <= 13 && height <= 12)
  })
})

describe('drawHearts e a posição dos contadores', () => {
  // ctx falso: guarda cada retângulo pintado
  function paint(states, pixelSize) {
    const rects = []
    const ctx = { fillStyle: '', fillRect: (x, y, w, h) => rects.push({ x, y, w, h, color: ctx.fillStyle }) }
    drawHearts(ctx, states, 100, 50, pixelSize)
    return rects
  }

  test('desenha um coração por estado, lado a lado, com 1 pixel de espaço', () => {
    const one = paint(['full'], 5)
    const three = paint(['full', 'full', 'full'], 5)
    assert.equal(three.length, one.length * 3)
    const step = (HEART_PIXELS.width + 1) * 5
    assert.equal(Math.min(...three.slice(one.length, one.length * 2).map((rect) => rect.x)) - Math.min(...one.map((rect) => rect.x)), step)
  })

  test('cada pixel do desenho vira um quadrado de pixelSize, sem passar do tamanho do coração', () => {
    const rects = paint(['half'], 4)
    for (const rect of rects) {
      assert.deepEqual([rect.w, rect.h], [4, 4])
      assert.ok(rect.x >= 100 && rect.x + 4 <= 100 + HEART_PIXELS.width * 4)
      assert.ok(rect.y >= 50 && rect.y + 4 <= 50 + HEART_PIXELS.height * 4)
    }
  })

  test('os contadores de grão e de garfo ficam abaixo dos corações', () => {
    for (const pixelSize of [2, 4, 5, 8]) {
      assert.equal(getHeartsHeight(pixelSize), HEART_PIXELS.height * pixelSize)
      assert.ok(getCountersTop(50, pixelSize) > 50 + getHeartsHeight(pixelSize))
    }
  })
})
