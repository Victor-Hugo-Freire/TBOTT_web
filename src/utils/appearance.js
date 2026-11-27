import { APPEARANCE_ANCHORS, APPEARANCE_SPRITES, getAppearancePath } from '../data/appearanceSprites.js'

// Aparência dos itens no Tung Tung (as regras estão no topo de appearanceSprites.js).
// Só decide o que aparece e onde; quem desenha é drawPlayer.js.

// Raridades da menor para a maior: o índice decide quem aparece quando 2 itens querem o mesmo slot
const RARITY_ORDER = ['comum', 'incomum', 'especial', 'raro']

// Itens que aparecem no Tung, no máximo 1 por slot.
// items = ids na ordem em que ele pegou (o último é o mais recente); catalog = itens da API, por id.
// Ganha o de maior raridade; empatando, o mais recente (por isso o >=). O efeito do item escondido continua valendo.
export function getVisibleItems(items, catalog) {
  const bySlot = {}
  for (const id of items) {
    const appearance = APPEARANCE_SPRITES[id]
    if (!appearance) continue // item sem desenho no Tung
    const current = bySlot[appearance.slot]
    if (!current || getRarityRank(id, catalog) >= getRarityRank(current, catalog)) {
      bySlot[appearance.slot] = id
    }
  }
  return Object.values(bySlot)
}

// Posição da raridade em RARITY_ORDER (-1 = sem raridade, perde de todas)
function getRarityRank(id, catalog) {
  return RARITY_ORDER.indexOf(catalog[id]?.rarity)
}

// Camadas a desenhar agora. pose = getPlayerPose (player.js); visibleItems = getVisibleItems; characterId = o personagem
// (só o chifre tem imagem própria por personagem).
// Cada camada: { itemId, path, position ('aura', 'atras' ou 'frente'), offset [dx, dy] em px da célula,
// rotation em graus e pivot [x, y] (o ponto em volta do qual gira, só no bastão) }.
// - Dano e morte: nenhuma camada (o Tung fica branco ou vermelho e a camada destoaria).
// - Golpe: o bastão gira em volta do ombro; nos quadros em que a ponta fica atrás da cabeça ou do corpo, ele some.
export function getAppearanceLayers(visibleItems, pose, characterId) {
  if (pose.sheet !== 'walk' && pose.sheet !== 'attack') return []
  const anchors = APPEARANCE_ANCHORS[pose.direction]
  const layers = []
  for (const id of visibleItems) {
    const item = APPEARANCE_SPRITES[id]
    const { slot, layers: byDirection } = item
    const layer = byDirection[pose.direction]
    if (!layer) continue // não aparece nessa direção (o Elixir de frente fica escondido pela cabeça)
    const move = getLayerMove(slot, anchors, pose)
    if (!move) continue // escondida neste quadro
    layers.push({ itemId: id, path: getAppearancePath(layer, item, characterId), position: layer.position, ...move })
  }
  return layers
}

// Quanto a camada anda em relação ao quadro 0 do andar (a imagem já vem desenhada no lugar desse quadro).
// null = a camada não aparece neste quadro.
function getLayerMove(slot, anchors, pose) {
  // A aura fica parada no chão: os pés não se mexem
  if (slot === 'aura') return { offset: [0, 0], rotation: 0, pivot: null }
  // No golpe, o bastão gira em volta do ombro (a ponta vai junto)
  if (slot === 'bastao' && pose.sheet === 'attack') {
    const bat = anchors.attackBat[pose.frame]
    if (!bat) return null
    return { offset: [bat[0], bat[1]], rotation: bat[2], pivot: anchors.shoulder }
  }
  // Andando, o bastão balança: o anel muda de lugar e o ângulo muda (giro em volta do anel do quadro 0)
  if (slot === 'bastao') {
    const first = anchors.walk[0]
    const now = anchors.walk[pose.frame]
    return {
      offset: [now.batRing[0] - first.batRing[0], now.batRing[1] - first.batRing[1]],
      rotation: now.batAngle - first.batAngle,
      pivot: first.batRing,
    }
  }
  // As costas andam com o corpo, que não balança para os lados como a cabeça (no golpe, valem os quadros da cabeça)
  if (slot === 'costas' && pose.sheet === 'walk') return { offset: anchors.walkBody[pose.frame], rotation: 0, pivot: null }
  // A cabeça anda com a cabeça (no golpe, a cabeça do golpe)
  const head = pose.sheet === 'attack' ? anchors.attackHead[pose.frame] : anchors.walk[pose.frame].head
  return { offset: head ?? [0, 0], rotation: 0, pivot: null }
}
