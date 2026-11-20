import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import {
  createItemEffects,
  getItemBonuses,
  isInSaucePuddle,
  MAX_PUDDLES,
  onGrainCollected,
  onKills,
  updatePuddles,
} from '../src/utils/itemEffects.js'
import { createPlayer } from '../src/utils/player.js'
import { PLAYER_FEET_BOX } from '../src/utils/roomMovement.js'
import { createRun, createRunSnapshot, getRunStats, toggleTrainingTarget, updateRun } from '../src/utils/run.js'
import { createTrainingTarget } from '../src/utils/targets.js'
import { TEST_CATALOG } from './helpers/testCatalog.js'

const STEP = 1 / 20
const STEP_MS = 50
const IDLE = { movement: { x: 0, y: 0 }, attackDirection: null }

function steps(run, count, input = IDLE) {
  for (let i = 0; i < count; i++) run = updateRun(run, input, STEP)
  return run
}

// Run na sala inicial (vazia) com os itens pedidos
function runWith(items, fields = {}) {
  return createRun({ seed: 1, characterId: 'x', catalog: TEST_CATALOG, items, ...fields })
}

// Run com o alvo de treino e o Tung logo abaixo dele (o golpe para cima acerta)
function runWithTarget(items, fields = {}) {
  const run = toggleTrainingTarget(runWith(items, fields))
  const target = run.targets[0]
  run.player = createPlayer({ x: target.x, y: target.y + 45 })
  return run
}

// Um golpe inteiro: aperta a seta (apertada de novo, não segurada) e espera o golpe acabar
function swing(run, direction = 'up') {
  run = updateRun(run, { movement: { x: 0, y: 0 }, attackDirection: direction }, STEP)
  while (run.player.attack) run = updateRun(run, IDLE, STEP)
  return run
}

// Chapa quente montada à mão, com os pés do Tung encostados nela
const HOT_PLATE = { id: 'chapa', col: 0, row: 0, kind: 'chapa', mechanic: 'quente', blocking: true, box: { x: 900, y: 500, width: 84, height: 60 } }
const TOUCHING_PLATE = { x: 900 - PLAYER_FEET_BOX.width / 2, y: 540 }

function onHotPlate(run) {
  run.obstacles = [HOT_PLATE]
  run.player = createPlayer(TOUCHING_PLATE)
  return run
}

describe('Café Duplo', () => {
  test('sempre anda um pouco mais rápido (speedMultiplier)', () => {
    assert.equal(getRunStats(runWith([])).moveSpeed, 1)
    assert.equal(getRunStats(runWith(['cafe-duplo'])).moveSpeed, 1.05)
  })

  test('ao levar dano, corre boostSpeedMultiplier mais rápido por boostDurationMs', () => {
    let run = updateRun(onHotPlate(runWith(['cafe-duplo'])), IDLE, STEP)
    assert.ok(run.player.hurt)
    assert.ok(Math.abs(getRunStats(run).moveSpeed - 1.05 * 1.4) < 1e-9)
    run.obstacles = [] // sai da chapa
    run = steps(run, 3000 / STEP_MS - 2)
    assert.ok(run.effects.coffeeBoostMs > 0, 'ainda correndo antes de 3 s')
    run = steps(run, 3)
    assert.equal(getRunStats(run).moveSpeed, 1.05)
  })
})

describe('Parmesão Curado', () => {
  test('o golpe que acerta solta 3 lascas em leque, cada uma com shardDamage no alvo', () => {
    const run = swing(runWithTarget(['parmesao-curado']))
    // 3 do golpe + 3 lascas de 1
    assert.equal(run.targets[0].health, 30 - 3 - 3)
    assert.deepEqual(run.shards, [], 'as lascas somem depois de acertar')
  })

  test('golpe que não acerta nada não solta lascas', () => {
    const run = updateRun(runWith(['parmesao-curado']), { movement: { x: 0, y: 0 }, attackDirection: 'up' }, STEP)
    const later = steps(run, 6)
    assert.deepEqual(later.shards, [])
    assert.equal(later.swing.shardsFired, false)
  })
})

