import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { createEnemy } from '../src/utils/enemies.js'
import { generateFloor } from '../src/utils/floorGenerator.js'
import { createPlayer } from '../src/utils/player.js'
import { createRun, updateRun } from '../src/utils/run.js'
import { TEST_CATALOG, TEST_ENEMIES } from './helpers/testCatalog.js'

// Os itens que acertam vários alvos, agora em inimigos de verdade (antes, só no alvo de treino do F3):
// golpes reais pela updateRun, numa sala comum sem obstáculos, com os inimigos parados onde o teste quer.

const STEP = 1 / 50 // 20 ms
const IDLE = { movement: { x: 0, y: 0 }, attackDirection: null }
const TUNG = { x: 700, y: 560 }

// Um inimigo do catálogo de teste em (x, y), parado (esperando) e com id próprio
function enemyAt(id, x, y, name) {
  return { ...createEnemy(TEST_ENEMIES[id], 0, 0), id: name, x, y, waitMs: 1e9 }
}

// Run numa sala comum sem obstáculos, com os itens e os inimigos pedidos e o Tung em TUNG
function runWith(items, enemies) {
  const room = generateFloor(1, 1).rooms.find((one) => one.type === 'comum')
  const run = createRun({ seed: 1, roomId: room.id, characterId: 'tung-tung-sahur', catalog: TEST_CATALOG, items })
  run.obstacles = []
  run.player = createPlayer(TUNG)
  return { ...run, targets: enemies }
}

// Um golpe inteiro: aperta a seta num quadro e espera o golpe acabar
function swing(run, direction = 'right') {
  run = updateRun(run, { movement: { x: 0, y: 0 }, attackDirection: direction }, STEP)
  while (run.player.attack) run = updateRun(run, IDLE, STEP)
  return run
}

function swings(run, count, direction) {
  for (let i = 0; i < count; i++) run = swing(run, direction)
  return run
}

const byId = (run, id) => run.targets.find((target) => target.id === id)

describe('itens de vários alvos em inimigos', () => {
  test('Elixir Elétrico: no 3º golpe seguido, o raio salta do inimigo golpeado para o que está perto', () => {
    const front = enemyAt('moka-scudiera', TUNG.x + 100, TUNG.y, 'frente') // na caixa do golpe, sem encostar no Tung
    const near = enemyAt('moka-scudiera', TUNG.x + 210, TUNG.y, 'perto') // a 110 u do golpeado, fora do golpe
    let run = swings(runWith(['elixir-eletrico'], [front, near]), 2)
    assert.equal(byId(run, 'perto').health, near.maxHealth, 'os 2 primeiros golpes não chegam nele')
    assert.ok(byId(run, 'frente').health < front.maxHealth, 'o da frente levou os golpes')
    run = swing(run)
    assert.equal(byId(run, 'perto').health, near.maxHealth - TEST_CATALOG['elixir-eletrico'].effect.chainDamage)
  })

  test('Batuta do Maestro: 4 golpes seguidos no ritmo soltam a onda, que acerta quem está fora do golpe', () => {
    const behind = enemyAt('moka-scudiera', TUNG.x, TUNG.y + 70, 'atras') // embaixo do Tung, a 70 u: o golpe para cima não chega
    let run = swings(runWith(['batuta-do-maestro'], [behind]), 4, 'up')
    assert.equal(byId(run, 'atras').health, behind.maxHealth, 'o golpe para cima não chega nele')
    run = swing(run, 'up') // o 1º golpe não está no ritmo (não há anterior): a onda sai no começo do 5º
    assert.equal(byId(run, 'atras').health, behind.maxHealth - 3, 'a onda tira o dano do golpe (3)')
  })

  test('Palitos de Pão: o 4º golpe empurra para longe quem está perto, mesmo fora do golpe', () => {
    const behind = enemyAt('cannolo-carica', TUNG.x, TUNG.y + 60, 'atras') // a 60 u (pushRange), embaixo do Tung
    let run = swings(runWith(['palitos-de-pao'], [behind]), 3, 'up')
    assert.equal(byId(run, 'atras').y, behind.y)
    run = swing(run, 'up')
    assert.ok(byId(run, 'atras').y > behind.y + 40, `empurrado para baixo (y ${Math.round(byId(run, 'atras').y)})`)
  })

  test('Dente de Tubarão: um abate de verdade soma uma carga do frenesi', () => {
    const fly = enemyAt('zanzarina-tarantella', TUNG.x + 100, TUNG.y, 'mosca') // vida 5: dois golpes
    let run = swing(runWith(['dente-de-tubarao'], [fly]))
    assert.equal(byId(run, 'mosca').health, 2)
    assert.equal(run.effects.frenzyStacks, 0)
    run = swing(run)
    assert.equal(byId(run, 'mosca').dead, true)
    assert.equal(run.effects.frenzyStacks, 1)
  })
})
