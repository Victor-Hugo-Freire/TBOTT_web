import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { getRoomView, roomToScreen, screenToRoom } from '../src/pages/SalaInicial/scene/view.js'
import { ROOM_SIZE } from '../src/utils/roomMovement.js'

const near = (a, b) => Math.abs(a - b) < 0.0001

describe('getRoomView (escala contain da sala)', () => {
  test('tela larga (16:9): a altura manda e sobra faixa nas laterais', () => {
    const view = getRoomView(1920, 1080)
    assert.ok(near(view.scale, 1080 / 768))
    assert.ok(near(view.offsetX, (1920 - 1080 * view.scale) / 2))
    assert.equal(view.offsetY, 0)
  })

  test('1366x768: escala 1 e 143 px de faixa de cada lado', () => {
    assert.deepEqual(getRoomView(1366, 768), { scale: 1, offsetX: 143, offsetY: 0 })
  })

  test('celular em pé: a largura manda e sobra faixa em cima e embaixo', () => {
    const view = getRoomView(390, 844)
    assert.ok(near(view.scale, 390 / 1080))
    assert.equal(view.offsetX, 0)
    assert.ok(near(view.offsetY, (844 - 768 * view.scale) / 2))
  })

  test('a sala nunca é cortada e nunca é distorcida', () => {
    const screens = [[1920, 1080], [1366, 768], [1280, 1024], [2560, 1080], [768, 1024], [390, 844], [320, 568]]
    for (const [width, height] of screens) {
      const view = getRoomView(width, height)
      const roomWidth = ROOM_SIZE.width * view.scale
      const roomHeight = ROOM_SIZE.height * view.scale
      assert.ok(view.offsetX >= -0.0001 && view.offsetX + roomWidth <= width + 0.0001, `${width}x${height}: cortou nas laterais`)
      assert.ok(view.offsetY >= -0.0001 && view.offsetY + roomHeight <= height + 0.0001, `${width}x${height}: cortou em cima ou embaixo`)
      // Um único fator de escala para os dois eixos: sem distorção
      assert.ok(near(roomWidth / roomHeight, ROOM_SIZE.width / ROOM_SIZE.height))
    }
  })

  test('tela sem tamanho (ainda não exibida) usa escala 1', () => {
    assert.deepEqual(getRoomView(0, 0), { scale: 1, offsetX: 0, offsetY: 0 })
  })
})

describe('conversão de coordenadas', () => {
  test('o canto da sala fica no deslocamento da tela', () => {
    const view = getRoomView(1920, 1080)
    const corner = roomToScreen(view, 0, 0)
    assert.ok(near(corner.x, view.offsetX))
    assert.ok(near(corner.y, view.offsetY))
  })

  test('screenToRoom é a volta exata de roomToScreen', () => {
    for (const [width, height] of [[1920, 1080], [390, 844]]) {
      const view = getRoomView(width, height)
      const screen = roomToScreen(view, 540, 538)
      const room = screenToRoom(view, screen.x, screen.y)
      assert.ok(near(room.x, 540) && near(room.y, 538))
    }
  })
})