describe('Concha Longa', () => {
  test('todo golpe deixa uma poça (acertando ou não), que some em puddleDurationMs', () => {
    let run = swing(runWith(['concha-longa']), 'down')
    assert.equal(run.puddles.length, 1)
    run = steps(run, 2000 / STEP_MS + 1)
    assert.deepEqual(run.puddles, [])
  })

  test('no máximo MAX_PUDDLES poças ao mesmo tempo (a mais velha some)', () => {
    // poças de 10 s, para 4 golpes (cerca de 2,6 s) caberem antes de alguma sumir
    const catalog = { ...TEST_CATALOG, 'concha-longa': { ...TEST_CATALOG['concha-longa'], effect: { puddleDurationMs: 10000, enemySpeedMultiplier: 0.5 } } }
    let run = runWith(['concha-longa'], { catalog })
    for (let i = 0; i < 4; i++) run = swing(run, 'down')
    assert.equal(run.puddles.length, MAX_PUDDLES)
  })

  test('alvo dentro da poça fica lento (enemySpeedMultiplier); fora, não', () => {
    const inside = createTrainingTarget({ x: 500, y: 500 })
    const outside = createTrainingTarget({ x: 700, y: 500 })
    const run = { ...runWith(['concha-longa']), puddles: [{ x: 500, y: 505, ms: 2000, ageMs: 0 }], targets: [inside, outside] }
    assert.equal(isInSaucePuddle(run.puddles[0], inside), true)
    const next = updatePuddles(run, STEP_MS)
    assert.equal(next.targets[0].slowMultiplier, 0.5)
    assert.ok(next.targets[0].slowMs > 0)
    assert.equal(next.targets[1].slowMs, 0)
  })
})

describe('Palitos de Pão', () => {
  test('o 4º golpe é mais rápido (attackSpeedBonus) e empurra os alvos a até pushRange', () => {
    let run = runWithTarget(['palitos-de-pao'])
    for (let i = 0; i < 3; i++) run = swing(run)
    const home = run.targets[0].y
    run = updateRun(run, { movement: { x: 0, y: 0 }, attackDirection: 'up' }, STEP)
    assert.equal(run.effects.swingCount, 4)
    assert.equal(run.swing.fast, true)
    assert.ok(Math.abs(getRunStats(run).attackSpeed - 1.4) < 1e-9)
    run = steps(run, 6)
    assert.ok(run.targets[0].y < home - 30, `o alvo foi empurrado para longe (y ${run.targets[0].y})`)
  })

  test('os golpes 1 a 3 são normais, e o bônus some quando o 4º acaba', () => {
    let run = runWithTarget(['palitos-de-pao'])
    run = updateRun(run, { movement: { x: 0, y: 0 }, attackDirection: 'up' }, STEP)
    assert.equal(run.swing.fast, false)
    for (let i = 0; i < 4; i++) run = swing(run)
    assert.equal(getRunStats(run).attackSpeed, 1)
  })
})

describe('Muçarela', () => {
  test('o golpe que acerta prende o alvo por stunDurationMs', () => {
    let run = updateRun(runWithTarget(['mucarela']), { movement: { x: 0, y: 0 }, attackDirection: 'up' }, STEP)
    while (!run.swing.hitAny) run = updateRun(run, IDLE, STEP)
    assert.ok(run.targets[0].stunMs > 700 && run.targets[0].stunMs <= 800)
    assert.ok(run.flashes.some((flash) => flash.variant === 'fios-de-queijo'))
  })
})

describe('Tiramisu', () => {
  test('pegar um grão deixa o golpe attackSpeedBonus mais rápido por bonusDurationMs (renova)', () => {
    let run = onGrainCollected(runWith(['tiramisu']))
    assert.ok(Math.abs(getRunStats(run).attackSpeed - 1.25) < 1e-9)
    run = steps(run, 2000 / STEP_MS + 1)
    assert.equal(getRunStats(run).attackSpeed, 1)
    assert.equal(onGrainCollected(runWith([])).effects.sugarMs, 0, 'sem o item, nada')
  })
})

