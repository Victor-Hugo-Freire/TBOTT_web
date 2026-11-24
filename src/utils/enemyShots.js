import { CHIMPANZINI, PATAPIM, TRALALERO } from '../data/bossBehavior.js'
import { EFFECT_SPRITES } from '../data/effectSprites.js'
import { FENICOTTERO, MOKA, PISTACCHIO } from '../data/enemyBehavior.js'
import { overlaps } from './collision.js'
import { getFeetBox, ROOM_FLOOR } from './roomMovement.js'
import { getTotalDuration } from './spriteAnimation.js'

// Projéteis dos inimigos: o caroço do Pistacchio, a pizza do Fenicottero e o anel de vapor da Moka. Dos chefes: as
// notas musicais do Tralalero, a banana-bumerangue do Chimpanzini e as raízes do Patapim.
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

// Cada raiz do Patapim brota durante a folha dela (raiz.png); ROOT_BOX é a base dela no chão (o desenho tem 68 x 80 u)
export const ROOT_MS = getTotalDuration(EFFECT_SPRITES.raiz.animations.raiz.durations)
const ROOT_BOX = { width: 60, height: 36 }

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

// Nota musical do canto do Tralalero: sai dos pés dele e voa reto na direção `angle` (radianos). Voa no ar, por cima
// dos obstáculos, e some depois de TRALALERO.noteMs. damage = o dano do canto (catálogo).
export function createNote(boss, angle, damage) {
  const speed = TRALALERO.noteSpeed
  return { kind: 'nota', x: boss.x, y: boss.y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, ageMs: 0, damage, cause: boss.enemyId }
}

// Banana-bumerangue do Chimpanzini: faz uma laçada. Vai em arco até onde o Tung está agora (no máximo
// CHIMPANZINI.bananaRange), afastada da linha reta para o lado `side` (1 ou -1), e volta para a mão de quem jogou
// (ownerId) no mesmo tempo, em arco pelo outro lado. Voa no ar, por cima dos obstáculos. Acerta uma vez na ida e uma na volta.
export function createBanana(boss, target, damage, side) {
  const dx = target.x - boss.x
  const dy = target.y - boss.y
  const distance = Math.hypot(dx, dy) || 1
  const reach = Math.min(distance, CHIMPANZINI.bananaRange)
  return {
    kind: 'banana',
    x: boss.x,
    y: boss.y,
    from: { x: boss.x, y: boss.y },
    to: { x: boss.x + (dx / distance) * reach, y: boss.y + (dy / distance) * reach },
    // Para que lado o arco se afasta da linha reta: a direção do arremesso girada 90 graus, para o lado `side`
    sideX: (-dy / distance) * side,
    sideY: (dx / distance) * side,
    outMs: (reach / CHIMPANZINI.bananaSpeed) * 1000, // o tempo da ida (a volta leva o mesmo)
    ageMs: 0,
    back: false, // já está voltando
    hitOut: false, // já acertou na ida
    hitBack: false, // já acertou na volta
    ownerId: boss.id,
    damage,
    cause: boss.enemyId,
  }
}

