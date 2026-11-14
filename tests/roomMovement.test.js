import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import {
  getAttackDirection,
  getRoomMovement,
  isRoomKey,
  RESTART_KEY,
  moveRoomPlayer,
  PLAYER_FEET_BOX,
  ROOM_PLAYER_BOUNDS,
  ROOM_PLAYER_SPEED,
  ROOM_PLAYER_START,
  ROOM_SIZE,
  ROOM_WALLS,
  shouldReturnToMenu,
} from '../src/utils/roomMovement.js'

describe('shouldReturnToMenu (tecla de retorno provisório)', () => {
  test('reconhece Escape sem diferenciar maiúsculas de minúsculas', () => {
    assert.equal(shouldReturnToMenu('Escape'), true)
    assert.equal(shouldReturnToMenu('escape'), true)
  })

  test('não confunde a tecla Esc com outras teclas', () => {
    assert.equal(shouldReturnToMenu('Esc'), false)
    assert.equal(shouldReturnToMenu('Enter'), false)
    assert.equal(shouldReturnToMenu(undefined), false)
  })
})

describe('getRoomMovement (controles da sala)', () => {
  test('WASD produzem o movimento nas quatro direções', () => {
    assert.deepEqual(getRoomMovement(new Set(['KeyW'])), { x: 0, y: -1 })
    assert.deepEqual(getRoomMovement(new Set(['KeyA'])), { x: -1, y: 0 })
    assert.deepEqual(getRoomMovement(new Set(['KeyS'])), { x: 0, y: 1 })
    assert.deepEqual(getRoomMovement(new Set(['KeyD'])), { x: 1, y: 0 })
  })

  test('as setas não movem o personagem', () => {
    assert.deepEqual(getRoomMovement(new Set(['ArrowUp', 'ArrowLeft'])), { x: 0, y: 0 })
    assert.deepEqual(getRoomMovement(new Set(['ArrowDown', 'ArrowRight'])), { x: 0, y: 0 })
  })

  test('combina teclas diagonais sem aumentar a velocidade', () => {
    const movement = getRoomMovement(new Set(['KeyW', 'KeyD']))
    assert.ok(Math.abs(Math.hypot(movement.x, movement.y) - 1) < 0.000001)
    assert.ok(movement.x > 0)
    assert.ok(movement.y < 0)
  })

  test('com teclas opostas, vale a última apertada (troca de lado sem parar)', () => {
    assert.deepEqual(getRoomMovement(new Set(['KeyA', 'KeyD'])), { x: 1, y: 0 })
    assert.deepEqual(getRoomMovement(new Set(['KeyD', 'KeyA'])), { x: -1, y: 0 })
    assert.deepEqual(getRoomMovement(new Set(['KeyW', 'KeyS'])), { x: 0, y: 1 })
  })

  test('soltar a última tecla volta para a oposta que ainda está segurada', () => {
    const keys = new Set(['KeyA', 'KeyD'])
    keys.delete('KeyD')
    assert.deepEqual(getRoomMovement(keys), { x: -1, y: 0 })
    keys.add('KeyD')
    keys.add('KeyA') // keydown repetido da tecla que já estava segurada não muda a ordem
    assert.deepEqual(getRoomMovement(keys), { x: 1, y: 0 })
  })
})

describe('teclas por código (event.code)', () => {
  test('WASD valem pela posição da tecla, em qualquer layout', () => {
    // No layout AZERTY a tecla de cima à esquerda imprime "z", mas o código continua KeyW
    assert.deepEqual(getRoomMovement(new Set(['KeyW'])), { x: 0, y: -1 })
    assert.deepEqual(getRoomMovement(new Set(['w'])), { x: 0, y: 0 })
  })

  test('isRoomKey reconhece o R de recomeçar a run', () => {
    assert.equal(RESTART_KEY, 'KeyR')
    assert.equal(isRoomKey('KeyR'), true)
  })

  test('isRoomKey reconhece WASD e as setas (e o R), e só elas', () => {
    for (const code of ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']) {
      assert.equal(isRoomKey(code), true, code)
    }
    for (const code of ['Space', 'Enter', 'KeyQ', 'Escape']) assert.equal(isRoomKey(code), false, code)
  })
})

describe('getAttackDirection (setas)', () => {
  test('cada seta ataca na sua direção', () => {
    assert.equal(getAttackDirection(new Set(['ArrowUp'])), 'up')
    assert.equal(getAttackDirection(new Set(['ArrowDown'])), 'down')
    assert.equal(getAttackDirection(new Set(['ArrowLeft'])), 'left')
    assert.equal(getAttackDirection(new Set(['ArrowRight'])), 'right')
  })

  test('sem seta, não há ataque', () => {
    assert.equal(getAttackDirection(new Set()), null)
    assert.equal(getAttackDirection(new Set(['KeyW', 'KeyD'])), null)
  })

  test('com duas setas, vale a última pressionada', () => {
    const keys = new Set()
    keys.add('ArrowUp')
    keys.add('ArrowRight')
    assert.equal(getAttackDirection(keys), 'right')
  })

  test('soltar a última seta volta para a anterior que ainda está segurada', () => {
    const keys = new Set(['ArrowUp', 'ArrowRight'])
    keys.delete('ArrowRight')
    assert.equal(getAttackDirection(keys), 'up')
  })

  test('a repetição da tecla segurada não troca a direção', () => {
    const keys = new Set(['ArrowUp'])
    keys.add('ArrowRight')
    keys.add('ArrowUp') // keydown repetido da seta que já estava segurada
    assert.equal(getAttackDirection(keys), 'right')
  })

  test('as setas não movem o personagem e WASD não ataca', () => {
    assert.deepEqual(getRoomMovement(new Set(['ArrowRight'])), { x: 0, y: 0 })
    assert.equal(getAttackDirection(new Set(['KeyD'])), null)
  })
})

