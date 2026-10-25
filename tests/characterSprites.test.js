import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { CHARACTER_SPRITES, getFramePosition } from '../src/data/characterSprites.js'

const sprite = CHARACTER_SPRITES.tungTungSahur

describe('getFramePosition (quadro dentro da folha de sprites)', () => {
  test('primeiro quadro de frente fica no canto superior esquerdo', () => {
    assert.equal(getFramePosition(sprite, 'down', 0), '0% 0%')
  })

  test('último quadro de costas fica no canto inferior direito', () => {
    assert.equal(getFramePosition(sprite, 'up', 3), '100% 100%')
  })

  test('cada direção usa a sua linha da folha', () => {
    // Lê a porcentagem vertical ("0% 33.33%" -> 33.33)
    const rowPercent = (direction) => parseFloat(getFramePosition(sprite, direction, 0).split(' ')[1])
    assert.ok(Math.abs(rowPercent('left') - 100 / 3) < 0.001)
    assert.ok(Math.abs(rowPercent('right') - 200 / 3) < 0.001)
  })

  test('o sprite fica em um caminho público estável', () => {
    assert.equal(sprite.src, '/sprites/characters/tung-tung-sahur.png')
  })

  test('folha de uma linha só (piscar) usa a altura toda', () => {
    const piscar = CHARACTER_SPRITES.tungTungSahurPiscar
    assert.equal(getFramePosition(piscar, 'down', 0), '0% 0%')
    assert.equal(getFramePosition(piscar, 'down', 3), '100% 0%')
  })

  test('a sequência do piscar só usa quadros que existem na folha', () => {
    const piscar = CHARACTER_SPRITES.tungTungSahurPiscar
    for (const step of piscar.sequence) {
      assert.ok(step.frame >= 0 && step.frame < piscar.framesPerRow)
      assert.ok(step.ms > 0)
    }
  })
})
