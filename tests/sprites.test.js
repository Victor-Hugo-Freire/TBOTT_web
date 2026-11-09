import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { describe, test } from 'node:test'
import { APPEARANCE_ANCHORS, APPEARANCE_DRAW_ORDER, APPEARANCE_SPRITES } from '../src/data/appearanceSprites.js'
import { BOSS_SPRITES } from '../src/data/bossSprites.js'
import { CHARACTER_SPRITES } from '../src/data/characterSprites.js'
import { EFFECT_SPRITES } from '../src/data/effectSprites.js'
import { ENEMY_SPRITES } from '../src/data/enemySprites.js'
import { CONSUMABLE_SPRITES, ITEM_SPRITES } from '../src/data/itemSprites.js'
import { PEDESTAL_SPRITES } from '../src/data/roomSprites.js'
import { UI_SPRITES } from '../src/data/uiSprites.js'

const publicFile = (src) => new URL(`../public${src}`, import.meta.url)

// Largura e altura de um PNG, lidas do cabeçalho (bytes 16 a 23)
function pngSize(src) {
  const bytes = readFileSync(publicFile(src))
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) }
}

// Todas as folhas com grade: inimigos e chefes (uma por camada), itens e consumíveis (e as variantes), efeitos
const characters = [...Object.values(ENEMY_SPRITES), ...Object.values(BOSS_SPRITES)]
const items = [...Object.values(ITEM_SPRITES), ...Object.values(CONSUMABLE_SPRITES)]
const sheets = [
  ...characters.flatMap((sprite) => Object.values(sprite.layers).map((src) => ({ ...sprite, path: src }))),
  ...items.flatMap((item) => [item, ...Object.values(item.variants)]),
  ...Object.values(EFFECT_SPRITES),
]
// Imagens paradas, sem grade
const stills = [...Object.values(PEDESTAL_SPRITES), ...Object.values(UI_SPRITES)]

