import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { describe, test } from 'node:test'
import { APPEARANCE_ANCHORS, APPEARANCE_SPRITES } from '../src/data/appearanceSprites.js'
import { getAppearanceLayers, getVisibleItems } from '../src/utils/appearance.js'
import { getPlayerPose } from '../src/utils/player.js'
import { TEST_CATALOG } from './helpers/testCatalog.js'

const ALL_WITH_LOOK = ['chifre-da-sorte', 'rolo-de-bronze', 'concha-longa', 'caldo-da-mamae', 'elixir-eletrico']

function walkPose(direction, frame) {
  return { sheet: 'walk', direction, frame, legs: { direction, frame } }
}

function attackPose(direction, frame) {
  return { sheet: 'attack', direction, frame, legs: { direction, frame: 12 } }
}

function findLayer(layers, itemId) {
  return layers.find((layer) => layer.itemId === itemId)
}

describe('getVisibleItems (1 item por slot)', () => {
  test('itens de slots diferentes aparecem todos; itens sem desenho no Tung não aparecem', () => {
    const visible = getVisibleItems(['cafe-duplo', 'chifre-da-sorte', 'rolo-de-bronze', 'mucarela'], TEST_CATALOG)
    assert.deepEqual(visible.sort(), ['chifre-da-sorte', 'rolo-de-bronze'])
  })

  test('Concha (comum) e Elixir (raro) disputam as costas: o Elixir aparece, pegue ele antes ou depois', () => {
    assert.deepEqual(getVisibleItems(['concha-longa', 'elixir-eletrico'], TEST_CATALOG), ['elixir-eletrico'])
    assert.deepEqual(getVisibleItems(['elixir-eletrico', 'concha-longa'], TEST_CATALOG), ['elixir-eletrico'])
  })

  test('raridade empatada: aparece o mais recente', () => {
    const catalog = {
      'concha-longa': { rarity: 'raro' },
      'elixir-eletrico': { rarity: 'raro' },
    }
    assert.deepEqual(getVisibleItems(['concha-longa', 'elixir-eletrico'], catalog), ['elixir-eletrico'])
    assert.deepEqual(getVisibleItems(['elixir-eletrico', 'concha-longa'], catalog), ['concha-longa'])
  })

  test('sem itens, nada aparece', () => {
    assert.deepEqual(getVisibleItems([], TEST_CATALOG), [])
  })
})

