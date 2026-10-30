import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import CharacterSprite from '../../components/CharacterSprite/CharacterSprite.jsx'
import { CHARACTER_SPRITES } from '../../data/characterSprites.js'
import { ROUTES } from '../../routes/paths.js'
import {
  getRoomMovement,
  moveRoomPlayer,
  ROOM_SIZE,
  shouldReturnToMenu,
} from '../../utils/roomMovement.js'
import './SalaInicial.css'

const INITIAL_POSITION = { x: ROOM_SIZE.width / 2, y: 460 }

// A sala é só de teclado: cliques e menu de contexto não fazem nada aqui
const BLOCKED_MOUSE_EVENTS = ['mousedown', 'mouseup', 'click', 'contextmenu']

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

export default function SalaInicial() {
  const navigate = useNavigate()
  const location = useLocation()
  const roomRef = useRef(null)
  const pressedKeysRef = useRef(new Set())
  const [position, setPosition] = useState(INITIAL_POSITION)
  const [direction, setDirection] = useState('down')
  const [isMoving, setIsMoving] = useState(false)

  const selectedCharacter = location.state?.character ?? {
    id: 'tung-tung-sahur',
    name: 'Tung Tung Sahur',
    description: 'Personagem principal do jogo.',
  }

  useEffect(() => {
    roomRef.current?.focus()

    function handleKeyDown(event) {
      if (event.altKey || event.ctrlKey || event.metaKey || event.isComposing) return

      if (shouldReturnToMenu(event.key)) {
        event.preventDefault()
        pressedKeysRef.current.clear()
        navigate(ROUTES.menuPrincipal)
        return
      }

      const key = event.key.toLowerCase()
      const movement = getRoomMovement(new Set([key]))
      if (movement.x === 0 && movement.y === 0) return

      event.preventDefault()
      pressedKeysRef.current.add(key)
    }

    function handleKeyUp(event) {
      pressedKeysRef.current.delete(event.key.toLowerCase())
    }

    function clearPressedKeys() {
      pressedKeysRef.current.clear()
      setIsMoving(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('blur', clearPressedKeys)
    BLOCKED_MOUSE_EVENTS.forEach((name) => window.addEventListener(name, blockMouse))

    let previousTime
    let animationFrame

    function update(time) {
      const deltaSeconds = previousTime === undefined ? 0 : (time - previousTime) / 1000
      previousTime = time

      const movement = getRoomMovement(pressedKeysRef.current)
      const moving = movement.x !== 0 || movement.y !== 0
      setIsMoving((current) => (current === moving ? current : moving))

      if (moving) {
        setDirection((current) => getFacingDirection(movement, current))
        setPosition((current) => moveRoomPlayer(current, movement, deltaSeconds))
      }

      animationFrame = window.requestAnimationFrame(update)
    }

    animationFrame = window.requestAnimationFrame(update)
    return () => {
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

      <div className="sala-inicial__cenario">
        <CharacterSprite
          sprite={CHARACTER_SPRITES.tungTungSahur}
          direction={direction}
          animated={isMoving}
          fps={8}
          label={selectedCharacter.name || 'Tung Tung Sahur'}
          className="sala-inicial__personagem"
          style={{
            left: `${(position.x / ROOM_SIZE.width) * 100}%`,
            top: `${(position.y / ROOM_SIZE.height) * 100}%`,
          }}
        />
      </div>
    </main>
  )
}
