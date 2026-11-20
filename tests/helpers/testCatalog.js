import { buildItemCatalog } from '../../src/utils/itemCatalog.js'

// Catálogo de teste no formato de GET /api/catalog, com as salas e os efeitos do seed 0002_items.sql da API,
// na ordem da API (por nome). Os testes não dependem da API nem do banco.
const ITEMS = [
  { id: 'batuta-do-maestro', name: 'Batuta do Maestro', rarity: 'incomum', roomTypes: ['palco'], effect: {} },
  { id: 'cafe-duplo', name: 'Café Duplo', rarity: 'comum', roomTypes: ['tesouro'], effect: {} },
  { id: 'caldo-da-mamae', name: 'Caldo da Mamãe', rarity: 'especial', roomTypes: ['god'], effect: {} },
  { id: 'chifre-da-sorte', name: 'Chifre da Sorte', rarity: 'incomum', roomTypes: ['fliperama'], effect: {} },
  { id: 'concha-longa', name: 'Concha Longa', rarity: 'comum', roomTypes: ['tesouro'], effect: {} },
  {
    id: 'dente-de-tubarao',
    name: 'Dente de Tubarão',
    rarity: 'especial',
    roomTypes: ['pacto'],
    effect: { trigger: 'abate', maxHealthCost: 2 },
  },
  { id: 'elixir-eletrico', name: 'Elixir Elétrico', rarity: 'raro', roomTypes: ['adega'], effect: {} },
  { id: 'mucarela', name: 'Muçarela', rarity: 'incomum', roomTypes: ['tesouro'], effect: {} },
  { id: 'palitos-de-pao', name: 'Palitos de Pão', rarity: 'comum', roomTypes: ['tesouro'], effect: {} },
  { id: 'parmesao-curado', name: 'Parmesão Curado', rarity: 'comum', roomTypes: ['tesouro'], effect: {} },
  { id: 'rolo-de-bronze', name: 'Rolo de Bronze', rarity: 'incomum', roomTypes: ['chefe'], effect: {} },
  { id: 'tiramisu', name: 'Tiramisu', rarity: 'incomum', roomTypes: ['loja'], price: 4, effect: {} },
]

export const TEST_CATALOG = buildItemCatalog(ITEMS).items
export const TREASURE_ITEMS = ['cafe-duplo', 'concha-longa', 'mucarela', 'palitos-de-pao', 'parmesao-curado']
