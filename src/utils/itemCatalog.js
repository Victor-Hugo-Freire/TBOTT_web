import { ENEMY_SPRITES } from '../data/enemySprites.js'
import { ITEM_SPRITES } from '../data/itemSprites.js'

// Catálogo de itens que vem da API (GET /api/catalog): nome, raridade, salas (roomTypes), preço e os números
// do efeito (effect). O jogo guarda os itens por id e lê os números daqui, sem copiar o seed para o código.
// Item do catálogo sem sprite no jogo não tem como aparecer, e sprite sem item no catálogo não tem números:
// os dois ficam de fora e voltam nas listas missingSprite e missingInCatalog, para a tela avisar no console.
// O garfo e o grão de café não estão no catálogo (ficam fora do banco): os sprites deles são CONSUMABLE_SPRITES.

// items = a lista `items` da resposta da API. Devolve { items: { id: item }, missingSprite, missingInCatalog }.
export function buildItemCatalog(items) {
  const catalog = {}
  const missingSprite = []
  const missingInCatalog = []
  const list = Array.isArray(items) ? items : []

  for (const item of list) {
    if (!item || typeof item.id !== 'string') continue
    if (!ITEM_SPRITES[item.id]) {
      missingSprite.push(item.id)
      continue
    }
    // Sem efeito (ou com um formato estranho), o item vale com o efeito vazio: quem usa lê só o que existe
    const hasEffect = item.effect && typeof item.effect === 'object' && !Array.isArray(item.effect)
    catalog[item.id] = { ...item, effect: hasEffect ? item.effect : {} }
  }

  for (const id of Object.keys(ITEM_SPRITES)) {
    if (!catalog[id]) missingInCatalog.push(id)
  }
  return { items: catalog, missingSprite, missingInCatalog }
}

// Inimigos do catálogo (lista `enemies` da mesma resposta): vida em pontos, damage em meios corações, speed em u/s
// e minFloor (primeiro andar em que aparece). Inimigo sem sprite no jogo fica de fora, e sprite sem inimigo no
// catálogo também (missingSprite e missingInCatalog, como nos itens).
// Devolve { enemies: { id: inimigo }, missingSprite, missingInCatalog }.
export function buildEnemyCatalog(enemies) {
  const catalog = {}
  const missingSprite = []
  const missingInCatalog = []
  const list = Array.isArray(enemies) ? enemies : []

  for (const enemy of list) {
    if (!enemy || typeof enemy.id !== 'string') continue
    if (!ENEMY_SPRITES[enemy.id]) {
      missingSprite.push(enemy.id)
      continue
    }
    catalog[enemy.id] = enemy
  }

  for (const id of Object.keys(ENEMY_SPRITES)) {
    if (!catalog[id]) missingInCatalog.push(id)
  }
  return { enemies: catalog, missingSprite, missingInCatalog }
}
