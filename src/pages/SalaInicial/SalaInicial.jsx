import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../routes/paths.js'
import { createPlayer, updatePlayer } from '../../utils/player.js'
import {
  getAttackDirection,
  getRoomMovement,
  isRoomKey,
  ROOM_PLAYER_START,
  shouldReturnToMenu,
} from '../../utils/roomMovement.js'
import { drawDebug } from './scene/drawDebug.js'
import { drawPlayer } from './scene/drawPlayer.js'
import { drawRoom } from './scene/drawRoom.js'
import { loadSheets } from './scene/sheets.js'
import { getRoomView, getVisibleRoom } from './scene/view.js'
import './SalaInicial.css'

// A sala é só de teclado: cliques e menu de contexto não fazem nada aqui
const BLOCKED_MOUSE_EVENTS = ['mousedown', 'mouseup', 'click', 'contextmenu']

function blockMouse(event) {
  event.preventDefault()
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
    const sheets = loadSheets()
    // Quem pede "reduzir movimento" no sistema vê o andar parado no quadro 0
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const pressedKeys = new Set()
    let player = createPlayer(ROOM_PLAYER_START)
    let showDebug = false // F3, só no npm run dev
    let view = getRoomView(0, 0)
    let visibleRoom // parte da sala que aparece na tela: o fundo é desenhado até as bordas dela
    let pixelRatio = 1

    // Ajusta a resolução do canvas à tela (e ao zoom/telas de alta densidade)
    function resize() {
      pixelRatio = window.devicePixelRatio || 1
      canvas.width = Math.round(canvas.clientWidth * pixelRatio)
      canvas.height = Math.round(canvas.clientHeight * pixelRatio)
      view = getRoomView(canvas.clientWidth, canvas.clientHeight)
      visibleRoom = getVisibleRoom(view, canvas.clientWidth, canvas.clientHeight)
    }

    function handleKeyDown(event) {
      if (event.altKey || event.ctrlKey || event.metaKey || event.isComposing) return

      if (shouldReturnToMenu(event.key)) {
        event.preventDefault()
        pressedKeys.clear()
        navigate(ROUTES.menuPrincipal)
        return
      }

      // import.meta.env.DEV é false no build: este trecho e o drawDebug saem do pacote
      if (import.meta.env.DEV && event.code === 'F3') {
        event.preventDefault()
        showDebug = !showDebug
        return
      }

      // preventDefault também nas setas, para a página não rolar
      if (!isRoomKey(event.code)) return

      event.preventDefault()
      pressedKeys.add(event.code)
    }

    function handleKeyUp(event) {
      pressedKeys.delete(event.code)
    }

    function clearPressedKeys() {
      pressedKeys.clear()
    }

    let previousTime
    let animationFrame

    function update(time) {
      const deltaSeconds = previousTime === undefined ? 0 : (time - previousTime) / 1000
      previousTime = time

      player = updatePlayer(
        player,
        { movement: getRoomMovement(pressedKeys), attackDirection: getAttackDirection(pressedKeys) },
        deltaSeconds,
      )

      draw()
      animationFrame = window.requestAnimationFrame(update)
    }

    function draw() {
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      // A partir daqui, tudo é desenhado em unidades da sala
      const scale = view.scale * pixelRatio
      ctx.setTransform(scale, 0, 0, scale, view.offsetX * pixelRatio, view.offsetY * pixelRatio)
      drawRoom(ctx, visibleRoom)

      drawPlayer(ctx, sheets, player, reduceMotion)
      if (import.meta.env.DEV && showDebug) drawDebug(ctx, player)
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
        Use as teclas W, A, S e D para mover o personagem pela sala e as setas para atacar.
      </p>

      <canvas ref={canvasRef} className="sala-inicial__canvas" aria-hidden="true" />
    </main>
  )
}
