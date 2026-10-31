import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { CHARACTER_SPRITES } from '../../data/characterSprites.js'
import { ROUTES } from '../../routes/paths.js'
import {
  getRoomMovement,
  moveRoomPlayer,
  ROOM_PLAYER_START,
  shouldReturnToMenu,
} from '../../utils/roomMovement.js'
import { drawRoom } from './scene/drawRoom.js'
import { drawSprite } from './scene/drawSprite.js'
import { getRoomView } from './scene/view.js'
import './SalaInicial.css'

// A sala é só de teclado: cliques e menu de contexto não fazem nada aqui
const BLOCKED_MOUSE_EVENTS = ['mousedown', 'mouseup', 'click', 'contextmenu']

const WALK_FPS = 8

function blockMouse(event) {
  event.preventDefault()
}

function getFacingDirection(movement, currentDirection) {
  if (movement.y < 0) return 'up'
  if (movement.y > 0) return 'down'
  if (movement.x < 0) return 'left'
  if (movement.x > 0) return 'right'
  return currentDirection
}

// A sala é um canvas em tela cheia. O jogo (posição, direção, animação) fica em
// variáveis do efeito e é desenhado a cada quadro: o React não renderiza de novo
// enquanto o personagem anda.
export default function SalaInicial() {
  const navigate = useNavigate()
  const roomRef = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    roomRef.current?.focus()

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const sprite = CHARACTER_SPRITES.tungTungSahur
    const image = new Image()
    image.src = sprite.src
    // Quem pede "reduzir movimento" no sistema vê o personagem sempre no quadro 0
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const pressedKeys = new Set()
    const player = { x: ROOM_PLAYER_START.x, y: ROOM_PLAYER_START.y, direction: 'down', walkTime: 0 }
    let view = getRoomView(0, 0)
    let pixelRatio = 1

    // Ajusta a resolução do canvas à tela (e ao zoom/telas de alta densidade)
    function resize() {
      pixelRatio = window.devicePixelRatio || 1
      canvas.width = Math.round(canvas.clientWidth * pixelRatio)
      canvas.height = Math.round(canvas.clientHeight * pixelRatio)
      view = getRoomView(canvas.clientWidth, canvas.clientHeight)
    }

    function handleKeyDown(event) {
      if (event.altKey || event.ctrlKey || event.metaKey || event.isComposing) return

      if (shouldReturnToMenu(event.key)) {
        event.preventDefault()
        pressedKeys.clear()
        navigate(ROUTES.menuPrincipal)
        return
      }

      const key = event.key.toLowerCase()
      const movement = getRoomMovement(new Set([key]))
      if (movement.x === 0 && movement.y === 0) return

      event.preventDefault()
      pressedKeys.add(key)
    }

    function handleKeyUp(event) {
      pressedKeys.delete(event.key.toLowerCase())
    }

    function clearPressedKeys() {
      pressedKeys.clear()
    }

    let previousTime
    let animationFrame

    function update(time) {
      const deltaSeconds = previousTime === undefined ? 0 : (time - previousTime) / 1000
      previousTime = time

      const movement = getRoomMovement(pressedKeys)
      if (movement.x !== 0 || movement.y !== 0) {
        player.direction = getFacingDirection(movement, player.direction)
        const next = moveRoomPlayer(player, movement, deltaSeconds)
        player.x = next.x
        player.y = next.y
        player.walkTime += deltaSeconds
      } else {
        player.walkTime = 0
      }

      draw()
      animationFrame = window.requestAnimationFrame(update)
    }

    function draw() {
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      // A partir daqui, tudo é desenhado em unidades da sala
      const scale = view.scale * pixelRatio
      ctx.setTransform(scale, 0, 0, scale, view.offsetX * pixelRatio, view.offsetY * pixelRatio)
      drawRoom(ctx)

      const frame = reduceMotion ? 0 : Math.floor(player.walkTime * WALK_FPS) % sprite.framesPerRow
      drawSprite(ctx, image, sprite, player.direction, frame, player)
    }

    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('blur', clearPressedKeys)
    BLOCKED_MOUSE_EVENTS.forEach((name) => window.addEventListener(name, blockMouse))
    animationFrame = window.requestAnimationFrame(update)

    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('blur', clearPressedKeys)
      BLOCKED_MOUSE_EVENTS.forEach((name) => window.removeEventListener(name, blockMouse))
      window.cancelAnimationFrame(animationFrame)
    }
  }, [navigate])

  return (
    <main
      className="sala-inicial"
      ref={roomRef}
      tabIndex={0}
      aria-label="Sala inicial"
    >
      <title>Sala inicial | The Binding of Tung Tung</title>
      <h1 className="visually-hidden">Sala inicial</h1>
      <p className="visually-hidden">
        Use as teclas W, A, S e D para mover o personagem pela sala.
      </p>

      <canvas ref={canvasRef} className="sala-inicial__canvas" aria-hidden="true" />
    </main>
  )
}
