import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import {
  createItemEffects,
  getItemBonuses,
  isInSaucePuddle,
  MAX_PUDDLES,
  onKills,
  SHIELD_BREAK_MS,
  updatePuddles,
  updateShards,
} from '../src/utils/itemEffects.js'
import { createPlayer } from '../src/utils/player.js'
import { PLAYER_FEET_BOX, ROOM_FLOOR } from '../src/utils/roomMovement.js'
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

  test('as lascas voam até a parede: um alvo do outro lado da sala, na direção do golpe, também leva o dano', () => {
    let run = runWithTarget(['parmesao-curado'])
    const near = run.targets[0]
    // o alvo de perto leva 1 golpe e fica com pouca vida; a lasca do meio passa direto se ele morrer antes
    const far = { ...createTrainingTarget({ x: near.x, y: ROOM_FLOOR.top + 140 }), id: 'longe' }
    run.targets = [{ ...near, health: 3 }, far]
    run = swing(run)
    assert.equal(run.targets[0].dead, true)
    assert.ok(run.targets[1].health < 30, `o alvo longe (${near.y - far.y} u) levou ${30 - run.targets[1].health} de dano`)
    assert.deepEqual(run.shards, [])
  })

  test('sem alvo no caminho, a lasca voa e some na parede', () => {
    // lasca montada à mão no meio da sala, subindo
    let run = { ...runWith(['parmesao-curado']), shards: [{ x: 800, y: 600, vx: 0, vy: -900 }] }
    run = updateShards(run, STEP)
    assert.equal(run.shards.length, 1, 'ainda no ar')
    assert.ok(run.shards[0].y < 600)
    for (let i = 0; i < 20; i++) run = updateShards(run, STEP) // 1 s: dá para cruzar a sala
    assert.deepEqual(run.shards, [], 'sumiu na parede de cima')
  })

  test('a lasca some ao bater num obstáculo sólido', () => {
    const shard = { x: 800, y: 600, vx: 0, vy: -900 }
    const box = { x: 780, y: 520, width: 40, height: 40 } // logo acima da lasca
    const run = { ...runWith(['parmesao-curado']), shards: [shard] }
    let blocked = run
    let free = run
    for (let i = 0; i < 3; i++) {
      blocked = updateShards(blocked, STEP, [box])
      free = updateShards(free, STEP, [])
    }
    assert.deepEqual(blocked.shards, [], 'bateu na caixa')
    assert.equal(free.shards.length, 1, 'sem a caixa, continua voando')
  })

  test('dentro da run, os obstáculos que bloqueiam param as lascas', () => {
    const barrel = { id: 'barril', col: 0, row: 0, kind: 'barril', mechanic: 'solido', blocking: true, box: { x: 780, y: 420, width: 40, height: 40 } }
    const base = { ...runWith(['parmesao-curado']), shards: [{ x: 800, y: 600, vx: 0, vy: -900 }] }
    const withBarrel = steps({ ...base, obstacles: [barrel] }, 6) // 300 ms: a lasca subiria 270 u
    const without = steps({ ...base, obstacles: [] }, 6)
    assert.deepEqual(withBarrel.shards, [])
    assert.equal(without.shards.length, 1)
  })

  test('golpe que não acerta nada também solta as 3 lascas, uma vez só por golpe', () => {
    let run = updateRun(runWith(['parmesao-curado']), { movement: { x: 0, y: 0 }, attackDirection: 'up' }, STEP)
    while (!run.swing.shardsFired) run = updateRun(run, IDLE, STEP)
    assert.equal(run.shards.length, 3)
    assert.ok(run.shards.every((shard) => shard.vy < 0), 'todas para cima, na direção do golpe')
    let most = run.shards.length
    while (run.player.attack) {
      run = updateRun(run, IDLE, STEP)
      most = Math.max(most, run.shards.length)
    }
    assert.equal(most, 3, 'a caixa fica vários quadros, mas solta uma vez só')
    assert.equal(swing(runWith([])).shards.length, 0, 'sem o item, nada')
  })
})

