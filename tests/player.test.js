import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import {
  ATTACK_COOLDOWN_MS,
  ATTACK_DURATION_MS,
  ATTACK_HITBOXES,
  createPlayer,
  getAttackHitbox,
  getPlayerPose,
  HURT_DURATION_MS,
  hurtPlayer,
  INVINCIBILITY_MS,
  isAttackHitActive,
  startAttack,
  updatePlayer,
} from '../src/utils/player.js'
import { ROOM_PLAYER_SPEED } from '../src/utils/roomMovement.js'

const START = { x: 500, y: 400 }
const NO_INPUT = { movement: { x: 0, y: 0 }, attackDirection: null }
const FRAME = 1 / 60

// Roda a simulação por "ms" milissegundos, em passos de stepSeconds. Devolve o estado final
// e os instantes (ms) em que um golpe começou.
function run(player, input, ms, stepSeconds = FRAME) {
  const starts = []
  let time = 0
  while (time < ms) {
    const next = updatePlayer(player, input, stepSeconds)
    if (next.attack && next.attack.elapsed === 0) starts.push(time)
    player = next
    time += stepSeconds * 1000
  }
  return { player, starts }
}

describe('ataque: começo e direção', () => {
  test('segurar uma seta começa o golpe na direção dela', () => {
    const player = updatePlayer(createPlayer(START), { ...NO_INPUT, attackDirection: 'left' }, FRAME)
    assert.equal(player.attack.direction, 'left')
    assert.equal(player.direction, 'left')
  })

  test('sem seta não há golpe', () => {
    const { player } = run(createPlayer(START), NO_INPUT, 1000)
    assert.equal(player.attack, null)
  })

  test('cooldown de 430 ms a partir do início do golpe anterior', () => {
    assert.equal(ATTACK_COOLDOWN_MS, 430)
    const base = createPlayer(START)
    assert.equal(startAttack({ ...base, sinceAttackStart: 429 }, 'up').attack, null)
    assert.deepEqual(startAttack({ ...base, sinceAttackStart: 430 }, 'up').attack, { direction: 'up', elapsed: 0 })
  })
})

describe('ataque: o golpe trava o movimento e não é cortado', () => {
  test('durante o golpe o personagem não sai do lugar, mesmo com WASD apertado', () => {
    const input = { movement: { x: 1, y: 0 }, attackDirection: 'up' }
    const { player } = run(createPlayer(START), input, 600)
    assert.ok(player.attack)
    assert.deepEqual({ x: player.x, y: player.y }, START)
  })

  test('o golpe dura 630 ms inteiros, mesmo se a seta for solta logo no começo', () => {
    assert.equal(ATTACK_DURATION_MS, 630)
    let player = updatePlayer(createPlayer(START), { ...NO_INPUT, attackDirection: 'down' }, FRAME)
    player = run(player, NO_INPUT, 600).player
    assert.ok(player.attack, 'a 617 ms o golpe ainda está em andamento')
    player = run(player, NO_INPUT, 40).player
    assert.equal(player.attack, null)
  })

  test('depois do golpe o personagem anda de novo', () => {
    let player = run(updatePlayer(createPlayer(START), { ...NO_INPUT, attackDirection: 'right' }, FRAME), NO_INPUT, 700).player
    player = updatePlayer(player, { movement: { x: 1, y: 0 }, attackDirection: null }, 0.02)
    assert.equal(player.x, START.x + ROOM_PLAYER_SPEED * 0.02)
  })

  test('sem golpe, o andar funciona como antes', () => {
    const player = updatePlayer(createPlayer(START), { movement: { x: 0, y: -1 }, attackDirection: null }, 0.02)
    assert.equal(player.y, START.y - ROOM_PLAYER_SPEED * 0.02)
    assert.equal(player.direction, 'up')
  })

  test('trocar de seta no meio do golpe só vale no golpe seguinte', () => {
    let player = updatePlayer(createPlayer(START), { ...NO_INPUT, attackDirection: 'up' }, FRAME)
    player = run(player, { ...NO_INPUT, attackDirection: 'left' }, 300).player
    assert.equal(player.attack.direction, 'up')
    player = run(player, { ...NO_INPUT, attackDirection: 'left' }, 400).player
    assert.equal(player.attack.direction, 'left')
  })
})

