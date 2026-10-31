// Escala "contain": a sala inteira (1200x853) cabe na tela sem distorcer.
// O que sobra em cima/embaixo ou nas laterais é preenchido pelo fundo, que se estende (getVisibleRoom).
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

// Parte da sala que aparece na tela, em unidades da sala (pode passar de 0..1080 e 0..768).
// O fundo é desenhado até essas bordas, então a tela inteira fica coberta e não sobra faixa.
export function getVisibleRoom(view, screenWidth, screenHeight) {
  const topLeft = screenToRoom(view, 0, 0)
  const bottomRight = screenToRoom(view, screenWidth, screenHeight)
  return { left: topLeft.x, top: topLeft.y, right: bottomRight.x, bottom: bottomRight.y }
}

// Ponto da tela (pixels CSS) -> ponto da sala (unidades da sala).
export function screenToRoom(view, x, y) {
  return { x: (x - view.offsetX) / view.scale, y: (y - view.offsetY) / view.scale }
}
