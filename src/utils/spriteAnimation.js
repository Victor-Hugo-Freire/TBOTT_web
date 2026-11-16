// O ciclo do andar tem 12 quadros (2 passos) e se repete a cada 80 u andadas (um quadro a cada 6,67 u:
// 39 quadros por segundo a 260 u/s, ou 6,5 passos por segundo).
// Era 130 u, mas a perna da folha percorre bem menos chão que isso a cada passo: o pé parecia patinar e o andar
// ficava duro. Com 80 u e a passada maior da folha nova, o pé quase acompanha o chão.
// O quadro depende da distância, e não do tempo: se o personagem para, ou empurra a
// parede sem sair do lugar, as pernas param junto.
export const WALK_CYCLE_DISTANCE = 80
export const WALK_FRAME_COUNT = 12
export const WALK_STEP_DISTANCE = WALK_CYCLE_DISTANCE / WALK_FRAME_COUNT

export function getWalkFrame(distance, frameCount = WALK_FRAME_COUNT) {
  return Math.floor(distance / WALK_STEP_DISTANCE) % frameCount
}

// Soma o que o personagem andou neste quadro. Se não andou nada, volta a zero:
// ao parar, o quadro é o 0 (sem quadro antigo) e, ao recomeçar, começa do 0.
export function updateWalkDistance(distance, traveled) {
  return traveled > 0 ? distance + traveled : 0
}

// Quadro de uma animação com tempo diferente por quadro (durations, em ms).
// Devolve -1 quando a animação já acabou.
export function getTimedFrame(durations, ms) {
  let end = 0
  for (let frame = 0; frame < durations.length; frame++) {
    end += durations[frame]
    if (ms < end) return frame
  }
  return -1
}

export function getTotalDuration(durations) {
  return durations.reduce((total, ms) => total + ms, 0)
}
