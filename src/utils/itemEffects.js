import { ITEM_SPRITES } from '../data/itemSprites.js'
import { overlaps } from './collision.js'
import { ATTACK_HITBOXES } from './player.js'
import { damageTarget, findSwingHits, findTargetsNear, getTargetBox, pushTarget, slowTarget, stunTarget } from './targets.js'

// Efeitos dos itens. Funções puras (sem React, sem canvas), para testar com node:test.
// Os números de cada efeito vêm do campo effect do catálogo da API (getEffect): nada do seed é copiado para cá.
// Se faltar uma chave no catálogo, aquele pedaço do efeito simplesmente não acontece.
// Tudo o que os efeitos acertam é um alvo (targets.js): hoje o alvo de treino, depois os inimigos.
// Os números daqui embaixo não estão no catálogo: são só do jeito de mostrar ou de limitar o efeito. Ajuste aqui.

export const SHARD_FLIGHT_MS = 300 // Parmesão: as lascas voam este tempo (o mesmo da animação "lascas")
const SHARD_SPREAD = 0.35 // Parmesão: ângulo entre uma lasca e a do lado, em radianos (cerca de 20°)
export const MAX_PUDDLES = 3 // Concha: no máximo 3 poças ao mesmo tempo (a mais velha some)
const PUDDLE_RADIUS = { x: 45, y: 20 } // Concha: tamanho da poça (o desenho tem cerca de 90 x 40 u)
const PUDDLE_SLOW_MS = 100 // Concha: a lentidão dura isso depois de sair da poça
const DEFAULT_FLASH_MS = 400 // duração de um efeito visual sem folha (não deve acontecer: todo item tem a dele)

const DIRECTION_VECTORS = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } }

// Estado dos efeitos que dura a run (não vai para o save, menos os usos por andar do Caldo)
export function createItemEffects(floorHealsUsed = 0) {
  return {
    coffeeBoostMs: 0, // Café Duplo: corrida depois do dano
    sugarMs: 0, // Tiramisu: golpe rápido depois de pegar um grão
    frenzyStacks: 0, // Dente de Tubarão: cargas do frenesi
    frenzyMs: 0, // Dente de Tubarão: tempo que falta do frenesi (renova a cada abate)
    swingCount: 0, // Palitos de Pão: golpes dados (o 4º, o 8º... são rápidos)
    rhythmCombo: 0, // Batuta do Maestro: golpes seguidos no ritmo
    sinceSwingEndMs: Infinity, // Batuta do Maestro: tempo desde que o golpe anterior acabou
    hitStreak: 0, // Elixir Elétrico: golpes seguidos que acertaram
    shieldHits: 0, // Caldo da Mamãe: danos que o escudo ainda anula nesta sala
    floorHealsUsed, // Caldo da Mamãe: curas já usadas neste andar
  }
}

// Como cada golpe começa: o que acertou e quais efeitos valem nele (veja startSwing)
export function createSwing() {
  return { hitIds: [], hitAny: false, fast: false, inRhythm: false, elixirReady: false, elixirFired: false, shardsFired: false }
}

// Números do efeito de um item que o jogador TEM, ou null se ele não tem o item
export function getEffect(run, itemId) {
  if (!run.items.includes(itemId)) return null
  return run.catalog[itemId]?.effect ?? null
}

// Bônus dos itens nos atributos (stats.js): os de sempre e os que valem por um tempo
export function getItemBonuses(run) {
  const bonuses = []
  // Custo do Pacto: o item com maxHealthCost tira essa vida máxima para sempre
  for (const id of run.items) {
    const cost = run.catalog[id]?.effect?.maxHealthCost
    if (cost) bonuses.push({ stat: 'maxHealth', add: -cost })
  }
  const effects = run.effects
  // Café Duplo: sempre um pouco mais rápido; depois de levar dano, bem mais rápido por um tempo
  const coffee = getEffect(run, 'cafe-duplo')
  if (coffee?.speedMultiplier) bonuses.push({ stat: 'moveSpeed', multiply: coffee.speedMultiplier })
  if (coffee?.boostSpeedMultiplier && effects.coffeeBoostMs > 0) bonuses.push({ stat: 'moveSpeed', multiply: coffee.boostSpeedMultiplier })
  // Tiramisu: golpe mais rápido depois de pegar um grão
  const sugar = getEffect(run, 'tiramisu')
  if (sugar?.attackSpeedBonus && effects.sugarMs > 0) bonuses.push({ stat: 'attackSpeed', add: sugar.attackSpeedBonus })
  // Palitos de Pão: o 4º golpe é mais rápido (só enquanto ele acontece)
  const sticks = getEffect(run, 'palitos-de-pao')
  if (sticks?.attackSpeedBonus && run.swing.fast && run.player.attack) {
    bonuses.push({ stat: 'attackSpeed', add: sticks.attackSpeedBonus })
  }
  // Dente de Tubarão: cada carga do frenesi deixa o golpe mais rápido
  const tooth = getEffect(run, 'dente-de-tubarao')
  if (tooth?.attackSpeedBonus && effects.frenzyStacks > 0) {
    bonuses.push({ stat: 'attackSpeed', add: tooth.attackSpeedBonus * effects.frenzyStacks })
  }
  return bonuses
}