describe('sprites de inimigos, chefes, itens, efeitos, salas e HUD', () => {
  test('o elenco tem 10 inimigos, 8 chefes (com o final), 12 itens e 2 consumíveis', () => {
    assert.equal(Object.keys(ENEMY_SPRITES).length, 10)
    assert.equal(Object.keys(BOSS_SPRITES).length, 8)
    assert.ok(BOSS_SPRITES['tralalero-tralala'])
    assert.equal(Object.keys(ITEM_SPRITES).length, 12)
    assert.deepEqual(Object.keys(CONSUMABLE_SPRITES), ['garfo', 'grao-de-cafe'])
  })

  test('os ids são únicos, em kebab-case e iguais à chave e ao nome do arquivo', () => {
    const groups = [ENEMY_SPRITES, BOSS_SPRITES, ITEM_SPRITES, CONSUMABLE_SPRITES, EFFECT_SPRITES, UI_SPRITES]
    const ids = [...groups.flatMap((group) => Object.entries(group)), ...Object.values(PEDESTAL_SPRITES).map((p) => [p.id, p])]
      .flatMap(([key, sprite]) => [[key, sprite], ...Object.values(sprite.variants ?? {}).map((v) => [v.id, v])])
    for (const [key, sprite] of ids) {
      assert.equal(sprite.id, key)
      assert.match(sprite.id, /^[a-z0-9]+(-[a-z0-9]+)*$/)
      const files = sprite.layers ? Object.values(sprite.layers) : [sprite.path]
      for (const file of files) assert.ok(file.split('/').at(-1).startsWith(sprite.id), file)
    }
    const all = ids.map(([id]) => id)
    assert.equal(new Set(all).size, all.length)
  })

  test('cada folha existe e tem o tamanho da grade (quadro x quadros por linha x linhas usadas)', () => {
    for (const sheet of sheets) {
      const rows = Math.max(...Object.values(sheet.animations).map((a) => a.row)) + 1
      assert.deepEqual(pngSize(sheet.path), {
        width: sheet.frameWidth * sheet.framesPerRow,
        height: sheet.frameHeight * rows,
      }, sheet.path)
    }
  })

  test('as animações usam linhas e quadros que existem e têm uma duração por quadro', () => {
    for (const sheet of sheets) {
      const rows = pngSize(sheet.path).height / sheet.frameHeight
      for (const [name, anim] of Object.entries(sheet.animations)) {
        const label = `${sheet.id}.${name}`
        assert.ok(Number.isInteger(anim.row) && anim.row >= 0 && anim.row < rows, label)
        assert.ok(anim.frames >= 1 && anim.frames <= sheet.framesPerRow, label)
        assert.equal(anim.durations.length, anim.frames, label)
        assert.ok(anim.durations.every((ms) => ms > 0), label)
        for (const frame of anim.hitFrames ?? []) assert.ok(frame >= 0 && frame < anim.frames, label)
        if (anim.emits) {
          assert.ok(anim.emits.frame >= 0 && anim.emits.frame < anim.frames, label)
          assert.ok(EFFECT_SPRITES[anim.emits.effect], `${label} emite ${anim.emits.effect}`)
        }
      }
    }
  })

  test('as duas camadas (pernas e tronco) têm o mesmo tamanho e os pés ficam dentro da célula', () => {
    for (const sprite of characters) {
      assert.deepEqual(pngSize(sprite.layers.pernas), pngSize(sprite.layers.tronco), sprite.id)
      assert.ok(sprite.feetX > 0 && sprite.feetX < sprite.frameWidth, sprite.id)
      assert.ok(sprite.feetPadding >= 0 && sprite.feetPadding < sprite.frameHeight, sprite.id)
    }
  })

  test('ícones, HUD e pedestais existem; HUD e pedestais têm o tamanho declarado', () => {
    for (const item of items) assert.ok(existsSync(publicFile(item.icon)), item.icon)
    for (const still of stills) {
      assert.deepEqual(pngSize(still.path), { width: still.frameWidth, height: still.frameHeight }, still.path)
    }
  })

  test('na tela (depois da escala), o pedestal tem a célula e os pés das folhas dos itens', () => {
    const onScreen = (s) => [s.frameWidth, s.frameHeight, s.feetX, s.feetPadding].map((v) => v * s.scale)
    for (const item of Object.values(ITEM_SPRITES)) {
      for (const pedestal of Object.values(PEDESTAL_SPRITES)) {
        assert.deepEqual(onScreen(pedestal), onScreen(item), `${item.id} / ${pedestal.id}`)
      }
    }
  })

  test('aparência do Tung: cada camada é de um item que existe, tem a célula do tronco e uma posição de desenho válida', () => {
    const walk = CHARACTER_SPRITES.tungTungSahurAndar
    for (const [id, item] of Object.entries(APPEARANCE_SPRITES)) {
      assert.ok(ITEM_SPRITES[id], id)
      assert.ok(['cabeca', 'costas', 'bastao', 'aura'].includes(item.slot), id)
      assert.deepEqual(Object.keys(item.layers), Object.keys(walk.rows), id)
      for (const layer of Object.values(item.layers)) {
        if (!layer) continue // a camada não aparece nessa direção
        assert.deepEqual(pngSize(layer.path), { width: walk.frameWidth, height: walk.frameHeight }, layer.path)
        assert.ok(APPEARANCE_DRAW_ORDER.includes(layer.position) && !['pernas', 'tronco'].includes(layer.position), layer.path)
      }
    }
  })

  test('aparência do Tung: as âncoras têm um valor por quadro do andar, do golpe e do dano', () => {
    const { tungTungSahurAndar: walk, tungTungSahurAtaque: attack, tungTungSahurDano: hurt } = CHARACTER_SPRITES
    assert.deepEqual(Object.keys(APPEARANCE_ANCHORS), Object.keys(walk.rows))
    for (const anchors of Object.values(APPEARANCE_ANCHORS)) {
      assert.equal(anchors.walk.length, walk.framesPerRow)
      assert.equal(anchors.attackHead.length, attack.framesPerRow)
      assert.equal(anchors.hurtHead.length, hurt.framesPerRow)
      assert.deepEqual(anchors.walk[0].head, [0, 0]) // o deslocamento é em relação ao quadro 0, onde a camada foi desenhada
    }
  })

  test('as folhas @1x (scale 3) são desenhadas 3x maiores; as outras, no tamanho do arquivo', () => {
    for (const sprite of [...sheets, ...stills]) assert.ok([1, 3].includes(sprite.scale), sprite.id)
    assert.equal(BOSS_SPRITES['tralalero-tralala'].frameWidth * BOSS_SPRITES['tralalero-tralala'].scale, 840)
  })
})
