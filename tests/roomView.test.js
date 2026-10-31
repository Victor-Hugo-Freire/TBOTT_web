import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { getRoomView, getVisibleRoom, screenToRoom } from '../src/pages/SalaInicial/scene/view.js'
import { ROOM_SIZE } from '../src/utils/roomMovement.js'

const near = (a, b) => Math.abs(a - b) < 0.0001

describe('getRoomView (escala contain da sala)', () => {
  test('tela larga (16:9): a altura manda e sobra faixa nas laterais', () => {
    const view = getRoomView(1920, 1080)
    assert.ok(near(view.scale, 1080 / ROOM_SIZE.height))
    assert.ok(near(view.offsetX, (1920 - ROOM_SIZE.width * view.scale) / 2))
    assert.equal(view.offsetY, 0)
  })

  test('tela do tamanho exato da sala: escala 1 e sem faixa', () => {
    assert.deepEqual(getRoomView(ROOM_SIZE.width, ROOM_SIZE.height), { scale: 1, offsetX: 0, offsetY: 0 })
  })

  test('celular em pé: a largura manda e sobra faixa em cima e embaixo', () => {
    const view = getRoomView(390, 844)
    assert.ok(near(view.scale, 390 / ROOM_SIZE.width))
    assert.equal(view.offsetX, 0)
    assert.ok(near(view.offsetY, (844 - ROOM_SIZE.height * view.scale) / 2))
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

describe('getVisibleRoom (parte da sala que aparece na tela)', () => {
  test('tela larga: mostra a sala toda de cima a baixo e passa dela nas laterais', () => {
    const visible = getVisibleRoom(getRoomView(1920, 1080), 1920, 1080)
    assert.ok(near(visible.top, 0) && near(visible.bottom, ROOM_SIZE.height))
    assert.ok(visible.left < 0 && visible.right > ROOM_SIZE.width)
  })

  test('celular em pé: mostra a sala toda de lado a lado e passa dela em cima e embaixo', () => {
    const visible = getVisibleRoom(getRoomView(390, 844), 390, 844)
    assert.ok(near(visible.left, 0) && near(visible.right, ROOM_SIZE.width))
    assert.ok(visible.top < 0 && visible.bottom > ROOM_SIZE.height)
  })

  test('sempre contém a sala inteira, e a tela inteira vira área visível (sem faixa sobrando)', () => {
    for (const [width, height] of [[1920, 1080], [1366, 768], [2560, 1080], [768, 1024], [390, 844]]) {
      const view = getRoomView(width, height)
      const visible = getVisibleRoom(view, width, height)
      assert.ok(visible.left <= 0.0001 && visible.top <= 0.0001, `${width}x${height}`)
      assert.ok(visible.right >= ROOM_SIZE.width - 0.0001 && visible.bottom >= ROOM_SIZE.height - 0.0001, `${width}x${height}`)
      // a área visível, na escala da tela, tem exatamente o tamanho da tela
      assert.ok(near((visible.right - visible.left) * view.scale, width), `${width}x${height}: largura`)
      assert.ok(near((visible.bottom - visible.top) * view.scale, height), `${width}x${height}: altura`)
    }
  })
})

describe('screenToRoom', () => {
  test('o canto da tela vira o canto visível da sala, e o da sala fica no deslocamento', () => {
    const view = getRoomView(1920, 1080)
    const origin = screenToRoom(view, view.offsetX, view.offsetY)
    assert.ok(near(origin.x, 0) && near(origin.y, 0))
    const visible = getVisibleRoom(view, 1920, 1080)
    assert.ok(near(screenToRoom(view, 0, 0).x, visible.left))
  })
})