describe('ataque: cadência real', () => {
  test('segurando a seta, um golpe começa a cada 630 ms (o cooldown de 430 não limita nada)', () => {
    const { starts } = run(createPlayer(START), { ...NO_INPUT, attackDirection: 'right' }, 2000)
    assert.equal(starts.length, 4)
    for (let i = 1; i < starts.length; i++) {
      const gap = starts[i] - starts[i - 1]
      assert.ok(gap >= 630 && gap < 630 + 1000 / 60 + 1, `intervalo de ${gap} ms`)
    }
  })
})

describe('ataque: janela do golpe (hitbox)', () => {
  test('acerta só de 160 a 350 ms (quadros 2 a 4)', () => {
    for (const [elapsed, active] of [[0, false], [159, false], [160, true], [349, true], [350, false], [629, false]]) {
      assert.equal(isAttackHitActive({ direction: 'right', elapsed }), active, `${elapsed} ms`)
    }
    assert.equal(isAttackHitActive(null), false)
  })

  test('com quadros curtos (60 fps) e longos (20 fps) o golpe acerta em alguns quadros', () => {
    for (const stepSeconds of [1 / 60, 0.05]) {
      let player = updatePlayer(createPlayer(START), { ...NO_INPUT, attackDirection: 'right' }, 0.001)
      let hits = 0
      for (let ms = 0; ms < 700; ms += stepSeconds * 1000) {
        player = updatePlayer(player, NO_INPUT, stepSeconds)
        if (getAttackHitbox(player)) hits++
      }
      assert.ok(hits >= 3, `passo de ${stepSeconds * 1000} ms: ${hits} quadros com hitbox`)
    }
  })

  test('a caixa do golpe fica relativa aos pés e só existe na janela', () => {
    const player = { ...createPlayer(START), attack: { direction: 'right', elapsed: 200 } }
    assert.deepEqual(getAttackHitbox(player), {
      x: START.x + ATTACK_HITBOXES.right.x,
      y: START.y + ATTACK_HITBOXES.right.y,
      width: ATTACK_HITBOXES.right.width,
      height: ATTACK_HITBOXES.right.height,
    })
    assert.equal(getAttackHitbox({ ...player, attack: { direction: 'right', elapsed: 50 } }), null)
    assert.equal(getAttackHitbox(createPlayer(START)), null)
  })

  test('o golpe de cada direção aponta para o lado certo', () => {
    assert.ok(ATTACK_HITBOXES.right.x >= 0)
    assert.ok(ATTACK_HITBOXES.left.x + ATTACK_HITBOXES.left.width <= 0)
    assert.ok(ATTACK_HITBOXES.up.y + ATTACK_HITBOXES.up.height <= 0)
    assert.ok(ATTACK_HITBOXES.down.y + ATTACK_HITBOXES.down.height > 0)
  })
})

describe('passo de lógica', () => {
  test('um quadro muito longo (aba escondida) conta no máximo 50 ms', () => {
    const player = updatePlayer(createPlayer(START), { ...NO_INPUT, attackDirection: 'up' }, 5)
    assert.equal(player.attack.elapsed, 0)
    const next = updatePlayer(player, NO_INPUT, 5)
    assert.equal(next.attack.elapsed, 50)
  })
})