describe('Rolo de Bronze', () => {
  test('o golpe que acerta empurra o alvo pushDistance na direção do golpe', () => {
    const run = swing(runWithTarget(['rolo-de-bronze']))
    const target = run.targets[0]
    assert.ok(Math.abs(target.y - (target.home.y - 120)) < 1e-6, `y ${target.y}`)
    assert.equal(target.health, 27, 'sem parede no caminho, só o dano do golpe')
  })

  test('batendo na parede, o alvo leva wallExtraDamage a mais e aparece o impacto', () => {
    let run = runWith(['rolo-de-bronze'])
    run.targets = [createTrainingTarget({ x: 800, y: 320 })] // perto da parede de cima
    run.player = createPlayer({ x: 800, y: 365 })
    run = updateRun(run, { movement: { x: 0, y: 0 }, attackDirection: 'up' }, STEP)
    let sawImpact = false
    while (run.player.attack) {
      run = updateRun(run, IDLE, STEP)
      if (run.flashes.some((flash) => flash.variant === 'impacto-de-bronze')) sawImpact = true
    }
    assert.equal(run.targets[0].health, 30 - 3 - 2)
    assert.ok(sawImpact)
  })
})

describe('Batuta do Maestro', () => {
  test('golpe apertado até rhythmWindowMs depois do anterior está no ritmo (+extraDamage); 4 seguidos soltam a onda', () => {
    let run = swing(runWithTarget(['batuta-do-maestro'])) // o 1º não tem anterior: fora do ritmo
    assert.equal(run.targets[0].health, 27)
    for (let i = 0; i < 3; i++) run = swing(run) // 2º, 3º e 4º golpes: no ritmo, 4 de dano cada
    assert.equal(run.effects.rhythmCombo, 3)
    assert.equal(run.targets[0].health, 27 - 12)
    run = swing(run) // 5º: o 4º seguido no ritmo solta a onda (3) e ainda acerta (4)
    assert.equal(run.effects.rhythmCombo, 0)
    assert.equal(run.targets[0].health, 15 - 3 - 4)
  })

  test('segurar a seta (sem apertar de novo) ou demorar não conta como ritmo', () => {
    let run = runWithTarget(['batuta-do-maestro'])
    run = steps(run, 60, { movement: { x: 0, y: 0 }, attackDirection: 'up' }) // segurando: 3 golpes ou mais
    assert.equal(run.effects.rhythmCombo, 0)
    run = steps(run, 10) // solta e espera 500 ms
    run = swing(run)
    assert.equal(run.effects.rhythmCombo, 0)
  })
})

describe('Dente de Tubarão', () => {
  test('alvo com metade da vida ou menos leva o dano vezes lowHealthDamageMultiplier', () => {
    let run = runWithTarget(['dente-de-tubarao'])
    run.targets = [{ ...run.targets[0], health: 15 }]
    run = updateRun(run, { movement: { x: 0, y: 0 }, attackDirection: 'up' }, STEP)
    while (!run.swing.hitAny) run = updateRun(run, IDLE, STEP)
    assert.equal(run.targets[0].health, 15 - 6)
    assert.ok(run.flashes.some((flash) => flash.variant === 'mordida'))
  })

  test('cada abate soma uma carga do frenesi (até maxStacks), que some depois de bonusDurationMs', () => {
    let run = onKills(runWith(['dente-de-tubarao']), 1)
    assert.ok(Math.abs(getRunStats(run).attackSpeed - 1.15) < 1e-9)
    run = onKills(run, 5)
    assert.equal(run.effects.frenzyStacks, 3)
    assert.ok(Math.abs(getRunStats(run).attackSpeed - 1.45) < 1e-9)
    run = steps(run, 4000 / STEP_MS + 1)
    assert.equal(run.effects.frenzyStacks, 0)
  })

  test('o golpe que mata o alvo de treino liga o frenesi', () => {
    let run = runWithTarget(['dente-de-tubarao'])
    run.targets = [{ ...run.targets[0], health: 3 }]
    run = swing(run)
    assert.equal(run.roomKills, 1)
    assert.equal(run.effects.frenzyStacks, 1)
  })
})

