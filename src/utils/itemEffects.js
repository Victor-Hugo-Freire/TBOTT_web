import { ITEM_SPRITES } from '../data/itemSprites.js'
import { overlaps } from './collision.js'
import { ROOM_FLOOR } from './roomMovement.js'
import { damageTarget, findSwingHits, findTargetsNear, getTargetBox, isTargetable, pushTarget, slowTarget, stunTarget } from './targets.js'

// Efeitos dos itens. Funções puras (sem React, sem canvas), para testar com node:test.
// Os números de cada efeito vêm do campo effect do catálogo da API (getEffect): nada do seed é copiado para cá.
// Se faltar uma chave no catálogo, aquele pedaço do efeito simplesmente não acontece.
// Tudo o que os efeitos acertam é um alvo (targets.js): hoje o alvo de treino, depois os inimigos.
// Os números daqui embaixo não estão no catálogo: são só do jeito de mostrar ou de limitar o efeito. Ajuste aqui.

const SHARD_SPEED = 900 // Parmesão: velocidade das lascas (u/s); elas voam até acertar um alvo ou chegar na parede
const SHARD_SPREAD = 0.35 // Parmesão: ângulo entre uma lasca e a do lado, em radianos (cerca de 20°)
export const MAX_PUDDLES = 3 // Concha: no máximo 3 poças ao mesmo tempo (a mais velha some)
const PUDDLE_RADIUS = { x: 45, y: 20 } // Concha: tamanho da poça (o desenho tem cerca de 90 x 40 u)
const PUDDLE_SLOW_MS = 100 // Concha: a lentidão dura isso depois de sair da poça
const DEFAULT_FLASH_MS = 400 // duração de um efeito visual sem folha (não deve acontecer: todo item tem a dele)
export const SHIELD_BREAK_MS = 450 // Caldo: duração da animação do escudo estourando ao anular um dano
const SPARK_SCALE = 1.6 // Elixir: tamanho da faísca no alvo atingido (1 = o tamanho da folha)
const CHAIN_SPARK_SCALE = 1 // Elixir: tamanho da faísca nos alvos em que o raio salta
const LUCKY_FLASH_LIFT = 12 // Chifre: o brilho fica um pouco acima do ponto do grão no chão (no meio do desenho dele)

const DIRECTION_VECTORS = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } }

// Estado dos efeitos que dura a run (não vai para o save, menos os usos por andar do Caldo)
export function createItemEffects(floorHealsUsed = 0) {
  return {
    coffeeBoostMs: 0, // Café Duplo: corrida depois do dano
    sugarMs: 0, // Tiramisu: golpe rápido depois de um golpe que acertou
    frenzyStacks: 0, // Dente de Tubarão: cargas do frenesi
    frenzyMs: 0, // Dente de Tubarão: tempo que falta do frenesi (renova a cada abate)
    swingCount: 0, // Palitos de Pão: golpes dados (o 4º, o 8º... são rápidos)
    rhythmCombo: 0, // Batuta do Maestro: golpes seguidos no ritmo
    sinceSwingEndMs: Infinity, // Batuta do Maestro: tempo desde que o golpe anterior acabou
    hitStreak: 0, // Elixir Elétrico: golpes seguidos que acertaram
    shieldHits: 0, // Caldo da Mamãe: danos que o escudo ainda anula nesta sala
    shieldBreakMs: 0, // Caldo da Mamãe: tempo que falta da animação do escudo estourando (depois de anular um dano)
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
  // Efeitos secundários, sempre ativos: Muçarela +vida máxima, Batuta +invencibilidade, Elixir passo e golpe
  // mais rápidos e Concha golpe maior
  const cheese = getEffect(run, 'mucarela')
  if (cheese?.maxHealthBonus) bonuses.push({ stat: 'maxHealth', add: cheese.maxHealthBonus })
  const baton = getEffect(run, 'batuta-do-maestro')
  if (baton?.invincibilityBonusMs) bonuses.push({ stat: 'invincibilityMs', add: baton.invincibilityBonusMs })
  const elixir = getEffect(run, 'elixir-eletrico')
  if (elixir?.speedMultiplier) bonuses.push({ stat: 'moveSpeed', multiply: elixir.speedMultiplier })
  if (elixir?.attackSpeedBonus) bonuses.push({ stat: 'attackSpeed', add: elixir.attackSpeedBonus })
  const ladle = getEffect(run, 'concha-longa')
  if (ladle?.attackAreaMultiplier) bonuses.push({ stat: 'attackArea', multiply: ladle.attackAreaMultiplier })
  // Café Duplo: sempre um pouco mais rápido; depois de levar dano, bem mais rápido por um tempo
  const coffee = getEffect(run, 'cafe-duplo')
  if (coffee?.speedMultiplier) bonuses.push({ stat: 'moveSpeed', multiply: coffee.speedMultiplier })
  if (coffee?.boostSpeedMultiplier && effects.coffeeBoostMs > 0) bonuses.push({ stat: 'moveSpeed', multiply: coffee.boostSpeedMultiplier })
  // Tiramisu: depois de um golpe que acertou, golpe e passo mais rápidos (o açúcar)
  const sugar = getEffect(run, 'tiramisu')
  if (sugar && effects.sugarMs > 0) {
    if (sugar.attackSpeedBonus) bonuses.push({ stat: 'attackSpeed', add: sugar.attackSpeedBonus })
    if (sugar.moveSpeedMultiplier) bonuses.push({ stat: 'moveSpeed', multiply: sugar.moveSpeedMultiplier })
  }
  // Palitos de Pão: o 4º golpe é mais rápido (só enquanto ele acontece)
  const sticks = getEffect(run, 'palitos-de-pao')
  if (sticks?.attackSpeedBonus && run.swing.fast && run.player.attack) {
    bonuses.push({ stat: 'attackSpeed', add: sticks.attackSpeedBonus })
  }
  // Dente de Tubarão: cada carga do frenesi deixa o golpe mais rápido, até o teto maxAttackSpeedBonus
  // (+0,15 por carga e teto 0,3: a 2ª carga já chega no teto; golpe de 630 ms fica em ~485 ms, não em ~435)
  const tooth = getEffect(run, 'dente-de-tubarao')
  if (tooth?.attackSpeedBonus && effects.frenzyStacks > 0) {
    const frenzy = Math.min(tooth.attackSpeedBonus * effects.frenzyStacks, tooth.maxAttackSpeedBonus ?? Infinity)
    bonuses.push({ stat: 'attackSpeed', add: frenzy })
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
    shieldBreakMs: Math.max(0, effects.shieldBreakMs - stepMs),
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

// Efeito visual em cima de um alvo: guarda o id dele para ir junto quando ele é empurrado (veja updateFlashes)
function createTargetFlash(itemId, variant, target, scale = 1) {
  const center = getTargetCenter(target)
  return { ...createFlash(itemId, variant, center.x, center.y, scale), targetId: target.id }
}

// Efeitos visuais que acabaram saem da lista. O efeito de um alvo (targetId) acompanha o meio dele:
// o Rolo empurra o alvo e os fios da Muçarela, a mordida e a faísca vão junto.
export function updateFlashes(flashes, stepMs, targets = []) {
  const next = []
  for (const flash of flashes) {
    const elapsedMs = flash.elapsedMs + stepMs
    if (elapsedMs >= flash.durationMs) continue
    const target = flash.targetId ? targets.find((one) => one.id === flash.targetId) : null
    const center = target ? getTargetCenter(target) : flash
    next.push({ ...flash, elapsedMs, x: center.x, y: center.y })
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
  return { ...effects, shieldHits: effects.shieldHits - 1, shieldBreakMs: SHIELD_BREAK_MS }
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
  const { player } = run

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

  // Elixir Elétrico: depois de 2 golpes seguidos que acertaram, este é o 3º (o raio sai no primeiro acerto dele)
  const elixir = getEffect(run, 'elixir-eletrico')
  if (elixir && effects.hitStreak >= 2) swing.elixirReady = true

  return { ...run, effects, swing, targets, flashes }
}

// Parmesão Curado: todo golpe, acertando ou não, solta as lascas em leque para a frente, uma vez por golpe,
// no primeiro quadro em que a caixa do golpe aparece (saem do meio dela)
function fireShards(run, hitbox, direction) {
  const cheese = getEffect(run, 'parmesao-curado')
  if (!cheese?.shards || run.swing.shardsFired) return run
  const origin = { x: hitbox.x + hitbox.width / 2, y: hitbox.y + hitbox.height / 2 }
  const shards = [...run.shards, ...createShards(origin, direction, cheese.shards)]
  return { ...run, shards, swing: { ...run.swing, shardsFired: true } }
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
// dos itens que valem em cada acerto. solids = os obstáculos e os pedestais da sala: o golpe não os atravessa.
// direction = a direção do golpe que gerou a caixa: o golpe pode ter acabado neste mesmo quadro (run.player.attack já é null)
export function hitWithSwing(run, hitbox, direction, stats, solids = []) {
  run = fireShards(run, hitbox, direction)
  const indexes = findSwingHits(run.targets, hitbox, run.swing.hitIds, run.player, solids)
  if (indexes.length === 0) return run
  const targets = [...run.targets]
  const flashes = [...run.flashes]
  let puddles = run.puddles
  const swing = { ...run.swing, hitIds: [...run.swing.hitIds], hitAny: true }
  const vector = DIRECTION_VECTORS[direction]

  for (const index of indexes) {
    let target = targets[index]
    const withElixir = swing.elixirReady && !swing.elixirFired

    // Dente de Tubarão: a mordida aparece no alvo ferido
    const tooth = getEffect(run, 'dente-de-tubarao')
    if (tooth?.lowHealthDamageMultiplier && target.health <= target.maxHealth / 2) {
      flashes.push(createTargetFlash('dente-de-tubarao', 'mordida', target))
    }
    target = damageTarget(target, getSwingDamage(run, target, stats, withElixir))

    // Muçarela: fios de queijo prendem o alvo (os fios vão junto se o Rolo empurrar). O mesmo alvo só é preso de
    // novo depois de restunDelayMs; até lá, o golpe não prende e os fios não aparecem.
    const cheese = getEffect(run, 'mucarela')
    if (cheese?.stunDurationMs) {
      const stunned = stunTarget(target, cheese.stunDurationMs, cheese.restunDelayMs ?? 0)
      if (stunned !== target) flashes.push(createTargetFlash('mucarela', 'fios-de-queijo', stunned))
      target = stunned
    }
    // Concha Longa: a poça de molho nasce nos pés do alvo e fica ali (empurrado, ele sai dela); no máximo MAX_PUDDLES
    const ladle = getEffect(run, 'concha-longa')
    if (ladle?.puddleDurationMs) {
      puddles = [...puddles, { x: target.x, y: target.y, ms: ladle.puddleDurationMs, ageMs: 0 }]
      if (puddles.length > MAX_PUDDLES) puddles = puddles.slice(puddles.length - MAX_PUDDLES)
    }
    // Rolo de Bronze: empurra o alvo na direção do golpe; batendo em parede ou obstáculo, leva dano a mais
    const roller = getEffect(run, 'rolo-de-bronze')
    if (roller?.pushDistance) target = pushTarget(target, vector.x, vector.y, roller.pushDistance, roller.wallExtraDamage ?? 0)

    targets[index] = target
    swing.hitIds.push(target.id)

    // Elixir Elétrico: o raio salta deste alvo para os mais perto dele
    if (withElixir) {
      swing.elixirFired = true
      flashes.push(createTargetFlash('elixir-eletrico', 'faisca', target, SPARK_SCALE))
      const elixir = getEffect(run, 'elixir-eletrico')
      for (const chained of findChainTargets(targets, index, elixir.chainTargets ?? 0, elixir.chainRange ?? 0)) {
        targets[chained] = damageTarget(targets[chained], elixir.chainDamage ?? 0)
        flashes.push(createTargetFlash('elixir-eletrico', 'faisca', targets[chained], CHAIN_SPARK_SCALE))
      }
    }
  }

  // Tiramisu: acertou, o golpe fica mais rápido por bonusDurationMs (cada acerto renova o tempo)
  let effects = run.effects
  const sugar = getEffect(run, 'tiramisu')
  if (sugar?.bonusDurationMs) effects = { ...effects, sugarMs: sugar.bonusDurationMs }

  return { ...run, targets, flashes, puddles, swing, effects }
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
      if (index === fromIndex || !isTargetable(target) || chosen.includes(index)) continue
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

// As lascas saem do ponto do golpe em leque, na direção dele, a SHARD_SPEED
function createShards(origin, direction, count) {
  const vector = DIRECTION_VECTORS[direction]
  const baseAngle = Math.atan2(vector.y, vector.x)
  const shards = []
  for (let i = 0; i < count; i++) {
    const angle = baseAngle + (i - (count - 1) / 2) * SHARD_SPREAD
    shards.push({ x: origin.x, y: origin.y, vx: Math.cos(angle) * SHARD_SPEED, vy: Math.sin(angle) * SHARD_SPEED })
  }
  return shards
}

// A lasca chegou na parede? (saiu do piso da sala)
function isOutOfRoom(shard) {
  return shard.x < ROOM_FLOOR.left || shard.x > ROOM_FLOOR.right || shard.y < ROOM_FLOOR.top || shard.y > ROOM_FLOOR.bottom
}

// As lascas voam até acertar um alvo vivo (dá shardDamage nele e some), um obstáculo sólido (some) ou a parede (some).
// solids = paredes, obstáculos que bloqueiam e pedestais (getRoomSolids). As lascas não contam para o Elixir.
export function updateShards(run, deltaSeconds, solids = []) {
  if (run.shards.length === 0) return run
  const effect = getEffect(run, 'parmesao-curado')
  const targets = [...run.targets]
  const shards = []
  for (const shard of run.shards) {
    const next = { ...shard, x: shard.x + shard.vx * deltaSeconds, y: shard.y + shard.vy * deltaSeconds }
    const box = { x: next.x - 4, y: next.y - 4, width: 8, height: 8 }
    let hit = false
    for (let index = 0; index < targets.length && !hit; index++) {
      const target = targets[index]
      if (!isTargetable(target) || !overlaps(box, getTargetBox(target))) continue
      targets[index] = damageTarget(target, effect?.shardDamage ?? 0)
      hit = true
    }
    const blocked = solids.some((solid) => overlaps(box, solid))
    if (!hit && !blocked && !isOutOfRoom(next)) shards.push(next)
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

// Chifre da Sorte: o brilho em volta do grão que caiu de um inimigo (o grão fica em room.drops, veja run.js)
export function createLuckyFlash(x, y) {
  return createFlash('chifre-da-sorte', 'brilho-da-sorte', x, y - LUCKY_FLASH_LIFT)
}

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