describe('getAppearanceLayers (camadas do quadro atual)', () => {
  const visible = getVisibleItems(ALL_WITH_LOOK, TEST_CATALOG) // chifre, rolo, caldo e elixir

  test('parado, as camadas ficam no lugar do quadro 0 (deslocamento zero, mais o shift da camada, se ela tiver)', () => {
    for (const direction of ['down', 'left', 'right', 'up']) {
      for (const layer of getAppearanceLayers(visible, walkPose(direction, 0))) {
        const shift = APPEARANCE_SPRITES[layer.itemId].layers[direction].shift ?? [0, 0]
        assert.deepEqual(layer.offset, shift, `${direction} ${layer.itemId}`)
        assert.equal(layer.rotation, 0, `${direction} ${layer.itemId}`)
      }
    }
  })

  test('andando, a cabeça segue a cabeça do quadro, as costas seguem o corpo e a aura fica parada no chão', () => {
    const layers = getAppearanceLayers(visible, walkPose('down', 3))
    assert.deepEqual(findLayer(layers, 'chifre-da-sorte').offset, APPEARANCE_ANCHORS.down.walk[3].head)
    assert.deepEqual(findLayer(layers, 'caldo-da-mamae').offset, [0, 0])
    const side = getAppearanceLayers(visible, walkPose('left', 9))
    const [bodyX, bodyY] = APPEARANCE_ANCHORS.left.walkBody[9]
    const [shiftX, shiftY] = APPEARANCE_SPRITES['elixir-eletrico'].layers.left.shift
    assert.deepEqual(findLayer(side, 'elixir-eletrico').offset, [bodyX + shiftX, bodyY + shiftY])
  })

  test('o Elixir de lado fica nas costas (na altura do tronco, na frente do corpo), espelhado nos dois lados', () => {
    const { left, right } = APPEARANCE_SPRITES['elixir-eletrico'].layers
    assert.equal(left.position, 'frente')
    assert.equal(right.position, 'frente')
    // desceu da nuca até o tronco e foi para dentro, do lado do corpo
    assert.ok(left.shift[1] > 60 && right.shift[1] === left.shift[1])
    assert.equal(left.shift[0], -right.shift[0])
  })

  test('de costas a cabeça balança para os lados e o corpo não: a Concha acompanha o corpo, sem balançar', () => {
    const concha = ['concha-longa']
    // quadro 2 de costas: a cabeça vai 3 px para o lado (head[0] = 3)
    assert.equal(APPEARANCE_ANCHORS.up.walk[2].head[0], 3)
    const layer = findLayer(getAppearanceLayers(concha, walkPose('up', 2)), 'concha-longa')
    assert.equal(layer.offset[0], 0)
    assert.deepEqual(layer.offset, APPEARANCE_ANCHORS.up.walkBody[2])
  })

  test('a tabela do corpo tem os 12 quadros do andar nas 4 direções, e o quadro 0 é a pose parada', () => {
    for (const direction of ['down', 'left', 'right', 'up']) {
      const { walkBody } = APPEARANCE_ANCHORS[direction]
      assert.equal(walkBody.length, 12, direction)
      assert.deepEqual(walkBody[0], [0, 0], direction)
    }
  })

  test('o Chifre tem imagem própria por personagem; os outros itens usam a pasta do Sahur', () => {
    for (const [characterId, folder] of [['tung-tung-sahur', 'tung-tung-sahur'], ['tung-tung-sabor', 'tung-tung-sabor'], ['tung-tung-god', 'tung-tung-god'], [undefined, 'tung-tung-sahur']]) {
      const layers = getAppearanceLayers(['chifre-da-sorte', 'rolo-de-bronze'], walkPose('left', 0), characterId)
      assert.equal(findLayer(layers, 'chifre-da-sorte').path, `/sprites/characters/${folder}/aparencia/chifre-da-sorte-esquerda.png`, String(characterId))
      assert.equal(findLayer(layers, 'rolo-de-bronze').path, '/sprites/characters/tung-tung-sahur/aparencia/rolo-de-bronze-esquerda.png', String(characterId))
    }
  })

  test('toda imagem de camada de todos os personagens existe em public', () => {
    const walk = walkPose('left', 0)
    for (const characterId of ['tung-tung-sahur', 'tung-tung-sabor', 'tung-tung-god']) {
      for (const direction of ['down', 'left', 'right', 'up']) {
        for (const layer of getAppearanceLayers(Object.keys(APPEARANCE_SPRITES), { ...walk, direction }, characterId)) {
          assert.ok(existsSync(new URL('../public' + layer.path, import.meta.url)), layer.path)
        }
      }
    }
  })

  test('andando, o bastão anda com o anel e gira com o ângulo, em volta do anel do quadro 0', () => {
    const { walk } = APPEARANCE_ANCHORS.right
    const rolo = findLayer(getAppearanceLayers(visible, walkPose('right', 9)), 'rolo-de-bronze')
    assert.deepEqual(rolo.offset, [walk[9].batRing[0] - walk[0].batRing[0], walk[9].batRing[1] - walk[0].batRing[1]])
    assert.equal(rolo.rotation, walk[9].batAngle - walk[0].batAngle)
    assert.deepEqual(rolo.pivot, walk[0].batRing)
  })

  test('no golpe, cabeça e costas seguem a cabeça do golpe e o bastão gira em volta do ombro', () => {
    const layers = getAppearanceLayers(visible, attackPose('up', 4))
    assert.deepEqual(findLayer(layers, 'chifre-da-sorte').offset, APPEARANCE_ANCHORS.up.attackHead[4])
    assert.ok(findLayer(layers, 'caldo-da-mamae'))
    const rolo = findLayer(layers, 'rolo-de-bronze')
    const [dx, dy, angle] = APPEARANCE_ANCHORS.up.attackBat[4]
    assert.deepEqual(rolo.offset, [dx, dy])
    assert.equal(rolo.rotation, angle)
    assert.deepEqual(rolo.pivot, APPEARANCE_ANCHORS.up.shoulder)
  })

  test('no golpe, a ponta do bastão some só nos quadros em que fica atrás da cabeça ou do corpo', () => {
    assert.equal(findLayer(getAppearanceLayers(visible, attackPose('up', 0)), 'rolo-de-bronze'), undefined)
    assert.equal(findLayer(getAppearanceLayers(visible, attackPose('down', 1)), 'rolo-de-bronze'), undefined)
    assert.ok(findLayer(getAppearanceLayers(visible, attackPose('down', 2)), 'rolo-de-bronze'))
  })

  test('a tabela do golpe tem os 8 quadros nas 4 direções, e o último é a pose parada', () => {
    for (const direction of ['down', 'left', 'right', 'up']) {
      const { attackBat } = APPEARANCE_ANCHORS[direction]
      assert.equal(attackBat.length, 8, direction)
      assert.deepEqual(attackBat[7], [0, 0, 0], direction)
      const rolo = findLayer(getAppearanceLayers(visible, attackPose(direction, 7)), 'rolo-de-bronze')
      assert.deepEqual(rolo.offset, [0, 0], direction)
    }
  })

  test('no dano e na morte, nenhuma camada aparece', () => {
    const hurt = getPlayerPose({ x: 0, y: 0, direction: 'left', hurt: { direction: 'left', elapsed: 100 } })
    assert.equal(hurt.sheet, 'hurt')
    assert.deepEqual(getAppearanceLayers(visible, hurt), [])
    const dead = getPlayerPose({ x: 0, y: 0, direction: 'down', dead: { elapsed: 0 } })
    assert.deepEqual(getAppearanceLayers(visible, dead), [])
  })

  test('o Elixir não aparece de frente (a cabeça esconde); nas outras direções aparece', () => {
    assert.equal(findLayer(getAppearanceLayers(visible, walkPose('down', 0)), 'elixir-eletrico'), undefined)
    for (const direction of ['left', 'right', 'up']) {
      assert.ok(findLayer(getAppearanceLayers(visible, walkPose(direction, 0)), 'elixir-eletrico'), direction)
    }
  })

  test('cada camada diz quando é desenhada: a aura no chão, a Concha atrás (de costas, na frente)', () => {
    const concha = ['concha-longa', 'caldo-da-mamae']
    const down = getAppearanceLayers(concha, walkPose('down', 0))
    assert.equal(findLayer(down, 'concha-longa').position, 'atras')
    assert.equal(findLayer(down, 'caldo-da-mamae').position, 'aura')
    assert.equal(findLayer(getAppearanceLayers(concha, walkPose('up', 0)), 'concha-longa').position, 'frente')
  })

  test('o Chifre fica no lado esquerdo da cabeça: virado para a direita, esse lado fica atrás da cabeça', () => {
    const horn = (direction) => findLayer(getAppearanceLayers(['chifre-da-sorte'], walkPose(direction, 0)), 'chifre-da-sorte')
    assert.equal(horn('right').position, 'atras')
    for (const direction of ['down', 'left', 'up']) assert.equal(horn(direction).position, 'frente', direction)
  })

  test('a pose de verdade (getPlayerPose) andando dá o deslocamento do quadro da caminhada', () => {
    const player = { x: 0, y: 0, direction: 'up', walkDistance: 25 }
    const pose = getPlayerPose(player)
    assert.notEqual(pose.frame, 0)
    const chifre = findLayer(getAppearanceLayers(visible, pose), 'chifre-da-sorte')
    assert.deepEqual(chifre.offset, APPEARANCE_ANCHORS.up.walk[pose.frame].head)
  })
})