describe('getPlayerPose (o que desenhar)', () => {
  test('parado: andar, quadro 0, na direção atual', () => {
    assert.deepEqual(getPlayerPose(createPlayer(START)), { sheet: 'walk', direction: 'down', frame: 0 })
  })

  test('andando, o quadro vem da distância', () => {
    assert.deepEqual(getPlayerPose({ ...createPlayer(START), direction: 'left', walkDistance: 40 }), {
      sheet: 'walk',
      direction: 'left',
      frame: 1,
    })
  })

  test('golpe: folha de ataque, direção do golpe, quadro pelo tempo', () => {
    const player = { ...createPlayer(START), attack: { direction: 'up', elapsed: 180 } }
    assert.deepEqual(getPlayerPose(player), { sheet: 'attack', direction: 'up', frame: 2 })
    assert.equal(getPlayerPose({ ...player, attack: { direction: 'up', elapsed: 629 } }).frame, 7)
  })

  test('reduzir movimento: o andar fica no quadro 0, mas o golpe anima', () => {
    assert.equal(getPlayerPose({ ...createPlayer(START), walkDistance: 70 }, true).frame, 0)
    const attacking = { ...createPlayer(START), attack: { direction: 'down', elapsed: 180 } }
    assert.equal(getPlayerPose(attacking, true).frame, 2)
  })
})

describe('dano (só o estado: nada dispara o dano no jogo ainda)', () => {
  test('a animação dura 410 ms e a invencibilidade 1000 ms', () => {
    assert.equal(HURT_DURATION_MS, 410)
    assert.equal(INVINCIBILITY_MS, 1000)
  })

  test('levar dano liga a animação e a invencibilidade, na direção atual', () => {
    const player = hurtPlayer({ ...createPlayer(START), direction: 'left' })
    assert.deepEqual(player.hurt, { direction: 'left', elapsed: 0 })
    assert.equal(player.invincibleMs, 1000)
  })

  test('o dano interrompe o golpe', () => {
    const attacking = updatePlayer(createPlayer(START), { ...NO_INPUT, attackDirection: 'up' }, FRAME)
    assert.ok(attacking.attack)
    const hurt = hurtPlayer(attacking)
    assert.equal(hurt.attack, null)
    assert.ok(hurt.hurt)
  })

  test('durante o dano não anda e não ataca, mesmo com as teclas apertadas', () => {
    const input = { movement: { x: 1, y: 0 }, attackDirection: 'right' }
    const { player } = run(hurtPlayer(createPlayer(START)), input, 400)
    assert.ok(player.hurt)
    assert.equal(player.attack, null)
    assert.deepEqual({ x: player.x, y: player.y }, START)
  })

  test('depois dos 410 ms o personagem volta a andar e a atacar', () => {
    let player = run(hurtPlayer(createPlayer(START)), NO_INPUT, 430).player
    assert.equal(player.hurt, null)
    player = updatePlayer(player, { movement: { x: 1, y: 0 }, attackDirection: null }, 0.02)
    assert.ok(player.x > START.x)
    player = updatePlayer(player, { ...NO_INPUT, attackDirection: 'down' }, FRAME)
    assert.ok(player.attack)
  })

  test('invencível por 1000 ms: outro dano é ignorado e depois vale de novo', () => {
    let player = run(hurtPlayer(createPlayer(START)), NO_INPUT, 500).player
    assert.equal(player.hurt, null)
    assert.ok(player.invincibleMs > 0)
    assert.equal(hurtPlayer(player), player, 'a 500 ms ainda está invencível')

    player = run(player, NO_INPUT, 520).player
    assert.equal(player.invincibleMs, 0)
    assert.ok(hurtPlayer(player).hurt, 'depois de 1000 ms leva dano de novo')
  })

  test('prioridade da pose: dano > ataque > andar', () => {
    const base = { ...createPlayer(START), walkDistance: 40 }
    const both = { ...base, attack: { direction: 'up', elapsed: 100 }, hurt: { direction: 'down', elapsed: 80 } }
    assert.deepEqual(getPlayerPose(both), { sheet: 'hurt', direction: 'down', frame: 1 })
    assert.equal(getPlayerPose({ ...base, attack: both.attack }).sheet, 'attack')
    assert.equal(getPlayerPose(base).sheet, 'walk')
  })
})
