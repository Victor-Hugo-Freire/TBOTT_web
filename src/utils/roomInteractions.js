// Coisas das salas especiais que reagem ao jogador, em funções puras (sem React, sem canvas), para testar.
// Hoje: a poça do Tralalero, na Sala do Pacto.

// ---------- Poça do Tralalero (Sala do Pacto) ----------

// O que matou o personagem (vai para o aviso de morte, veja health.js):
// - TRALALERO_CAUSE: passou perto da barbatana e o Tralalero puxou;
// - PUDDLE_FALL_CAUSE: pisou na poça com a barbatana longe e caiu sozinho (a barbatana mergulha).
export const TRALALERO_CAUSE = 'tralalero'
export const PUDDLE_FALL_CAUSE = 'poca-tralalero'
// As duas mortes na poça têm a mesma duração: o Tung afunda, sobem bolhas e a água acalma
export const SHARK_DEATH_MS = 1600

// A poça é uma elipse no meio da sala, como no protótipo. Fica longe das entradas das portas
// (a de cima é em y 318). As casas X do layout 'pacto' (colunas 5 a 7 da fileira 3) ficam dentro dela.
export const PUDDLE = { x: 800, y: 510, radiusX: 300, radiusY: 80 }

export const FIN_LAP_MS = 5000 // uma volta da barbatana em torno da poça
const FIN_INSET_X = 40 // a volta fica um pouco para dentro da borda
const FIN_INSET_Y = 22
const FIN_REACH = 60 // u: os pés a essa distância da barbatana fazem o Tralalero puxar

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
