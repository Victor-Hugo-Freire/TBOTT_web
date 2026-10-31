// Escala "contain": a sala inteira (1080x768) cabe na tela sem distorcer.
// Sobra faixa na cor de fundo do jogo, em cima/embaixo ou nas laterais.
// A área jogável tem sempre o mesmo tamanho, porque as paredes são colisão.
import { ROOM_SIZE } from '../../../utils/roomMovement.js'

// Calcula quanto a sala é ampliada (scale) e onde começa na tela (offsetX, offsetY),
// tudo em pixels CSS.
export function getRoomView(screenWidth, screenHeight) {
  if (!screenWidth || !screenHeight) return { scale: 1, offsetX: 0, offsetY: 0 }

  const scale = Math.min(screenWidth / ROOM_SIZE.width, screenHeight / ROOM_SIZE.height)
  return {
    scale,
    offsetX: (screenWidth - ROOM_SIZE.width * scale) / 2,
    offsetY: (screenHeight - ROOM_SIZE.height * scale) / 2,
  }
}

// Ponto da tela (pixels CSS) -> ponto da sala (unidades da sala).
export function screenToRoom(view, x, y) {
  return { x: (x - view.offsetX) / view.scale, y: (y - view.offsetY) / view.scale }
}

// Ponto da sala -> ponto da tela. É a volta exata de screenToRoom.
export function roomToScreen(view, x, y) {
  return { x: x * view.scale + view.offsetX, y: y * view.scale + view.offsetY }
}
