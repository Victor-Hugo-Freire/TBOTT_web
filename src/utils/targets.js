import { moveAndCollide, overlaps } from './collision.js'

// Alvo: tudo o que o golpe e os efeitos dos itens podem acertar. Hoje é só o alvo de treino (F3 + T, só no
// npm run dev); na issue dos inimigos, cada inimigo vai ser um alvo também, e os efeitos passam a valer neles.
// Funções puras (sem React, sem canvas), para testar com node:test. Tempos em ms, distâncias em unidades da sala.
// A posição (x, y) é o meio da base do alvo (os "pés"), como a do jogador. Dano em pontos (veja characterStats.js).

export const DAMAGE_TEXT_MS = 700 // os números de dano sobem e somem neste tempo
export const PUSH_MS = 150 // o empurrão percorre a distância toda neste tempo
export const TRAINING_HEALTH = 30 // vida do alvo de treino (10 golpes de 3)
export const TRAINING_RESPAWN_MS = 1000 // o alvo de treino volta com a vida cheia este tempo depois de morrer
const TRAINING_SIZE = { width: 56, height: 120 } // caixa que o golpe acerta
const BASE_BOX = { width: 44, height: 18 } // caixa da base: é ela que bate nas paredes e nos obstáculos no empurrão

export function createTarget({ id, x, y, width, height, health }) {
  return {
    id,
    x,
    y,
    width,
    height,
    health,
    maxHealth: health,
    dead: false,
    deadMs: 0, // há quanto tempo morreu
    slowMs: 0, // lento: ms que faltam
    slowMultiplier: 1, // velocidade enquanto está lento (0,5 = metade)
    stunMs: 0, // preso: ms que faltam (não anda nem ataca)
    stunImmuneMs: 0, // ms até poder ser preso de novo (Muçarela)
    hurtMs: Infinity, // ms desde o último dano (a animação "dano" dos inimigos toca no começo)
    push: null, // empurrão: { x, y } em u/s e os ms que faltam
    damageTexts: [], // { amount, ageMs }: números de dano subindo
  }
}

// Alvo de treino: parado, com vida 30. Ao morrer, volta com a vida cheia TRAINING_RESPAWN_MS depois,
// no lugar onde foi posto (home), mesmo que tenha sido empurrado.
export function createTrainingTarget(position) {
  const target = createTarget({ id: 'treino', x: position.x, y: position.y, ...TRAINING_SIZE, health: TRAINING_HEALTH })
  return { ...target, training: true, home: { x: position.x, y: position.y } }
}

// Caixa que o golpe acerta
export function getTargetBox(target) {
  return { x: target.x - target.width / 2, y: target.y - target.height, width: target.width, height: target.height }
}

function getBaseBox(target) {
  return { x: target.x - BASE_BOX.width / 2, y: target.y - BASE_BOX.height, width: BASE_BOX.width, height: BASE_BOX.height }
}

// Tira `amount` pontos de vida e mostra o número. Com 0 de vida o alvo morre; morto, não leva mais dano.
export function damageTarget(target, amount) {
  if (target.dead) return target
  const health = Math.max(0, target.health - amount)
  const damageTexts = [...target.damageTexts, { amount, ageMs: 0 }]
  return { ...target, health, dead: health === 0, deadMs: 0, hurtMs: 0, damageTexts }
}

// Fica lento por `ms`, andando a `multiplier` da velocidade. Se já estava lento, vale o tempo maior.
export function slowTarget(target, multiplier, ms) {
  if (target.dead) return target
  return { ...target, slowMultiplier: multiplier, slowMs: Math.max(target.slowMs, ms) }
}

// Fica preso por `ms`: não anda nem ataca. Se já estava preso, vale o tempo maior.
// immuneMs: depois de preso, só pode ser preso de novo passado esse tempo (contado agora); até lá, nada muda.
export function stunTarget(target, ms, immuneMs = 0) {
  if (target.dead || target.stunImmuneMs > 0) return target
  return { ...target, stunMs: Math.max(target.stunMs, ms), stunImmuneMs: immuneMs }
}

// Empurrão: desliza `distance` na direção (directionX, directionY) em PUSH_MS, parando no que bloqueia.
// A direção tem tamanho 1: { x: 1, y: 0 } empurra para a direita.
// wallDamage = dano a mais se ele bater numa parede ou obstáculo no caminho (Rolo de Bronze); 0 = nenhum.
export function pushTarget(target, directionX, directionY, distance, wallDamage = 0) {
  if (target.dead) return target
  const speed = distance / (PUSH_MS / 1000)
  return { ...target, push: { x: directionX * speed, y: directionY * speed, ms: PUSH_MS, wallDamage } }
}