// Os tempos dos efeitos andam
export function updateEffectTimers(effects, stepMs) {
  const next = {
    ...effects,
    coffeeBoostMs: Math.max(0, effects.coffeeBoostMs - stepMs),
    sugarMs: Math.max(0, effects.sugarMs - stepMs),
    frenzyMs: Math.max(0, effects.frenzyMs - stepMs),
    sinceSwingEndMs: effects.sinceSwingEndMs + stepMs,
  }
  if (next.frenzyMs === 0) next.frenzyStacks = 0
  return next
}

// Efeito visual de um item (variants de itemSprites.js) que toca uma vez num ponto da sala.
// scale = tamanho a mais (1 = o normal); angle = giro em radianos (0 = a folha como foi desenhada).
function createFlash(itemId, variant, x, y, scale = 1, angle = 0) {
  const sprite = ITEM_SPRITES[itemId]?.variants?.[variant]
  let durationMs = DEFAULT_FLASH_MS
  if (sprite) {
    durationMs = 0
    for (const ms of Object.values(sprite.animations)[0].durations) durationMs += ms
  }
  return { itemId, variant, x, y, scale, angle, elapsedMs: 0, durationMs }
}

// Efeitos visuais que acabaram saem da lista
export function updateFlashes(flashes, stepMs) {
  const next = []
  for (const flash of flashes) {
    const elapsedMs = flash.elapsedMs + stepMs
    if (elapsedMs < flash.durationMs) next.push({ ...flash, elapsedMs })
  }
  return next
}

// Meio do alvo (para os efeitos visuais em cima dele)
function getTargetCenter(target) {
  return { x: target.x, y: target.y - target.height / 2 }
}

// ---------- dano no jogador ----------

// Café Duplo: levar dano liga a corrida. Elixir Elétrico: levar dano zera a sequência de acertos.
export function onPlayerHurt(run, effects) {
  const next = { ...effects, hitStreak: 0 }
  const coffee = getEffect(run, 'cafe-duplo')
  if (coffee?.boostDurationMs) next.coffeeBoostMs = coffee.boostDurationMs
  return next
}

// Caldo da Mamãe, escudo: o escudo desta sala anula o dano? (gasta um uso)
export function spendShield(effects) {
  if (effects.shieldHits <= 0) return null
  return { ...effects, shieldHits: effects.shieldHits - 1 }
}

// Caldo da Mamãe, colo de mãe: com a vida em healAtHealth ou menos (e viva), cura healAmount, healsPerFloor
// vezes por andar. Devolve { health, effects }.
export function applyMotherHeal(run, health, maxHealth, effects) {
  const broth = getEffect(run, 'caldo-da-mamae')
  if (!broth?.healAtHealth || !broth.healAmount || health <= 0 || health > broth.healAtHealth) return { health, effects }
  if (effects.floorHealsUsed >= (broth.healsPerFloor ?? 0)) return { health, effects }
  return { health: Math.min(maxHealth, health + broth.healAmount), effects: { ...effects, floorHealsUsed: effects.floorHealsUsed + 1 } }
}

// Caldo da Mamãe, escudo: numa sala com alvo vivo, o escudo anula os próximos blockedHitsPerRoom danos.
// Hoje vale ao pôr o alvo de treino; com os inimigos, ao entrar numa sala com inimigos.
export function armRoomShield(run) {
  const broth = getEffect(run, 'caldo-da-mamae')
  let anyAlive = false
  for (const target of run.targets) {
    if (!target.dead) anyAlive = true
  }
  if (!broth?.blockedHitsPerRoom || !anyAlive) return run
  return { ...run, effects: { ...run.effects, shieldHits: broth.blockedHitsPerRoom } }
}

