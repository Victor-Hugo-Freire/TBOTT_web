import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { apiRequest } from '../../services/api.js'
import { ROUTES } from '../../routes/paths.js'
import { formatRunTime } from '../../utils/formatDuration.js'
import { getDeathCauseLabel } from '../../utils/health.js'
import { normalizeProgressPayload } from '../../utils/progress.js'
import { createRunSeed } from '../../utils/random.js'
import {
  getAttackDirection,
  getRoomMovement,
  isRoomKey,
  RESTART_KEY,
  ROOM_FLOOR,
  ROOM_SIZE,
  shouldReturnToMenu,
} from '../../utils/roomMovement.js'
import {
  createRun,
  createRunSnapshot,
  getRestartFade,
  RESTART_HOLD_MS,
  updateRestartHold,
  updateRestartKey,
  updateRun,
} from '../../utils/run.js'
import { drawDebug, drawDebugPanel } from './scene/drawDebug.js'
import { drawFloorBanner } from './scene/drawFloorBanner.js'
import { drawHud, loadHudImages } from './scene/drawHud.js'
import { drawRunScene, getFloorFade } from './scene/drawScene.js'
import { drawTimer } from './scene/drawTimer.js'
import { loadSheets } from './scene/sheets.js'
import { getHudTop, getRoomView } from './scene/view.js'
import './SalaInicial.css'

// De quanto em quanto tempo o progresso é salvo na API (também é salvo ao sair da sala)
const SAVE_INTERVAL_MS = 5000
// Passo máximo do jogo num quadro: depois de uma pausa longa (aba escondida), nada dá um salto
const MAX_STEP_MS = 100

// A sala é só de teclado: cliques e menu de contexto não fazem nada aqui (só no aviso de fim da run)
const BLOCKED_MOUSE_EVENTS = ['mousedown', 'mouseup', 'click', 'contextmenu']

// Texto do aviso de fim conforme o resultado (vitória ou morte) e o envio à API.
// Só a vitória vai para o ranking; a derrota é enviada para a API encerrar a partida salva.
function getEndingMessage(ending) {
  if (ending.status === 'error') return ending.message
  if (ending.outcome === 'defeat') return ending.status === 'sending' ? 'Encerrando a run...' : 'A run acabou.'
  return ending.status === 'sending' ? 'Enviando o tempo ao ranking...' : 'Tempo enviado ao ranking.'
}

