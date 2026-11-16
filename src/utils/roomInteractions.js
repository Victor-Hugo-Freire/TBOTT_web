import { overlaps } from './collision.js'
import { getCellRect } from './roomLayout.js'
import { getFeetBox } from './roomMovement.js'

// Coisas das salas especiais que reagem ao jogador, em funções puras (sem React, sem canvas), para testar.
// Hoje: a poça do Tralalero, na Sala do Pacto, e a rede da Sala de Descanso.

// ---------- Rede da Sala de Descanso ----------

// Sono: a tela escurece em SLEEP_FADE_MS, fica preta com o "ZZZ...." e clareia em SLEEP_FADE_MS
export const SLEEP_MS = 2100
export const SLEEP_FADE_MS = 450
const HAMMOCK_REACH = 12 // u: os pés a essa distância da rede já fazem o Tung dormir
const SLEEP_TEXT = 'ZZZ....'

// A rede cobre as casas (1, 1) a (5, 2) do layout 'descanso' (as casas X dela): é sólida
export function getHammockBox() {
  const first = getCellRect(1, 1)
  const last = getCellRect(5, 2)
  return { x: first.x, y: first.y, width: last.x + last.width - first.x, height: last.y + last.height - first.y }
}

// Os pés chegaram perto da rede? (a caixa dos pés, HAMMOCK_REACH maior para cada lado, encosta nela)
// As entradas das portas ficam a mais de 50 u da rede: entrar na sala não faz dormir.
export function isNearHammock(position) {
  return overlaps(getFeetBox(position, HAMMOCK_REACH), getHammockBox())
}

// Escurecimento do sono: 0 (nada) a 1 (preto). sleep = run.sleep ({ elapsedMs }) ou null (acordado).
export function getSleepFade(sleep) {
  if (!sleep) return 0
  const { elapsedMs } = sleep
  if (elapsedMs < SLEEP_FADE_MS) return elapsedMs / SLEEP_FADE_MS
  if (elapsedMs < SLEEP_MS - SLEEP_FADE_MS) return 1
  return Math.max(0, (SLEEP_MS - elapsedMs) / SLEEP_FADE_MS)
}

// Texto em cima da tela preta: as letras de "ZZZ...." aparecem uma por vez enquanto ele dorme
export function getSleepText(sleep) {
  if (!sleep) return ''
  const darkMs = sleep.elapsedMs - SLEEP_FADE_MS
  if (darkMs < 0) return ''
  const darkTotalMs = SLEEP_MS - SLEEP_FADE_MS * 2
  const letters = Math.min(SLEEP_TEXT.length, Math.floor((darkMs / darkTotalMs) * SLEEP_TEXT.length) + 1)
  return SLEEP_TEXT.slice(0, letters)
}

// ---------- Poça do Tralalero (Sala do Pacto) ----------

// O que matou o personagem (vai para o aviso de morte, veja health.js):
// - TRALALERO_CAUSE: passou perto da barbatana e o Tralalero puxou;
// - PUDDLE_FALL_CAUSE: pisou na poça com a barbatana longe e caiu sozinho (a barbatana mergulha).
export const TRALALERO_CAUSE = 'tralalero'
export const PUDDLE_FALL_CAUSE = 'poca-tralalero'
// As duas mortes na poça têm a mesma duração: o Tung afunda, sobem bolhas e a água acalma
export const SHARK_DEATH_MS = 1600

// A poça é uma elipse no alto da sala, como no protótipo. A Sala do Pacto nunca tem porta em cima
// (floorGenerator.js), e as outras entradas ficam longe dela. As casas X do layout 'pacto'
// (colunas 5 a 7 da fileira 1) ficam dentro dela.
export const PUDDLE = { x: 800, y: 400, radiusX: 300, radiusY: 80 }

export const FIN_LAP_MS = 5000 // uma volta da barbatana em torno da poça
const FIN_INSET_X = 40 // a volta fica um pouco para dentro da borda
const FIN_INSET_Y = 22
const FIN_REACH = 80 // u: os pés até essa distância da barbatana fazem o Tralalero puxar (é o alcance máximo dele)

// Os pés estão dentro da poça? (pular na poça)
export function isInPuddle(position) {
  const dx = (position.x - PUDDLE.x) / PUDDLE.radiusX
  const dy = (position.y - PUDDLE.y) / PUDDLE.radiusY
  return dx * dx + dy * dy <= 1
}

// Onde a barbatana está: ela dá voltas contornando a borda da poça. finMs é o relógio dela (run.finMs).
// Ela é perigo de jogo, então se mexe sempre, mesmo com "reduzir movimento" (como o golpe do Tung).
// turn diz para que lado ela nada: 1 = direita, -1 = esquerda e perto de 0 nas pontas da volta, quando ela
// vira (nada de frente ou de costas para a tela). facingLeft = está indo para a esquerda.
export function getSharkFinPosition(finMs) {
  const angle = ((finMs % FIN_LAP_MS) / FIN_LAP_MS) * Math.PI * 2
  const radiusX = PUDDLE.radiusX - FIN_INSET_X
  const radiusY = PUDDLE.radiusY - FIN_INSET_Y
  // Direção do movimento nesse ponto da volta (a derivada da posição)
  const speedX = -Math.sin(angle) * radiusX
  const speedY = Math.cos(angle) * radiusY
  const turn = speedX / Math.hypot(speedX, speedY)
  return {
    x: PUDDLE.x + Math.cos(angle) * radiusX,
    y: PUDDLE.y + Math.sin(angle) * radiusY,
    turn,
    facingLeft: turn < 0,
  }
}

// Os pés estão perto da barbatana? (passar perto do Tralalero)
export function isNearFin(position, fin) {
  return Math.hypot(position.x - fin.x, position.y - fin.y) <= FIN_REACH
}

// Para onde o Tung é puxado: um ponto dentro da poça, no caminho entre o meio dela e ele
export function getPullPoint(position) {
  const angle = Math.atan2((position.y - PUDDLE.y) / PUDDLE.radiusY, (position.x - PUDDLE.x) / PUDDLE.radiusX)
  return {
    x: PUDDLE.x + Math.cos(angle) * PUDDLE.radiusX * 0.6,
    y: PUDDLE.y + Math.sin(angle) * PUDDLE.radiusY * 0.6,
  }
}
