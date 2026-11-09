import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { apiRequest } from '../../services/api.js'
import { ROUTES } from '../../routes/paths.js'
import { formatRunTime } from '../../utils/formatDuration.js'
import { createPlayer, updatePlayer } from '../../utils/player.js'
import { createProgressSnapshot, normalizeProgressPayload } from '../../utils/progress.js'
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
import { drawTimer } from './scene/drawTimer.js'
import { loadSheets } from './scene/sheets.js'
import { getRoomView, ROOM_VIEW_CROP } from './scene/view.js'
import './SalaInicial.css'

const BLOCKED_MOUSE_EVENTS = ['mousedown', 'mouseup', 'click', 'contextmenu']

function blockMouse(event) {
  event.preventDefault()
}

export default function SalaInicial() {
  const navigate = useNavigate()
  const location = useLocation()
  const roomRef = useRef(null)
  const canvasRef = useRef(null)

  const selectedCharacter = location.state?.character ?? {
    id: 'tung-tung-sahur',
    name: 'Tung Tung Sahur',
    description: 'Personagem principal do jogo.',
  }

  useEffect(() => {
    roomRef.current?.focus()

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const sheets = loadSheets()
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const pressedKeys = new Set()
    const continueProgress = normalizeProgressPayload(location.state?.continueProgress ?? {}, {
      roomId: 'sala-inicial',
      characterId: selectedCharacter.id,
      playerX: ROOM_PLAYER_START.x,
      playerY: ROOM_PLAYER_START.y,
      elapsedMs: 0,
    })

    let player = createPlayer({ x: continueProgress.playerX, y: continueProgress.playerY })
    let showDebug = false
    let view = getRoomView(0, 0)
    let pixelRatio = 1
    let previousTime
    let elapsedMs = continueProgress.elapsedMs
    let isPaused = false
    let saveInFlight = false
    let queuedSave = false
    let animationFrame

    async function persistProgress() {
      if (saveInFlight) {
        queuedSave = true
        return
      }

      saveInFlight = true
      const payload = createProgressSnapshot({
        player,
        elapsedMs,
        characterId: selectedCharacter.id,
        roomId: 'sala-inicial',
      })

      try {
        await apiRequest('/api/progress', {
          method: 'PUT',
          credentials: 'include',
          body: JSON.stringify(payload),
        })
      } catch (error) {
        if (error?.status !== 401) console.warn('Não foi possível salvar o progresso.', error)
      } finally {
        saveInFlight = false
        if (queuedSave) {
          queuedSave = false
          void persistProgress()
        }
      }
    }

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

      if (import.meta.env.DEV && event.code === 'F3') {
        event.preventDefault()
        showDebug = !showDebug
        return
      }

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

    function handleBlur() {
      isPaused = true
      previousTime = undefined
    }

    function handleFocus() {
      isPaused = false
      previousTime = undefined
    }

    function update(time) {
      const deltaMs = previousTime === undefined ? 0 : time - previousTime
      previousTime = time

      if (!isPaused) elapsedMs += deltaMs

      player = updatePlayer(
        player,
        { movement: getRoomMovement(pressedKeys), attackDirection: getAttackDirection(pressedKeys) },
        deltaMs / 1000,
      )

      draw()
      animationFrame = window.requestAnimationFrame(update)
    }

    function draw() {
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const scale = view.scale * pixelRatio
      ctx.setTransform(scale, 0, 0, scale, view.offsetX * pixelRatio, view.offsetY * pixelRatio)
      drawRoom(ctx, view.offsetX / view.scale)

      drawPlayer(ctx, sheets, player, reduceMotion)
      if (import.meta.env.DEV && showDebug) drawDebug(ctx, player)

      ctx.setTransform(1, 0, 0, 1, 0, 0)
      const pixelSize = Math.max(2, Math.round(4 * scale))
      const timerTop = Math.round((view.offsetY + (ROOM_VIEW_CROP + 12) * view.scale) * pixelRatio)
      drawTimer(ctx, formatRunTime(elapsedMs), Math.round((canvas.clientWidth / 2) * pixelRatio), timerTop, pixelSize)
    }

    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('blur', handleBlur)
    window.addEventListener('focus', handleFocus)
    window.addEventListener('blur', clearPressedKeys)
    BLOCKED_MOUSE_EVENTS.forEach((name) => window.addEventListener(name, blockMouse))

    if (!location.state?.continueProgress) {
      void persistProgress()
    }

    const saveTimer = window.setInterval(() => {
      void persistProgress()
    }, 5000)

    animationFrame = window.requestAnimationFrame(update)

    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('blur', handleBlur)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('blur', clearPressedKeys)
      BLOCKED_MOUSE_EVENTS.forEach((name) => window.removeEventListener(name, blockMouse))
      window.clearInterval(saveTimer)
      window.cancelAnimationFrame(animationFrame)
      void persistProgress()
    }
  }, [location.state?.continueProgress, navigate, selectedCharacter.id])

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

      <canvas
        ref={canvasRef}
        className="sala-inicial__canvas"
        role="img"
        aria-label={`Sala inicial com ${selectedCharacter.name || 'Tung Tung Sahur'}`}
      />
    </main>
  )
}