// Os números de dano envelhecem e somem depois de DAMAGE_TEXT_MS
function ageDamageTexts(texts, stepMs) {
  const aged = []
  for (const text of texts) {
    const ageMs = text.ageMs + stepMs
    if (ageMs < DAMAGE_TEXT_MS) aged.push({ ...text, ageMs })
  }
  return aged
}

// O alvo de treino volta no lugar de onde saiu, com a vida cheia e sem efeitos
function respawn(target) {
  return {
    ...target,
    x: target.home.x,
    y: target.home.y,
    health: target.maxHealth,
    dead: false,
    deadMs: 0,
    slowMs: 0,
    slowMultiplier: 1,
    stunMs: 0,
    stunImmuneMs: 0,
    push: null,
  }
}

// Avança o alvo um quadro: os tempos de lento e preso diminuem, o empurrão anda (parando no que bloqueia),
// os números de dano sobem e o alvo de treino volta TRAINING_RESPAWN_MS depois de morrer.
// Se o empurrão bate em alguma coisa, bumped fica true neste quadro (e o alvo leva o wallDamage do empurrão).
// solids: as caixas que bloqueiam o empurrão (as paredes e os obstáculos da sala, veja getRoomSolids).
export function updateTarget(target, deltaSeconds, solids) {
  const stepMs = deltaSeconds * 1000
  let next = {
    ...target,
    slowMs: Math.max(0, target.slowMs - stepMs),
    stunMs: Math.max(0, target.stunMs - stepMs),
    stunImmuneMs: Math.max(0, target.stunImmuneMs - stepMs),
    hurtMs: target.hurtMs + stepMs,
    damageTexts: ageDamageTexts(target.damageTexts, stepMs),
    bumped: false,
  }
  if (next.slowMs === 0) next.slowMultiplier = 1

  if (target.push) {
    const seconds = Math.min(stepMs, target.push.ms) / 1000
    const box = getBaseBox(target)
    const dx = target.push.x * seconds
    const dy = target.push.y * seconds
    const moved = moveAndCollide(box, dx, dy, solids)
    next.x = moved.x + BASE_BOX.width / 2
    next.y = moved.y + BASE_BOX.height
    // Bateu em alguma coisa (andou menos que o pedido) ou o tempo acabou: o empurrão para
    const blocked = moved.x !== box.x + dx || moved.y !== box.y + dy
    const ms = target.push.ms - stepMs
    next.push = blocked || ms <= 0 ? null : { ...target.push, ms }
    if (blocked) {
      next.bumped = true
      if (target.push.wallDamage > 0) next = damageTarget(next, target.push.wallDamage)
    }
  }

  if (target.dead) {
    next.deadMs = target.deadMs + stepMs
    if (target.training && next.deadMs >= TRAINING_RESPAWN_MS) return respawn(next)
  }
  return next
}

export function updateTargets(targets, deltaSeconds, solids) {
  const next = []
  for (const target of targets) next.push(updateTarget(target, deltaSeconds, solids))
  return next
}

// Posições (na lista) dos alvos vivos que a caixa do golpe (hitbox) toca e que ainda não levaram dano DESTE golpe
// (hitIds). Assim cada alvo é acertado uma vez por golpe, mesmo com a caixa ativa por vários quadros.
// Quem chama aplica o dano e os efeitos dos itens (itemEffects.js).
export function findSwingHits(targets, hitbox, hitIds) {
  const indexes = []
  for (let index = 0; index < targets.length; index++) {
    const target = targets[index]
    if (!target.dead && !hitIds.includes(target.id) && overlaps(hitbox, getTargetBox(target))) indexes.push(index)
  }
  return indexes
}

// Alvos vivos a até `range` do ponto (x, y) (medido até a base de cada um)
export function findTargetsNear(targets, x, y, range) {
  const indexes = []
  for (let index = 0; index < targets.length; index++) {
    const target = targets[index]
    if (!target.dead && Math.hypot(target.x - x, target.y - y) <= range) indexes.push(index)
  }
  return indexes
}

// Quantos alvos morreram entre `before` e `after` (a mesma lista, um quadro depois): os abates do quadro.
// O alvo de treino que voltou (estava morto e ficou vivo) não conta.
export function countNewKills(before, after) {
  let kills = 0
  for (let index = 0; index < after.length; index++) {
    if (before[index] && !before[index].dead && after[index].dead) kills += 1
  }
  return kills
}
