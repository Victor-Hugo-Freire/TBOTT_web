import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { ROOM_THEMES } from '../src/pages/SalaInicial/scene/themes.js'
import { COLORS } from '../src/pages/SalaInicial/scene/colors.js'

const THEME_KEYS = ['cantina', 'cucina', 'piazza', 'pastificio', 'porto', 'chefe', 'tesouro', 'loja', 'pacto', 'mamae', 'fliperama', 'palco', 'adega', 'descanso']
const COLOR_FIELDS = ['top', 'panelA', 'panelB', 'beam', 'beamLight', 'beamBase', 'beamShadow', 'base', 'baseLine', 'mortar', 'joint', 'side', 'side2', 'doorFrame', 'doorTrim', 'doorLeaf', 'stoneA', 'stoneB', 'post', 'postLight']
const HEX = /^#[0-9a-f]{6}$/

describe('temas das salas', () => {
  test('existem os 5 andares e as 9 salas especiais, e nada além disso', () => {
    assert.deepEqual(Object.keys(ROOM_THEMES).sort(), [...THEME_KEYS].sort())
  })

  test('cada tema tem todos os campos de cor, padrões conhecidos e a luz no formato r,g,b', () => {
    for (const key of THEME_KEYS) {
      const theme = ROOM_THEMES[key]
      for (const field of COLOR_FIELDS) assert.match(theme[field], HEX, `${key}.${field}`)
      assert.ok(['brick', 'tile', 'facade', 'metal', 'planks'].includes(theme.wall), `${key}.wall`)
      assert.ok(['planks', 'checker', 'cobble', 'concrete', 'dock', 'slabs'].includes(theme.floor), `${key}.floor`)
      assert.ok(theme.wallCols.length >= 2 && theme.wallCols.every((color) => HEX.test(color)), `${key}.wallCols`)
      assert.ok(theme.floorCols.length >= 2 && theme.floorCols.every((color) => HEX.test(color)), `${key}.floorCols`)
      assert.match(theme.glow, /^\d{1,3},\d{1,3},\d{1,3}$/, `${key}.glow`)
    }
  })

  test('a Cantina usa as cores de colors.js (a sala de hoje)', () => {
    const cantina = ROOM_THEMES.cantina
    assert.equal(cantina.top, COLORS.topWall)
    assert.deepEqual(cantina.wallCols, [COLORS.brickA, COLORS.brickB, COLORS.brickC])
    assert.deepEqual(cantina.floorCols, [COLORS.floorA, COLORS.floorB, COLORS.floorC])
    assert.equal(cantina.stoneA, '#3b261b')
    assert.equal(cantina.stoneB, '#33211a')
    assert.equal(cantina.post, '#37241a')
    assert.equal(cantina.postLight, '#3e2a1c')
    assert.equal(cantina.glow, '170,118,70')
  })
})
