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

// A sala é só de teclado: cliques e menu de contexto não fazem nada aqui
// De quanto em quanto tempo o progresso é salvo na API (também é salvo ao sair da sala)
const SAVE_INTERVAL_MS = 5000

const BLOCKED_MOUSE_EVENTS = ['mousedown', 'mouseup', 'click', 'contextmenu']

function blockMouse(event) {
  event.preventDefault()
}

// A sala é um canvas em tela cheia. O jogo (posição, direção, animação) fica em
// variáveis do efeito e é desenhado a cada quadro: o React não renderiza de novo
// enquanto o personagem anda.
export default function SalaInicial() {
  const navigate = useNavigate()
  const location = useLocation()
  const roomRef = useRef(null)
  const canvasRef = useRef(null)

  // Personagem escolhido na seleção. Por enquanto só o nome é usado: o canvas
  // desenha o Tung Tung Sahur, o único com sprite (os outros virão depois)
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
    // Quem pede "reduzir movimento" no sistema vê o andar parado no quadro 0
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const pressedKeys = new Set()
    let player = createPlayer(ROOM_PLAYER_START)
    let characterId = selectedCharacter.id
    let elapsedMs = 0 // tempo de jogo ativo, em milissegundos
    let previousTime
    let isPaused = !document.hasFocus()
    let animationFrame
    // O progresso só é salvo depois de carregado: assim uma sala "em branco" nunca
    // apaga o que já estava salvo (F5, botão Avançar do navegador, endereço digitado)
    let progressLoaded = false
    let isCancelled = false
    let isSaving = false
    let saveAgain = false
    let showDebug = false // F3, só no npm run dev
    let view = getRoomView(0, 0)
    let pixelRatio = 1

    // A posição e o tempo vêm da API (e não do state da navegação, que o navegador
    // guarda no histórico e pode estar velho). A partida nova já foi salva pela seleção.
    async function loadProgress() {
      try {
        const response = await apiRequest('/api/progress', { credentials: 'include' })
        if (isCancelled) return

        if (response?.exists) {
          const progress = normalizeProgressPayload(response.progress)
          player = createPlayer({ x: progress.playerX, y: progress.playerY })
          elapsedMs = progress.elapsedMs
          characterId = progress.characterId
        }
        progressLoaded = true
      } catch (error) {
        // Sem conseguir ler o progresso, não salvamos nada nesta visita (isso protege o que já existe)
        if (error?.status !== 401) console.warn('Não foi possível carregar o progresso.', error)
      }
    }

    // Salva uma requisição por vez: se pedirem outra durante o envio, ela roda logo depois
    async function saveProgress() {
      if (!progressLoaded) return
      if (isSaving) {
        saveAgain = true
        return
      }

      isSaving = true
      try {
        const snapshot = createProgressSnapshot({ player, elapsedMs, characterId })
        await apiRequest('/api/progress', { method: 'PUT', credentials: 'include', body: JSON.stringify(snapshot) })
      } catch (error) {
        if (error?.status !== 401) console.warn('Não foi possível salvar o progresso.', error)
      } finally {
        isSaving = false
        if (saveAgain) {
          saveAgain = false
          void saveProgress()
        }
      }
    }

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

    // Janela sem foco (outra aba, outro programa): o contador para e não conta esse tempo
    function handleBlur() {
      isPaused = true
    }

    function handleFocus() {
      isPaused = false
      previousTime = undefined
    }

    function update(time) {
      const deltaMs = previousTime === undefined ? 0 : time - previousTime
      previousTime = time
      // O contador só anda depois de carregar o progresso salvo (que traz o tempo já jogado)
      if (progressLoaded && !isPaused) elapsedMs += deltaMs

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
      // A partir daqui, tudo é desenhado em unidades da sala
      const scale = view.scale * pixelRatio
      ctx.setTransform(scale, 0, 0, scale, view.offsetX * pixelRatio, view.offsetY * pixelRatio)
      // As paredes laterais continuam até a borda da tela (a sobra de cada lado, em unidades da sala)
      drawRoom(ctx, view.offsetX / view.scale)

      drawPlayer(ctx, sheets, player, reduceMotion)
      if (import.meta.env.DEV && showDebug) drawDebug(ctx, player)

      // O contador é desenhado em pixels da tela (sem a escala da sala), para ficar nítido
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      const pixelSize = Math.max(2, Math.round(4 * scale))
      const timerTop = Math.round((view.offsetY + (ROOM_VIEW_CROP + 12) * view.scale) * pixelRatio)
      drawTimer(ctx, formatRunTime(elapsedMs), Math.round((canvas.clientWidth / 2) * pixelRatio), timerTop, pixelSize)
    }

    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('blur', clearPressedKeys)
    window.addEventListener('blur', handleBlur)
    window.addEventListener('focus', handleFocus)
    BLOCKED_MOUSE_EVENTS.forEach((name) => window.addEventListener(name, blockMouse))
    void loadProgress()
    // Parado na janela sem foco, não há o que salvar
    const saveTimer = window.setInterval(() => {
      if (!isPaused) void saveProgress()
    }, SAVE_INTERVAL_MS)
    animationFrame = window.requestAnimationFrame(update)

    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('blur', clearPressedKeys)
      window.removeEventListener('blur', handleBlur)
      window.removeEventListener('focus', handleFocus)
      BLOCKED_MOUSE_EVENTS.forEach((name) => window.removeEventListener(name, blockMouse))
      window.clearInterval(saveTimer)
      window.cancelAnimationFrame(animationFrame)
      isCancelled = true
      void saveProgress() // ao sair da sala
    }
  }, [navigate, selectedCharacter.id])

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
