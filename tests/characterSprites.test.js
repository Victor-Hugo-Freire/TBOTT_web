import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, test } from 'node:test'
import { CHARACTER_SPRITES, getFramePosition } from '../src/data/characterSprites.js'
import { drawSprite, PLAYER_SPRITE_SCALE } from '../src/pages/SalaInicial/scene/drawSprite.js'
import { PLAYER_SCALE } from '../src/utils/roomMovement.js'

const sprite = CHARACTER_SPRITES.tungTungSahurDano // grade de 4 colunas x 4 linhas

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
    assert.equal(sprite.src, '/sprites/characters/tung-tung-sahur/dano.png')
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
    for (const name of ['tungTungSahurPernas', 'tungTungSahurAndar', 'tungTungSahurAtaque', 'tungTungSahurDano', 'tungTungSahurMorte']) {
      const sprite = CHARACTER_SPRITES[name]
      assert.deepEqual(pngSize(sprite.src), {
        width: sprite.frameWidth * sprite.framesPerRow,
        height: sprite.frameHeight * Object.keys(sprite.rows).length,
      }, name)
    }
  })

  test('o pivô (pés) do andar fica em (148, 241)', () => {
    const walk = CHARACTER_SPRITES.tungTungSahurAndar
    assert.equal(walk.frameWidth / 2, 148)
    assert.equal(walk.frameHeight - walk.feetPadding, 241)
    assert.deepEqual(walk.rows, { down: 0, left: 1, right: 2, up: 3 })
  })

  test('pernas e tronco do andar têm a mesma célula e os pés no mesmo ponto; o ciclo tem 12 quadros mais o parado', () => {
    const legs = CHARACTER_SPRITES.tungTungSahurPernas
    const walk = CHARACTER_SPRITES.tungTungSahurAndar
    assert.deepEqual([legs.frameWidth, legs.frameHeight, legs.feetPadding], [walk.frameWidth, walk.frameHeight, walk.feetPadding])
    assert.deepEqual(legs.rows, walk.rows)
    assert.equal(walk.framesPerRow, 12)
    assert.equal(legs.framesPerRow, walk.framesPerRow + 1)
    assert.equal(legs.idleFrame, walk.framesPerRow) // o quadro parado é o último
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

  test('a morte tem uma linha só, um tempo por quadro e dura 1780 ms', () => {
    const death = CHARACTER_SPRITES.tungTungSahurMorte
    assert.deepEqual(death.rows, { down: 0 })
    assert.equal(death.durations.length, death.framesPerRow)
    assert.ok(death.durations.every((ms) => ms > 0))
    assert.equal(death.durations.reduce((a, b) => a + b, 0), 1780)
    // os pés (o pivô) ficam dentro da célula, com espaço para o corpo deitado à esquerda e o bastão à direita
    assert.ok(death.feetX > 296 && death.feetX < death.frameWidth - 100)
    assert.ok(death.feetPadding > 0 && death.feetPadding < death.frameHeight / 2)
  })

  test('o dano tem 4 quadros de 410 ms e os pés no mesmo ponto do andar', () => {
    const hurt = CHARACTER_SPRITES.tungTungSahurDano
    const walk = CHARACTER_SPRITES.tungTungSahurAndar
    assert.deepEqual(hurt.durations, [70, 110, 110, 120])
    assert.equal(hurt.durations.length, hurt.framesPerRow)
    assert.deepEqual([hurt.frameWidth, hurt.frameHeight, hurt.feetPadding], [walk.frameWidth, walk.frameHeight, walk.feetPadding])
    assert.deepEqual(hurt.rows, walk.rows)
  })
})

