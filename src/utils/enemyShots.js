import { EFFECT_SPRITES } from '../data/effectSprites.js'
import { FENICOTTERO, MOKA, PISTACCHIO } from '../data/enemyBehavior.js'
import { overlaps } from './collision.js'
import { getFeetBox } from './roomMovement.js'
import { getTotalDuration } from './spriteAnimation.js'

// Projéteis dos inimigos: o caroço do Pistacchio, a pizza do Fenicottero e o anel de vapor da Moka.
// Cada projétil guarda o ponto do chão embaixo dele (x, y): é esse ponto que acerta os pés do Tung e bate no que
// bloqueia, como a sombra de uma bola. A altura (height) é só para o desenho.
// Ficam em run.enemyShots e somem ao trocar de sala. Funções puras, para testar com node:test.
// Quem acerta o Tung vai para world.hits ({ damage, cause }), como a explosão do Peperoncino.

const SEED_BOX = { width: 36, height: 24 } // o caroço no chão (a sombra dele)
export const SEED_HEIGHT = 55 // o caroço voa nesta altura (a boca do Pistacchio)
const PIZZA_START_HEIGHT = 90 // a pizza sai da boca do forno do Fenicottero

// Queijo quente onde a pizza cai: a pizza acerta quem está nessa caixa e o queijo queima quem encosta nela (como a
// chapa quente). CHEESE_SCALE: o desenho (queijo-quente.png, 88 x 34 u na escala 1) do tamanho da caixa.
export const CHEESE_BOX = { width: 110, height: 40 }
export const CHEESE_SCALE = 1.4

// O anel é uma elipse achatada como o desenho (vapor-anel.png, 408 x 228 px) e cresce enquanto a folha toca
const RING_FLATNESS = 228 / 408
const RING_MS = getTotalDuration(EFFECT_SPRITES['vapor-anel'].animations['vapor-anel'].durations)

// Caixa de tamanho `size` com o meio em (x, y)
function boxAround(x, y, size) {
  return { x: x - size.width / 2, y: y - size.height / 2, width: size.width, height: size.height }
}

// Caroço: sai dos pés do Pistacchio e voa reto até onde o Tung está agora
export function createSeed(enemy, target) {
  const dx = target.x - enemy.x
  const dy = target.y - enemy.y
  const distance = Math.hypot(dx, dy) || 1
  const speed = PISTACCHIO.seedSpeed
  return { kind: 'caroco', x: enemy.x, y: enemy.y, vx: (dx / distance) * speed, vy: (dy / distance) * speed, ageMs: 0, damage: enemy.damage, cause: enemy.enemyId }
}

// Pizza: voa em arco do Fenicottero até onde o Tung está agora (to), em FENICOTTERO.flightMs
export function createPizza(enemy, target) {
  return {
    kind: 'pizza',
    from: { x: enemy.x, y: enemy.y },
    to: { x: target.x, y: target.y },
    x: enemy.x,
    y: enemy.y,
    height: PIZZA_START_HEIGHT,
    ageMs: 0,
    damage: enemy.damage,
    cause: enemy.enemyId,
  }
}

// Anel de vapor: cresce em volta dos pés da Moka
export function createSteamRing(enemy) {
  return { kind: 'anel', x: enemy.x, y: enemy.y, radius: 0, ageMs: 0, hit: false, damage: enemy.damage, cause: enemy.enemyId }
}

// Queijo quente no chão: um "obstáculo de piso" quente, como a chapa (touchesHot já sabe o que fazer com ele).
// Fica em run.enemyFloor, junto com o gelo do Pinguino, e some depois de FENICOTTERO.cheeseMs.
export function createHotCheese(x, y) {
  return { kind: 'queijo-quente', mechanic: 'quente', box: boxAround(x, y, CHEESE_BOX), x, y, scale: CHEESE_SCALE, ageMs: 0, ms: FENICOTTERO.cheeseMs }
}

// O caroço anda; acertou os pés do Tung (dano) ou bateu no que bloqueia, some
function updateSeed(seed, world, feet) {
  const x = seed.x + seed.vx * world.deltaSeconds
  const y = seed.y + seed.vy * world.deltaSeconds
  const box = boxAround(x, y, SEED_BOX)
  if (overlaps(box, feet)) {
    world.hits.push({ damage: seed.damage, cause: seed.cause })
    return null
  }
  if (world.solids.some((solid) => overlaps(box, solid))) return null
  return { ...seed, x, y, ageMs: seed.ageMs + world.deltaSeconds * 1000 }
}

// A pizza anda em arco (por cima de tudo). Ao cair, acerta o Tung se ele estiver no lugar e deixa o queijo quente.
function updatePizza(pizza, world, feet) {
  const ageMs = pizza.ageMs + world.deltaSeconds * 1000
  const t = Math.min(1, ageMs / FENICOTTERO.flightMs) // 0 = saiu do forno, 1 = caiu
  if (t === 1) {
    if (overlaps(boxAround(pizza.to.x, pizza.to.y, CHEESE_BOX), feet)) world.hits.push({ damage: pizza.damage, cause: pizza.cause })
    world.floor.push(createHotCheese(pizza.to.x, pizza.to.y))
    return null
  }
  const x = pizza.from.x + (pizza.to.x - pizza.from.x) * t
  const y = pizza.from.y + (pizza.to.y - pizza.from.y) * t
  // Sai da boca do forno, sobe até arcHeight no meio do caminho e desce até o chão
  const height = PIZZA_START_HEIGHT * (1 - t) + 4 * FENICOTTERO.arcHeight * t * (1 - t)
  return { ...pizza, x, y, height, ageMs }
}

// O anel cresce até MOKA.ringRadius. Quando a borda chega nos pés do Tung, acerta (uma vez só).
function updateRing(ring, world) {
  const ageMs = ring.ageMs + world.deltaSeconds * 1000
  if (ageMs >= RING_MS) return null
  const radius = MOKA.ringRadius * (ageMs / RING_MS)
  const dx = (world.player.x - ring.x) / radius
  const dy = (world.player.y - ring.y) / (radius * RING_FLATNESS)
  let { hit } = ring
  if (!hit && dx * dx + dy * dy <= 1) {
    world.hits.push({ damage: ring.damage, cause: ring.cause })
    hit = true
  }
  return { ...ring, radius, ageMs, hit }
}

// Um quadro dos projéteis. world = { player, solids, deltaSeconds, hits, floor } (o mesmo dos inimigos).
// Devolve os que continuam voando.
export function updateEnemyShots(shots, world) {
  const feet = getFeetBox(world.player)
  const next = []
  for (const shot of shots) {
    let moved = null
    if (shot.kind === 'caroco') moved = updateSeed(shot, world, feet)
    if (shot.kind === 'pizza') moved = updatePizza(shot, world, feet)
    if (shot.kind === 'anel') moved = updateRing(shot, world)
    if (moved) next.push(moved)
  }
  return next
}
