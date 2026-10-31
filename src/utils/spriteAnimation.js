// Um quadro do andar a cada 32,5 u andadas (260 u/s a 8 quadros por segundo).
// O quadro depende da distância, e não do tempo: se o personagem para, ou empurra a
// parede sem sair do lugar, as pernas param junto.
export const WALK_STEP_DISTANCE = 32.5

export function getWalkFrame(distance, frameCount = 4) {
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