describe('drawSprite (tamanho igual nos dois lados)', () => {
  // ctx falso: só guarda os argumentos do drawImage
  function draw(sprite, direction) {
    let call
    const ctx = { drawImage: (...args) => { call = args } }
    drawSprite(ctx, { complete: true, naturalWidth: 1 }, sprite, direction, 0, { x: 600, y: 500 })
    const [, , , , , dx, dy, dw, dh] = call
    return { dx, dy, dw: dw / PLAYER_SPRITE_SCALE, dh, footX: dx + (sprite.feetX ?? sprite.frameWidth / 2) * (dw / sprite.frameWidth), footY: dy + (sprite.frameHeight - sprite.feetPadding) * (dh / sprite.frameHeight) }
  }

  test('a vista esquerda é desenhada 4% maior e os pés ficam no mesmo ponto', () => {
    for (const name of ['tungTungSahurAndar', 'tungTungSahurAtaque', 'tungTungSahurDano']) {
      const left = draw(CHARACTER_SPRITES[name], 'left')
      const right = draw(CHARACTER_SPRITES[name], 'right')
      assert.ok(Math.abs(left.dw / right.dw - 1.04) < 1e-9, name)
      assert.ok(Math.abs(left.footX - 600) < 1e-9 && Math.abs(left.footY - 500) < 1e-9, name)
    }
  })

  test('as outras direções e as pernas não mudam de tamanho', () => {
    const walk = CHARACTER_SPRITES.tungTungSahurAndar
    assert.ok(Math.abs(draw(walk, 'down').dw - walk.frameWidth) < 1e-9)
    assert.ok(Math.abs(draw(CHARACTER_SPRITES.tungTungSahurPernas, 'left').dw - CHARACTER_SPRITES.tungTungSahurPernas.frameWidth) < 1e-9)
  })

  test('o quadro de 296 px é desenhado com 118,8 u vezes a escala do personagem (1,18)', () => {
    assert.equal(PLAYER_SCALE, 1.18)
    const walk = CHARACTER_SPRITES.tungTungSahurAndar
    let call
    drawSprite({ drawImage: (...args) => { call = args } }, { complete: true, naturalWidth: 1 }, walk, 'down', 0, { x: 600, y: 500 })
    assert.ok(Math.abs(call[7] - 118.8 * 1.18) < 1e-9)
  })

  test('a folha da morte (célula maior) também fica com os pés no ponto pedido', () => {
    const death = CHARACTER_SPRITES.tungTungSahurMorte
    let call
    drawSprite({ drawImage: (...args) => { call = args } }, { complete: true, naturalWidth: 1 }, death, 'down', 0, { x: 600, y: 500 })
    const [, , , , , dx, dy, dw, dh] = call
    assert.ok(Math.abs(dx + death.feetX * (dw / death.frameWidth) - 600) < 1e-9)
    assert.ok(Math.abs(dy + (death.frameHeight - death.feetPadding) * (dh / death.frameHeight) - 500) < 1e-9)
  })
})

describe('folhas do Tung Tung Sahur (o jogo nunca reamostra nem redesenha: só muda a escala de desenho)', () => {
  // md5 de cada folha. As folhas saem dos scripts do protagonista (fora do repositório), só com peças do original.
  // Em 2026-11-13 o andar ficou sem o balanço lateral (andar.png e pernas.png) e a morte ganhou expressão (morte.png),
  // os dois a pedido; o ataque, o dano e o piscar são os de antes. Se uma folha for regerada de propósito, atualize o md5 dela aqui.
  const ORIGINALS = {
    'tung-tung-sahur/andar.png': '13327d75d725bfc4d19edd65ba6dc060',
    'tung-tung-sahur/ataque.png': '997d1d744c41acbb3541236c7d977770',
    'tung-tung-sahur/dano.png': '1703162b5ccfd15dbbc59d1addef1e09',
    'tung-tung-sahur/morte.png': 'e6516e25d86d33c0f3dc0af66042554b',
    'tung-tung-sahur/pernas.png': '966cca8e4b54137429a06167340d8f5b',
    'tung-tung-sahur-piscar.png': '41439f99db89c773334818bac41d14fd',
  }

  test('o md5 das folhas não mudou', () => {
    for (const [file, md5] of Object.entries(ORIGINALS)) {
      const bytes = readFileSync(new URL(`../public/sprites/characters/${file}`, import.meta.url))
      assert.equal(createHash('md5').update(bytes).digest('hex'), md5, file)
    }
  })
})
