import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
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

// Largura e altura de um PNG, lidas do cabeçalho (bytes 16 a 23)
function pngSize(src) {
  const bytes = readFileSync(new URL(`../public${src}`, import.meta.url))
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) }
}

describe('folhas do personagem na sala', () => {
  test('o tamanho de cada folha bate com a grade declarada (quadro x quadros por linha x linhas)', () => {
    for (const name of ['tungTungSahurAndar', 'tungTungSahurAtaque']) {
      const sprite = CHARACTER_SPRITES[name]
      assert.deepEqual(pngSize(sprite.src), {
        width: sprite.frameWidth * sprite.framesPerRow,
        height: sprite.frameHeight * Object.keys(sprite.rows).length,
      }, name)
    }
  })

  test('o pivô (pés) do andar fica em (148, 241), o mesmo da folha original', () => {
    const walk = CHARACTER_SPRITES.tungTungSahurAndar
    const original = CHARACTER_SPRITES.tungTungSahur
    assert.equal(walk.frameWidth / 2, 148)
    assert.equal(walk.frameHeight - walk.feetPadding, 241)
    assert.equal(walk.feetPadding, original.feetPadding)
    assert.deepEqual(walk.rows, original.rows)
  })

  test('o ataque tem os pés no mesmo ponto do andar: o quadro original fica em (62, 60) da célula', () => {
    const walk = CHARACTER_SPRITES.tungTungSahurAndar
    const attack = CHARACTER_SPRITES.tungTungSahurAtaque
    const feetX = 62 + walk.frameWidth / 2
    const feetY = 60 + (walk.frameHeight - walk.feetPadding)
    assert.equal(attack.feetX, feetX)
    assert.equal(attack.frameHeight - attack.feetPadding, feetY)
    assert.deepEqual([feetX, feetY], [210, 301])
    assert.deepEqual(attack.rows, walk.rows)
  })

  test('o golpe dura 630 ms e acerta de 160 a 350 ms (quadros 2 a 4)', () => {
    const { durations, hitFrames, framesPerRow } = CHARACTER_SPRITES.tungTungSahurAtaque
    assert.equal(durations.length, framesPerRow)
    assert.equal(durations.reduce((a, b) => a + b, 0), 630)
    const start = durations.slice(0, hitFrames[0]).reduce((a, b) => a + b, 0)
    const end = durations.slice(0, hitFrames.at(-1) + 1).reduce((a, b) => a + b, 0)
    assert.deepEqual([start, end], [160, 350])
  })
})