describe('Concha Longa', () => {
  test('o golpe que acerta deixa uma poça nos pés do alvo, que some em puddleDurationMs; golpe no vazio, não', () => {
    assert.deepEqual(swing(runWithTarget(['concha-longa']), 'down').puddles, [], 'errou: sem poça')
    let run = runWithTarget(['concha-longa'])
    const { x, y } = run.targets[0]
    run = swing(run)
    assert.equal(run.puddles.length, 1)
    assert.deepEqual([run.puddles[0].x, run.puddles[0].y], [x, y])
    run = steps(run, 2000 / STEP_MS + 1)
    assert.deepEqual(run.puddles, [])
  })

  test('com o Rolo, a poça fica onde o alvo foi atingido (não vai junto com o empurrão)', () => {
    let run = runWithTarget(['concha-longa', 'rolo-de-bronze'])
    const { x, y } = run.targets[0]
    run = swing(run)
    assert.ok(run.targets[0].y < y - 100, 'o alvo foi empurrado')
    assert.deepEqual([run.puddles[0].x, run.puddles[0].y], [x, y])
    assert.equal(isInSaucePuddle(run.puddles[0], run.targets[0]), false, 'e saiu da poça')
  })

  test('no máximo MAX_PUDDLES poças ao mesmo tempo (a mais velha some)', () => {
    // poças de 10 s, para 4 golpes (cerca de 2,6 s) caberem antes de alguma sumir
    const catalog = { ...TEST_CATALOG, 'concha-longa': { ...TEST_CATALOG['concha-longa'], effect: { puddleDurationMs: 10000, enemySpeedMultiplier: 0.5 } } }
    let run = runWithTarget(['concha-longa'], { catalog })
    for (let i = 0; i < 4; i++) run = swing(run)
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

  test('com o Rolo, os fios de queijo vão junto com o alvo empurrado (não ficam onde ele estava)', () => {
    let run = updateRun(runWithTarget(['mucarela', 'rolo-de-bronze']), { movement: { x: 0, y: 0 }, attackDirection: 'up' }, STEP)
    while (!run.swing.hitAny) run = updateRun(run, IDLE, STEP)
    const startY = run.targets[0].y
    run = steps(run, 4) // 200 ms: o empurrão (150 ms) acabou e os fios (400 ms) ainda aparecem
    const target = run.targets[0]
    const strings = run.flashes.find((flash) => flash.variant === 'fios-de-queijo')
    assert.ok(target.y < startY - 100, `o alvo foi empurrado para cima (${startY} -> ${target.y})`)
    assert.ok(target.stunMs > 0, 'e continua preso onde parou')
    assert.deepEqual([strings.x, strings.y], [target.x, target.y - target.height / 2])
  })
})

describe('Tiramisu', () => {
  test('o golpe que acerta deixa o golpe attackSpeedBonus mais rápido por bonusDurationMs', () => {
    let run = updateRun(runWithTarget(['tiramisu']), { movement: { x: 0, y: 0 }, attackDirection: 'up' }, STEP)
    while (!run.swing.hitAny) run = updateRun(run, IDLE, STEP)
    assert.equal(run.effects.sugarMs, 2000)
    assert.ok(Math.abs(getRunStats(run).attackSpeed - 1.25) < 1e-9)
    assert.ok(Math.abs(getRunStats(run).moveSpeed - 1.2) < 1e-9, 'e anda 20% mais rápido')
    run = steps(run, 2000 / STEP_MS + 1)
    assert.equal(getRunStats(run).attackSpeed, 1, 'sem acertar por 2 s, volta ao normal')
    assert.equal(getRunStats(run).moveSpeed, 1)
  })

  test('cada acerto renova os 2 s; golpe no vazio não liga', () => {
    assert.equal(swing(runWithTarget(['tiramisu']), 'down').effects.sugarMs, 0, 'errou: nada')
    let run = steps(swing(runWithTarget(['tiramisu'])), 1000 / STEP_MS)
    assert.ok(run.effects.sugarMs > 0 && run.effects.sugarMs < 1000, `quase acabando: ${run.effects.sugarMs}`)
    run = updateRun(run, { movement: { x: 0, y: 0 }, attackDirection: 'up' }, STEP)
    while (!run.swing.hitAny) run = updateRun(run, IDLE, STEP)
    assert.equal(run.effects.sugarMs, 2000, 'o 2º acerto renova os 2 s')
    assert.equal(swing(runWithTarget([])).effects.sugarMs, 0, 'sem o item, nada')
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
    run = steps(run, 4000 / STEP_MS + 1)
    assert.equal(run.effects.frenzyStacks, 0)
    assert.equal(getRunStats(run).attackSpeed, 1)
  })

  test('o frenesi tem teto: com 2 ou 3 cargas o golpe fica no máximo maxAttackSpeedBonus mais rápido', () => {
    const base = runWith(['dente-de-tubarao'])
    for (const [stacks, expected] of [[1, 1.15], [2, 1.3], [3, 1.3]]) {
      const run = { ...base, effects: { ...base.effects, frenzyStacks: stacks, frenzyMs: 4000 } }
      assert.ok(Math.abs(getRunStats(run).attackSpeed - expected) < 1e-9, `${stacks} cargas: ${getRunStats(run).attackSpeed}`)
    }
    const { maxAttackSpeedBonus } = TEST_CATALOG['dente-de-tubarao'].effect
    assert.ok(maxAttackSpeedBonus < 0.15 * 3, 'o teto fica abaixo das 3 cargas somadas')
  })

  test('com 3 cargas, o golpe de 630 ms dura uns 485 ms (sem o teto seriam uns 435)', () => {
    let run = runWith(['dente-de-tubarao'])
    run.effects = { ...run.effects, frenzyStacks: 3, frenzyMs: 10000 }
    run = updateRun(run, { movement: { x: 0, y: 0 }, attackDirection: 'up' }, STEP)
    let ms = STEP_MS
    while (run.player.attack) {
      run = updateRun(run, IDLE, STEP)
      ms += STEP_MS
    }
    assert.ok(ms >= 630 / 1.3 && ms <= 630 / 1.3 + 2 * STEP_MS, `golpe de ${ms} ms`)
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
    // o escudo estoura (no mesmo quadro o relógio já andou um passo)
    assert.equal(run.effects.shieldBreakMs, SHIELD_BREAK_MS - STEP_MS)
    run = steps(run, SHIELD_BREAK_MS / STEP_MS)
    assert.equal(run.effects.shieldBreakMs, 0, 'a animação acaba')
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

  test('a faísca é maior no alvo atingido (1,6) que nos alvos em que o raio salta (1), e fica em cima de cada um', () => {
    let run = withExtraTargets(runWithTarget(['elixir-eletrico']), [100])
    run = swing(swing(run))
    run = updateRun(run, { movement: { x: 0, y: 0 }, attackDirection: 'up' }, STEP)
    while (!run.swing.elixirFired) run = updateRun(run, IDLE, STEP)
    const sparks = run.flashes.filter((flash) => flash.variant === 'faisca')
    assert.deepEqual(
      sparks.map((spark) => [spark.targetId, spark.scale]),
      [
        [run.targets[0].id, 1.6],
        ['extra-0', 1],
      ],
    )
  })

  test('errar um golpe no meio zera a sequência', () => {
    let run = swing(swing(runWithTarget(['elixir-eletrico'])))
    run = swing(run, 'down') // golpe para baixo: não acerta o alvo
    assert.equal(run.effects.hitStreak, 0)
  })
})

describe('bônus de velocidade do golpe de itens diferentes', () => {
  test('somam (Tiramisu + Palitos + Dente com 3 cargas), com o teto do frenesi', () => {
    const run = runWith(['tiramisu', 'palitos-de-pao', 'dente-de-tubarao'])
    run.effects = { ...createItemEffects(), sugarMs: 1000, frenzyStacks: 3, frenzyMs: 1000 }
    run.swing = { ...run.swing, fast: true }
    run.player = { ...run.player, attack: { direction: 'up', elapsed: 0 } }
    const bonuses = getItemBonuses(run).filter((bonus) => bonus.stat === 'attackSpeed')
    assert.equal(bonuses.length, 3)
    assert.ok(Math.abs(getRunStats(run).attackSpeed - 1.95) < 1e-9, '1 + 0,25 + 0,4 + 0,3 (teto do frenesi)')
  })
})
