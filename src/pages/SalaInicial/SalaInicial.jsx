import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { apiRequest } from '../../services/api.js'
import { ROUTES } from '../../routes/paths.js'
import { formatRunTime } from '../../utils/formatDuration.js'
import { getDeathCauseLabel } from '../../utils/health.js'
import { CONSUMABLE_INFO } from '../../data/economy.js'
import { CONSUMABLE_SPRITES } from '../../data/itemSprites.js'
import { buildBossCatalog, buildEnemyCatalog, buildItemCatalog } from '../../utils/itemCatalog.js'
import { findNearbyPedestal, getRoomPedestals } from '../../utils/pedestals.js'
import { applyEndedRun, ENDED_RUN_STORAGE_KEY, normalizeProgressPayload } from '../../utils/progress.js'
import { getSleepFade, getSleepText } from '../../utils/roomInteractions.js'
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
  BANNER_TOTAL_MS,
  createRun,
  createRunSnapshot,
  getCurrentRoom,
  getEnterFade,
  getRestartFade,
  getRunStats,
  giveNextItem,
  giveRoomReward,
  removeTrainingTarget,
  RESTART_HOLD_MS,
  toggleTrainingTarget,
  updateRestartHold,
  updateRestartKey,
  updateRun,
} from '../../utils/run.js'
import { drawBossBar, getBossBar } from './scene/drawBossBar.js'
import { drawDebug, drawDebugPanel } from './scene/drawDebug.js'
import { drawFloorBanner } from './scene/drawFloorBanner.js'
import { drawHud, getHudBottom, loadHudImages } from './scene/drawHud.js'
import { drawItemInfo } from './scene/drawItemInfo.js'
import { drawItemList } from './scene/drawItemList.js'
import { drawMinimap } from './scene/drawMinimap.js'
import { loadDescriptionFont } from './scene/fonts.js'
import { drawRunScene, getFloorFade } from './scene/drawScene.js'
import { drawSleepText } from './scene/drawSleep.js'
import { drawTimer } from './scene/drawTimer.js'
import { loadSheets } from './scene/sheets.js'
import { getHudTop, getRoomView } from './scene/view.js'
import './SalaInicial.css'
import Opcoes from '../Opcoes/Opcoes.jsx'
import AvisoPersonagem, { AVISO_PERSONAGEM_MS } from '../../components/AvisoPersonagem/AvisoPersonagem.jsx'
import { ELIXIR_ITEM_ID, GOD_ID, SABOR_ID, SAHUR_ID } from '../../data/characterUnlocks.js'
import { retryPendingUnlocks, unlockCharacter } from '../../services/unlocks.js'
import { ITEM_SPRITES } from '../../data/itemSprites.js'
import { getMenuNavigationAction } from '../../utils/menuKeyboard.js'
import { canPauseRun } from '../../utils/pause.js'
import { getBaseStats } from '../../utils/stats.js'
import { getGameMusicContext, isSameGameMusicContext, notifyGameMusic } from '../../audio/music/contextoDoJogo.js'

function normalizePauseItemIcon(image) {
  if (!image?.complete || image.dataset.normalized === 'true') return

  const canvas = document.createElement('canvas')
  canvas.width = image.naturalWidth
  canvas.height = image.naturalHeight

  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) return

  context.drawImage(image, 0, 0)

  let pixels
  try {
    pixels = context.getImageData(0, 0, canvas.width, canvas.height).data
  } catch {
    return
  }

  let left = canvas.width
  let top = canvas.height
  let right = 0
  let bottom = 0

  for (let y = 0; y < canvas.height; y += 1) {
    for (let x = 0; x < canvas.width; x += 1) {
      if (pixels[(y * canvas.width + x) * 4 + 3] > 8) {
        left = Math.min(left, x)
        top = Math.min(top, y)
        right = Math.max(right, x + 1)
        bottom = Math.max(bottom, y + 1)
      }
    }
  }

  if (right <= left || bottom <= top) return

  const visibleWidth = right - left
  const visibleHeight = bottom - top
  const scale = 128 / Math.max(visibleWidth, visibleHeight)
  const renderedWidth = Math.round(visibleWidth * scale)
  const renderedHeight = Math.round(visibleHeight * scale)
  const cropped = document.createElement('canvas')
  cropped.width = 128
  cropped.height = 128
  cropped.getContext('2d')?.drawImage(
    canvas,
    left,
    top,
    visibleWidth,
    visibleHeight,
    Math.round((128 - renderedWidth) / 2),
    Math.round((128 - renderedHeight) / 2),
    renderedWidth,
    renderedHeight,
  )

  image.dataset.normalized = 'true'
  image.src = cropped.toDataURL('image/png')
}

// De quanto em quanto tempo o progresso é salvo na API (também é salvo ao sair da sala)
const SAVE_INTERVAL_MS = 5000
// Passo máximo do jogo num quadro: depois de uma pausa longa (aba escondida), nada dá um salto
const MAX_STEP_MS = 100

