import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { getHudTop, getRoomView, ROOM_VIEW_BOTTOM_EXTRA, ROOM_VIEW_TOP_CROP } from '../src/pages/SalaInicial/scene/view.js'
import { ROOM_PLAYER_BOUNDS, ROOM_SIZE } from '../src/utils/roomMovement.js'

const near = (a, b) => Math.abs(a - b) < 0.0001

// Altura do personagem acima dos pés: os pés ficam a 241 px do topo do quadro e 1 px vale 0,474 u (escala 1,18)
const PLAYER_HEIGHT = 115
// Até onde a tela precisa mostrar embaixo: a sala mais a faixa dos enfeites da porta de baixo
const FULL_HEIGHT = ROOM_SIZE.height + ROOM_VIEW_BOTTOM_EXTRA

// Primeira e última linha da sala (em unidades) que aparecem na tela
function visibleRange(view, screenHeight) {
  const top = -view.offsetY / view.scale
  return { top, bottom: top + screenHeight / view.scale }
}

const SCREENS = [[1920, 1080], [1920, 910], [1366, 768], [1280, 1024], [2560, 1080], [844, 390], [932, 430], [390, 844], [1600, 900]]

describe('getRoomView (escala da sala, com corte só em cima)', () => {
  test('tela 16:9: a largura manda, sem faixa nos lados, e cabe tudo', () => {
    const view = getRoomView(1920, 1080)
    assert.ok(near(view.scale, 1920 / ROOM_SIZE.width))
    assert.equal(view.offsetX, 0)
    const { top, bottom } = visibleRange(view, 1080)
    assert.ok(top <= 0 && bottom >= FULL_HEIGHT, 'a sala inteira e a faixa da porta de baixo aparecem')
  })

  test('os lados nunca são cortados', () => {
    for (const [width, height] of SCREENS) {
      const view = getRoomView(width, height)
      const roomWidth = ROOM_SIZE.width * view.scale
      assert.ok(view.offsetX >= -0.0001 && view.offsetX + roomWidth <= width + 0.0001, `${width}x${height}: cortou nas laterais`)
    }
  })

  test('em cima, a tela corta no máximo ROOM_VIEW_TOP_CROP u', () => {
    for (const [width, height] of SCREENS) {
      const { top } = visibleRange(getRoomView(width, height), height)
      assert.ok(top <= ROOM_VIEW_TOP_CROP + 0.0001, `${width}x${height}: cortou ${top} u em cima`)
    }
  })

  test('embaixo nunca corta: a porta de baixo aparece inteira, com o enfeite dela', () => {
    for (const [width, height] of SCREENS) {
      const { bottom } = visibleRange(getRoomView(width, height), height)
      assert.ok(bottom >= FULL_HEIGHT - 0.0001, `${width}x${height}: só mostra até ${bottom} u`)
    }
  })

  test('na janela do navegador (1920x910) o corte é todo em cima e sobra uma faixa pequena nos lados', () => {
    const view = getRoomView(1920, 910)
    const { top, bottom } = visibleRange(view, 910)
    assert.ok(near(top, ROOM_VIEW_TOP_CROP))
    assert.ok(near(bottom, FULL_HEIGHT))
    assert.ok(view.offsetX > 0 && view.offsetX < 1920 * 0.06)
  })

  test('celular deitado: sobra pouco nos lados', () => {
    for (const [width, height] of [[844, 390], [932, 430]]) {
      assert.ok(getRoomView(width, height).offsetX < width * 0.07, `${width}x${height}`)
    }
  })

  test('celular em pé: a largura manda e sobra faixa igual em cima e embaixo', () => {
    const view = getRoomView(390, 844)
    assert.ok(near(view.scale, 390 / ROOM_SIZE.width))
    assert.equal(view.offsetX, 0)
    assert.ok(view.offsetY > 0)
    assert.ok(near(FULL_HEIGHT * view.scale + 2 * view.offsetY, 844))
  })

  test('nunca é distorcida: um único fator de escala', () => {
    const view = getRoomView(1920, 910)
    assert.ok(near(ROOM_SIZE.width * view.scale + 2 * view.offsetX, 1920))
    assert.ok(near(view.offsetY + FULL_HEIGHT * view.scale, 910))
  })

  test('o corte não pega o personagem: a cabeça fica fora da área cortada', () => {
    assert.ok(ROOM_PLAYER_BOUNDS.minY - PLAYER_HEIGHT >= ROOM_VIEW_TOP_CROP)
  })

  test('tela sem tamanho (ainda não exibida) usa escala 1', () => {
    assert.deepEqual(getRoomView(0, 0), { scale: 1, offsetX: 0, offsetY: 0 })
  })
})

describe('getHudTop (altura do contador e do HUD)', () => {
  test('com a sala inteira na tela, fica a 42 u do topo da sala', () => {
    assert.equal(getHudTop(0), 42)
    assert.equal(getHudTop(-20), 42, 'sobra de tela em cima não muda')
  })

  test('com a tela cortando em cima, desce junto e fica a 9 u da borda da tela', () => {
    assert.equal(getHudTop(ROOM_VIEW_TOP_CROP), ROOM_VIEW_TOP_CROP + 9)
    assert.equal(getHudTop(40), 49)
  })

  test('mesmo no corte máximo, o contador (até 28 u de altura, com o contorno) termina antes dos enfeites da porta de cima (y = 83)', () => {
    assert.ok(getHudTop(ROOM_VIEW_TOP_CROP) + 28 <= 83)
  })
})
