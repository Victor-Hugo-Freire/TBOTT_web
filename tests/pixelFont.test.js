import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { getHudIconSize } from '../src/pages/SalaInicial/scene/drawHud.js'
import { forEachTextPixel, getTextWidth, NUMBER_FONT, SMALL_FONT } from '../src/utils/pixelFont.js'
import { formatRunTime } from '../src/utils/formatDuration.js'

describe('NUMBER_FONT (dígitos do contador e do HUD)', () => {
  const DIGITS = '0123456789'

  test('todo dígito tem 4 de largura e 6 de altura: menor que a SMALL_FONT (5 x 7) e sem o contador tremer', () => {
    for (const digit of DIGITS) {
      const glyph = NUMBER_FONT.glyphs[digit]
      assert.equal(glyph.length, 6, digit)
      assert.ok(glyph.every((line) => line.length === 4), digit)
      assert.equal(SMALL_FONT.glyphs[digit].length, 7)
    }
  })

  test('dois-pontos e ponto são estreitos (1 pixel) e têm a mesma altura', () => {
    for (const mark of [':', '.']) {
      assert.equal(NUMBER_FONT.glyphs[mark].length, 6, mark)
      assert.ok(NUMBER_FONT.glyphs[mark].every((line) => line.length === 1), mark)
    }
  })

  test('só usa # e . em cada linha e cada dígito acende pixels', () => {
    for (const [name, glyph] of Object.entries(NUMBER_FONT.glyphs)) {
      assert.ok(glyph.every((line) => /^[#.]+$/.test(line)), name)
      assert.ok(glyph.some((line) => line.includes('#')), name)
    }
  })

  test('os dígitos são diferentes entre si', () => {
    const shapes = new Set([...DIGITS].map((digit) => NUMBER_FONT.glyphs[digit].join('/')))
    assert.equal(shapes.size, 10)
  })

  test('o contador HH:MM:SS.cc tem 45 pixels de largura (a SMALL_FONT usava 65) e não muda com os números', () => {
    const widths = new Set(['00:00:00.00', '12:34:56.78', '99:59:59.99', formatRunTime(111600)].map((text) => getTextWidth(NUMBER_FONT, text)))
    assert.equal(widths.size, 1)
    // 8 dígitos de 4, dois ':' e um '.' de 1, e 10 espaços entre as 11 letras
    assert.equal(getTextWidth(NUMBER_FONT, '00:00:00.00'), 8 * 4 + 3 * 1 + 10)
    assert.ok(getTextWidth(NUMBER_FONT, '00:00:00.00') < getTextWidth(SMALL_FONT, '00:00:00.00'))
  })

  test('forEachTextPixel acende cada pixel de um dígito na posição certa', () => {
    const lit = []
    forEachTextPixel(NUMBER_FONT, '1', (col, row) => lit.push(`${col},${row}`))
    assert.deepEqual(lit, ['1,0', '0,1', '1,1', '1,2', '1,3', '1,4', '0,5', '1,5', '2,5'])
  })

  test('letra que não existe vira "?"', () => {
    assert.equal(getTextWidth(NUMBER_FONT, 'A'), getTextWidth(NUMBER_FONT, '?'))
  })
})

describe('getHudIconSize (ícones do HUD)', () => {
  test('sempre um múltiplo inteiro de 20 px, o tamanho da arte', () => {
    for (let pixelSize = 2; pixelSize <= 20; pixelSize++) {
      assert.equal(getHudIconSize(pixelSize) % 20, 0, `pixelSize ${pixelSize}`)
      assert.ok(getHudIconSize(pixelSize) >= 20)
    }
  })

  test('em 1080p (pixelSize 5) o ícone tem 40 px, 2 px por pixel da arte', () => {
    assert.equal(getHudIconSize(5), 40)
  })

  test('cresce com a tela e nunca é menor que o número ao lado (6 pixels da fonte)', () => {
    for (let pixelSize = 2; pixelSize <= 20; pixelSize++) {
      assert.ok(getHudIconSize(pixelSize) >= 6 * pixelSize - 10, `pixelSize ${pixelSize}`)
      assert.ok(getHudIconSize(pixelSize + 1) >= getHudIconSize(pixelSize))
    }
  })
})
