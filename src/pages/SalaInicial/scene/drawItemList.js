import { ITEM_SPRITES } from '../../../data/itemSprites.js'
import { getImage, isImageReady } from './images.js'

// Itens que ele já pegou, embaixo do minimapa, na ordem em que foram pegos (como no Isaac): ícones em fileiras
// de ITEMS_PER_ROW, alinhadas à direita. Desenha em pixels da tela (o ctx deve estar sem escala).
const ITEMS_PER_ROW = 4

// items = ids na ordem; right = borda direita; top = logo abaixo do minimapa; size = lado da caixa de cada ícone
export function drawItemList(ctx, items, { right, top, size }) {
  const gap = Math.round(size * 0.15)
  ctx.save()
  ctx.imageSmoothingEnabled = true
  for (let index = 0; index < items.length; index++) {
    const sprite = ITEM_SPRITES[items[index]]
    if (!sprite) continue
    const icon = getImage(sprite.icon)
    if (!isImageReady(icon)) continue
    // A primeira coluna fica à esquerda: a fileira cheia termina na borda direita
    const col = index % ITEMS_PER_ROW
    const row = Math.floor(index / ITEMS_PER_ROW)
    const boxLeft = right - ITEMS_PER_ROW * (size + gap) + gap + col * (size + gap)
    const boxTop = top + row * (size + gap)
    // O ícone cabe na caixa sem deformar
    const fit = size / Math.max(icon.naturalWidth, icon.naturalHeight)
    const width = icon.naturalWidth * fit
    const height = icon.naturalHeight * fit
    ctx.drawImage(icon, boxLeft + (size - width) / 2, boxTop + (size - height) / 2, width, height)
  }
  ctx.restore()
}