// Tiramisu: pegar um grão de café deixa o golpe mais rápido por bonusDurationMs (renova). Quem pega o grão chama.
export function onGrainCollected(run) {
  const sugar = getEffect(run, 'tiramisu')
  if (!sugar?.bonusDurationMs) return run
  return { ...run, effects: { ...run.effects, sugarMs: sugar.bonusDurationMs } }
}

// ---------- golpe ----------

// O golpe acabou. Elixir Elétrico: golpe que acertou soma na sequência; golpe que errou, que já soltou o raio
// ou que foi cortado por dano recomeça a contagem. Batuta do Maestro: o tempo do ritmo conta a partir daqui.
export function endSwing(run) {
  let hitStreak = 0
  if (run.swing.hitAny && !run.swing.elixirFired && !run.player.hurt) hitStreak = run.effects.hitStreak + 1
  return { ...run, effects: { ...run.effects, hitStreak, sinceSwingEndMs: 0 } }
}

// Um golpe novo começou. freshPress = a seta foi apertada agora (e não só segurada desde antes).
// stats = os atributos (dano da onda da Batuta).
export function startSwing(run, freshPress, stats) {
  const effects = { ...run.effects, swingCount: run.effects.swingCount + 1 }
  const swing = createSwing()
  let targets = [...run.targets]
  const flashes = [...run.flashes]
  let puddles = run.puddles
  const { player } = run
  const direction = player.attack.direction

  // Palitos de Pão: o 4º golpe sai mais rápido e solta um estalo que empurra quem está perto
  const sticks = getEffect(run, 'palitos-de-pao')
  if (sticks && effects.swingCount % 4 === 0) {
    swing.fast = true
    flashes.push(createFlash('palitos-de-pao', 'estalo', player.x, player.y - 50))
    if (sticks.pushRange) {
      for (const index of findTargetsNear(targets, player.x, player.y, sticks.pushRange)) {
        const target = targets[index]
        const distance = Math.hypot(target.x - player.x, target.y - player.y) || 1
        targets[index] = pushTarget(target, (target.x - player.x) / distance, (target.y - player.y) / distance, sticks.pushRange)
      }
    }
  }

  // Batuta do Maestro: golpe começado até rhythmWindowMs depois do fim do anterior está no ritmo (nota);
  // comboHits golpes seguidos no ritmo soltam uma onda que acerta todos a até waveRange
  const baton = getEffect(run, 'batuta-do-maestro')
  if (baton?.rhythmWindowMs) {
    swing.inRhythm = freshPress && effects.sinceSwingEndMs <= baton.rhythmWindowMs
    effects.rhythmCombo = swing.inRhythm ? effects.rhythmCombo + 1 : 0
    if (swing.inRhythm) flashes.push(createFlash('batuta-do-maestro', 'notas-no-ritmo', player.x, player.y - 150))
    if (baton.comboHits && effects.rhythmCombo >= baton.comboHits) {
      effects.rhythmCombo = 0
      flashes.push(createFlash('batuta-do-maestro', 'notas-no-ritmo', player.x, player.y - 60, 2.5))
      if (baton.waveRange) {
        for (const index of findTargetsNear(targets, player.x, player.y, baton.waveRange)) {
          targets[index] = damageTarget(targets[index], stats.damage)
        }
      }
    }
  }

  // Concha Longa: todo golpe deixa uma poça de molho na frente do Tung (no máximo MAX_PUDDLES)
  const ladle = getEffect(run, 'concha-longa')
  if (ladle?.puddleDurationMs) {
    const box = ATTACK_HITBOXES[direction]
    const puddle = { x: player.x + box.x + box.width / 2, y: player.y + box.y + box.height * 0.75, ms: ladle.puddleDurationMs, ageMs: 0 }
    puddles = [...puddles, puddle]
    if (puddles.length > MAX_PUDDLES) puddles = puddles.slice(puddles.length - MAX_PUDDLES)
  }

  // Elixir Elétrico: depois de 2 golpes seguidos que acertaram, este é o 3º (o raio sai no primeiro acerto dele)
  const elixir = getEffect(run, 'elixir-eletrico')
  if (elixir && effects.hitStreak >= 2) swing.elixirReady = true

  return { ...run, effects, swing, targets, flashes, puddles }
}

