import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { getView, SCENE_HEIGHT, SCENE_WIDTH } from '../src/pages/Inicial/scene/view.js'

describe('getView (tamanho da cena na tela)', () => {
  test('na proporção do protótipo (1440x1024) mostra exatamente a cena', () => {
    assert.deepEqual(getView(1440, 1024), { width: 360, height: 256, offsetX: 0, offsetY: 0 })
  })

  test('em tela larga (16:9) ganha laterais e mantém a altura', () => {
    const view = getView(1920, 1080)
    assert.equal(view.height, SCENE_HEIGHT)
    assert.equal(view.width, 456)
    assert.equal(view.offsetX, 48)
  })

  test('em celular em pé ganha céu e chão e mantém a largura', () => {
    const view = getView(390, 844)
    assert.equal(view.width, SCENE_WIDTH)
    assert.ok(view.height > SCENE_HEIGHT)
  })

  test('a área segura (título, personagem e mensagem) nunca é cortada', () => {
    const screens = [
      [1440, 1024],
      [1920, 1080],
      [1366, 768],
      [2560, 1080],
      [1280, 1024],
      [768, 1024],
      [390, 844],
      [320, 568],
    ]
    for (const [width, height] of screens) {
      const view = getView(width, height)
      assert.ok(view.offsetX >= 0 && view.offsetX + SCENE_WIDTH <= view.width, `${width}x${height}: cortou nas laterais`)
      assert.ok(view.offsetY >= 0 && view.offsetY + SCENE_HEIGHT <= view.height, `${width}x${height}: cortou em cima ou embaixo`)
      // A área segura fica exatamente no centro (o personagem, posicionado pelo CSS, depende disso)
      assert.equal(view.offsetX * 2 + SCENE_WIDTH, view.width)
      assert.equal(view.offsetY * 2 + SCENE_HEIGHT, view.height)
      // A proporção do canvas acompanha a da tela, então os pixels continuam quadrados
      assert.ok(Math.abs(view.width / view.height - width / height) < 0.01, `${width}x${height}: pixels distorcidos`)
    }
  })

  test('tela sem tamanho (ainda não exibida) usa o tamanho padrão', () => {
    assert.deepEqual(getView(0, 0), { width: SCENE_WIDTH, height: SCENE_HEIGHT, offsetX: 0, offsetY: 0 })
  })
})
