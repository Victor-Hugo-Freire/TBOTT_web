import { UI_SPRITES } from '../../../data/uiSprites.js'
import { getHeartStates } from '../../../utils/health.js'
import { getTextWidth, NUMBER_FONT } from '../../../utils/pixelFont.js'
import { drawHearts, getHeartsHeight } from './drawHearts.js'
import { drawTimer } from './drawTimer.js'

// HUD do canto de cima à esquerda, no estilo do Isaac: os corações de vida em cima e, embaixo deles, o grão de café
// e o garfo, cada um com o ícone e o número de 2 dígitos ao lado, alinhados à esquerda.
// Desenha em pixels da tela (o ctx deve estar sem escala), na mesma fonte e tamanho do contador de tempo.
const ICON_ART_PIXELS = 20 // os ícones são arte de 20 x 20 (blocos de 3 px)
const ICON_FONT_PIXELS = 8 // altura que o ícone deve ter, em pixels da fonte (o número tem 6 de altura)
const TEXT_HEIGHT_PIXELS = 6 // altura da NUMBER_FONT
const GAP_PIXELS = 2 // espaço entre o ícone e o número, e entre as duas linhas
const HEARTS_GAP_PIXELS = 3 // espaço entre os corações e os contadores

// Lado do ícone na tela: sempre um múltiplo inteiro de 20 px (cada pixel da arte vira 1, 2, 3... pixels da tela).
// Com tamanho quebrado (45 px, por exemplo) os pixels da arte saíam com larguras diferentes e as linhas tortas.
export function getHudIconSize(pixelSize) {
  return ICON_ART_PIXELS * Math.max(1, Math.round((ICON_FONT_PIXELS * pixelSize) / ICON_ART_PIXELS))
}

export function loadHudImages() {
  const images = {}
  for (const [key, id] of [['grains', 'grao-de-cafe-hud'], ['forks', 'garfo-hud']]) {
    images[key] = new Image()
    images[key].src = UI_SPRITES[id].path
  }
  return images
}

// Onde começam os contadores: logo abaixo da fileira de corações
export function getCountersTop(top, pixelSize) {
  return top + getHeartsHeight(pixelSize) + HEARTS_GAP_PIXELS * pixelSize
}

// left e top = canto superior esquerdo do HUD; pixelSize = o mesmo do contador de tempo.
// health = vida em meios corações (health.js).
export function drawHud(ctx, images, { health, grains, forks, left, top, pixelSize }) {
  drawHearts(ctx, getHeartStates(health), left, top, pixelSize)
  const countersTop = getCountersTop(top, pixelSize)
  const rowHeight = getHudIconSize(pixelSize) + GAP_PIXELS * pixelSize
  drawCounter(ctx, images.grains, grains, left, countersTop, pixelSize)
  drawCounter(ctx, images.forks, forks, left, countersTop + rowHeight, pixelSize)
}

function drawCounter(ctx, image, value, left, top, pixelSize) {
  const iconSize = getHudIconSize(pixelSize)
  // Imagem ainda carregando (ou que falhou): desenha só o número
  if (image?.complete && image.naturalWidth > 0) {
    ctx.save()
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(image, left, top, iconSize, iconSize)
    ctx.restore()
  }
  const text = String(value).padStart(2, '0')
  const textWidth = getTextWidth(NUMBER_FONT, text) * pixelSize
  const textLeft = left + iconSize + GAP_PIXELS * pixelSize
  // O número fica no meio da altura do ícone
  drawTimer(ctx, text, textLeft + textWidth / 2, top + Math.round((iconSize - TEXT_HEIGHT_PIXELS * pixelSize) / 2), pixelSize)
}
