import { ITEM_SPRITES } from '../../../data/itemSprites.js'
import { DESCRIPTION_FONT } from './fonts.js'
import { getImage, isImageReady } from './images.js'

// Caixa de descrição do item (como a caixa preta do Isaac, em português): aparece com o Tung perto de um pedestal
// com item (findNearbyPedestal, em pedestals.js). Mostra o ícone, o nome e a descrição do catálogo da API.
// Desenha em pixels da tela (o ctx deve estar sem escala), como o HUD.
const BOX_COLOR = 'rgba(8, 5, 5, 0.86)'
const BORDER_COLOR = '#5a4636'
const NAME_COLOR = '#f4d27a'
const TEXT_COLOR = '#f4ece4'

// item = { id, name, description } do catálogo.
// left e top = canto de cima à esquerda; maxWidth = largura máxima; fontSize = tamanho da letra da descrição.
export function drawItemInfo(ctx, { item, left, top, maxWidth, fontSize }) {
  const padding = Math.round(fontSize * 0.8)
  const lineHeight = Math.round(fontSize * 1.3)
  const iconSize = Math.round(fontSize * 2.6)
  const nameSize = Math.round(fontSize * 1.25)
  const textWidth = maxWidth - padding * 2

  ctx.save()
  ctx.font = `${fontSize}px ${DESCRIPTION_FONT}`
  const lines = wrapText(ctx, item.description || '', textWidth)
  const height = padding * 2 + iconSize + lineHeight * lines.length

  ctx.fillStyle = BOX_COLOR
  ctx.fillRect(left, top, maxWidth, height)
  ctx.strokeStyle = BORDER_COLOR
  ctx.lineWidth = Math.max(2, Math.round(fontSize / 8))
  ctx.strokeRect(left, top, maxWidth, height)

  // Ícone do item e o nome ao lado dele
  const icon = getImage(ITEM_SPRITES[item.id].icon)
  if (isImageReady(icon)) {
    const fit = iconSize / Math.max(icon.naturalWidth, icon.naturalHeight)
    const width = icon.naturalWidth * fit
    const iconHeight = icon.naturalHeight * fit
    ctx.imageSmoothingEnabled = true
    ctx.drawImage(icon, left + padding + (iconSize - width) / 2, top + padding + (iconSize - iconHeight) / 2, width, iconHeight)
  }
  ctx.textBaseline = 'middle'
  ctx.font = `bold ${nameSize}px ${DESCRIPTION_FONT}`
  ctx.fillStyle = NAME_COLOR
  ctx.fillText(item.name, left + padding * 2 + iconSize, top + padding + iconSize / 2)

  // Descrição, quebrada em linhas
  ctx.font = `${fontSize}px ${DESCRIPTION_FONT}`
  ctx.textBaseline = 'top'
  ctx.fillStyle = TEXT_COLOR
  let y = top + padding + iconSize
  for (const line of lines) {
    ctx.fillText(line, left + padding, y)
    y += lineHeight
  }
  ctx.restore()
}

// Quebra o texto em linhas que cabem em `width` (pixels), palavra por palavra
function wrapText(ctx, text, width) {
  const lines = []
  let line = ''
  for (const word of text.split(' ')) {
    const attempt = line ? `${line} ${word}` : word
    if (line && ctx.measureText(attempt).width > width) {
      lines.push(line)
      line = word
    } else {
      line = attempt
    }
  }
  if (line) lines.push(line)
  return lines
}
