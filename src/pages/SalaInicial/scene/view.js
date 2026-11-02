// Escala da sala (1600x853) na tela, sem distorcer.
// Como no Isaac, a tela pode cortar até ROOM_VIEW_CROP u da borda externa das paredes de cima e de baixo
// (é só parede, a cabeça do personagem não chega lá). Assim telas largas quase não ficam com faixas nos lados.
// Os lados da sala nunca são cortados; o que sobra da tela fica na cor de fundo do jogo.
import { ROOM_SIZE } from '../../../utils/roomMovement.js'

export const ROOM_VIEW_CROP = 30

// Calcula quanto a sala é ampliada (scale) e onde começa na tela (offsetX, offsetY),
// tudo em pixels CSS. offsetY negativo quer dizer que a borda de cima (e a de baixo) ficou fora da tela.
export function getRoomView(screenWidth, screenHeight) {
  if (!screenWidth || !screenHeight) return { scale: 1, offsetX: 0, offsetY: 0 }

  const scale = Math.min(screenWidth / ROOM_SIZE.width, screenHeight / (ROOM_SIZE.height - 2 * ROOM_VIEW_CROP))
  return {
    scale,
    offsetX: (screenWidth - ROOM_SIZE.width * scale) / 2,
    offsetY: (screenHeight - ROOM_SIZE.height * scale) / 2,
  }
}