// A sala é só de teclado: cliques e menu de contexto não fazem nada aqui (só nos botões do aviso de erro ao carregar)
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
  const retryRef = useRef(null)
  const restartRef = useRef(null)
  const retryLoadRef = useRef(null)
  const pauseMenuItemsRef = useRef([])
  const pauseActionRef = useRef(null)
  const pauseResumeRef = useRef(null)
  const leavingPauseRef = useRef(false)
  const [floorInfo, setFloorInfo] = useState(null) // { number, name } do andar atual
  // Aviso de fim: { outcome: 'victory' | 'defeat', cause, time, status: 'sending' | 'sent' | 'error', message }
  const [ending, setEnding] = useState(null)
  // Mensagem de erro se o catálogo de itens não carregou (sem ele a run não começa)
  const [loadError, setLoadError] = useState(null)
  // Personagem que acabou de ser liberado (o aviso no canto da tela), ou null
  const [characterNotice, setCharacterNotice] = useState(null)
  const [pauseView, setPauseView] = useState('closed')
  const [pausedItems, setPausedItems] = useState([])
  const [pauseError, setPauseError] = useState('')
  const [isLeavingPause, setIsLeavingPause] = useState(false)
  const [pauseMenuIndex, setPauseMenuIndex] = useState(0)
  const pauseViewRef = useRef('closed')
  const windowPausedRef = useRef(!document.hasFocus())
  const pauseItemsRef = useRef([])
  const endingStateRef = useRef(null)
  const loadErrorRef = useRef(null)
  const musicContextRef = useRef(null) // último contexto avisado à música do jogo (só avisa quando muda)
  const musicVolumeFocusRef = useRef(false) // o controle "Music volume" das Opções da pausa está com o foco?

  // Troca entre o menu de pausa e as Opções. Ao voltar das Opções, o destaque fica em OPÇÕES
  function setPauseState(nextView) {
    musicVolumeFocusRef.current = false // o controle de volume (se abrir) avisa de novo quando ganhar o foco
    pauseViewRef.current = nextView
    setPauseView(nextView)
    if (nextView === 'menu') {
      setPauseMenuIndex(1)
      setPauseError('')
    }
  }


  // Personagem escolhido na seleção: o id vai para a run (e para o ranking) e o nome para o leitor de tela.
  // Quem manda é o progresso salvo: no Continue não há personagem no state, então a sala troca o nome (e as folhas)
  // quando lê o progresso.
  const selectedCharacter = location.state?.character ?? {
    id: 'tung-tung-sahur',
    name: 'Tung Tung Sahur',
    description: 'Personagem principal do jogo.',
  }
  const [characterName, setCharacterName] = useState(selectedCharacter.name || 'Tung Tung Sahur')

  useEffect(() => {
    endingStateRef.current = ending
  }, [ending])

  useEffect(() => {
    loadErrorRef.current = loadError
  }, [loadError])

  // O aviso de fim é só de teclado (a dica das teclas aparece nele). Enquanto o resultado está sendo enviado,
  // nada sai da sala: o menu leria o progresso antes de a API apagá-lo. Depois:
  // - Esc volta ao menu;
  // - Espaço ou Enter: se o envio falhou, tenta enviar de novo (vitória ou derrota); se a derrota já foi enviada,
  //   começa uma nova run. Na vitória enviada, só o Esc (o tempo já está no ranking).
  useEffect(() => {
    if (!ending) return

    function handleEndingKey(event) {
      if (event.altKey || event.ctrlKey || event.metaKey || event.isComposing || event.repeat) return
      if (ending.status === 'sending') return

      if (event.key === 'Escape') {
        event.preventDefault()
        navigate(ROUTES.menuPrincipal)
        return
      }

      if (event.key !== 'Enter' && event.key !== ' ') return
      if (ending.status === 'error') {
        event.preventDefault()
        retryRef.current?.()
      } else if (ending.outcome === 'defeat') {
        event.preventDefault()
        restartRef.current?.()
      }
    }

    window.addEventListener('keydown', handleEndingKey)
    return () => window.removeEventListener('keydown', handleEndingKey)
  }, [ending, navigate])

  useEffect(() => {
    if (pauseView !== 'menu') return

    function handlePauseMenuKey(event) {
      if (event.altKey || event.ctrlKey || event.metaKey || event.isComposing) return

      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        if (event.repeat || isLeavingPause) return
        pauseMenuItemsRef.current[pauseMenuIndex]?.click()
        return
      }

      const action = getMenuNavigationAction(event.key)
      if (action !== 'up' && action !== 'down') return
      event.preventDefault()
      if (event.repeat) return
      const direction = action === 'down' ? 1 : -1
      setPauseMenuIndex((current) => (current + direction + 3) % 3)
    }

    window.addEventListener('keydown', handlePauseMenuKey)
    return () => window.removeEventListener('keydown', handlePauseMenuKey)
  }, [pauseView, pauseMenuIndex, isLeavingPause])

  useEffect(() => {
    roomRef.current?.focus()

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let sheets = null // as folhas do personagem: carregadas quando o progresso diz quem ele é (draw só desenha com a run pronta)
    const hudImages = loadHudImages()
    loadDescriptionFont()
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
    let saving = null // salvamento em andamento (o fim da run espera por ele)
    let saveAgain = false
    let resultSent = false
    let endStored = false // o fim da run já foi guardado no navegador (veja applyEndedRun)
    let outcome = 'victory' // resultado da run que acabou: 'victory' (tambor do andar 5) ou 'defeat' (morreu)
    let deathCause = null // o que matou o personagem (id de health.js), para o aviso
    let restartHoldMs = 0 // há quanto tempo o R está segurado (a tela escurece junto)
    let enterMs = Infinity // tempo desde que a run apareceu: a tela clareia do preto (getEnterFade)
    let restartHeld = false // a tecla R está segurada (veja updateRestartKey em run.js)
    let announcedFloor = 0
    let elixirHandled = false // o Elixir Elétrico desta run já foi tratado (libera o Tung Tung Sabor; veja update)
    const noticeTimers = [] // os tempos do aviso de personagem liberado (saem junto com a sala)

    // Aviso de personagem liberado: espera delayMs (a faixa do item ocupa a tela) e fica AVISO_PERSONAGEM_MS no canto
    function showCharacterNotice(characterId, delayMs) {
      noticeTimers.push(
        window.setTimeout(() => {
          setCharacterNotice(characterId)
          noticeTimers.push(window.setTimeout(() => setCharacterNotice(null), AVISO_PERSONAGEM_MS))
        }, delayMs),
      )
    }

    // Libera um personagem na API (com a fila e a nova tentativa de utils/unlocks.js) sem a run esperar por isso.
    // O aviso só aparece quando a API diz que ele é novo (created): quem já tinha o personagem não vê nada.
    async function unlock(characterId, noticeDelayMs) {
      const created = await unlockCharacter(characterId)
      if (isCancelled) return
      for (const id of created) showCharacterNotice(id, noticeDelayMs)
    }

    // Tenta de novo o que ficou na fila (a API estava fora do ar, a sessão venceu...)
    async function retryUnlocks() {
      const created = await retryPendingUnlocks()
      if (isCancelled) return
      for (const id of created) showCharacterNotice(id, 0)
    }
    let showDebug = false // F3, só no npm run dev
    let showMinimap = false // Tab segurado: mapa ampliado
    let view = getRoomView(0, 0)
    let pixelRatio = 1

    // Primeiro o catálogo (GET /api/catalog: itens com os números dos efeitos, inimigos com vida, dano, velocidade
    // e andar mínimo e chefes com vida, dano, ataques e andares), depois o progresso. Sem o catálogo a run não
    // começa: aparece o aviso de erro com "Tentar de novo".
    async function loadGame() {
      let catalog
      let enemyCatalog
      let bossCatalog
      try {
        const response = await apiRequest('/api/catalog', { credentials: 'include' })
        if (isCancelled) return
        catalog = buildItemCatalog(response?.items)
        enemyCatalog = buildEnemyCatalog(response?.enemies)
        bossCatalog = buildBossCatalog(response?.bosses)
      } catch (error) {
        if (isCancelled) return
        // Sessão vencida (401): o apiRequest já leva para a tela de entrar
        if (error?.status !== 401) setLoadError(error?.message || 'Tente de novo daqui a pouco.')
        return
      }
      // Item sem sprite no jogo (ou sprite sem item no catálogo) fica fora da run
      if (catalog.missingSprite.length > 0 || catalog.missingInCatalog.length > 0) {
        console.warn('Itens ignorados.', { semSprite: catalog.missingSprite, semCatalogo: catalog.missingInCatalog })
      }
      if (enemyCatalog.missingSprite.length > 0 || enemyCatalog.missingInCatalog.length > 0) {
        console.warn('Inimigos ignorados.', { semSprite: enemyCatalog.missingSprite, semCatalogo: enemyCatalog.missingInCatalog })
      }
      if (bossCatalog.missingSprite.length > 0 || bossCatalog.missingInCatalog.length > 0) {
        console.warn('Chefes ignorados.', { semSprite: bossCatalog.missingSprite, semCatalogo: bossCatalog.missingInCatalog })
      }
      await loadProgress(catalog.items, enemyCatalog.enemies, bossCatalog.bosses)
    }
    retryLoadRef.current = loadGame

    // O andar, a sala, a posição e o tempo vêm da API (e não do state da navegação, que o navegador
    // guarda no histórico e pode estar velho). A partida nova já foi salva pela seleção, sem seed.
    async function loadProgress(catalog, enemyCatalog, bossCatalog) {
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
        // Se a morte não chegou à API (servidor fora do ar, F5 na animação), vale a que ficou guardada no navegador
        try {
          progress = applyEndedRun(progress, JSON.parse(window.localStorage.getItem(ENDED_RUN_STORAGE_KEY)))
        } catch {
          // sem localStorage (ou texto estragado): vale o que veio da API
        }
        characterId = progress.characterId
        canSave = true
      } catch (error) {
        if (isCancelled) return
        // Sem conseguir ler o progresso, joga com uma seed nova, mas não salva nada nesta visita
        // (isso protege o que já existe)
        if (error?.status !== 401) console.warn('Não foi possível carregar o progresso.', error)
      }

      sheets = loadSheets(characterId)
      setCharacterName(getBaseStats(characterId).name)

      // Partida nova (ou save antigo, sem seed): a sala cria a seed e salva na hora
      const isNewSeed = progress.seed === null
      run = createRun({
        seed: progress.seed ?? createRunSeed(),
        floorNumber: progress.floor,
        roomId: progress.roomId,
        position: { x: progress.playerX, y: progress.playerY },
        characterId,
        visitedRoomIds: progress.visitedRoomIds,
        clearedRoomIds: progress.clearedRoomIds,
        roomStates: progress.roomStates,
        health: progress.health,
        forks: progress.forks,
        grains: progress.grains,
        catalog,
        enemyCatalog,
        bossCatalog,
        pactRoomType: progress.pactRoomType,
        branchOffered: progress.branchOffered,
        items: progress.items,
        floorHealsUsed: progress.floorHealsUsed,
      })
      elapsedMs = progress.elapsedMs
      enterMs = 0 // a sala surge do preto, com a faixa do andar (New game e Continue)
      pauseItemsRef.current = snapshotPauseItems()
      void retryUnlocks() // ao abrir a sala: uma liberação que ficou na fila (a API estava fora do ar) tenta de novo

      // Run que já acabou (o jogador saiu antes de o tempo chegar ao ranking, pelo Voltar do navegador ou F5):
      // não deixa jogar de novo nem envia sozinho (o primeiro envio pode ainda estar a caminho e o tempo
      // entraria duas vezes). Mostra o aviso de fim, com o botão para enviar de novo se for preciso.
      if (progress.finished) {
        // Sem vida (ou com a causa da morte salva), a run acabou em derrota
        const died = progress.deathCause !== null || progress.health <= 0
        outcome = died ? 'defeat' : 'victory'
        deathCause = progress.deathCause
        // Sem a faixa do andar: a run parada não conta o tempo dela, e ela ficaria para sempre atrás do aviso
        run = { ...run, banner: null, finished: true, death: died ? { cause: deathCause } : null }
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

    pauseActionRef.current = async () => {
      if (leavingPauseRef.current) return
      leavingPauseRef.current = true
      setIsLeavingPause(true)
      setPauseError('')
      try {
        // Sem o progresso lido (canSave false), não salva nada nesta visita: só sai.
        // O PUT é feito aqui, e não pelo saveProgress (que só avisa no console), para o erro aparecer no menu.
        if (canSave) {
          if (saving) await saving
          const snapshot = createRunSnapshot(run, elapsedMs)
          await apiRequest('/api/progress', { method: 'PUT', credentials: 'include', body: JSON.stringify(snapshot) })
        }
        navigate(ROUTES.menuPrincipal, { replace: true })
      } catch (error) {
        leavingPauseRef.current = false
        setIsLeavingPause(false)
        setPauseError(error?.status === 401
          ? 'Sua sessão expirou. Entre novamente antes de sair.'
          : error?.message || 'Não foi possível salvar o progresso. Tente sair novamente.')
      }
    }

    // Fim da run (vitória no andar 5 ou morte): salva uma última vez e envia o resultado.
    // O último PUT leva finished: true. Se o envio falhar, o Continue reabre este aviso para enviar de novo.
    async function finishRun() {
      outcome = run.death ? 'defeat' : 'victory'
      deathCause = run.death?.cause ?? null
      // Venceu o jogo com o Sahur: libera o Tung Tung God. O aviso aparece por cima do aviso de fim.
      if (outcome === 'victory' && run.characterId === SAHUR_ID) void unlock(GOD_ID, 0)
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
      setEnding({ ...result, status: 'sending' })
      try {
        const body = { characterId: run.characterId, durationMs: Math.max(1, Math.round(elapsedMs)), status: outcome }
        await apiRequest('/api/runs', { method: 'POST', credentials: 'include', body: JSON.stringify(body) })
        try {
          window.localStorage.removeItem(ENDED_RUN_STORAGE_KEY) // a API já apagou o progresso: não precisa mais
        } catch {
          // sem localStorage: o próximo Continue já não acha progresso na API
        }
        if (!isCancelled) setEnding({ ...result, status: 'sent' })
      } catch (error) {
        if (isCancelled) return
        setEnding({ ...result, status: 'error', message: error?.message || 'Não foi possível enviar o resultado da run.' })
      }
    }
    retryRef.current = sendRunResult

    // Recomeça do andar 1 com outra seed, vida cheia e o tempo zerado, e salva por cima da partida anterior.
    // A tela está preta nesta hora. O tempo segurado volta a 0: a tela clareia na run nova e, com o R ainda
    // segurado, escurece de novo e recomeça outra vez (uma run atrás da outra, como no Isaac).
    // Também é chamada pelo aviso de morte (Espaço ou Enter, depois de o resultado ser enviado): por isso o aviso some
    // e as marcas do fim da run voltam ao começo.
    function restartRun() {
      run = createRun({
        seed: createRunSeed(),
        characterId: run.characterId,
        catalog: run.catalog,
        enemyCatalog: run.enemyCatalog,
        bossCatalog: run.bossCatalog,
      })
      resultSent = false
      elixirHandled = false // a run nova pode ter o Elixir (5%)
      endStored = false // a run nova ainda não acabou: a próxima morte também é guardada no navegador
      setEnding(null)
      elapsedMs = 0
      restartHoldMs = 0
      enterMs = 0 // a run nova também clareia do preto, em vez de aparecer de uma vez
      void saveProgress()
    }
    restartRef.current = restartRun

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
        if (event.repeat) return
        // Nas Opções, o Esc é do botão de voltar delas. Saindo para o menu (salvando), o Esc não reabre o jogo.
        if (pauseViewRef.current === 'options' || leavingPauseRef.current) return
        if (pauseViewRef.current === 'menu') {
          clearPressedKeys()
          pauseViewRef.current = 'closed'
          setPauseView('closed')
          previousTime = undefined
          isPaused = windowPausedRef.current
          return
        }
        if (run && canPauseRun(run) && !endingStateRef.current && !loadErrorRef.current) {
          clearPressedKeys()
          pauseItemsRef.current = snapshotPauseItems()
          if (pauseViewRef.current === 'closed') {
            pauseViewRef.current = 'menu'
            setPauseView('menu')
            setPausedItems(pauseItemsRef.current)
            setPauseMenuIndex(0)
          }
          previousTime = undefined
          isPaused = true
        }
        return
      }

      if (pauseViewRef.current !== 'closed') return

      // import.meta.env.DEV é false no build: este trecho e o drawDebug saem do pacote
      if (import.meta.env.DEV && event.code === 'F3') {
        event.preventDefault()
        showDebug = !showDebug
        // O alvo de treino só existe com o F3 ligado
        if (!showDebug && run) run = removeTrainingTarget(run)
        return
      }

      // Ferramentas de teste do F3: T põe ou tira o alvo de treino, I dá o próximo item que ele ainda não tem e G
      // dá a recompensa de sala limpa nesta sala (contando os abates do alvo de treino). Segurar a tecla não repete.
      const testKeys = ['KeyT', 'KeyI', 'KeyG']
      if (import.meta.env.DEV && showDebug && run && testKeys.includes(event.code)) {
        event.preventDefault()
        if (event.repeat) return
        if (event.code === 'KeyT') run = toggleTrainingTarget(run)
        if (event.code === 'KeyI') run = giveNextItem(run)
        if (event.code === 'KeyG') run = giveRoomReward(run)
        return
      }

      // Tab segurado = mapa ampliado. Sem alternar: o keydown repete enquanto a tecla está segurada e o mapa piscaria
      if (event.code === 'Tab') {
        event.preventDefault()
        showMinimap = true
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
      if (event.code === 'Tab') showMinimap = false
      pressedKeys.delete(event.code)
      if (event.code === RESTART_KEY) restartHeld = updateRestartKey(restartHeld, 'release')
    }

    function clearPressedKeys() {
      showMinimap = false // Alt+Tab: o keyup do Tab não chega
      pressedKeys.clear()
      restartHeld = updateRestartKey(restartHeld, 'blur')
    }

    pauseResumeRef.current = () => {
      clearPressedKeys()
      previousTime = undefined
    }

    function snapshotPauseItems() {
      return (Array.isArray(run?.items) ? run.items : []).map((itemId) => {
        const item = run?.catalog?.[itemId]
        const sprite = ITEM_SPRITES[itemId]
        const icon = item?.icon || sprite?.icon
        return icon ? { id: itemId, name: item?.name || itemId, icon } : null
      }).filter(Boolean)
    }

    // Só os botões do aviso de fim da run aceitam o mouse (a pausa ignora o mouse pelo pointer-events do CSS)
    function blockMouse(event) {
      if (endingRef.current?.contains(event.target) && event.target.closest('button')) return
      event.preventDefault()
    }

    // Janela sem foco (outra aba, outro programa): o contador para e não conta esse tempo
    function handleBlur() {
      windowPausedRef.current = true
      clearPressedKeys()
      if (run && canPauseRun(run) && !endingStateRef.current && !loadErrorRef.current && pauseViewRef.current === 'closed') {
        pauseItemsRef.current = snapshotPauseItems()
        if (pauseViewRef.current === 'closed') {
          pauseViewRef.current = 'menu'
          setPauseView('menu')
          setPausedItems(pauseItemsRef.current)
          setPauseMenuIndex(0)
        }
      }
      isPaused = true
      previousTime = undefined
    }

    function handleFocus() {
      windowPausedRef.current = false
      isPaused = pauseViewRef.current !== 'closed' || !document.hasFocus()
      previousTime = undefined
    }

    function update(time) {
      const deltaMs = previousTime === undefined ? 0 : time - previousTime
      previousTime = time

      if (run) {
        const stepMs = Math.min(deltaMs, MAX_STEP_MS)
        isPaused = pauseViewRef.current !== 'closed' || windowPausedRef.current
        if (!isPaused) {
          enterMs += stepMs
          // O contador para com a pausa visual, a janela sem foco, a morte e o fim da run
          if (!run.finished && !run.death) elapsedMs += deltaMs
          run = updateRun(
            run,
            { movement: getRoomMovement(pressedKeys), attackDirection: getAttackDirection(pressedKeys) },
            stepMs / 1000,
          )
        }

        // Pegou o Elixir Elétrico: libera o Tung Tung Sabor. O aviso espera a faixa do item sair da tela.
        // (Numa run que já tem o Elixir ao continuar, a chamada devolve "já liberado" e nada aparece.)
        if (!elixirHandled && run.items.includes(ELIXIR_ITEM_ID)) {
          elixirHandled = true
          void unlock(SABOR_ID, BANNER_TOTAL_MS)
        }

        // Segurar R escurece a tela e, ao completar, recomeça a run (não vale na morte nem depois do fim)
        const holdingRestart = !isPaused && restartHeld && !run.finished && !run.death
        restartHoldMs = updateRestartHold(restartHoldMs, holdingRestart, stepMs)
        if (holdingRestart && restartHoldMs >= RESTART_HOLD_MS) restartRun()

        // Chegou a um andar novo: o leitor de tela anuncia o nome
        if (run.floor.number !== announcedFloor) {
          announcedFloor = run.floor.number
          setFloorInfo({ number: run.floor.number, name: run.floor.name })
        }
        // Morreu (ou venceu): guarda o fim no navegador e já manda o PUT com finished, sem esperar a animação nem os 5 s
        if ((run.death || run.finished) && !endStored && canSave) {
          endStored = true
          try {
            window.localStorage.setItem(ENDED_RUN_STORAGE_KEY, JSON.stringify(createRunSnapshot(run, elapsedMs)))
          } catch {
            // sem localStorage: fica só o PUT
          }
          void saveProgress()
        }
        if (run.finished && !resultSent) {
          resultSent = true
          void finishRun()
        }

        // Música do jogo: só lê a run e avisa o controlador de música quando o contexto musical muda
        // Na pausa a música fica abafada, mas com o foco no "Music volume" ela toca como no jogo: para regular o volume, ouve-se o nível real
        // (a conferência da tela evita um foco "preso" se o controle saiu da tela sem avisar, e a janela sem foco continua abafada)
        const adjustingMusic = pauseViewRef.current === 'options' && musicVolumeFocusRef.current && !windowPausedRef.current
        const musicContext = getGameMusicContext(run, isPaused && !adjustingMusic)
        if (!isSameGameMusicContext(musicContextRef.current, musicContext)) {
          musicContextRef.current = musicContext
          notifyGameMusic(musicContext)
        }
      }

      draw()
      animationFrame = window.requestAnimationFrame(update)
    }

    function draw() {
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      // Enquanto o progresso carrega, a tela fica preta: é de onde a sala clareia ao entrar
      if (!run) {
        ctx.fillStyle = '#000'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        return
      }

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

      // O contador e o HUD começam na mesma altura, no alto da tela
      const hudTop = toScreenY(getHudTop(visibleTop))

      // HUD no canto de cima à esquerda, sobre a parede lateral (ou na sobra da tela, quando ela é mais larga que a sala):
      // os corações em cima e os contadores de grão e de garfo embaixo deles
      drawHud(ctx, hudImages, {
        health: run.health,
        maxHealth: getRunStats(run).maxHealth,
        grains: run.grains,
        forks: run.forks,
        left: toScreenX(screen.left + 20),
        top: hudTop,
        pixelSize,
      })

      drawTimer(ctx, formatRunTime(elapsedMs), Math.round((canvas.clientWidth / 2) * pixelRatio), hudTop, pixelSize)

      // Perto de um pedestal com item: a caixa com o nome e a descrição do item, embaixo do HUD.
      // Enquanto a faixa de um item pego aparece, a caixa espera (as duas ficariam uma em cima da outra).
      const room = getCurrentRoom(run)
      const itemBannerOn = Boolean(run.banner?.subtitle)
      const pedestals = run.transition || run.death || itemBannerOn ? [] : getRoomPedestals(run, room)
      const nearby = findNearbyPedestal(pedestals, run.player)
      if (nearby) {
        drawItemInfo(ctx, {
          item: getPedestalInfo(run, nearby),
          left: toScreenX(screen.left + 20),
          top: getHudBottom(hudTop, pixelSize) + pixelSize * 4,
          maxWidth: Math.round(Math.min(canvas.width * 0.34, 460 * pixelRatio)),
          fontSize: Math.round(Math.max(13, 17 * view.scale) * pixelRatio),
        })
      }

      // Sempre no canto superior direito; segurar Tab amplia o mapa
      const minimapRight = canvas.width - Math.round(18 * pixelRatio)
      const minimapBottom = drawMinimap(ctx, run.floor, room, {
        right: minimapRight,
        top: Math.round(18 * pixelRatio),
        scale: pixelRatio * (showMinimap ? 2 : 0.9),
        expanded: showMinimap,
        maxWidth: canvas.width * 0.5,
        maxHeight: canvas.height * 0.75,
      })
      // Itens pegos, na ordem, embaixo do minimapa (com o mapa ampliado, ele cobriria a lista)
      if (!showMinimap) {
        drawItemList(ctx, run.items, { right: minimapRight, top: minimapBottom + Math.round(8 * pixelRatio), size: Math.round(26 * pixelRatio) })
      }

      // Barra de vida do chefe, embaixo da tela, no meio (some na transição de sala e quando a morte dele acaba)
      const bossBar = run.transition ? null : getBossBar(run.targets)
      if (bossBar) {
        drawBossBar(ctx, bossBar, {
          centerX: Math.round((canvas.clientWidth / 2) * pixelRatio),
          bottom: toScreenY(visibleTop + visibleHeight) - pixelSize * 4,
          pixelSize,
          timeMs: performance.now(),
          reduceMotion,
        })
      }

      // Entrada na run, troca de andar, fim da run, R segurado e sono na rede: a tela escurece por cima da sala e do HUD
      const sleepFade = getSleepFade(run.sleep)
      const fade = Math.max(getFloorFade(run), getRestartFade(restartHoldMs), getEnterFade(enterMs), sleepFade)
      if (fade > 0) {
        ctx.fillStyle = `rgba(0, 0, 0, ${fade})`
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }

      // Dormindo: o "ZZZ...." aparece letra por letra no meio da tela preta
      if (run.sleep) {
        drawSleepText(
          ctx,
          getSleepText(run.sleep),
          Math.round(canvas.width / 2),
          Math.round(canvas.height / 2),
          Math.max(4, Math.round(10 * scale)),
          sleepFade,
        )
      }

      // A faixa do andar fica por cima do escurecimento: ao entrar na run, o nome aparece sobre o preto
      // e a sala clareia por baixo dele. Na morte, no fim da run e no sono ela não aparece (a run parada não a faz sumir).
      if (run.banner && !run.death && !run.finished && !run.sleep) {
        drawFloorBanner(ctx, {
          text: run.banner.text,
          subtitle: run.banner.subtitle, // só a faixa de item tem a frase embaixo do nome
          elapsedMs: run.banner.elapsedMs,
          reduceMotion,
          left: toScreenX(ROOM_FLOOR.left),
          right: toScreenX(ROOM_FLOOR.right),
          // A faixa de item tem duas linhas e é mais alta: fica mais embaixo, para não cobrir o HUD e o minimapa
          centerY: toScreenY(visibleTop + visibleHeight * (run.banner.subtitle ? 0.3 : 0.18)),
          pixelSize: Math.max(3, Math.round(6 * scale)),
        })
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
    window.addEventListener('blur', handleBlur)
    window.addEventListener('focus', handleFocus)
    BLOCKED_MOUSE_EVENTS.forEach((name) => window.addEventListener(name, blockMouse))
    void loadGame()
    // Parado na janela sem foco, não há o que salvar
    const saveTimer = window.setInterval(() => {
      if (!isPaused) {
        void saveProgress().catch(() => {})
        void retryUnlocks() // uma liberação que falhou antes (fila no navegador) tenta de novo junto com o salvamento
      }
    }, SAVE_INTERVAL_MS)
    animationFrame = window.requestAnimationFrame(update)

    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('blur', handleBlur)
      window.removeEventListener('focus', handleFocus)
      BLOCKED_MOUSE_EVENTS.forEach((name) => window.removeEventListener(name, blockMouse))
      window.clearInterval(saveTimer)
      noticeTimers.forEach((timer) => window.clearTimeout(timer))
      window.cancelAnimationFrame(animationFrame)
      isCancelled = true
      void saveProgress() // ao sair da sala (depois do fim da run, não salva)
    }
  }, [navigate, selectedCharacter.id])

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

      {/* Personagem que acabou de ser liberado (o Sabor pelo Elixir, o God ao vencer com o Sahur) */}
      {characterNotice && <AvisoPersonagem key={characterNotice} characterId={characterNotice} />}

      {pauseView === 'menu' && (
        <div className="sala-inicial__pausa" role="dialog" aria-modal="true" aria-label="Menu de pausa">
          <section className="sala-inicial__pausa-painel">
            <section className="sala-inicial__inventario" aria-labelledby="pausa-itens-titulo">
              <h3 id="pausa-itens-titulo">ITENS COLETADOS</h3>
              {pausedItems.length > 0 ? (
                <div className="sala-inicial__itens">
                  {pausedItems.map((item, index) => item.icon ? (
                      <figure className="sala-inicial__item" key={`${item.id}-${index}`} aria-label={item.name || item.id}>
                        <img
                          src={item.icon}
                          alt={item.name || item.id}
                          draggable="false"
                          onLoad={(event) => normalizePauseItemIcon(event.currentTarget)}
                        />
                      </figure>
                    ) : null)}
                </div>
              ) : (
                <p className="sala-inicial__itens-vazio">Nenhum item coletado nesta run.</p>
              )}
            </section>

            <div className="sala-inicial__pausa-principal">
              <nav className="sala-inicial__pausa-menu" aria-label="Opções de pausa">
                {[
                  { label: 'CONTINUAR', action: 'resume' },
                  { label: 'OPÇÕES', action: 'options' },
                  { label: 'SAIR PARA O MENU', action: 'leave' },
                ].map(({ label, action }, index) => (
                  <button
                    key={action}
                    ref={(element) => { pauseMenuItemsRef.current[index] = element }}
                    type="button"
                    className={`sala-inicial__pausa-opcao${pauseMenuIndex === index ? ' sala-inicial__pausa-opcao--selecionada' : ''}`}
                    onClick={() => {
                      if (action === 'resume') {
                        pauseResumeRef.current?.()
                        pauseViewRef.current = 'closed'
                        setPauseView('closed')
                      }
                      if (action === 'options') setPauseState('options')
                      if (action === 'leave') void pauseActionRef.current?.()
                    }}
                    disabled={isLeavingPause}
                  >
                    {label}
                  </button>
                ))}
              </nav>
              {pauseError && <p className="sala-inicial__pausa-erro" role="alert">{pauseError}</p>}
            </div>
          </section>
        </div>
      )}

      {pauseView === 'options' && (
        <div className="sala-inicial__opcoes" role="dialog" aria-modal="true" aria-label="Opções">
          <Opcoes
            embedded
            onClose={() => setPauseState('menu')}
            onMusicVolumeFocus={(focused) => { musicVolumeFocusRef.current = focused }}
          />
        </div>
      )}

      {/* Erro ao carregar o catálogo. Usa o visual e o ref do aviso de fim: os dois nunca aparecem juntos
          (sem catálogo a run não existe), e o ref deixa o mouse clicar nos botões */}
      {loadError && (
        <div className="sala-inicial__fim" ref={endingRef}>
          <section className="sala-inicial__fim-painel" role="dialog" aria-modal="true" aria-labelledby="sala-inicial-erro-titulo">
            <h2 id="sala-inicial-erro-titulo" className="sala-inicial__fim-titulo">
              Erro ao carregar
            </h2>
            <p className="sala-inicial__fim-mensagem" role="alert">
              Não foi possível carregar os itens do jogo. {loadError}
            </p>
            <div className="sala-inicial__fim-botoes">
              <button type="button" className="sala-inicial__fim-botao" onClick={() => navigate(ROUTES.menuPrincipal)}>
                Voltar ao menu
              </button>
              <button
                type="button"
                className="sala-inicial__fim-botao"
                autoFocus
                onClick={() => {
                  setLoadError(null)
                  retryLoadRef.current?.()
                }}
              >
                Tentar de novo
              </button>
            </div>
          </section>
        </div>
      )}

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
            {ending.status !== 'sending' && (
              <p className="sala-inicial__fim-controles">
                {ending.status === 'error' && (
                  <>
                    <kbd>Espaço</kbd> ou <kbd>Enter</kbd> tenta enviar de novo ·{' '}
                  </>
                )}
                {ending.status === 'sent' && ending.outcome === 'defeat' && (
                  <>
                    <kbd>Espaço</kbd> ou <kbd>Enter</kbd> inicia uma nova run ·{' '}
                  </>
                )}
                <kbd>Esc</kbd> volta ao menu
              </p>
            )}
          </section>
        </div>
      )}
    </main>
  )
}

// O que a caixa de descrição mostra para o pedestal: o item do catálogo, ou o garfo e o coração da Loja.
// O preço não entra: ele já aparece na etiqueta embaixo do pedestal.
function getPedestalInfo(run, pedestal) {
  if (pedestal.itemId) return run.catalog[pedestal.itemId]
  return { ...CONSUMABLE_INFO[pedestal.consumable], icon: CONSUMABLE_SPRITES[pedestal.consumable]?.icon }
}
