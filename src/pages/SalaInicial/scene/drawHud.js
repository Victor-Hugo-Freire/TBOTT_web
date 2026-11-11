import { UI_SPRITES } from '../../../data/uiSprites.js'
import { getTextWidth, SMALL_FONT } from '../../../utils/pixelFont.js'
import { drawTimer } from './drawTimer.js'

// HUD do canto esquerdo: grão de café em cima e garfo embaixo, cada um com o número de 2 dígitos ao lado.
// Desenha em pixels da tela (o ctx deve estar sem escala), na mesma fonte e tamanho do contador de tempo.
const ICON_PIXELS = 9 // lado do ícone, em pixels da fonte (o texto tem 7 de altura)
const GAP_PIXELS = 2 // espaço entre o ícone e o número, e entre as duas linhas

export function loadHudImages() {
  const images = {}
  for (const [key, id] of [['grains', 'grao-de-cafe-hud'], ['forks', 'garfo-hud']]) {
    images[key] = new Image()
    images[key].src = UI_SPRITES[id].path
  }
  return images
}

// left e top = canto superior esquerdo do HUD; pixelSize = o mesmo do contador de tempo.
export function drawHud(ctx, images, { grains, forks, left, top, pixelSize }) {
  const rowHeight = (ICON_PIXELS + GAP_PIXELS) * pixelSize
  drawCounter(ctx, images.grains, grains, left, top, pixelSize)
  drawCounter(ctx, images.forks, forks, left, top + rowHeight, pixelSize)
}

function drawCounter(ctx, image, value, left, top, pixelSize) {
  const iconSize = ICON_PIXELS * pixelSize
  // Imagem ainda carregando (ou que falhou): desenha só o número
  if (image?.complete && image.naturalWidth > 0) {
    ctx.save()
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(image, left, top, iconSize, iconSize)
    ctx.restore()
  }
  const text = String(value).padStart(2, '0')
  const textWidth = getTextWidth(SMALL_FONT, text) * pixelSize
  const textLeft = left + iconSize + GAP_PIXELS * pixelSize
  // O texto (7 pixels) fica no meio da altura do ícone (9 pixels)
  drawTimer(ctx, text, textLeft + textWidth / 2, top + pixelSize, pixelSize)
}