// A sala é um canvas em tela cheia. A run (andar, sala, jogador, transições) fica em
// variáveis do efeito e é desenhada a cada quadro: o React não renderiza de novo
// enquanto o personagem anda. O estado do React só guarda o andar (para o leitor de tela)
// e o aviso de fim da run.
export default function SalaInicial() {
  const navigate = useNavigate()
  const location = useLocation()
  const roomRef = useRef(null)
  const canvasRef = useRef(null)
  const endingRef = useRef(null)
  const menuButtonRef = useRef(null)
  const retryRef = useRef(null)
  const [floorInfo, setFloorInfo] = useState(null) // { number, name } do andar atual
  // Aviso de fim: { outcome: 'victory' | 'defeat', cause, time, status: 'sending' | 'sent' | 'error', message }
  const [ending, setEnding] = useState(null)
  const endingStatus = ending?.status

  // Personagem escolhido na seleção: o id vai para a run (e para o ranking) e o nome para o leitor de tela.
  // O canvas desenha sempre o Tung Tung Sahur, o único com sprite (os outros virão depois)
  const selectedCharacter = location.state?.character ?? {
    id: 'tung-tung-sahur',
    name: 'Tung Tung Sahur',
    description: 'Personagem principal do jogo.',
  }

  // O aviso de fim já abre com o foco no "Voltar ao menu" (e volta para ele a cada mudança do envio)
  useEffect(() => {
    if (endingStatus) menuButtonRef.current?.focus()
  }, [endingStatus])

  useEffect(() => {
    roomRef.current?.focus()

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const sheets = loadSheets()
    const hudImages = loadHudImages()
    // Quem pede "reduzir movimento" no sistema vê o andar parado no quadro 0, a faixa sem deslizar
    // e a troca de sala por escurecimento
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const pressedKeys = new Set()
    // A run só existe depois de ler o progresso: assim o andar não troca debaixo do personagem
    let run = null
    let elapsedMs = 0 // tempo de jogo ativo, em milissegundos
    let previousTime
    let isPaused = !document.hasFocus()
    let animationFrame
    // O progresso só é salvo depois de lido: assim uma sala "em branco" nunca
    // apaga o que já estava salvo (F5, botão Avançar do navegador, endereço digitado)
    let canSave = false
    let isCancelled = false
    let sendingResult = false // o POST /api/runs do fim da run está em andamento
    let saving = null // salvamento em andamento (o fim da run espera por ele)
    let saveAgain = false
    let resultSent = false
    let outcome = 'victory' // resultado da run que acabou: 'victory' (tambor do andar 5) ou 'defeat' (morreu)
    let deathCause = null // o que matou o personagem (id de health.js), para o aviso
    let restartHoldMs = 0 // há quanto tempo o R está segurado (a tela escurece junto)
    let restartHeld = false // a tecla R está segurada (veja updateRestartKey em run.js)
    let announcedFloor = 0
    let showDebug = false // F3, só no npm run dev
    let view = getRoomView(0, 0)
    let pixelRatio = 1

    // O andar, a sala, a posição e o tempo vêm da API (e não do state da navegação, que o navegador
    // guarda no histórico e pode estar velho). A partida nova já foi salva pela seleção, sem seed.
    async function loadProgress() {
      let progress = normalizeProgressPayload(null)
      let characterId = selectedCharacter.id
      try {
        const response = await apiRequest('/api/progress', { credentials: 'include' })
        if (isCancelled) return
        // Sem partida salva (ex.: a run acabou e o POST /api/runs apagou o progresso), não há o que jogar:
        // criar uma run aqui salvaria uma partida que ninguém pediu e religaria o Continue
        if (!response?.exists) {
          navigate(ROUTES.menuPrincipal, { replace: true })
          return
        }
        progress = normalizeProgressPayload(response.progress)
        characterId = progress.characterId
        canSave = true
      } catch (error) {
        if (isCancelled) return
        // Sem conseguir ler o progresso, joga com uma seed nova, mas não salva nada nesta visita
        // (isso protege o que já existe)
        if (error?.status !== 401) console.warn('Não foi possível carregar o progresso.', error)
      }

      // Partida nova (ou save antigo, sem seed): a sala cria a seed e salva na hora
      const isNewSeed = progress.seed === null
      run = createRun({
        seed: progress.seed ?? createRunSeed(),
        floorNumber: progress.floor,
        roomId: progress.roomId,
        position: { x: progress.playerX, y: progress.playerY },
        characterId,
        visitedRoomIds: progress.visitedRoomIds,
        roomStates: progress.roomStates,
        health: progress.health,
        forks: progress.forks,
      })
      elapsedMs = progress.elapsedMs

      // Run que já acabou (o jogador saiu antes de o tempo chegar ao ranking, pelo Voltar do navegador ou F5):
      // não deixa jogar de novo nem envia sozinho (o primeiro envio pode ainda estar a caminho e o tempo
      // entraria duas vezes). Mostra o aviso de fim, com o botão para enviar de novo se for preciso.
      if (progress.finished) {
        // Sem vida (ou com a causa da morte salva), a run acabou em derrota
        const died = progress.deathCause !== null || progress.health <= 0
        outcome = died ? 'defeat' : 'victory'
        deathCause = progress.deathCause
        run = { ...run, finished: true, death: died ? { cause: deathCause } : null }
        // Morto, ele já aparece caído atrás do aviso (tempo infinito = último quadro da animação de morte)
        if (died) run.player = { ...run.player, dead: { elapsed: Infinity } }
        resultSent = true
        setEnding({
          outcome,
          cause: deathCause,
          time: formatRunTime(elapsedMs),
          status: 'error',
          message: died
            ? 'Esta run já terminou. Envie o resultado de novo para poder começar outra.'
            : 'Esta run já terminou. Se o tempo ainda não aparece no ranking, envie de novo.',
        })
        return
      }
      if (isNewSeed) void saveProgress()
    }

    async function putProgress() {
      try {
        const snapshot = createRunSnapshot(run, elapsedMs)
        await apiRequest('/api/progress', { method: 'PUT', credentials: 'include', body: JSON.stringify(snapshot) })
      } catch (error) {
        if (error?.status !== 401) console.warn('Não foi possível salvar o progresso.', error)
      }
    }

    // Salva uma requisição por vez: se pedirem outra durante o envio, ela roda logo depois.
    // Depois do fim da run não salva mais: o POST /api/runs apaga o progresso e um PUT o recriaria.
    async function saveProgress() {
      if (!canSave || !run || run.finished) return
      if (saving) {
        saveAgain = true
        return
      }

      saving = putProgress()
      await saving
      saving = null
      if (saveAgain) {
        saveAgain = false
        void saveProgress()
      }
    }

    // Fim da run (vitória no andar 5 ou morte): salva uma última vez e envia o resultado.
    // O último PUT leva finished: true. Se o envio falhar, o Continue reabre este aviso para enviar de novo.
    async function finishRun() {
      outcome = run.death ? 'defeat' : 'victory'
      deathCause = run.death?.cause ?? null
      sendingResult = true
      setEnding({ outcome, cause: deathCause, time: formatRunTime(elapsedMs), status: 'sending' })
      if (saving) await saving
      if (canSave) await putProgress()
      await sendRunResult()
    }

    // O POST /api/runs grava a run (vitória ou derrota) e apaga o progresso salvo.
    // Enquanto ele não termina, não dá para sair: o menu leria o progresso antes de a API apagá-lo
    // e mostraria um Continue que leva a uma partida já encerrada
    async function sendRunResult() {
      const result = { outcome, cause: deathCause, time: formatRunTime(elapsedMs) }
      sendingResult = true
      setEnding({ ...result, status: 'sending' })
      try {
        const body = { characterId: run.characterId, durationMs: Math.max(1, Math.round(elapsedMs)), status: outcome }
        await apiRequest('/api/runs', { method: 'POST', credentials: 'include', body: JSON.stringify(body) })
        if (!isCancelled) setEnding({ ...result, status: 'sent' })
      } catch (error) {
        if (isCancelled) return
        setEnding({ ...result, status: 'error', message: error?.message || 'Não foi possível enviar o resultado da run.' })
      } finally {
        sendingResult = false
      }
    }
    retryRef.current = sendRunResult

    // Recomeça do andar 1 com outra seed, vida cheia e o tempo zerado, e salva por cima da partida anterior.
    // A tela está preta nesta hora. O tempo segurado volta a 0: a tela clareia na run nova e, com o R ainda
    // segurado, escurece de novo e recomeça outra vez (uma run atrás da outra, como no Isaac).
    function restartRun() {
      run = createRun({ seed: createRunSeed(), characterId: run.characterId })
      elapsedMs = 0
      restartHoldMs = 0
      void saveProgress()
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
        if (!sendingResult) navigate(ROUTES.menuPrincipal)
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
      // O R fica fora de pressedKeys: só um aperto novo conta, e não o keydown que o teclado repete
      if (event.code === RESTART_KEY) {
        restartHeld = updateRestartKey(restartHeld, event.repeat ? 'repeat' : 'press')
        return
      }
      pressedKeys.add(event.code)
    }

    function handleKeyUp(event) {
      pressedKeys.delete(event.code)
      if (event.code === RESTART_KEY) restartHeld = updateRestartKey(restartHeld, 'release')
    }

    function clearPressedKeys() {
      pressedKeys.clear()
      restartHeld = updateRestartKey(restartHeld, 'blur')
    }

    // Só os botões do aviso de fim da run aceitam o mouse
    function blockMouse(event) {
      if (endingRef.current?.contains(event.target) && event.target.closest('button')) return
      event.preventDefault()
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

      if (run) {
        const stepMs = Math.min(deltaMs, MAX_STEP_MS)
        // O contador para com a janela sem foco, quando o personagem morre e no fim da run
        if (!isPaused && !run.finished && !run.death) elapsedMs += deltaMs
        run = updateRun(
          run,
          { movement: getRoomMovement(pressedKeys), attackDirection: getAttackDirection(pressedKeys) },
          stepMs / 1000,
        )

        // Segurar R escurece a tela e, ao completar, recomeça a run (não vale na morte nem depois do fim)
        const holdingRestart = restartHeld && !run.finished && !run.death
        restartHoldMs = updateRestartHold(restartHoldMs, holdingRestart, stepMs)
        if (holdingRestart && restartHoldMs >= RESTART_HOLD_MS) restartRun()

        // Chegou a um andar novo: o leitor de tela anuncia o nome
        if (run.floor.number !== announcedFloor) {
          announcedFloor = run.floor.number
          setFloorInfo({ number: run.floor.number, name: run.floor.name })
        }
        if (run.finished && !resultSent) {
          resultSent = true
          void finishRun()
        }
      }

      draw()
      animationFrame = window.requestAnimationFrame(update)
    }

    function draw() {
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      if (!run) return

      // A partir daqui, tudo é desenhado em unidades da sala
      const scale = view.scale * pixelRatio
      ctx.setTransform(scale, 0, 0, scale, view.offsetX * pixelRatio, view.offsetY * pixelRatio)
      // Área da tela em unidades da sala: as paredes laterais continuam até a borda da tela
      const screen = {
        left: -view.offsetX / view.scale,
        top: -view.offsetY / view.scale,
        width: canvas.clientWidth / view.scale,
        height: canvas.clientHeight / view.scale,
      }
      drawRunScene(ctx, run, sheets, reduceMotion, screen)
      if (import.meta.env.DEV && showDebug) drawDebug(ctx, run)

      // Faixa, HUD e contador são desenhados em pixels da tela (sem a escala da sala), para ficarem nítidos
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      const toScreenX = (x) => Math.round((view.offsetX + x * view.scale) * pixelRatio)
      const toScreenY = (y) => Math.round((view.offsetY + y * view.scale) * pixelRatio)
      const pixelSize = Math.max(2, Math.round(4 * scale))
      // Parte da sala que aparece na tela (a tela larga corta um pouco da parede de cima, veja view.js)
      const visibleTop = Math.max(0, screen.top)
      const visibleHeight = Math.min(ROOM_SIZE.height, screen.top + screen.height) - visibleTop

      if (run.banner) {
        drawFloorBanner(ctx, {
          text: run.banner.text,
          elapsedMs: run.banner.elapsedMs,
          reduceMotion,
          left: toScreenX(ROOM_FLOOR.left),
          right: toScreenX(ROOM_FLOOR.right),
          centerY: toScreenY(visibleTop + visibleHeight * 0.18),
          pixelSize: Math.max(3, Math.round(6 * scale)),
        })
      }

      // O contador e o HUD começam na mesma altura, no alto da tela
      const hudTop = toScreenY(getHudTop(visibleTop))

      // HUD no canto de cima à esquerda, sobre a parede lateral (ou na sobra da tela, quando ela é mais larga que a sala):
      // os corações em cima e os contadores de grão e de garfo embaixo deles
      drawHud(ctx, hudImages, {
        health: run.health,
        grains: run.grains,
        forks: run.forks,
        left: toScreenX(screen.left + 20),
        top: hudTop,
        pixelSize,
      })

      drawTimer(ctx, formatRunTime(elapsedMs), Math.round((canvas.clientWidth / 2) * pixelRatio), hudTop, pixelSize)

      // Troca de andar, fim da run e R segurado: a tela escurece por cima de tudo
      const fade = Math.max(getFloorFade(run), getRestartFade(restartHoldMs))
      if (fade > 0) {
        ctx.fillStyle = `rgba(0, 0, 0, ${fade})`
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }

      if (import.meta.env.DEV && showDebug) {
        drawDebugPanel(ctx, run, {
          right: canvas.width - Math.round(12 * pixelRatio),
          top: Math.round(12 * pixelRatio),
          fontSize: Math.round(13 * pixelRatio),
        })
      }
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
      void saveProgress() // ao sair da sala (depois do fim da run, não salva)
    }
  }, [navigate, selectedCharacter.id])

  const characterName = selectedCharacter.name || 'Tung Tung Sahur'

  return (
    <main
      className="sala-inicial"
      ref={roomRef}
      tabIndex={0}
      aria-label="Jogo"
    >
      <title>Jogo | The Binding of Tung Tung</title>
      <h1 className="visually-hidden">Jogo</h1>
      <p className="visually-hidden">
        Use as teclas W, A, S e D para mover o personagem pela sala e as setas para atacar. Segure a tecla R para
        recomeçar a run.
      </p>
      {/* Anuncia o nome do andar ao chegar a cada andar */}
      <p className="visually-hidden" aria-live="polite">
        {floorInfo ? `Andar ${floorInfo.number}: ${floorInfo.name}` : ''}
      </p>

      <canvas
        ref={canvasRef}
        className="sala-inicial__canvas"
        role="img"
        aria-label={floorInfo ? `Andar ${floorInfo.number}, ${floorInfo.name}, com ${characterName}` : `Sala com ${characterName}`}
      />

      {ending && (
        <div className="sala-inicial__fim" ref={endingRef}>
          <section className="sala-inicial__fim-painel" role="dialog" aria-modal="true" aria-labelledby="sala-inicial-fim-titulo">
            <h2 id="sala-inicial-fim-titulo" className="sala-inicial__fim-titulo">
              {ending.outcome === 'defeat' ? 'Você morreu' : 'Fim da run'}
            </h2>
            {ending.outcome === 'defeat' && (
              <p className="sala-inicial__fim-mensagem">
                O {characterName} morreu para {getDeathCauseLabel(ending.cause)}.
              </p>
            )}
            <p className="sala-inicial__fim-tempo">{ending.time}</p>
            <p className="sala-inicial__fim-mensagem" role="status">{getEndingMessage(ending)}</p>
            <div className="sala-inicial__fim-botoes">
              <button ref={menuButtonRef} type="button" className="sala-inicial__fim-botao" onClick={() => ending.status !== 'sending' && navigate(ROUTES.menuPrincipal)}>
                Voltar ao menu
              </button>
              {ending.status === 'error' && (
                <button type="button" className="sala-inicial__fim-botao" onClick={() => retryRef.current?.()}>
                  Tentar de novo
                </button>
              )}
            </div>
          </section>
        </div>
      )}
    </main>
  )
}
