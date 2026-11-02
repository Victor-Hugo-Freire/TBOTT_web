import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { getRoomView, ROOM_VIEW_CROP } from '../src/pages/SalaInicial/scene/view.js'
import { ROOM_PLAYER_BOUNDS, ROOM_SIZE } from '../src/utils/roomMovement.js'

const near = (a, b) => Math.abs(a - b) < 0.0001

// Altura do personagem acima dos pés (118,8 u) com uma folga
const PLAYER_HEIGHT = 119

describe('getRoomView (escala da sala, com corte em cima e embaixo)', () => {
  test('tela 16:9: a largura manda, sem faixa nos lados', () => {
    const view = getRoomView(1920, 1080)
    assert.ok(near(view.scale, 1920 / ROOM_SIZE.width))
    assert.equal(view.offsetX, 0)
  })

  test('a sala só é cortada em cima e embaixo, e no máximo ROOM_VIEW_CROP u', () => {
    const screens = [[1920, 1080], [1920, 910], [1366, 768], [1280, 1024], [2560, 1080], [844, 390], [932, 430], [390, 844]]
    for (const [width, height] of screens) {
      const view = getRoomView(width, height)
      const roomWidth = ROOM_SIZE.width * view.scale
      assert.ok(view.offsetX >= -0.0001 && view.offsetX + roomWidth <= width + 0.0001, `${width}x${height}: cortou nas laterais`)
      assert.ok(view.offsetY >= -ROOM_VIEW_CROP * view.scale - 0.0001, `${width}x${height}: cortou mais que o permitido`)
    }
  })

  test('na janela do navegador (1920x910) sobra uma faixa pequena nos lados', () => {
    const view = getRoomView(1920, 910)
    assert.ok(view.offsetX > 0 && view.offsetX < 1920 * 0.06)
  })

  test('celular deitado: sobra pouco nos lados', () => {
    for (const [width, height] of [[844, 390], [932, 430]]) {
      assert.ok(getRoomView(width, height).offsetX < width * 0.07, `${width}x${height}`)
    }
  })

  test('celular em pé: a largura manda e sobra faixa em cima e embaixo', () => {
    const view = getRoomView(390, 844)
    assert.ok(near(view.scale, 390 / ROOM_SIZE.width))
    assert.equal(view.offsetX, 0)
    assert.ok(view.offsetY > 0)
  })

  test('nunca é distorcida: um único fator de escala', () => {
    const view = getRoomView(1920, 910)
    assert.ok(near(ROOM_SIZE.width * view.scale + 2 * view.offsetX, 1920))
    assert.ok(near(ROOM_SIZE.height * view.scale + 2 * view.offsetY, 910))
  })

  test('o corte não pega o personagem: a cabeça fica fora da área cortada', () => {
    assert.ok(ROOM_PLAYER_BOUNDS.minY - PLAYER_HEIGHT >= ROOM_VIEW_CROP)
  })

  test('tela sem tamanho (ainda não exibida) usa escala 1', () => {
    assert.deepEqual(getRoomView(0, 0), { scale: 1, offsetX: 0, offsetY: 0 })
  })
})