// Raízes do Patapim: PATAPIM.rootCount raízes em linha, dos pés dele na direção do Tung, uma a cada rootSpacing u.
// A primeira brota na hora; cada uma das outras, rootStepMs depois da anterior. Param na borda do piso.
export function createRoots(boss, target, damage) {
  const dx = target.x - boss.x
  const dy = target.y - boss.y
  const distance = Math.hypot(dx, dy) || 1
  const points = []
  for (let k = 1; k <= PATAPIM.rootCount; k++) {
    const point = { x: boss.x + (dx / distance) * PATAPIM.rootSpacing * k, y: boss.y + (dy / distance) * PATAPIM.rootSpacing * k }
    const inside = point.x > ROOM_FLOOR.left && point.x < ROOM_FLOOR.right && point.y > ROOM_FLOOR.top && point.y < ROOM_FLOOR.bottom
    if (!inside) break
    points.push(point)
  }
  return { kind: 'raizes', x: boss.x, y: boss.y, points, ageMs: 0, hit: false, damage, cause: boss.enemyId }
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

// A nota anda (por cima dos obstáculos); acertou os pés do Tung (dano) ou o tempo dela acabou, some
function updateNote(note, world, feet) {
  const x = note.x + note.vx * world.deltaSeconds
  const y = note.y + note.vy * world.deltaSeconds
  const ageMs = note.ageMs + world.deltaSeconds * 1000
  if (overlaps(boxAround(x, y, SEED_BOX), feet)) {
    world.hits.push({ damage: note.damage, cause: note.cause })
    return null
  }
  return ageMs >= TRALALERO.noteMs ? null : { ...note, x, y, ageMs }
}

// A laçada da banana. Na ida, de onde foi jogada até o alvo (to); na volta, do alvo até a mão do dono (se ele andou,
// ela vai atrás; se ele morreu, volta para onde foi jogada), no mesmo tempo, e some ali. O arco se afasta da linha reta
// até bananaArc no meio do caminho (seno de 0 a pi: zero nas pontas), para um lado na ida e para o outro na volta.
// Acerta os pés do Tung uma vez na ida e uma na volta.
function updateBanana(banana, world, feet) {
  const ageMs = banana.ageMs + world.deltaSeconds * 1000
  if (ageMs >= banana.outMs * 2) return null // voltou para a mão
  const back = ageMs >= banana.outMs
  let start = banana.from
  let end = banana.to
  let progress = ageMs / banana.outMs // de 0 a 1 no trecho atual
  let bend = 1
  if (back) {
    const owner = (world.enemies ?? []).find((enemy) => enemy.id === banana.ownerId && !enemy.dead)
    start = banana.to
    end = owner ? { x: owner.x, y: owner.y } : banana.from
    progress = (ageMs - banana.outMs) / banana.outMs
    bend = -1 // volta pelo outro lado: fecha a laçada
  }
  const arc = CHIMPANZINI.bananaArc * Math.sin(Math.PI * progress) * bend
  const x = start.x + (end.x - start.x) * progress + banana.sideX * arc
  const y = start.y + (end.y - start.y) * progress + banana.sideY * arc
  let { hitOut, hitBack } = banana
  const touching = overlaps(boxAround(x, y, SEED_BOX), feet)
  if (touching && !back && !hitOut) {
    world.hits.push({ damage: banana.damage, cause: banana.cause })
    hitOut = true
  }
  if (touching && back && !hitBack) {
    world.hits.push({ damage: banana.damage, cause: banana.cause })
    hitBack = true
  }
  return { ...banana, x, y, ageMs, back, hitOut, hitBack }
}

// As raízes brotam uma depois da outra; a que está brotando (a folha dela tocando) machuca quem está em cima dela.
// A linha inteira acerta uma vez só. Some quando a última raiz termina.
function updateRoots(roots, world, feet) {
  const ageMs = roots.ageMs + world.deltaSeconds * 1000
  if (ageMs >= (roots.points.length - 1) * PATAPIM.rootStepMs + ROOT_MS) return null
  let { hit } = roots
  if (!hit) {
    for (let k = 0; k < roots.points.length; k++) {
      const rootMs = ageMs - k * PATAPIM.rootStepMs
      if (rootMs >= 0 && rootMs < ROOT_MS && overlaps(boxAround(roots.points[k].x, roots.points[k].y, ROOT_BOX), feet)) hit = true
    }
    if (hit) world.hits.push({ damage: roots.damage, cause: roots.cause })
  }
  return { ...roots, ageMs, hit }
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
    if (shot.kind === 'nota') moved = updateNote(shot, world, feet)
    if (shot.kind === 'banana') moved = updateBanana(shot, world, feet)
    if (shot.kind === 'raizes') moved = updateRoots(shot, world, feet)
    if (moved) next.push(moved)
  }
  return next
}