// Dano do golpe num alvo: o dano dos atributos, mais o do ritmo (Batuta) e o do raio (Elixir), vezes o do Dente
// de Tubarão se o alvo estiver com metade da vida ou menos
function getSwingDamage(run, target, stats, withElixir) {
  let damage = stats.damage
  const baton = getEffect(run, 'batuta-do-maestro')
  if (run.swing.inRhythm && baton?.extraDamage) damage += baton.extraDamage
  const elixir = getEffect(run, 'elixir-eletrico')
  if (withElixir && elixir?.extraDamage) damage += elixir.extraDamage
  const tooth = getEffect(run, 'dente-de-tubarao')
  if (tooth?.lowHealthDamageMultiplier && target.health <= target.maxHealth / 2) damage *= tooth.lowHealthDamageMultiplier
  return damage
}

// A caixa do golpe (hitbox) acertou os alvos que ela toca agora (cada um uma vez por golpe), com os efeitos
// dos itens que valem em cada acerto
export function hitWithSwing(run, hitbox, stats) {
  const indexes = findSwingHits(run.targets, hitbox, run.swing.hitIds)
  if (indexes.length === 0) return run
  const targets = [...run.targets]
  const flashes = [...run.flashes]
  let shards = run.shards
  const swing = { ...run.swing, hitIds: [...run.swing.hitIds], hitAny: true }
  const direction = run.player.attack.direction
  const vector = DIRECTION_VECTORS[direction]

  for (const index of indexes) {
    let target = targets[index]
    const center = getTargetCenter(target)
    const withElixir = swing.elixirReady && !swing.elixirFired

    // Dente de Tubarão: a mordida aparece no alvo ferido
    const tooth = getEffect(run, 'dente-de-tubarao')
    if (tooth?.lowHealthDamageMultiplier && target.health <= target.maxHealth / 2) {
      flashes.push(createFlash('dente-de-tubarao', 'mordida', center.x, center.y))
    }
    target = damageTarget(target, getSwingDamage(run, target, stats, withElixir))

    // Muçarela: fios de queijo prendem o alvo
    const cheese = getEffect(run, 'mucarela')
    if (cheese?.stunDurationMs) {
      target = stunTarget(target, cheese.stunDurationMs)
      flashes.push(createFlash('mucarela', 'fios-de-queijo', center.x, center.y))
    }
    // Rolo de Bronze: empurra o alvo na direção do golpe; batendo em parede ou obstáculo, leva dano a mais
    const roller = getEffect(run, 'rolo-de-bronze')
    if (roller?.pushDistance) target = pushTarget(target, vector.x, vector.y, roller.pushDistance, roller.wallExtraDamage ?? 0)

    targets[index] = target
    swing.hitIds.push(target.id)

    // Elixir Elétrico: o raio salta deste alvo para os mais perto dele
    if (withElixir) {
      swing.elixirFired = true
      flashes.push(createFlash('elixir-eletrico', 'faisca', center.x, center.y))
      const elixir = getEffect(run, 'elixir-eletrico')
      for (const chained of findChainTargets(targets, index, elixir.chainTargets ?? 0, elixir.chainRange ?? 0)) {
        targets[chained] = damageTarget(targets[chained], elixir.chainDamage ?? 0)
        const chainedCenter = getTargetCenter(targets[chained])
        flashes.push(createFlash('elixir-eletrico', 'faisca', chainedCenter.x, chainedCenter.y, 0.6))
      }
    }
  }

  // Parmesão Curado: o primeiro acerto do golpe solta as lascas em leque para a frente
  const cheeseShards = getEffect(run, 'parmesao-curado')
  if (cheeseShards?.shards && !swing.shardsFired) {
    swing.shardsFired = true
    const origin = { x: hitbox.x + hitbox.width / 2, y: hitbox.y + hitbox.height / 2 }
    shards = [...shards, ...createShards(origin, direction, cheeseShards)]
    flashes.push(createFlash('parmesao-curado', 'lascas', origin.x, origin.y, 1, Math.atan2(vector.y, vector.x)))
  }

  return { ...run, targets, flashes, shards, swing }
}

