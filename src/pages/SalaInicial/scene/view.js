// Escala da sala (1600x853) na tela, sem distorcer.
// A tela mostra a sala e mais uma faixa de rodapé embaixo dela (ROOM_VIEW_BOTTOM_EXTRA), onde ficam os enfeites
// da porta de baixo (a barbatana do pacto, a placa da loja...). Sem essa faixa, a porta de baixo aparecia cortada
// e não dava para saber que sala fica ali.
// Quando a tela é larga demais para mostrar tudo, o corte é só EM CIMA (no máximo ROOM_VIEW_TOP_CROP u): lá é só a
// parede escura, a cabeça do personagem não chega e os enfeites da porta de cima continuam aparecendo.
// Os lados da sala nunca são cortados; o que sobra da tela é a continuação das paredes.
import { ROOM_SIZE } from '../../../utils/roomMovement.js'

export const ROOM_VIEW_TOP_CROP = 46
export const ROOM_VIEW_BOTTOM_EXTRA = 44 // altura do maior enfeite de porta (veja drawOrnament em drawDoors.js)

// Altura do topo do contador e do HUD, em unidades da sala, quando a sala aparece inteira.
// Com a tela cortada em cima, eles descem junto com a borda da tela (veja getHudTop).
const ROOM_HUD_TOP = 42
const HUD_MARGIN = 9 // distância da borda da tela quando ela corta a sala

// O que a tela mostra de cima a baixo, em unidades da sala
const FULL_HEIGHT = ROOM_SIZE.height + ROOM_VIEW_BOTTOM_EXTRA
const MIN_HEIGHT = FULL_HEIGHT - ROOM_VIEW_TOP_CROP

// Calcula quanto a sala é ampliada (scale) e onde começa na tela (offsetX, offsetY), tudo em pixels CSS.
// offsetY negativo quer dizer que a borda de cima da sala ficou fora da tela.
export function getRoomView(screenWidth, screenHeight) {
  if (!screenWidth || !screenHeight) return { scale: 1, offsetX: 0, offsetY: 0 }

  const scale = Math.min(screenWidth / ROOM_SIZE.width, screenHeight / MIN_HEIGHT)
  // Sobra de tela na altura: positiva = cabe tudo (a sobra é dividida em cima e embaixo);
  // negativa = falta altura, e o que falta é cortado em cima (a borda de baixo fica encostada na tela)
  const spare = screenHeight - FULL_HEIGHT * scale
  return {
    scale,
    offsetX: (screenWidth - ROOM_SIZE.width * scale) / 2,
    offsetY: spare >= 0 ? spare / 2 : spare,
  }
}

// Topo do contador de tempo e do HUD, em unidades da sala. visibleTop = a primeira linha da sala que aparece.
export function getHudTop(visibleTop) {
  return Math.max(ROOM_HUD_TOP, visibleTop + HUD_MARGIN)
}
