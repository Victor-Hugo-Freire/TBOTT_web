import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { PEPERONCINO } from '../src/data/enemyBehavior.js'
import { createEnemy, updateEnemies } from '../src/utils/enemies.js'
import { createChaseMap, getCellAt, getChasePoint, hasClearPath } from '../src/utils/enemyPath.js'
import { getCellPoint, getCellRect } from '../src/utils/roomLayout.js'
import { ROOM_WALLS } from '../src/utils/roomMovement.js'
import { TEST_ENEMIES } from './helpers/testCatalog.js'

const STEP = 1 / 50 // 20 ms

// Caixa sólida de um obstáculo na casa (84 x 60 no meio dela, como em roomLayout.js)
function obstacle(col, row) {
  const rect = getCellRect(col, row)
  return { x: rect.x + (rect.width - 84) / 2, y: rect.y + (rect.height - 60) / 2, width: 84, height: 60 }
}

// Parede de obstáculos na coluna 6, das linhas 1 a 5: só dá para passar por cima (linha 0) ou por baixo (linha 6)
const WALL = [1, 2, 3, 4, 5].map((row) => obstacle(6, row))
const SOLIDS = [...ROOM_WALLS, ...WALL]
const LEFT = getCellPoint(3, 3)
const RIGHT = getCellPoint(9, 3)

function step(enemy, player, solids) {
  const world = { player, solids, deltaSeconds: STEP, hits: [], flashes: [], floor: [] }
  return { enemy: updateEnemies([enemy], world)[0], world }
}

describe('caminho reto', () => {
  test('a casa de um ponto', () => {
    assert.deepEqual(getCellAt(getCellPoint(4, 2)), { col: 4, row: 2 })
    assert.deepEqual(getCellAt({ x: -50, y: 9999 }), { col: 0, row: 6 }, 'fora do piso, a casa da borda')
  })

  test('livre numa sala vazia, bloqueado com a parede no meio', () => {
    assert.equal(hasClearPath(LEFT, RIGHT, ROOM_WALLS), true)
    assert.equal(hasClearPath(LEFT, RIGHT, SOLIDS), false)
  })
})

describe('mapa de distâncias (busca em largura)', () => {
  test('conta as casas até o Tung dando a volta na parede', () => {
    const map = createChaseMap(SOLIDS, RIGHT)
    assert.equal(map[3][9], 0)
    assert.equal(map[3][6], Infinity, 'a casa do obstáculo não entra')
    // da (3,3) até a (9,3) dando a volta pela linha 0 ou 6: 3 para cima, 6 para o lado, 3 para baixo
    assert.equal(map[3][3], 12)
  })

  test('com o caminho bloqueado, o inimigo vai para a casa vizinha mais perto; com ele livre, direto', () => {
    const map = createChaseMap(SOLIDS, RIGHT)
    const next = getCellAt(getChasePoint(LEFT, RIGHT, map, SOLIDS))
    assert.equal(Math.abs(next.col - 3) + Math.abs(next.row - 3), 1, 'uma casa vizinha')
    assert.equal(map[next.row][next.col], 11, 'uma casa mais perto do Tung')
    assert.deepEqual(getChasePoint(LEFT, RIGHT, createChaseMap(ROOM_WALLS, RIGHT), ROOM_WALLS), RIGHT)
  })
})

describe('inimigos desviam dos obstáculos', () => {
  test('o Formaggino atrás da parede dá a volta e chega para atacar', () => {
    let enemy = { ...createEnemy(TEST_ENEMIES['formaggino-saltellino'], 3, 3), waitMs: 0 }
    for (let time = 0; time < 10000 && enemy.animation !== 'atacando'; time += 20) enemy = step(enemy, RIGHT, SOLIDS).enemy
    assert.equal(enemy.animation, 'atacando', 'chegou perto do Tung')
    assert.ok(enemy.x > 800, `passou da parede (${Math.round(enemy.x)})`)
  })

  test('o Cannolo não investe com um obstáculo no meio: primeiro contorna', () => {
    let enemy = { ...createEnemy(TEST_ENEMIES['cannolo-carica'], 5, 3), waitMs: 0 }
    enemy = step(enemy, getCellPoint(8, 3), SOLIDS).enemy // a 3 casas, dentro do alcance, mas atrás da parede
    assert.equal(enemy.animation, 'andando')
  })
})

describe('Peperoncino aceso', () => {
  test('aceso, corre litSpeedMultiplier vezes mais rápido atrás do Tung', () => {
    const player = { x: 1400, y: 525 }
    const walking = { ...createEnemy(TEST_ENEMIES['peperoncino-kamikaze'], 2, 3), waitMs: 0 }
    const lit = { ...walking, animation: 'aceso', animationMs: 0 }
    let a = walking
    let b = lit
    for (let i = 0; i < 10; i++) {
      a = step(a, player, ROOM_WALLS).enemy
      b = step(b, player, ROOM_WALLS).enemy
    }
    const ratio = (b.x - lit.x) / (a.x - walking.x)
    assert.ok(Math.abs(ratio - PEPERONCINO.litSpeedMultiplier) < 0.01, `${ratio}`)
  })

  test('a explosão acerta a até blastRadius e o desenho cresce para mostrar essa área', () => {
    const enemy = { ...createEnemy(TEST_ENEMIES['peperoncino-kamikaze'], 6, 3), waitMs: 0, animation: 'atacando', animationMs: 120 }
    const near = { x: enemy.x + PEPERONCINO.blastRadius - 5, y: enemy.y }
    const { world } = step(enemy, near, ROOM_WALLS)
    assert.equal(world.hits.length, 1)
    assert.equal(world.flashes[0].scale, PEPERONCINO.blastScale)
    const far = { x: enemy.x + PEPERONCINO.blastRadius + 5, y: enemy.y }
    assert.equal(step(enemy, far, ROOM_WALLS).world.hits.length, 0)
  })
})