describe('moveRoomPlayer (colisão com as bordas)', () => {
  test('mantém os pés dentro do piso da sala de 1600x853', () => {
    assert.deepEqual(ROOM_SIZE, { width: 1600, height: 853 })
    assert.deepEqual(ROOM_PLAYER_BOUNDS, {
      minX: 144,
      maxX: 1456,
      minY: 294,
      maxY: 786,
    })
  })

  test('o personagem inteiro (até 70 u dos pés para cada lado, com a escala 1,18) fica dentro da sala', () => {
    assert.ok(ROOM_PLAYER_BOUNDS.minX - 70 >= 0)
    assert.ok(ROOM_PLAYER_BOUNDS.maxX + 70 <= ROOM_SIZE.width)
  })

  test('o personagem começa no meio da sala, dentro dos limites', () => {
    assert.ok(ROOM_PLAYER_START.x >= ROOM_PLAYER_BOUNDS.minX && ROOM_PLAYER_START.x <= ROOM_PLAYER_BOUNDS.maxX)
    assert.ok(ROOM_PLAYER_START.y >= ROOM_PLAYER_BOUNDS.minY && ROOM_PLAYER_START.y <= ROOM_PLAYER_BOUNDS.maxY)
  })

  test('move respeitando velocidade e tempo transcorrido', () => {
    const next = moveRoomPlayer({ x: 500, y: 400 }, { x: 1, y: 0 }, 0.02)
    assert.deepEqual(next, { x: 500 + ROOM_PLAYER_SPEED * 0.02, y: 400 })
  })

  test('não atravessa os limites laterais ou as paredes', () => {
    const left = moveRoomPlayer(
      { x: ROOM_PLAYER_BOUNDS.minX, y: 400 },
      { x: -1, y: 0 },
      0.05,
    )
    const right = moveRoomPlayer(
      { x: ROOM_PLAYER_BOUNDS.maxX, y: 400 },
      { x: 1, y: 0 },
      0.05,
    )
    const top = moveRoomPlayer(
      { x: 500, y: ROOM_PLAYER_BOUNDS.minY },
      { x: 0, y: -1 },
      0.05,
    )
    const bottom = moveRoomPlayer(
      { x: 500, y: ROOM_PLAYER_BOUNDS.maxY },
      { x: 0, y: 1 },
      0.05,
    )

    assert.equal(left.x, ROOM_PLAYER_BOUNDS.minX)
    assert.equal(right.x, ROOM_PLAYER_BOUNDS.maxX)
    assert.equal(top.y, ROOM_PLAYER_BOUNDS.minY)
    assert.equal(bottom.y, ROOM_PLAYER_BOUNDS.maxY)
  })

  test('limita deltas longos para evitar saltos após uma pausa', () => {
    const next = moveRoomPlayer({ x: 500, y: 400 }, { x: 1, y: 0 }, 1)
    assert.equal(next.x, 500 + ROOM_PLAYER_SPEED * 0.05)
  })
})

describe('moveRoomPlayer (sólidos da sala)', () => {
  const block = { x: 600, y: 380, width: 84, height: 60 }

  test('sem informar os sólidos, usa só as paredes (igual a antes)', () => {
    const start = { x: ROOM_PLAYER_BOUNDS.maxX, y: 400 }
    assert.deepEqual(moveRoomPlayer(start, { x: 1, y: 0 }, 0.05), moveRoomPlayer(start, { x: 1, y: 0 }, 0.05, 1, ROOM_WALLS))
    assert.equal(moveRoomPlayer(start, { x: 1, y: 0 }, 0.05), start)
  })

  test('para encostado num obstáculo da lista de sólidos', () => {
    let position = { x: 560, y: 420 }
    for (let frame = 0; frame < 30; frame++) position = moveRoomPlayer(position, { x: 1, y: 0 }, 0.05, 1, [...ROOM_WALLS, block])
    assert.deepEqual(position, { x: 600 - PLAYER_FEET_BOX.width / 2, y: 420 })
  })

  test('o obstáculo fora da lista não bloqueia', () => {
    const position = moveRoomPlayer({ x: 570, y: 420 }, { x: 1, y: 0 }, 0.05)
    assert.equal(position.x, 570 + ROOM_PLAYER_SPEED * 0.05)
  })
})