// Elixir Elétrico: os `count` alvos vivos mais perto do alvo `fromIndex`, a até `range` dele (sem ele mesmo)
function findChainTargets(targets, fromIndex, count, range) {
  const from = targets[fromIndex]
  const chosen = []
  for (let round = 0; round < count; round++) {
    let best = -1
    let bestDistance = range
    for (let index = 0; index < targets.length; index++) {
      const target = targets[index]
      if (index === fromIndex || target.dead || chosen.includes(index)) continue
      const distance = Math.hypot(target.x - from.x, target.y - from.y)
      if (distance <= bestDistance) {
        best = index
        bestDistance = distance
      }
    }
    if (best === -1) break
    chosen.push(best)
  }
  return chosen
}

// ---------- lascas do Parmesão ----------

// As lascas saem do ponto do golpe em leque, na direção dele, e andam shardRange em SHARD_FLIGHT_MS
function createShards(origin, direction, effect) {
  const vector = DIRECTION_VECTORS[direction]
  const baseAngle = Math.atan2(vector.y, vector.x)
  const speed = (effect.shardRange ?? 0) / (SHARD_FLIGHT_MS / 1000)
  const shards = []
  for (let i = 0; i < effect.shards; i++) {
    const angle = baseAngle + (i - (effect.shards - 1) / 2) * SHARD_SPREAD
    shards.push({ x: origin.x, y: origin.y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, ms: SHARD_FLIGHT_MS })
  }
  return shards
}

// As lascas voam; a que entra num alvo vivo dá shardDamage nele e some. As lascas não contam para o Elixir.
export function updateShards(run, deltaSeconds) {
  if (run.shards.length === 0) return run
  const effect = getEffect(run, 'parmesao-curado')
  const targets = [...run.targets]
  const shards = []
  for (const shard of run.shards) {
    const next = { ...shard, x: shard.x + shard.vx * deltaSeconds, y: shard.y + shard.vy * deltaSeconds, ms: shard.ms - deltaSeconds * 1000 }
    let hit = false
    for (let index = 0; index < targets.length && !hit; index++) {
      const target = targets[index]
      if (target.dead || !overlaps({ x: next.x - 4, y: next.y - 4, width: 8, height: 8 }, getTargetBox(target))) continue
      targets[index] = damageTarget(target, effect?.shardDamage ?? 0)
      hit = true
    }
    if (!hit && next.ms > 0) shards.push(next)
  }
  return { ...run, targets, shards }
}

// ---------- poças da Concha ----------

// O alvo está dentro da poça? (a poça é uma elipse no chão; vale a base do alvo)
export function isInSaucePuddle(puddle, target) {
  const dx = (target.x - puddle.x) / PUDDLE_RADIUS.x
  const dy = (target.y - puddle.y) / PUDDLE_RADIUS.y
  return dx * dx + dy * dy <= 1
}

// As poças envelhecem e somem; quem está dentro de uma fica lento (enemySpeedMultiplier)
export function updatePuddles(run, stepMs) {
  if (run.puddles.length === 0) return run
  const ladle = getEffect(run, 'concha-longa')
  const puddles = []
  for (const puddle of run.puddles) {
    if (puddle.ageMs + stepMs < puddle.ms) puddles.push({ ...puddle, ageMs: puddle.ageMs + stepMs })
  }
  const targets = [...run.targets]
  if (ladle?.enemySpeedMultiplier) {
    for (let index = 0; index < targets.length; index++) {
      for (const puddle of puddles) {
        if (isInSaucePuddle(puddle, targets[index])) targets[index] = slowTarget(targets[index], ladle.enemySpeedMultiplier, PUDDLE_SLOW_MS)
      }
    }
  }
  return { ...run, puddles, targets }
}

// ---------- abates ----------

// Dente de Tubarão: cada abate soma uma carga do frenesi (até maxStacks) e renova o tempo dele
export function onKills(run, kills) {
  const tooth = getEffect(run, 'dente-de-tubarao')
  if (kills === 0 || !tooth?.bonusDurationMs) return run
  const frenzyStacks = Math.min(tooth.maxStacks ?? 1, run.effects.frenzyStacks + kills)
  return { ...run, effects: { ...run.effects, frenzyStacks, frenzyMs: tooth.bonusDurationMs } }
}

// Rolo de Bronze: o impacto aparece onde o alvo empurrado bateu (targets.js marca bumped)
export function addBumpFlashes(run) {
  const roller = getEffect(run, 'rolo-de-bronze')
  if (!roller) return run
  const flashes = [...run.flashes]
  for (const target of run.targets) {
    if (target.bumped) flashes.push(createFlash('rolo-de-bronze', 'impacto-de-bronze', target.x, target.y - 10))
  }
  return { ...run, flashes }
}