describe('Caldo da Mamãe', () => {
  test('com alvo vivo na sala, o escudo anula o próximo dano (sem animação de dano e sem disparar o Café)', () => {
    let run = runWithTarget(['caldo-da-mamae', 'cafe-duplo'])
    assert.equal(run.effects.shieldHits, 1)
    run = updateRun(onHotPlate(run), IDLE, STEP)
    assert.equal(run.health, 6)
    assert.equal(run.effects.shieldHits, 0)
    assert.equal(run.player.hurt, null)
    assert.ok(run.player.invincibleMs > 0)
    assert.equal(run.effects.coffeeBoostMs, 0)
    // depois da invencibilidade, o próximo dano vale
    run = steps(run, 1000 / STEP_MS + 1)
    assert.equal(run.health, 5)
  })

  test('sala sem alvo vivo não arma o escudo', () => {
    assert.equal(runWith(['caldo-da-mamae']).effects.shieldHits, 0)
  })

  test('com a vida em healAtHealth ou menos, cura healAmount uma vez por andar (e isso vai para o save)', () => {
    let run = updateRun(onHotPlate(runWith(['caldo-da-mamae'], { health: 3 })), IDLE, STEP)
    assert.equal(run.health, 6, '3 - 1 = 2, e o colo de mãe cura 4')
    assert.equal(run.effects.floorHealsUsed, 1)
    assert.equal(createRunSnapshot(run, 0).floorHealsUsed, 1)
    run = { ...run, health: 3, player: createPlayer(TOUCHING_PLATE) }
    run = updateRun(run, IDLE, STEP)
    assert.equal(run.health, 2, 'a cura do andar já foi usada')
  })

  test('as curas usadas no andar voltam do save', () => {
    assert.equal(runWith(['caldo-da-mamae'], { floorHealsUsed: 1 }).effects.floorHealsUsed, 1)
  })
})

describe('Elixir Elétrico', () => {
  // Alvos a mais em volta do alvo de treino, para o raio saltar
  function withExtraTargets(run, offsets) {
    const main = run.targets[0]
    const extras = offsets.map((dx, index) => ({ ...createTrainingTarget({ x: main.x + dx, y: main.y }), id: `extra-${index}` }))
    return { ...run, targets: [main, ...extras] }
  }

  test('o 3º golpe seguido que acerta dá extraDamage e solta o raio em até chainTargets alvos a até chainRange', () => {
    // dois alvos perto (100 e -110 u) e um longe (200 u): o raio pega os dois de perto
    let run = withExtraTargets(runWithTarget(['elixir-eletrico']), [100, -110, 200])
    run = swing(swing(run))
    assert.equal(run.effects.hitStreak, 2)
    run = swing(run)
    assert.equal(run.targets[0].health, 30 - 3 - 3 - 5)
    assert.deepEqual(run.targets.slice(1).map((target) => target.health), [29, 29, 30])
    assert.equal(run.effects.hitStreak, 0, 'depois do raio, a contagem recomeça')
  })

  test('errar um golpe no meio zera a sequência', () => {
    let run = swing(swing(runWithTarget(['elixir-eletrico'])))
    run = swing(run, 'down') // golpe para baixo: não acerta o alvo
    assert.equal(run.effects.hitStreak, 0)
  })
})

describe('bônus de velocidade do golpe de itens diferentes', () => {
  test('somam (Tiramisu + Palitos + Dente com 3 cargas) e respeitam o limite', () => {
    const run = runWith(['tiramisu', 'palitos-de-pao', 'dente-de-tubarao'])
    run.effects = { ...createItemEffects(), sugarMs: 1000, frenzyStacks: 3, frenzyMs: 1000 }
    run.swing = { ...run.swing, fast: true }
    run.player = { ...run.player, attack: { direction: 'up', elapsed: 0 } }
    const bonuses = getItemBonuses(run).filter((bonus) => bonus.stat === 'attackSpeed')
    assert.equal(bonuses.length, 3)
    assert.equal(getRunStats(run).attackSpeed, 2, '1 + 0,25 + 0,4 + 0,45 = 2,1, mas o limite é 2')
  })
})
